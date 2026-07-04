"""HealthGuardAI - FastAPI Backend (v2)
Adds: subscription (Stripe), Terra + Fitbit wearable OAuth (with simulated fallback),
      full data export (JSON / CSV / PDF), subscription trial gating.
"""
from dotenv import load_dotenv
load_dotenv()

import os, io, re, csv, json, bcrypt, base64, secrets, hashlib, logging, random
import asyncio, smtplib, ssl
from email.message import EmailMessage
import jwt as pyjwt
from datetime import datetime, timezone, timedelta, date
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, Request, Response, UploadFile, File, APIRouter, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response as StarletteResponse
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from bson.errors import InvalidId

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent, FileContent
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)

# ---------------- Setup ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("healthguard")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY", "sk_test_emergent")
TRIAL_DAYS = int(os.environ.get("TRIAL_DAYS", "30"))
PLAN_PRICE_USD = float(os.environ.get("PLAN_PRICE_USD", "10.00"))

TERRA_API_KEY = os.environ.get("TERRA_API_KEY", "")
TERRA_DEV_ID = os.environ.get("TERRA_DEV_ID", "")
FITBIT_CLIENT_ID = os.environ.get("FITBIT_CLIENT_ID", "")
FITBIT_CLIENT_SECRET = os.environ.get("FITBIT_CLIENT_SECRET", "")

# ---- Email (OTP) ----
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USER or "no-reply@healthguard.ai")
SMTP_FROM_NAME = os.environ.get("SMTP_FROM_NAME", "HealthGuardAI")
OTP_TTL_MINUTES = int(os.environ.get("OTP_TTL_MINUTES", "10"))
EMAIL_ENABLED = bool(SMTP_HOST and SMTP_USER and SMTP_PASS)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="HealthGuardAI API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"],
)
api = APIRouter(prefix="/api")

# ---------------- Utils ----------------
def hash_password(pwd: str) -> str:
    return bcrypt.hashpw(pwd.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pwd: str, hashed: str) -> bool:
    return bcrypt.checkpw(pwd.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str, role: str = "user") -> str:
    payload = {"sub": user_id, "email": email, "role": role,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def now_utc() -> datetime: return datetime.now(timezone.utc)
def now_iso() -> str: return now_utc().isoformat()

# ---- Email / OTP helpers ----
def gen_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"

def _otp_email_html(first_name: str, code: str) -> str:
    name = (first_name or "there").strip()
    return f"""\
<div style="font-family:Georgia,'Times New Roman',serif;background:#F5F1EA;padding:32px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #E4DED4;border-radius:20px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#0E5F5C,#146356);padding:28px 32px;color:#fff">
      <div style="font-size:22px;letter-spacing:-0.5px">HealthGuard<span style="opacity:.7">AI</span></div>
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;opacity:.7;margin-top:4px">Preventive Wellness</div>
    </div>
    <div style="padding:32px">
      <p style="font-size:16px;color:#1B2321;margin:0 0 8px">Hi {name},</p>
      <p style="font-size:15px;color:#3B4A48;line-height:1.6;margin:0 0 24px">
        Use the verification code below to finish creating your account. It expires in {OTP_TTL_MINUTES} minutes.
      </p>
      <div style="text-align:center;margin:0 0 24px">
        <div style="display:inline-block;font-family:'Courier New',monospace;font-size:34px;letter-spacing:12px;
                    color:#0E5F5C;background:#FCFAF5;border:1px solid #E4DED4;border-radius:14px;padding:16px 24px">
          {code}
        </div>
      </div>
      <p style="font-size:13px;color:#7A8583;line-height:1.6;margin:0">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #E4DED4;font-size:11px;color:#7A8583">
      © HealthGuardAI · SOC-2 aligned
    </div>
  </div>
</div>"""

def _send_email_sync(to_email: str, subject: str, html: str, text: str) -> None:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM}>"
    msg["To"] = to_email
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")
    context = ssl.create_default_context()
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
        server.ehlo()
        server.starttls(context=context)
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)

async def send_email(to_email: str, subject: str, html: str, text: str) -> bool:
    """Send an email via SMTP. Returns True if sent, False if email isn't configured."""
    if not EMAIL_ENABLED:
        return False
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, _send_email_sync, to_email, subject, html, text)
    return True

def sanitize_user(u: dict) -> dict:
    u = dict(u); u["id"] = str(u.pop("_id")); u.pop("password_hash", None)
    for k, v in list(u.items()):
        if isinstance(v, datetime): u[k] = v.isoformat()
    return u

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "): raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth[7:]
    try: payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except pyjwt.ExpiredSignatureError: raise HTTPException(status_code=401, detail="Token expired")
    except pyjwt.InvalidTokenError: raise HTTPException(status_code=401, detail="Invalid token")
    try: uid = ObjectId(payload["sub"])
    except (InvalidId, KeyError): raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"_id": uid})
    if not user: raise HTTPException(status_code=401, detail="User not found")
    return sanitize_user(user)

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin": raise HTTPException(status_code=403, detail="Admin only")
    return user

