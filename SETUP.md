# HealthGuardAI — Run it locally

This is a full app: a **backend** (the brain — accounts, data, AI) and a **frontend** (what you see).
Both need to run at the same time.

---

## 1. What you need installed (one time)

- **Node.js** (for the frontend) — https://nodejs.org
- **Python 3.10+** (for the backend)
- **MongoDB** (the database that stores accounts & data)
  - Mac: `brew install mongodb-community && brew services start mongodb-community`

---

## 2. Start the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a file named **`backend/.env`** with this inside:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=healthguard
JWT_SECRET=change-this-to-any-long-random-text
EMERGENT_LLM_KEY=your-key-here

# --- Real OTP emails (optional but recommended) ---
# With these filled in, the 6-digit code is emailed to the real inbox.
# Leave them blank and the app still works — it shows the code on screen ("Test mode").
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youraddress@gmail.com
SMTP_PASS=your-16-char-gmail-app-password
SMTP_FROM=youraddress@gmail.com
SMTP_FROM_NAME=HealthGuardAI
```

Then run it:

```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

### How to get the Gmail app password (5 minutes)
1. Turn on 2-Step Verification: https://myaccount.google.com/security
2. Create an app password: https://myaccount.google.com/apppasswords
3. Copy the 16-character password into `SMTP_PASS` above (no spaces).

> Any email provider that supports SMTP works (Outlook, Zoho, SendGrid, Resend, etc.) —
> just change `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`.

---

## 3. Start the frontend (new terminal)

Create a file named **`frontend/.env`** with:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
```

Then run it:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

---

## 4. Sign up (real, end-to-end)

1. Click **Create an account**
2. Enter **First name, Last name, Date of birth, Email, Password**
3. Click **Continue** → a 6-digit code is generated on the server
   - If SMTP is configured → the code arrives in your **email inbox**
   - If not → the code shows on screen under **"Test mode"** so you can still try it
4. Enter the code → **Verify & Continue** → you're in.

Your account, connected devices, and data are all saved in MongoDB, so everything is
there when you come back and sign in again.
