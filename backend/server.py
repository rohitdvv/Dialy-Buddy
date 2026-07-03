"""HealthGuardAI - FastAPI Backend
Enterprise-level backend with JWT auth, MongoDB persistence, and Gemini AI proxy.
"""
from dotenv import load_dotenv
load_dotenv()

import os
import io
import re
import json
import bcrypt
import jwt as pyjwt
import base64
import secrets
import logging
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Any, Dict

from fastapi import FastAPI, HTTPException, Depends, Request, Response, UploadFile, File, Form, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

from emergentintegrations.llm.chat import (
    LlmChat, UserMessage, ImageContent, FileContent
)

# ---------------- Setup ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("healthguard")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
JWT_ALG = "HS256"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="HealthGuardAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # can't be True with wildcard; using Bearer tokens instead
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")

# ---------------- Utils ----------------
def hash_password(pwd: str) -> str:
    return bcrypt.hashpw(pwd.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pwd: str, hashed: str) -> bool:
    return bcrypt.checkpw(pwd.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str = "user") -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def sanitize_user(u: dict) -> dict:
    u = dict(u)
    u["id"] = str(u.pop("_id"))
    u.pop("password_hash", None)
    return u

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return sanitize_user(user)

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ---------------- Models ----------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class NutritionIn(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float
    healthScore: float
    foodName: str
    analysis: str
    timestamp: Optional[str] = None

class JournalIn(BaseModel):
    mood: str
    stressLevel: float
    sentimentScore: float
    keyTopics: List[str]
    summary: str
    timestamp: Optional[str] = None

class ActivityIn(BaseModel):
    steps: int
    sleepHours: float
    sleepQuality: int
    heartRateAvg: int
    caloriesBurned: int
    date: Optional[str] = None

class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None

class DeviceIn(BaseModel):
    id: str
    name: str
    type: str  # CLOUD or BLUETOOTH
    status: str
    lastSync: Optional[str] = None


# ---------------- LLM helpers ----------------
def strip_json_fences(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()

async def llm_json(system: str, user_text: str, session_id: str, file_contents=None, model="gemini-2.5-flash", provider="gemini") -> dict:
    """Send a message and parse JSON reply."""
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system,
    ).with_model(provider, model)
    msg = UserMessage(text=user_text, file_contents=file_contents or [])
    resp = await chat.send_message(msg)
    text = resp if isinstance(resp, str) else str(resp)
    text = strip_json_fences(text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # try to find JSON inside
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            return json.loads(m.group(0))
        raise HTTPException(status_code=502, detail="AI response was not valid JSON")


# ---------------- Auth Endpoints ----------------
@api.post("/auth/register")
async def register(payload: RegisterIn):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "email": email,
        "name": payload.name.strip(),
        "password_hash": hash_password(payload.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc),
        "streak": 0,
        "last_activity_date": None,
        "badges": [],
    }
    res = await db.users.insert_one(doc)
    doc["_id"] = res.inserted_id
    user = sanitize_user(doc)
    token = create_access_token(user["id"], user["email"], user["role"])
    return {"user": user, "token": token}

@api.post("/auth/login")
async def login(payload: LoginIn):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    su = sanitize_user(user)
    token = create_access_token(su["id"], su["email"], su.get("role", "user"))
    return {"user": su, "token": token}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": user}


# ---------------- Nutrition ----------------
@api.post("/nutrition/analyze")
async def analyze_food(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    contents = await file.read()
    b64 = base64.b64encode(contents).decode("utf-8")

    system = (
        "You are a certified nutritionist AI. Analyze food images and return ONLY strict JSON matching this schema: "
        '{"foodName": string, "calories": number, "protein": number, "carbs": number, "fat": number, "healthScore": number(0-100), "analysis": string}'
    )
    prompt = (
        "Analyze this food image. Estimate calories (kcal) and macronutrients (grams). "
        "Rate healthiness from 0-100 and provide a concise 1-2 sentence analysis. "
        "Return only valid JSON, no markdown, no code fences."
    )
    data = await llm_json(
        system=system,
        user_text=prompt,
        session_id=f"nutrition-{user['id']}",
        file_contents=[ImageContent(image_base64=b64)],
    )

    entry = {
        "user_id": user["id"],
        "foodName": data.get("foodName", "Meal"),
        "calories": float(data.get("calories", 0)),
        "protein": float(data.get("protein", 0)),
        "carbs": float(data.get("carbs", 0)),
        "fat": float(data.get("fat", 0)),
        "healthScore": float(data.get("healthScore", 50)),
        "analysis": data.get("analysis", ""),
        "timestamp": now_iso(),
        "created_at": datetime.now(timezone.utc),
    }
    ins = await db.nutrition.insert_one(dict(entry))
    entry["id"] = str(ins.inserted_id)
    await update_streak(user["id"])
    return entry

@api.get("/nutrition")
async def list_nutrition(user: dict = Depends(get_current_user), search: Optional[str] = None):
    q = {"user_id": user["id"]}
    if search:
        q["foodName"] = {"$regex": re.escape(search), "$options": "i"}
    docs = await db.nutrition.find(q).sort("timestamp", -1).to_list(500)
    for d in docs:
        d["id"] = str(d.pop("_id"))
        d.pop("created_at", None)
    return docs

@api.delete("/nutrition/{item_id}")
async def delete_nutrition(item_id: str, user: dict = Depends(get_current_user)):
    res = await db.nutrition.delete_one({"_id": ObjectId(item_id), "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ---------------- Journal (voice + text) ----------------
@api.post("/journal/analyze-text")
async def analyze_journal_text(
    payload: Dict[str, str],
    user: dict = Depends(get_current_user),
):
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    system = (
        "You are an emotional-wellbeing analyst. Analyze journal entries and return ONLY strict JSON: "
        '{"mood": string, "stressLevel": number(1-10), "sentimentScore": number(-1 to 1), '
        '"keyTopics": string[], "summary": string}'
    )
    data = await llm_json(
        system=system,
        user_text=f'Analyze this journal entry:\n"""\n{text}\n"""\nReturn only JSON.',
        session_id=f"journal-{user['id']}",
    )
    entry = _build_journal_entry(user["id"], data)
    ins = await db.journal.insert_one(dict(entry))
    entry["id"] = str(ins.inserted_id)
    await update_streak(user["id"])
    return entry

@api.post("/journal/analyze-audio")
async def analyze_journal_audio(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    contents = await file.read()
    b64 = base64.b64encode(contents).decode("utf-8")
    mime = file.content_type or "audio/webm"

    system = (
        "You are an emotional-wellbeing analyst. Listen to voice recordings and analyze tone, pace, and content. "
        "Return ONLY strict JSON: "
        '{"mood": string, "stressLevel": number(1-10), "sentimentScore": number(-1 to 1), '
        '"keyTopics": string[], "summary": string}'
    )
    prompt = (
        "Listen to this voice diary. Analyze the speaker's emotional tone (not just words), "
        "detect stress markers, and return only JSON, no markdown."
    )
    data = await llm_json(
        system=system,
        user_text=prompt,
        session_id=f"journal-{user['id']}",
        file_contents=[FileContent(content_type=mime, file_content_base64=b64)],
    )
    entry = _build_journal_entry(user["id"], data)
    ins = await db.journal.insert_one(dict(entry))
    entry["id"] = str(ins.inserted_id)
    await update_streak(user["id"])
    return entry

def _build_journal_entry(user_id: str, data: dict) -> dict:
    return {
        "user_id": user_id,
        "mood": data.get("mood", "Neutral"),
        "stressLevel": float(data.get("stressLevel", 5)),
        "sentimentScore": float(data.get("sentimentScore", 0)),
        "keyTopics": list(data.get("keyTopics", []))[:8],
        "summary": data.get("summary", ""),
        "timestamp": now_iso(),
        "created_at": datetime.now(timezone.utc),
    }

@api.get("/journal")
async def list_journal(user: dict = Depends(get_current_user), search: Optional[str] = None):
    q = {"user_id": user["id"]}
    if search:
        q["$or"] = [
            {"summary": {"$regex": re.escape(search), "$options": "i"}},
            {"mood": {"$regex": re.escape(search), "$options": "i"}},
            {"keyTopics": {"$regex": re.escape(search), "$options": "i"}},
        ]
    docs = await db.journal.find(q).sort("timestamp", -1).to_list(500)
    for d in docs:
        d["id"] = str(d.pop("_id"))
        d.pop("created_at", None)
    return docs

@api.post("/journal/quick")
async def quick_journal(payload: JournalIn, user: dict = Depends(get_current_user)):
    entry = _build_journal_entry(user["id"], payload.model_dump())
    ins = await db.journal.insert_one(dict(entry))
    entry["id"] = str(ins.inserted_id)
    return entry


# ---------------- Activity ----------------
@api.get("/activity")
async def get_activity(user: dict = Depends(get_current_user)):
    doc = await db.activity.find_one({"user_id": user["id"]}, sort=[("date", -1)])
    if not doc:
        return {
            "date": datetime.now(timezone.utc).date().isoformat(),
            "steps": 6500, "sleepHours": 7.0, "sleepQuality": 6,
            "heartRateAvg": 72, "caloriesBurned": 1800,
        }
    doc["id"] = str(doc.pop("_id"))
    doc.pop("created_at", None)
    return doc

@api.post("/activity")
async def upsert_activity(payload: ActivityIn, user: dict = Depends(get_current_user)):
    date_key = payload.date or datetime.now(timezone.utc).date().isoformat()
    doc = {
        "user_id": user["id"],
        "date": date_key,
        "steps": payload.steps,
        "sleepHours": payload.sleepHours,
        "sleepQuality": payload.sleepQuality,
        "heartRateAvg": payload.heartRateAvg,
        "caloriesBurned": payload.caloriesBurned,
        "created_at": datetime.now(timezone.utc),
    }
    await db.activity.update_one(
        {"user_id": user["id"], "date": date_key},
        {"$set": doc},
        upsert=True,
    )
    return {"ok": True, **doc, "created_at": None}

@api.get("/activity/history")
async def activity_history(days: int = 7, user: dict = Depends(get_current_user)):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).date().isoformat()
    docs = await db.activity.find({"user_id": user["id"], "date": {"$gte": cutoff}}).sort("date", 1).to_list(60)
    for d in docs:
        d["id"] = str(d.pop("_id"))
        d.pop("created_at", None)
    return docs


# ---------------- Devices ----------------
@api.get("/devices")
async def list_devices(user: dict = Depends(get_current_user)):
    docs = await db.devices.find({"user_id": user["id"]}).to_list(50)
    for d in docs:
        d.pop("_id", None)
    return docs

@api.post("/devices")
async def upsert_device(payload: DeviceIn, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["user_id"] = user["id"]
    await db.devices.update_one(
        {"user_id": user["id"], "id": payload.id},
        {"$set": doc},
        upsert=True,
    )
    return {"ok": True}

@api.delete("/devices/{device_id}")
async def delete_device(device_id: str, user: dict = Depends(get_current_user)):
    await db.devices.delete_one({"user_id": user["id"], "id": device_id})
    return {"ok": True}


# ---------------- Chat ----------------
@api.get("/chat")
async def list_chat(user: dict = Depends(get_current_user)):
    docs = await db.chat.find({"user_id": user["id"]}).sort("timestamp", 1).to_list(2000)
    for d in docs:
        d["id"] = str(d.pop("_id"))
        d.pop("created_at", None)
        d.pop("user_id", None)
    return docs

@api.post("/chat")
async def chat_send(payload: ChatIn, user: dict = Depends(get_current_user)):
    session_id = payload.session_id or f"chat-{user['id']}"
    # Save user message
    user_msg = {
        "user_id": user["id"],
        "role": "user",
        "text": payload.message,
        "timestamp": now_iso(),
        "created_at": datetime.now(timezone.utc),
    }
    r = await db.chat.insert_one(dict(user_msg))
    user_msg["id"] = str(r.inserted_id)

    # Build context: recent user profile + last stress + nutrition
    recent_journal = await db.journal.find({"user_id": user["id"]}).sort("timestamp", -1).to_list(3)
    recent_nutrition = await db.nutrition.find({"user_id": user["id"]}).sort("timestamp", -1).to_list(3)
    activity = await db.activity.find_one({"user_id": user["id"]}, sort=[("date", -1)])
    context_lines = []
    if activity:
        context_lines.append(f"Latest activity: {activity.get('steps')} steps, {activity.get('sleepHours')}h sleep, HR {activity.get('heartRateAvg')} bpm.")
    if recent_journal:
        j = recent_journal[0]
        context_lines.append(f"Recent mood: {j.get('mood')}, stress {j.get('stressLevel')}/10.")
    if recent_nutrition:
        n = recent_nutrition[0]
        context_lines.append(f"Latest meal: {n.get('foodName')} ({n.get('calories')} kcal, health {n.get('healthScore')}/100).")

    system = (
        "You are HealthGuard, a compassionate, friendly, and knowledgeable AI wellness companion. "
        "You talk to the user like a supportive friend with expertise in nutrition, sleep, stress management, and fitness. "
        "Keep responses concise (max 3 short paragraphs), encouraging, empathetic. Never diagnose serious conditions; "
        "advise seeing a doctor when needed.\n"
        "USER_CONTEXT: " + " ".join(context_lines)
    )

    # Include recent chat history in the initial messages
    history_docs = await db.chat.find({"user_id": user["id"]}).sort("timestamp", -1).limit(20).to_list(20)
    history_docs = list(reversed(history_docs))[:-1]  # exclude the message we just inserted
    initial_messages = [
        {"role": m["role"], "content": m["text"]} for m in history_docs
    ]

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system,
        initial_messages=initial_messages,
    ).with_model("gemini", "gemini-2.5-flash")

    resp = await chat.send_message(UserMessage(text=payload.message))
    text = resp if isinstance(resp, str) else str(resp)

    ai_msg = {
        "user_id": user["id"],
        "role": "model",
        "text": text,
        "timestamp": now_iso(),
        "created_at": datetime.now(timezone.utc),
    }
    r2 = await db.chat.insert_one(dict(ai_msg))
    ai_msg["id"] = str(r2.inserted_id)

    return {"user_message": {**{k: v for k, v in user_msg.items() if k != "created_at"}}, "reply": {**{k: v for k, v in ai_msg.items() if k != "created_at"}}}


# ---------------- Insights / Wellness Report ----------------
@api.get("/insights")
async def insights(user: dict = Depends(get_current_user)):
    nutrition = await db.nutrition.find({"user_id": user["id"]}).sort("timestamp", -1).limit(10).to_list(10)
    journal = await db.journal.find({"user_id": user["id"]}).sort("timestamp", -1).limit(10).to_list(10)
    activity = await db.activity.find_one({"user_id": user["id"]}, sort=[("date", -1)])

    if not nutrition and not journal and not activity:
        return {
            "wellnessScore": 75,
            "recommendations": [
                {"category": "DIET", "title": "Balanced Start", "description": "Log your first meal to unlock personalised diet insights.", "priority": "MEDIUM"},
                {"category": "FITNESS", "title": "Get Moving", "description": "Aim for 8,000 steps today to improve circulation and mood.", "priority": "LOW"},
                {"category": "STRESS", "title": "Voice Check-in", "description": "Record a 30s voice note to calibrate your stress baseline.", "priority": "MEDIUM"},
                {"category": "SLEEP", "title": "Consistent Rest", "description": "Aim for 7–9 hours of sleep to protect cognitive function.", "priority": "LOW"},
            ],
        }

    context = {
        "nutrition": [{k: v for k, v in n.items() if k not in ("_id", "created_at", "user_id")} for n in nutrition],
        "journal": [{k: v for k, v in j.items() if k not in ("_id", "created_at", "user_id")} for j in journal],
        "activity": {k: v for k, v in (activity or {}).items() if k not in ("_id", "created_at", "user_id")},
    }

    system = (
        "You are a preventive-wellness reasoning engine. Analyse the user's data (nutrition, journal, activity), "
        "detect anomalies (e.g., high stress + poor sleep, bad diet + low activity), and generate a JSON response: "
        '{"wellnessScore": number(0-100), "recommendations": [{"category":"DIET|FITNESS|STRESS|SLEEP","title":string,"description":string,"priority":"HIGH|MEDIUM|LOW"}]} '
        "Return exactly 4 recommendations. Return only JSON."
    )
    try:
        data = await llm_json(
            system=system,
            user_text=f"Data: {json.dumps(context)}",
            session_id=f"insights-{user['id']}",
        )
        return data
    except Exception:
        logger.exception("insights failed")
        return {
            "wellnessScore": 65,
            "recommendations": [
                {"category": "STRESS", "title": "Reflect & Reset", "description": "Take 2 minutes to breathe deeply and reset your posture.", "priority": "MEDIUM"},
            ],
        }


# ---------------- Streaks + Badges ----------------
BADGE_CATALOG = [
    {"id": "first_step", "name": "First Step", "desc": "Logged your first entry.", "threshold": 1},
    {"id": "week_warrior", "name": "Week Warrior", "desc": "7-day activity streak.", "threshold": 7},
    {"id": "fortnight_force", "name": "Fortnight Force", "desc": "14-day streak.", "threshold": 14},
    {"id": "monthly_mind", "name": "Monthly Mindful", "desc": "30-day streak.", "threshold": 30},
]

async def update_streak(user_id: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return
    today = datetime.now(timezone.utc).date().isoformat()
    last = user.get("last_activity_date")
    streak = user.get("streak", 0)
    if last == today:
        pass
    elif last:
        last_date = datetime.fromisoformat(last).date() if isinstance(last, str) else last
        today_d = datetime.now(timezone.utc).date()
        if (today_d - last_date).days == 1:
            streak += 1
        else:
            streak = 1
    else:
        streak = 1

    # award badges
    existing_badges = set(user.get("badges", []))
    for b in BADGE_CATALOG:
        if streak >= b["threshold"]:
            existing_badges.add(b["id"])

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"streak": streak, "last_activity_date": today, "badges": list(existing_badges)}},
    )

@api.get("/streak")
async def get_streak(user: dict = Depends(get_current_user)):
    u = await db.users.find_one({"_id": ObjectId(user["id"])})
    badges_earned = set(u.get("badges", []))
    return {
        "streak": u.get("streak", 0),
        "last_activity_date": u.get("last_activity_date"),
        "badges": [{**b, "earned": b["id"] in badges_earned} for b in BADGE_CATALOG],
    }


# ---------------- Weekly PDF report ----------------
@api.get("/report/weekly.pdf")
async def weekly_report(user: dict = Depends(get_current_user)):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib.colors import HexColor
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    cutoff_iso = cutoff.isoformat()

    nutrition = await db.nutrition.find({"user_id": user["id"], "timestamp": {"$gte": cutoff_iso}}).to_list(200)
    journal = await db.journal.find({"user_id": user["id"], "timestamp": {"$gte": cutoff_iso}}).to_list(200)
    activity_docs = await db.activity.find({"user_id": user["id"]}).sort("date", -1).limit(7).to_list(7)

    total_cal = sum(n.get("calories", 0) for n in nutrition)
    avg_stress = round(sum(j.get("stressLevel", 0) for j in journal) / len(journal), 1) if journal else 0
    avg_sleep = round(sum(a.get("sleepHours", 0) for a in activity_docs) / len(activity_docs), 1) if activity_docs else 0
    avg_steps = int(sum(a.get("steps", 0) for a in activity_docs) / len(activity_docs)) if activity_docs else 0

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=0.6*inch)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="H", fontSize=22, textColor=HexColor("#D86B45"), spaceAfter=6, leading=26))
    styles.add(ParagraphStyle(name="Sub", fontSize=12, textColor=HexColor("#555"), spaceAfter=18))

    elements = [
        Paragraph("HealthGuardAI — Weekly Wellness Report", styles["H"]),
        Paragraph(f"Prepared for <b>{user['name']}</b> · {datetime.now(timezone.utc).strftime('%B %d, %Y')}", styles["Sub"]),
        Paragraph("<b>Summary</b>", styles["Heading2"]),
        Spacer(1, 6),
    ]
    tbl = Table([
        ["Metric", "Value"],
        ["Meals logged", str(len(nutrition))],
        ["Total calories (7d)", f"{int(total_cal)} kcal"],
        ["Journal entries", str(len(journal))],
        ["Avg stress", f"{avg_stress} / 10"],
        ["Avg sleep", f"{avg_sleep} h"],
        ["Avg steps", f"{avg_steps}"],
    ], colWidths=[3*inch, 3*inch])
    tbl.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), HexColor("#050505")),
        ("TEXTCOLOR", (0,0), (-1,0), HexColor("#F2EFE9")),
        ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
        ("GRID", (0,0), (-1,-1), 0.4, HexColor("#DDDDDD")),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [HexColor("#FAFAFA"), HexColor("#FFFFFF")]),
        ("PADDING", (0,0), (-1,-1), 8),
    ]))
    elements.append(tbl)
    elements.append(Spacer(1, 18))
    elements.append(Paragraph("<b>Recent Journal Highlights</b>", styles["Heading2"]))
    for j in journal[:5]:
        elements.append(Paragraph(f"• <b>{j.get('mood','')}</b> (stress {j.get('stressLevel',0)}/10) — {j.get('summary','')}", styles["Normal"]))
        elements.append(Spacer(1, 4))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("<b>Nutrition Highlights</b>", styles["Heading2"]))
    for n in nutrition[:5]:
        elements.append(Paragraph(f"• {n.get('foodName','')} — {int(n.get('calories',0))} kcal · health {int(n.get('healthScore',0))}/100", styles["Normal"]))
        elements.append(Spacer(1, 4))

    doc.build(elements)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf", headers={
        "Content-Disposition": f'attachment; filename="healthguard-weekly-{datetime.now(timezone.utc).date().isoformat()}.pdf"'
    })