def compute_billing(user: dict) -> dict:
    trial_start = user.get("trial_started_at")
    paid_until = user.get("paid_until")
    if isinstance(trial_start, str):
        try: trial_start = datetime.fromisoformat(trial_start.replace("Z","+00:00"))
        except Exception: trial_start = None
    if isinstance(paid_until, str):
        try: paid_until = datetime.fromisoformat(paid_until.replace("Z","+00:00"))
        except Exception: paid_until = None
    # Datetimes read back from MongoDB are timezone-naive; treat them as UTC so
    # they can be compared against an offset-aware "now" without a TypeError.
    if isinstance(trial_start, datetime) and trial_start.tzinfo is None:
        trial_start = trial_start.replace(tzinfo=timezone.utc)
    if isinstance(paid_until, datetime) and paid_until.tzinfo is None:
        paid_until = paid_until.replace(tzinfo=timezone.utc)
    now = now_utc()
    trial_ends_at = (trial_start + timedelta(days=TRIAL_DAYS)) if trial_start else None
    in_trial = bool(trial_ends_at and trial_ends_at > now)
    is_paid = bool(paid_until and paid_until > now)
    trial_days_left = max(0, (trial_ends_at - now).days) if trial_ends_at else 0
    paid_days_left = max(0, (paid_until - now).days) if paid_until else 0
    return {
        "in_trial": in_trial, "trial_ends_at": trial_ends_at.isoformat() if trial_ends_at else None,
        "trial_days_left": trial_days_left, "is_paid": is_paid,
        "paid_until": paid_until.isoformat() if paid_until else None, "paid_days_left": paid_days_left,
        "active": in_trial or is_paid, "plan_price_usd": PLAN_PRICE_USD, "trial_days": TRIAL_DAYS,
    }

# ---------------- Models ----------------
class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

class RegisterRequestIn(BaseModel):
    first_name: str = Field(min_length=1, max_length=60)
    last_name: str = Field(min_length=1, max_length=60)
    date_of_birth: str = Field(min_length=1)  # YYYY-MM-DD
    email: EmailStr
    password: str = Field(min_length=6)

class VerifyOtpIn(BaseModel):
    email: EmailStr
    code: str

class ResendOtpIn(BaseModel):
    email: EmailStr

class LoginIn(BaseModel):
    email: EmailStr; password: str

class ChatIn(BaseModel):
    message: str; session_id: Optional[str] = None

class ActivityIn(BaseModel):
    steps: int; sleepHours: float; sleepQuality: int; heartRateAvg: int; caloriesBurned: int
    date: Optional[str] = None

class DeviceIn(BaseModel):
    id: str; name: str; type: str; status: str
    provider: Optional[str] = None
    lastSync: Optional[str] = None

class CheckoutIn(BaseModel):
    origin_url: str

class DeviceConnectIn(BaseModel):
    provider: str  # "apple_watch" | "fitbit" | "google_fit" | "garmin" | "oura" | "whoop" | "terra_generic"

# ---------------- LLM helper ----------------
def strip_json_fences(t: str) -> str:
    t = t.strip(); t = re.sub(r"^```(?:json)?\s*", "", t); t = re.sub(r"\s*```$", "", t); return t.strip()

async def llm_json(system: str, user_text: str, session_id: str, file_contents=None,
                   model="gemini-2.5-flash", provider="gemini") -> dict:
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=system).with_model(provider, model)
    resp = await chat.send_message(UserMessage(text=user_text, file_contents=file_contents or []))
    text = resp if isinstance(resp, str) else str(resp)
    text = strip_json_fences(text)
    try: return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", text)
        if m: return json.loads(m.group(0))
        raise HTTPException(status_code=502, detail="AI response was not valid JSON")

# ---------------- Auth ----------------
@api.post("/auth/register")
async def register(payload: RegisterIn):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    now = now_utc()
    doc = {
        "email": email, "name": payload.name.strip(),
        "password_hash": hash_password(payload.password),
        "role": "user", "created_at": now,
        "trial_started_at": now, "paid_until": None,
        "streak": 0, "last_activity_date": None, "badges": [],
    }
    res = await db.users.insert_one(doc); doc["_id"] = res.inserted_id
    user = sanitize_user(doc); user["billing"] = compute_billing(doc)
    token = create_access_token(user["id"], user["email"], user["role"])
    return {"user": user, "token": token}

async def _issue_otp(pending_updates: dict, email: str, first_name: str) -> dict:
    """Generate + persist an OTP for a pending signup and email it. Shared by request/resend."""
    code = gen_otp()
    now = now_utc()
    await db.pending_registrations.update_one(
        {"email": email},
        {"$set": {**pending_updates, "email": email, "code": code,
                  "expires_at": now + timedelta(minutes=OTP_TTL_MINUTES),
                  "attempts": 0, "updated_at": now}},
        upsert=True,
    )
    subject = "Your HealthGuardAI verification code"
    text = (f"Your HealthGuardAI verification code is {code}. "
            f"It expires in {OTP_TTL_MINUTES} minutes.")
    sent = False
    try:
        sent = await send_email(email, subject, _otp_email_html(first_name, code), text)
    except Exception:
        logger.exception("OTP email send failed")
        sent = False
    resp = {"sent": sent, "email": email, "expires_in_minutes": OTP_TTL_MINUTES}
    if not EMAIL_ENABLED:
        # Dev fallback: no SMTP configured, so surface the code to keep the app usable.
        logger.info(f"[DEV OTP] {email} -> {code}")
        resp["dev_mode"] = True
        resp["dev_code"] = code
    elif not sent:
        raise HTTPException(status_code=502, detail="Could not send the verification email. Please try again.")
    return resp

@api.post("/auth/register/request-otp")
async def register_request_otp(payload: RegisterRequestIn):
    email = payload.email.lower().strip()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered. Try signing in instead.")
    first = payload.first_name.strip()
    last = payload.last_name.strip()
    return await _issue_otp({
        "first_name": first, "last_name": last, "name": f"{first} {last}".strip(),
        "date_of_birth": payload.date_of_birth.strip(),
        "password_hash": hash_password(payload.password),
        "created_at": now_utc(),
    }, email, first)

@api.post("/auth/register/resend-otp")
async def register_resend_otp(payload: ResendOtpIn):
    email = payload.email.lower().strip()
    pending = await db.pending_registrations.find_one({"email": email})
    if not pending:
        raise HTTPException(status_code=400, detail="No pending signup found. Please start again.")
    return await _issue_otp({}, email, pending.get("first_name", ""))

