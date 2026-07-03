# HealthGuardAI — Product Requirements Doc

## Original problem statement
> "Read the entire app and make it fully workable, and make all the connections according to the app. Think like a brainstorming Steve Jobs, like a builder and everything, and build a full, kind of an enterprise-level app end to end. Also add any features that you think will be very good. The app has to work, like nothing else has to be a competition for this app."

## User choices (2026-07-03)
1. FastAPI + MongoDB backend (chosen `a`)
2. JWT-based custom auth with email + password + OTP verify for signup (chosen `a`)
3. Emergent Universal LLM key for Gemini
4. All enterprise features (real trends, PDF, streaks, search, notifications, admin)
5. Distinctive enterprise UI — "refresh with something more distinctive and more innovative, like an enterprise-level UI/UX design, think like a master designer"

## Architecture
- Backend: FastAPI + Motor(MongoDB) at :8001, all routes under `/api/*`
- Frontend: Vite + React 18 + Tailwind at :3000, dark luxury aesthetic (charcoal + terracotta + gold + sage)
- Auth: JWT (HS256) with 7-day expiry, stored in `localStorage["hg_token"]`, sent as Bearer
- AI: `emergentintegrations.LlmChat` with `gemini-2.5-flash` and Emergent Universal LLM key (server-side only)
- Multimodal: `ImageContent` for food photos, `FileContent` for voice recordings
- Fonts: Outfit (display) + Manrope (body) + JetBrains Mono (numeric)

## User personas
1. **Wellness-seeking professional** — logs meals, does voice journal, checks weekly reports.
2. **Data-driven enthusiast** — connects wearables/BLE, watches trend charts, chases streaks.
3. **Admin operator** — monitors platform-wide signals from an admin console.

## Static core requirements
- Password hashing via bcrypt
- JWT-only session (no cookies, CORS `*` safe with Bearer)
- All Gemini calls proxied server-side
- MongoDB indexed by user_id + timestamp
- Streak resets on gap > 1 day; badges awarded at 1/7/14/30 days

## Implemented (2026-07-03)
- Auth: JWT register/login/me with OTP verify UI on signup, seeded admin + demo users
- Dashboard: Biometric ring, 4 KPI mini-stats, streak+badges, 7-day trend charts (bars + line + area) fed by real DB history, AI insight cards (Gemini 2.5), shimmer skeleton while loading
- Nutrition: image upload → Gemini vision → macros/health-score, day-grouped history, search, delete, 422 guard when no food detected
- Voice Journal: audio record via MediaRecorder or typed entry → Gemini tone analysis → mood/stress/sentiment, day-grouped, search
- Activity & Devices: manual sliders, Fitbit/Google Fit/Apple Watch mocked cloud sync, Web Bluetooth real-time HR streaming, per-device connect/disconnect
- AI Companion: multi-turn chat with recent context (activity + mood + last meal) + conversation history grouped by day
- Nightly Check-In modal (10 PM trigger or manual open)
- Weekly PDF wellness report (reportlab) with metrics + highlights
- Admin Console: 5 KPIs, high-stress events feed, user table with role/streak
- Browser toast notifications (INFO + ALERT variants) on high-stress detection
- Streak + badge tracking with automatic awards

## Testing
- Backend: 21/21 pytest passing (iteration 2, 100%)
- Frontend: full Playwright coverage of chat multi-turn, dashboard skeleton, admin, nutrition upload

## Backlog / next
- P1: Real email/SMS OTP delivery (currently dev-mode: code shown inline)
- P1: Google OAuth login (Emergent-managed) as second auth option
- P2: Live wearable webhook ingestion (Terra API / HealthKit push)
- P2: Care-team sharing (share a scoped wellness report link)
- P3: On-device summarisation for privacy-sensitive users
- P3: Push (Web Push) notifications (currently in-app toasts only)
