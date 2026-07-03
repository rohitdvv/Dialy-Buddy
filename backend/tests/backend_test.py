"""HealthGuardAI backend E2E tests via public URL."""
import os
import io
import time
import base64
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else "https://a34c8da2-bb38-4771-9dca-400921523877.preview.emergentagent.com"

DEMO_EMAIL = "demo@healthguard.ai"
DEMO_PASS = "Demo2026!"
ADMIN_EMAIL = "admin@healthguard.ai"
ADMIN_PASS = "HealthGuard2026!"


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def demo_token(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS})
    assert r.status_code == 200, f"demo login failed {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS})
    assert r.status_code == 200, f"admin login failed {r.status_code} {r.text}"
    return r.json()["token"]


def auth(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------- health ----------
def test_health(s):
    r = s.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "ok"


# ---------- auth ----------
def test_register_new_user_and_duplicate(s):
    email = f"test_{int(time.time())}@healthguard.ai"
    r = s.post(f"{BASE_URL}/api/auth/register", json={"name": "Test", "email": email, "password": "Passw0rd!"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert "token" in body and "user" in body
    assert body["user"]["email"] == email
    # duplicate
    r2 = s.post(f"{BASE_URL}/api/auth/register", json={"name": "Test", "email": email, "password": "Passw0rd!"})
    assert r2.status_code == 400


def test_login_demo_valid_and_invalid(s):
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS})
    assert r.status_code == 200
    assert "token" in r.json()
    r2 = s.post(f"{BASE_URL}/api/auth/login", json={"email": DEMO_EMAIL, "password": "wrong"})
    assert r2.status_code == 401


def test_me_returns_user(s, demo_token):
    r = s.get(f"{BASE_URL}/api/auth/me", headers=auth(demo_token))
    assert r.status_code == 200
    assert r.json()["user"]["email"] == DEMO_EMAIL


def test_me_without_token(s):
    r = requests.get(f"{BASE_URL}/api/auth/me")
    assert r.status_code == 401


# ---------- nutrition ----------
def _tiny_jpeg_bytes():
    # 1x1 pixel JPEG
    return base64.b64decode(
        "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oACAEBAAA/APn+iiiv/9k="
    )


def test_nutrition_analyze_and_list(s, demo_token):
    files = {"file": ("meal.jpg", _tiny_jpeg_bytes(), "image/jpeg")}
    r = requests.post(f"{BASE_URL}/api/nutrition/analyze", files=files, headers=auth(demo_token), timeout=120)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ("foodName", "calories", "protein", "carbs", "fat", "healthScore", "analysis", "id"):
        assert k in d
    # persist
    r2 = requests.get(f"{BASE_URL}/api/nutrition", headers=auth(demo_token))
    assert r2.status_code == 200
    lst = r2.json()
    assert isinstance(lst, list) and len(lst) >= 1
    assert any(item.get("id") == d["id"] for item in lst)


def test_nutrition_requires_auth():
    files = {"file": ("meal.jpg", _tiny_jpeg_bytes(), "image/jpeg")}
    r = requests.post(f"{BASE_URL}/api/nutrition/analyze", files=files)
    assert r.status_code == 401


# ---------- journal ----------
def test_journal_analyze_text_persist_and_search(s, demo_token):
    text = "Feeling stressed about the upcoming deadline and low sleep from last night uniquetagxyz."
    r = requests.post(f"{BASE_URL}/api/journal/analyze-text", json={"text": text}, headers={**auth(demo_token), "Content-Type": "application/json"}, timeout=90)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ("mood", "stressLevel", "sentimentScore", "keyTopics", "summary", "id"):
        assert k in d
    # list persistence
    r2 = requests.get(f"{BASE_URL}/api/journal", headers=auth(demo_token))
    assert r2.status_code == 200
    assert any(x["id"] == d["id"] for x in r2.json())
    # search — using mood text (case-insensitive)
    mood = d["mood"]
    r3 = requests.get(f"{BASE_URL}/api/journal", headers=auth(demo_token), params={"search": mood})
    assert r3.status_code == 200


def test_journal_analyze_audio(s, demo_token):
    # Minimal WAV header, silent
    wav = (
        b"RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00"
        b"\x40\x1f\x00\x00\x80>\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
    )
    files = {"file": ("v.wav", wav, "audio/wav")}
    r = requests.post(f"{BASE_URL}/api/journal/analyze-audio", files=files, headers=auth(demo_token), timeout=120)
    # LLM may return 502 for empty/silent audio; accept 200 or 502 but prefer 200
    assert r.status_code in (200, 502), r.text
    if r.status_code == 200:
        d = r.json()
        for k in ("mood", "stressLevel", "sentimentScore", "keyTopics", "summary"):
            assert k in d


# ---------- chat ----------
def test_chat_send_and_list(s, demo_token):
    r = requests.post(f"{BASE_URL}/api/chat", json={"message": "Hi HealthGuard, what should I eat for lunch?"}, headers={**auth(demo_token), "Content-Type": "application/json"}, timeout=90)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "user_message" in d and "reply" in d
    assert d["reply"]["role"] == "model"
    assert len(d["reply"]["text"]) > 0
    r2 = requests.get(f"{BASE_URL}/api/chat", headers=auth(demo_token))
    assert r2.status_code == 200
    assert isinstance(r2.json(), list) and len(r2.json()) >= 2


# ---------- insights ----------
def test_insights(s, demo_token):
    r = requests.get(f"{BASE_URL}/api/insights", headers=auth(demo_token), timeout=120)
    assert r.status_code == 200
    d = r.json()
    assert "wellnessScore" in d and "recommendations" in d
    assert 0 <= d["wellnessScore"] <= 100
    assert isinstance(d["recommendations"], list) and len(d["recommendations"]) >= 1


# ---------- activity ----------
def test_activity_roundtrip(s, demo_token):
    payload = {"steps": 8000, "sleepHours": 7.5, "sleepQuality": 8, "heartRateAvg": 68, "caloriesBurned": 2100}
    r = requests.post(f"{BASE_URL}/api/activity", json=payload, headers={**auth(demo_token), "Content-Type": "application/json"})
    assert r.status_code == 200, r.text
    r2 = requests.get(f"{BASE_URL}/api/activity", headers=auth(demo_token))
    assert r2.status_code == 200
    doc = r2.json()
    assert doc["steps"] == 8000
    r3 = requests.get(f"{BASE_URL}/api/activity/history", headers=auth(demo_token), params={"days": 7})
    assert r3.status_code == 200
    assert isinstance(r3.json(), list)


# ---------- devices ----------
def test_devices_crud(s, demo_token):
    dev = {"id": "test-fitbit", "name": "Fitbit Sense", "type": "BLUETOOTH", "status": "connected", "lastSync": None}
    r = requests.post(f"{BASE_URL}/api/devices", json=dev, headers={**auth(demo_token), "Content-Type": "application/json"})
    assert r.status_code == 200, r.text
    r2 = requests.get(f"{BASE_URL}/api/devices", headers=auth(demo_token))
    assert r2.status_code == 200
    assert any(x["id"] == "test-fitbit" for x in r2.json())
    r3 = requests.delete(f"{BASE_URL}/api/devices/test-fitbit", headers=auth(demo_token))
    assert r3.status_code == 200
    r4 = requests.get(f"{BASE_URL}/api/devices", headers=auth(demo_token))
    assert not any(x["id"] == "test-fitbit" for x in r4.json())


# ---------- streak ----------
def test_streak(s, demo_token):
    r = requests.get(f"{BASE_URL}/api/streak", headers=auth(demo_token))
    assert r.status_code == 200
    d = r.json()
    assert "streak" in d and "last_activity_date" in d and "badges" in d
    assert isinstance(d["badges"], list) and len(d["badges"]) >= 1
    assert "earned" in d["badges"][0]


# ---------- weekly pdf ----------
def test_weekly_pdf(s, demo_token):
    r = requests.get(f"{BASE_URL}/api/report/weekly.pdf", headers=auth(demo_token), timeout=60)
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("application/pdf")
    assert r.content[:4] == b"%PDF"


# ---------- admin ----------
def test_admin_stats_and_users(s, admin_token):
    r = requests.get(f"{BASE_URL}/api/admin/stats", headers=auth(admin_token))
    assert r.status_code == 200
    d = r.json()
    for k in ("users_total", "meals_total", "journals_total", "chats_total", "new_users_7d"):
        assert k in d
    r2 = requests.get(f"{BASE_URL}/api/admin/users", headers=auth(admin_token))
    assert r2.status_code == 200
    assert isinstance(r2.json(), list) and len(r2.json()) >= 1


def test_admin_forbidden_for_normal(s, demo_token):
    r = requests.get(f"{BASE_URL}/api/admin/stats", headers=auth(demo_token))
    assert r.status_code == 403
    r2 = requests.get(f"{BASE_URL}/api/admin/users", headers=auth(demo_token))
    assert r2.status_code == 403