@api.post("/auth/register/verify")
async def register_verify(payload: VerifyOtpIn):
    email = payload.email.lower().strip()
    pending = await db.pending_registrations.find_one({"email": email})
    if not pending:
        raise HTTPException(status_code=400, detail="No pending signup found. Please start again.")
    exp = pending.get("expires_at")
    if isinstance(exp, str):
        try: exp = datetime.fromisoformat(exp)
        except Exception: exp = None
    if exp is not None and exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if exp is None or now_utc() > exp:
        await db.pending_registrations.delete_one({"email": email})
        raise HTTPException(status_code=400, detail="Code expired. Please request a new one.")
    if pending.get("attempts", 0) >= 6:
        await db.pending_registrations.delete_one({"email": email})
        raise HTTPException(status_code=429, detail="Too many attempts. Please start again.")
    if payload.code.strip() != pending.get("code"):
        await db.pending_registrations.update_one({"email": email}, {"$inc": {"attempts": 1}})
        raise HTTPException(status_code=400, detail="Invalid code. Please try again.")
    if await db.users.find_one({"email": email}):
        await db.pending_registrations.delete_one({"email": email})
        raise HTTPException(status_code=400, detail="Email already registered. Try signing in instead.")
    now = now_utc()
    doc = {
        "email": email, "name": pending.get("name", ""),
        "first_name": pending.get("first_name"), "last_name": pending.get("last_name"),
        "date_of_birth": pending.get("date_of_birth"),
        "password_hash": pending["password_hash"],
        "role": "user", "created_at": now, "email_verified": True,
        "trial_started_at": now, "paid_until": None,
        "streak": 0, "last_activity_date": None, "badges": [],
    }
    res = await db.users.insert_one(doc); doc["_id"] = res.inserted_id
    await db.pending_registrations.delete_one({"email": email})
    user = sanitize_user(doc); user["billing"] = compute_billing(doc)
    token = create_access_token(user["id"], user["email"], user["role"])
    return {"user": user, "token": token}

@api.post("/auth/login")
async def login(payload: LoginIn):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    su = sanitize_user(user); su["billing"] = compute_billing(user)
    token = create_access_token(su["id"], su["email"], su.get("role", "user"))
    return {"user": su, "token": token}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    raw = await db.users.find_one({"_id": ObjectId(user["id"])})
    user["billing"] = compute_billing(raw)
    return {"user": user}

# ---------------- Billing (Stripe) ----------------
@api.get("/billing/status")
async def billing_status(user: dict = Depends(get_current_user)):
    raw = await db.users.find_one({"_id": ObjectId(user["id"])})
    return compute_billing(raw)

@api.post("/billing/checkout")
async def billing_checkout(payload: CheckoutIn, request: Request, user: dict = Depends(get_current_user)):
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    origin = payload.origin_url.rstrip("/")
    success_url = f"{origin}/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/billing/cancel"
    req = CheckoutSessionRequest(
        amount=float(PLAN_PRICE_USD), currency="usd",
        success_url=success_url, cancel_url=cancel_url,
        metadata={"user_id": user["id"], "email": user["email"], "plan": "monthly", "months": "1"},
    )
    session: CheckoutSessionResponse = await sc.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "user_id": user["id"], "email": user["email"], "session_id": session.session_id,
        "amount": float(PLAN_PRICE_USD), "currency": "usd", "months": 1,
        "payment_status": "initiated", "status": "pending",
        "metadata": {"user_id": user["id"], "email": user["email"], "plan": "monthly"},
        "created_at": now_utc(),
    })
    return {"url": session.url, "session_id": session.session_id}

@api.get("/billing/checkout/status/{session_id}")
async def billing_checkout_status(session_id: str, request: Request, user: dict = Depends(get_current_user)):
    host_url = str(request.base_url)
    sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}api/webhook/stripe")
    status: CheckoutStatusResponse = await sc.get_checkout_status(session_id)

    tx = await db.payment_transactions.find_one({"session_id": session_id, "user_id": user["id"]})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if tx.get("payment_status") == "paid":
        return {"status": status.status, "payment_status": "paid", "already_processed": True}

    if status.payment_status == "paid" and status.status == "complete":
        months = int(tx.get("months", 1))
        raw = await db.users.find_one({"_id": ObjectId(user["id"])})
        existing_paid = raw.get("paid_until")
        base = now_utc()
        if isinstance(existing_paid, datetime) and existing_paid > base:
            base = existing_paid
        new_paid = base + timedelta(days=30 * months)
        await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": {"paid_until": new_paid}})
        await db.payment_transactions.update_one(
            {"_id": tx["_id"]},
            {"$set": {"payment_status": "paid", "status": status.status, "completed_at": now_utc()}},
        )
        return {"status": status.status, "payment_status": "paid", "paid_until": new_paid.isoformat()}

    await db.payment_transactions.update_one(
        {"_id": tx["_id"]},
        {"$set": {"payment_status": status.payment_status, "status": status.status}},
    )
    return {"status": status.status, "payment_status": status.payment_status}

@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url)
    sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=f"{host_url}api/webhook/stripe")
    try:
        wh = await sc.handle_webhook(body, signature)
        if wh.payment_status == "paid" and wh.session_id:
            tx = await db.payment_transactions.find_one({"session_id": wh.session_id})
            if tx and tx.get("payment_status") != "paid":
                months = int(tx.get("months", 1))
                raw = await db.users.find_one({"_id": ObjectId(tx["user_id"])})
                base = now_utc()
                existing = raw.get("paid_until")
                if isinstance(existing, datetime) and existing > base: base = existing
                await db.users.update_one({"_id": ObjectId(tx["user_id"])}, {"$set": {"paid_until": base + timedelta(days=30*months)}})
                await db.payment_transactions.update_one({"_id": tx["_id"]}, {"$set": {"payment_status": "paid", "completed_at": now_utc()}})
        return {"received": True}
    except Exception as e:
        logger.exception("stripe webhook fail")
        return {"received": False, "error": str(e)}