# ---------------- Admin ----------------
@api.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    users_total = await db.users.count_documents({})
    meals_total = await db.nutrition.count_documents({})
    journals_total = await db.journal.count_documents({})
    chats_total = await db.chat.count_documents({})
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    new_users = await db.users.count_documents({"created_at": {"$gte": week_ago}})
    # top stress events
    high_stress = await db.journal.find({"stressLevel": {"$gte": 8}}).sort("timestamp", -1).limit(10).to_list(10)
    for h in high_stress:
        h["id"] = str(h.pop("_id"))
        h.pop("created_at", None)
    return {
        "users_total": users_total,
        "meals_total": meals_total,
        "journals_total": journals_total,
        "chats_total": chats_total,
        "new_users_7d": new_users,
        "high_stress_events": high_stress,
    }

@api.get("/admin/users")
async def admin_users(admin: dict = Depends(require_admin)):
    docs = await db.users.find({}).sort("created_at", -1).to_list(200)
    return [sanitize_user(d) for d in docs]


# ---------------- Health / bootstrap ----------------
@api.get("/health")
async def health():
    return {"status": "ok", "time": now_iso()}


app.include_router(api)


# ---------------- Startup ----------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.nutrition.create_index([("user_id", 1), ("timestamp", -1)])
    await db.journal.create_index([("user_id", 1), ("timestamp", -1)])
    await db.chat.create_index([("user_id", 1), ("timestamp", 1)])
    await db.activity.create_index([("user_id", 1), ("date", -1)])
    await db.devices.create_index([("user_id", 1), ("id", 1)], unique=True)

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@healthguard.ai").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "created_at": datetime.now(timezone.utc),
            "streak": 0, "last_activity_date": None, "badges": [],
        })
        logger.info("Seeded admin user %s", admin_email)
    else:
        if not verify_password(admin_password, existing["password_hash"]):
            await db.users.update_one({"_id": existing["_id"]}, {"$set": {"password_hash": hash_password(admin_password)}})

    demo_email = os.environ.get("DEMO_EMAIL", "demo@healthguard.ai").lower()
    demo_password = os.environ.get("DEMO_PASSWORD", "demo123")
    demo = await db.users.find_one({"email": demo_email})
    if not demo:
        await db.users.insert_one({
            "email": demo_email,
            "name": "Demo User",
            "password_hash": hash_password(demo_password),
            "role": "user",
            "created_at": datetime.now(timezone.utc),
            "streak": 0, "last_activity_date": None, "badges": [],
        })
        logger.info("Seeded demo user %s", demo_email)
    else:
        if not verify_password(demo_password, demo["password_hash"]):
            await db.users.update_one({"_id": demo["_id"]}, {"$set": {"password_hash": hash_password(demo_password)}})