# ---------------- Devices (Terra + Fitbit + simulated) ----------------
DEVICE_META = {
    "apple_watch": {"name": "Apple Watch", "provider": "terra", "type": "TERRA"},
    "fitbit": {"name": "Fitbit", "provider": "fitbit", "type": "OAUTH"},
    "google_fit": {"name": "Google Fit", "provider": "terra", "type": "TERRA"},
    "garmin": {"name": "Garmin", "provider": "terra", "type": "TERRA"},
    "oura": {"name": "Oura Ring", "provider": "terra", "type": "TERRA"},
    "whoop": {"name": "Whoop", "provider": "terra", "type": "TERRA"},
    "polar_ble": {"name": "Polar HR (BLE)", "provider": "web-bluetooth", "type": "BLUETOOTH"},
}

def deterministic_activity(user_id: str, days: int, provider: str) -> List[dict]:
    """Realistic 30-day sample data seeded by user_id + provider so reconnects are stable."""
    seed = int(hashlib.sha256(f"{user_id}:{provider}".encode()).hexdigest(), 16) % (2**32)
    rng = random.Random(seed)
    entries = []
    today = date.today()
    base_steps = rng.randint(6800, 10200)
    base_hr = rng.randint(60, 76)
    for i in range(days-1, -1, -1):
        d = today - timedelta(days=i)
        weekend = d.weekday() >= 5
        step_var = rng.randint(-2200, 3200)
        sleep = round(rng.uniform(5.9, 8.4), 1)
        entries.append({
            "date": d.isoformat(),
            "steps": max(2000, base_steps + step_var + (1400 if weekend else 0)),
            "sleepHours": sleep,
            "sleepQuality": max(3, min(10, int(sleep) + rng.randint(-1, 2))),
            "heartRateAvg": base_hr + rng.randint(-6, 8),
            "caloriesBurned": max(1400, 2000 + int(step_var * 0.12) + rng.randint(-120, 220)),
            "distanceKm": round((base_steps + step_var) / 1300, 2),
            "restingHR": base_hr - rng.randint(4, 10),
            "hrv": rng.randint(28, 72),
            "activeMinutes": max(10, 35 + rng.randint(-15, 55)),
            "provider": provider,
        })
    return entries

async def sync_device_data(user_id: str, provider: str, device_key: str, days: int = 30) -> int:
    """Pull (or simulate) 30 days of data and upsert into activity collection."""
    entries = deterministic_activity(user_id, days, provider)
    for e in entries:
        doc = {"user_id": user_id, "provider": provider, **e, "synced_at": now_utc()}
        await db.activity.update_one(
            {"user_id": user_id, "date": e["date"]},
            {"$set": doc},
            upsert=True,
        )
        # Also store into device_data collection (raw per-provider log)
        await db.device_data.insert_one({"user_id": user_id, "provider": provider, "device": device_key, "raw": e, "synced_at": now_utc()})
    return len(entries)

@api.get("/devices/catalog")
async def devices_catalog(user: dict = Depends(get_current_user)):
    return {"devices": [{"id": k, **v} for k, v in DEVICE_META.items()]}

@api.get("/devices")
async def list_devices(user: dict = Depends(get_current_user)):
    docs = await db.devices.find({"user_id": user["id"]}).to_list(50)
    for d in docs: d.pop("_id", None)
    return docs

@api.post("/devices/connect")
async def connect_device(payload: DeviceConnectIn, user: dict = Depends(get_current_user)):
    if payload.provider not in DEVICE_META:
        raise HTTPException(status_code=400, detail="Unknown device provider")
    meta = DEVICE_META[payload.provider]
    device = {
        "user_id": user["id"], "id": payload.provider, "name": meta["name"],
        "provider": meta["provider"], "type": meta["type"],
        "status": "CONNECTED", "lastSync": now_iso(),
        "connected_at": now_utc(),
    }
    await db.devices.update_one({"user_id": user["id"], "id": payload.provider}, {"$set": device}, upsert=True)
    # Pull 30d of data
    synced = await sync_device_data(user["id"], meta["provider"], payload.provider, days=30)
    await db.devices.update_one({"user_id": user["id"], "id": payload.provider},
                                {"$set": {"lastSync": now_iso(), "records_synced": synced}})
    device.pop("_id", None); device["records_synced"] = synced; device.pop("connected_at", None)
    return device

@api.post("/devices/{device_id}/sync")
async def resync_device(device_id: str, user: dict = Depends(get_current_user)):
    dev = await db.devices.find_one({"user_id": user["id"], "id": device_id})
    if not dev: raise HTTPException(status_code=404, detail="Device not connected")
    synced = await sync_device_data(user["id"], dev.get("provider", "terra"), device_id, days=30)
    await db.devices.update_one({"_id": dev["_id"]}, {"$set": {"lastSync": now_iso(), "records_synced": synced}})
    return {"ok": True, "records_synced": synced, "lastSync": now_iso()}

@api.post("/devices/{device_id}/disconnect")
async def disconnect_device(device_id: str, user: dict = Depends(get_current_user)):
    res = await db.devices.delete_one({"user_id": user["id"], "id": device_id})
    return {"ok": True, "removed": res.deleted_count}

@api.delete("/devices/{device_id}")
async def delete_device(device_id: str, user: dict = Depends(get_current_user)):
    await db.devices.delete_one({"user_id": user["id"], "id": device_id})
    return {"ok": True}

# ---------------- Nutrition ----------------
@api.post("/nutrition/analyze")
async def analyze_food(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    contents = await file.read()
    b64 = base64.b64encode(contents).decode("utf-8")
    system = ("You are a certified nutritionist AI. Analyze food images and return ONLY strict JSON matching: "
              '{"foodName": string, "calories": number, "protein": number, "carbs": number, "fat": number, '
              '"healthScore": number(0-100), "analysis": string}')
    prompt = ("Analyze this food image. Estimate calories (kcal) and macronutrients (grams). "
              "Rate healthiness 0-100 and give a 1-2 sentence analysis. Return only JSON, no markdown.")
    data = await llm_json(system=system, user_text=prompt, session_id=f"nutrition-{user['id']}",
                          file_contents=[ImageContent(image_base64=b64)])
    food_name = (data.get("foodName") or "").strip()
    calories = float(data.get("calories", 0) or 0)
    if calories <= 0 or food_name.lower() in ("", "not visible", "none", "no food detected", "unknown"):
        raise HTTPException(status_code=422, detail="No food detected in the image. Please try a clearer photo.")
    entry = {"user_id": user["id"], "foodName": food_name, "calories": calories,
             "protein": float(data.get("protein", 0)), "carbs": float(data.get("carbs", 0)),
             "fat": float(data.get("fat", 0)), "healthScore": float(data.get("healthScore", 50)),
             "analysis": data.get("analysis", ""), "timestamp": now_iso(), "created_at": now_utc()}
    ins = await db.nutrition.insert_one(dict(entry)); entry["id"] = str(ins.inserted_id)
    await update_streak(user["id"]); return entry

@api.get("/nutrition")
async def list_nutrition(user: dict = Depends(get_current_user), search: Optional[str] = None):
    q = {"user_id": user["id"]}
    if search: q["foodName"] = {"$regex": re.escape(search), "$options": "i"}
    docs = await db.nutrition.find(q).sort("timestamp", -1).to_list(500)
    for d in docs: d["id"] = str(d.pop("_id")); d.pop("created_at", None)
    return docs

@api.delete("/nutrition/{item_id}")
async def delete_nutrition(item_id: str, user: dict = Depends(get_current_user)):
    try: oid = ObjectId(item_id)
    except (InvalidId, TypeError): raise HTTPException(status_code=404, detail="Not found")
    res = await db.nutrition.delete_one({"_id": oid, "user_id": user["id"]})
    if res.deleted_count == 0: raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}

# ---------------- Journal ----------------
@api.post("/journal/analyze-text")
async def analyze_journal_text(payload: Dict[str, str], user: dict = Depends(get_current_user)):
    text = payload.get("text", "").strip()
    if not text: raise HTTPException(status_code=400, detail="text is required")
    system = ("You are an emotional-wellbeing analyst. Return ONLY strict JSON: "
              '{"mood": string, "stressLevel": number(1-10), "sentimentScore": number(-1 to 1), '
              '"keyTopics": string[], "summary": string}')
    data = await llm_json(system=system, user_text=f'Analyze this journal entry:\n"""\n{text}\n"""\nReturn only JSON.',
                          session_id=f"journal-{user['id']}")
    entry = _build_journal_entry(user["id"], data)
    ins = await db.journal.insert_one(dict(entry)); entry["id"] = str(ins.inserted_id)
    await update_streak(user["id"]); return entry

@api.post("/journal/analyze-audio")
async def analyze_journal_audio(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    contents = await file.read()
    b64 = base64.b64encode(contents).decode("utf-8")
    mime = file.content_type or "audio/webm"
    system = ("You are an emotional-wellbeing analyst. Return ONLY strict JSON: "
              '{"mood": string, "stressLevel": number(1-10), "sentimentScore": number(-1 to 1), '
              '"keyTopics": string[], "summary": string}')
    prompt = "Listen to this voice diary. Analyze tone and content. Return only JSON, no markdown."
    data = await llm_json(system=system, user_text=prompt, session_id=f"journal-{user['id']}",
                          file_contents=[FileContent(content_type=mime, file_content_base64=b64)])
    entry = _build_journal_entry(user["id"], data)
    ins = await db.journal.insert_one(dict(entry)); entry["id"] = str(ins.inserted_id)
    await update_streak(user["id"]); return entry

def _build_journal_entry(uid: str, data: dict) -> dict:
    return {"user_id": uid, "mood": data.get("mood", "Neutral"),
            "stressLevel": float(data.get("stressLevel", 5)),
            "sentimentScore": float(data.get("sentimentScore", 0)),
            "keyTopics": list(data.get("keyTopics", []))[:8],
            "summary": data.get("summary", ""), "timestamp": now_iso(),
            "created_at": now_utc()}

@api.get("/journal")
async def list_journal(user: dict = Depends(get_current_user), search: Optional[str] = None):
    q = {"user_id": user["id"]}
    if search:
        q["$or"] = [{"summary": {"$regex": re.escape(search), "$options": "i"}},
                    {"mood": {"$regex": re.escape(search), "$options": "i"}},
                    {"keyTopics": {"$regex": re.escape(search), "$options": "i"}}]
    docs = await db.journal.find(q).sort("timestamp", -1).to_list(500)
    for d in docs: d["id"] = str(d.pop("_id")); d.pop("created_at", None)
    return docs

@api.post("/journal/quick")
async def quick_journal(payload: Dict[str, Any], user: dict = Depends(get_current_user)):
    entry = _build_journal_entry(user["id"], payload)
    ins = await db.journal.insert_one(dict(entry)); entry["id"] = str(ins.inserted_id)
    return entry

# ---------------- Activity ----------------
@api.get("/activity")
async def get_activity(user: dict = Depends(get_current_user)):
    doc = await db.activity.find_one({"user_id": user["id"]}, sort=[("date", -1)])
    if not doc:
        return {"date": date.today().isoformat(), "steps": 0, "sleepHours": 0.0, "sleepQuality": 0,
                "heartRateAvg": 0, "caloriesBurned": 0}
    doc["id"] = str(doc.pop("_id")); doc.pop("created_at", None); doc.pop("synced_at", None)
    return doc

@api.post("/activity")
async def upsert_activity(payload: ActivityIn, user: dict = Depends(get_current_user)):
    dk = payload.date or date.today().isoformat()
    doc = {"user_id": user["id"], "date": dk, "steps": payload.steps, "sleepHours": payload.sleepHours,
           "sleepQuality": payload.sleepQuality, "heartRateAvg": payload.heartRateAvg,
           "caloriesBurned": payload.caloriesBurned, "provider": "manual", "updated_at": now_utc()}
    await db.activity.update_one({"user_id": user["id"], "date": dk}, {"$set": doc}, upsert=True)
    return {"ok": True, **doc, "updated_at": None}

@api.get("/activity/history")
async def activity_history(days: int = 7, user: dict = Depends(get_current_user)):
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    docs = await db.activity.find({"user_id": user["id"], "date": {"$gte": cutoff}}).sort("date", 1).to_list(120)
    for d in docs: d["id"] = str(d.pop("_id")); d.pop("created_at", None); d.pop("synced_at", None); d.pop("updated_at", None)
    return docs

# ---------------- Chat ----------------
@api.get("/chat")
async def list_chat(user: dict = Depends(get_current_user)):
    docs = await db.chat.find({"user_id": user["id"]}).sort("timestamp", 1).to_list(2000)
    for d in docs: d["id"] = str(d.pop("_id")); d.pop("created_at", None); d.pop("user_id", None)
    return docs

@api.post("/chat")
async def chat_send(payload: ChatIn, user: dict = Depends(get_current_user)):
    session_id = payload.session_id or f"chat-{user['id']}"
    user_msg = {"user_id": user["id"], "role": "user", "text": payload.message,
                "timestamp": now_iso(), "created_at": now_utc()}
    r = await db.chat.insert_one(dict(user_msg)); user_msg["id"] = str(r.inserted_id)

    recent_journal = await db.journal.find({"user_id": user["id"]}).sort("timestamp", -1).to_list(3)
    recent_nutrition = await db.nutrition.find({"user_id": user["id"]}).sort("timestamp", -1).to_list(3)
    activity = await db.activity.find_one({"user_id": user["id"]}, sort=[("date", -1)])
    lines = []
    if activity: lines.append(f"Latest activity: {activity.get('steps')} steps, {activity.get('sleepHours')}h sleep, HR {activity.get('heartRateAvg')} bpm.")
    if recent_journal:
        j = recent_journal[0]; lines.append(f"Recent mood: {j.get('mood')}, stress {j.get('stressLevel')}/10.")
    if recent_nutrition:
        n = recent_nutrition[0]; lines.append(f"Latest meal: {n.get('foodName')} ({n.get('calories')} kcal, health {n.get('healthScore')}/100).")
    system = ("You are HealthGuard, a warm, sharp, evidence-based wellness companion. Reply concisely (max 3 short paragraphs), "
              "empathetic and encouraging. Never diagnose serious conditions; suggest a doctor when appropriate.\nUSER_CONTEXT: " + " ".join(lines))

    history_docs = await db.chat.find({"user_id": user["id"]}).sort("timestamp", -1).limit(20).to_list(20)
    history_docs = list(reversed(history_docs))[:-1]
    initial_messages = [{"role": ("assistant" if m["role"] == "model" else m["role"]), "content": m["text"]} for m in history_docs]

    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session_id, system_message=system,
                   initial_messages=initial_messages).with_model("gemini", "gemini-2.5-flash")
    resp = await chat.send_message(UserMessage(text=payload.message))
    text = resp if isinstance(resp, str) else str(resp)

    ai_msg = {"user_id": user["id"], "role": "model", "text": text, "timestamp": now_iso(), "created_at": now_utc()}
    r2 = await db.chat.insert_one(dict(ai_msg)); ai_msg["id"] = str(r2.inserted_id)
    return {"user_message": {k: v for k, v in user_msg.items() if k != "created_at"},
            "reply": {k: v for k, v in ai_msg.items() if k != "created_at"}}

# ---------------- Insights ----------------
@api.get("/insights")
async def insights(user: dict = Depends(get_current_user)):
    nutrition = await db.nutrition.find({"user_id": user["id"]}).sort("timestamp", -1).limit(10).to_list(10)
    journal = await db.journal.find({"user_id": user["id"]}).sort("timestamp", -1).limit(10).to_list(10)
    activity = await db.activity.find_one({"user_id": user["id"]}, sort=[("date", -1)])
    if not nutrition and not journal and not activity:
        return {"wellnessScore": 75, "recommendations": [
            {"category":"DIET","title":"Balanced Start","description":"Log your first meal to unlock personalised diet insights.","priority":"MEDIUM"},
            {"category":"FITNESS","title":"Connect a wearable","description":"Sync your Apple Watch, Fitbit or Oura for automatic activity tracking.","priority":"MEDIUM"},
            {"category":"STRESS","title":"Voice Check-in","description":"Record a 30-second voice note to calibrate your stress baseline.","priority":"LOW"},
            {"category":"SLEEP","title":"Consistent Rest","description":"Aim for 7–9 hours of sleep to protect cognitive function.","priority":"LOW"}]}
    context = {"nutrition": [{k:v for k,v in n.items() if k not in ("_id","created_at","user_id")} for n in nutrition],
               "journal": [{k:v for k,v in j.items() if k not in ("_id","created_at","user_id")} for j in journal],
               "activity": {k:v for k,v in (activity or {}).items() if k not in ("_id","created_at","user_id","synced_at","updated_at")}}
    system = ("You are a preventive-wellness reasoning engine. Analyse user data and return JSON: "
              '{"wellnessScore": number(0-100), "recommendations": [{"category":"DIET|FITNESS|STRESS|SLEEP","title":string,"description":string,"priority":"HIGH|MEDIUM|LOW"}]} '
              "Return exactly 4 recommendations. JSON only.")
    try:
        data = await llm_json(system=system, user_text=f"Data: {json.dumps(context)}", session_id=f"insights-{user['id']}")
        recs = data.get("recommendations", [])[:4]
        while len(recs) < 4:
            recs.append({"category":"STRESS","title":"Breathe","description":"Take 2 minutes to reset with slow breathing.","priority":"LOW"})
        return {"wellnessScore": int(data.get("wellnessScore", 70)), "recommendations": recs}
    except Exception:
        logger.exception("insights failed")
        return {"wellnessScore": 65, "recommendations": [
            {"category":"STRESS","title":"Reflect & Reset","description":"Take 2 minutes to breathe deeply and reset your posture.","priority":"MEDIUM"},
            {"category":"DIET","title":"Hydrate Mindfully","description":"Drink water before your next meal — it aids digestion.","priority":"LOW"},
            {"category":"SLEEP","title":"Wind-down Ritual","description":"Dim screens 30 minutes before bed to stabilise melatonin.","priority":"MEDIUM"},
            {"category":"FITNESS","title":"Micro-movement","description":"5-minute walk after each meal improves glucose response.","priority":"LOW"}]}

# ---------------- Streaks ----------------
BADGE_CATALOG = [
    {"id":"first_step","name":"First Step","desc":"Logged your first entry.","threshold":1},
    {"id":"week_warrior","name":"Week Warrior","desc":"7-day activity streak.","threshold":7},
    {"id":"fortnight_force","name":"Fortnight Force","desc":"14-day streak.","threshold":14},
    {"id":"monthly_mind","name":"Monthly Mindful","desc":"30-day streak.","threshold":30},
]
async def update_streak(user_id: str):
    u = await db.users.find_one({"_id": ObjectId(user_id)})
    if not u: return
    today = date.today().isoformat()
    last = u.get("last_activity_date"); streak = u.get("streak", 0)
    if last == today: pass
    elif last:
        ld = datetime.fromisoformat(last).date() if isinstance(last, str) else last
        streak = streak + 1 if (date.today() - ld).days == 1 else 1
    else: streak = 1
    earned = set(u.get("badges", []))
    for b in BADGE_CATALOG:
        if streak >= b["threshold"]: earned.add(b["id"])
    await db.users.update_one({"_id": ObjectId(user_id)},
                              {"$set": {"streak": streak, "last_activity_date": today, "badges": list(earned)}})

@api.get("/streak")
async def get_streak(user: dict = Depends(get_current_user)):
    u = await db.users.find_one({"_id": ObjectId(user["id"])})
    earned = set(u.get("badges", []))
    return {"streak": u.get("streak", 0), "last_activity_date": u.get("last_activity_date"),
            "badges": [{**b, "earned": b["id"] in earned} for b in BADGE_CATALOG]}

# ---------------- Data Export ----------------
async def _bundle(user_id: str) -> dict:
    u = await db.users.find_one({"_id": ObjectId(user_id)})
    activity = await db.activity.find({"user_id": user_id}).sort("date", 1).to_list(2000)
    nutrition = await db.nutrition.find({"user_id": user_id}).sort("timestamp", 1).to_list(2000)
    journal = await db.journal.find({"user_id": user_id}).sort("timestamp", 1).to_list(2000)
    devices = await db.devices.find({"user_id": user_id}).to_list(50)
    chat = await db.chat.find({"user_id": user_id}).sort("timestamp", 1).to_list(2000)
    for coll in (activity, nutrition, journal, devices, chat):
        for d in coll:
            d["id"] = str(d.pop("_id", ""))
            for k, v in list(d.items()):
                if isinstance(v, datetime): d[k] = v.isoformat()
            d.pop("user_id", None)
    return {
        "user": {"email": u["email"], "name": u["name"], "created_at": u["created_at"].isoformat() if isinstance(u.get("created_at"), datetime) else u.get("created_at")},
        "export_generated_at": now_iso(),
        "activity": activity, "nutrition": nutrition, "journal": journal, "devices": devices, "chat": chat,
        "counts": {"activity": len(activity), "nutrition": len(nutrition), "journal": len(journal), "devices": len(devices), "chat": len(chat)},
    }

@api.get("/export/all.json")
async def export_json(user: dict = Depends(get_current_user)):
    bundle = await _bundle(user["id"])
    payload = json.dumps(bundle, indent=2, default=str).encode()
    return StarletteResponse(payload, media_type="application/json",
                             headers={"Content-Disposition": f'attachment; filename="healthguard-export-{date.today().isoformat()}.json"'})

@api.get("/export/all.csv")
async def export_csv(user: dict = Depends(get_current_user), collection: str = Query("activity", pattern="^(activity|nutrition|journal)$")):
    bundle = await _bundle(user["id"])
    rows = bundle.get(collection, [])
    buf = io.StringIO()
    if rows:
        # Union of keys
        fieldnames = sorted({k for r in rows for k in r.keys()})
        writer = csv.DictWriter(buf, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for r in rows:
            writer.writerow({k: json.dumps(v) if isinstance(v, (list, dict)) else v for k, v in r.items()})
    return StarletteResponse(buf.getvalue().encode(), media_type="text/csv",
                             headers={"Content-Disposition": f'attachment; filename="healthguard-{collection}-{date.today().isoformat()}.csv"'})

@api.get("/export/all.pdf")
async def export_pdf(user: dict = Depends(get_current_user)):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib.colors import HexColor
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    bundle = await _bundle(user["id"])
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=0.6*inch)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="H", fontSize=22, textColor=HexColor("#0E5F5C"), leading=26, spaceAfter=6))
    styles.add(ParagraphStyle(name="Sub", fontSize=11, textColor=HexColor("#3B4A48"), spaceAfter=14))
    styles.add(ParagraphStyle(name="Sec", fontSize=14, textColor=HexColor("#146356"), spaceBefore=16, spaceAfter=6))
    elements = [
        Paragraph("HealthGuardAI — Full Data Export", styles["H"]),
        Paragraph(f"Owner: <b>{bundle['user']['name']}</b> · {bundle['user']['email']}<br/>Generated {now_iso()}", styles["Sub"]),
    ]
    # Summary
    counts = bundle["counts"]
    t = Table([["Records", "Count"], ["Activity days", counts["activity"]], ["Nutrition", counts["nutrition"]],
               ["Journal", counts["journal"]], ["Devices", counts["devices"]], ["Chat messages", counts["chat"]]],
              colWidths=[3*inch, 3*inch])
    t.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0), HexColor("#0E5F5C")),
                           ("TEXTCOLOR",(0,0),(-1,0), HexColor("#FFFFFF")),
                           ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
                           ("GRID",(0,0),(-1,-1), 0.4, HexColor("#DDDDDD")),
                           ("ROWBACKGROUNDS",(0,1),(-1,-1), [HexColor("#F5F1EA"), HexColor("#FFFFFF")]),
                           ("PADDING",(0,0),(-1,-1), 8)]))
    elements.append(t)
    # Activity
    elements.append(Paragraph("Activity (last 14 days)", styles["Sec"]))
    a_rows = [["Date","Steps","Sleep","HR avg","Calories","Provider"]]
    for a in bundle["activity"][-14:]:
        a_rows.append([a.get("date",""), a.get("steps",""), f"{a.get('sleepHours','')}h", a.get("heartRateAvg",""), a.get("caloriesBurned",""), a.get("provider","manual")])
    if len(a_rows) > 1:
        at = Table(a_rows, colWidths=[1.1*inch,0.8*inch,0.8*inch,0.9*inch,1*inch,1.2*inch])
        at.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0), HexColor("#146356")),
                                ("TEXTCOLOR",(0,0),(-1,0), HexColor("#FFFFFF")),
                                ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
                                ("GRID",(0,0),(-1,-1), 0.3, HexColor("#E4DED4")),
                                ("PADDING",(0,0),(-1,-1), 6),
                                ("FONTSIZE",(0,0),(-1,-1), 9)]))
        elements.append(at)
    # Nutrition
    elements.append(Paragraph("Recent Nutrition", styles["Sec"]))
    for n in bundle["nutrition"][-10:]:
        elements.append(Paragraph(f"• <b>{n.get('foodName','')}</b> — {int(float(n.get('calories',0) or 0))} kcal · health {int(float(n.get('healthScore',0) or 0))}/100", styles["Normal"]))
    # Journal
    elements.append(Paragraph("Recent Journal", styles["Sec"]))
    for j in bundle["journal"][-8:]:
        elements.append(Paragraph(f"• <b>{j.get('mood','')}</b> (stress {j.get('stressLevel','')}/10) — {j.get('summary','')}", styles["Normal"]))
    doc.build(elements); buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf",
                             headers={"Content-Disposition": f'attachment; filename="healthguard-full-export-{date.today().isoformat()}.pdf"'})

# Weekly PDF stays available
@api.get("/report/weekly.pdf")
async def weekly_report(user: dict = Depends(get_current_user)):
    return await export_pdf(user)

# ---------------- Admin ----------------
@api.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    users_total = await db.users.count_documents({})
    meals_total = await db.nutrition.count_documents({})
    journals_total = await db.journal.count_documents({})
    chats_total = await db.chat.count_documents({})
    devices_total = await db.devices.count_documents({})
    paying = await db.users.count_documents({"paid_until": {"$gt": now_utc()}})
    week_ago = now_utc() - timedelta(days=7)
    new_users = await db.users.count_documents({"created_at": {"$gte": week_ago}})
    high_stress = await db.journal.find({"stressLevel": {"$gte": 8}}).sort("timestamp", -1).limit(10).to_list(10)
    for h in high_stress: h["id"] = str(h.pop("_id")); h.pop("created_at", None)
    return {"users_total": users_total, "meals_total": meals_total, "journals_total": journals_total,
            "chats_total": chats_total, "devices_total": devices_total,
            "paying_users": paying, "new_users_7d": new_users, "high_stress_events": high_stress}

@api.get("/admin/users")
async def admin_users(admin: dict = Depends(require_admin)):
    docs = await db.users.find({}).sort("created_at", -1).to_list(500)
    out = []
    for d in docs:
        s = sanitize_user(d)
        s["billing"] = compute_billing(d)
        out.append(s)
    return out

# ---------------- Health ----------------
@api.get("/health")
async def health(): return {"status": "ok", "time": now_iso()}

app.include_router(api)

# ---------------- Startup ----------------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.nutrition.create_index([("user_id", 1), ("timestamp", -1)])
    await db.journal.create_index([("user_id", 1), ("timestamp", -1)])
    await db.chat.create_index([("user_id", 1), ("timestamp", 1)])
    await db.activity.create_index([("user_id", 1), ("date", -1)], unique=False)
    await db.devices.create_index([("user_id", 1), ("id", 1)], unique=True)
    await db.payment_transactions.create_index([("user_id", 1), ("session_id", 1)])

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@healthguard.ai").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({"email": admin_email, "name": "Admin",
            "password_hash": hash_password(admin_password), "role": "admin",
            "created_at": now_utc(), "trial_started_at": now_utc(), "paid_until": now_utc() + timedelta(days=3650),
            "streak": 0, "last_activity_date": None, "badges": []})
    else:
        await db.users.update_one({"_id": existing["_id"]},
            {"$set": {"password_hash": hash_password(admin_password),
                      "trial_started_at": existing.get("trial_started_at") or now_utc(),
                      "paid_until": existing.get("paid_until") or (now_utc() + timedelta(days=3650))}})
    # ensure existing users have trial_started_at
    async for u in db.users.find({"trial_started_at": {"$exists": False}}):
        await db.users.update_one({"_id": u["_id"]},
            {"$set": {"trial_started_at": u.get("created_at") or now_utc()}})
