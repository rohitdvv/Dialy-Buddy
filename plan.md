# HealthGuardAI v2 — Execution Plan

## Overview

Complete overhaul of the HealthGuardAI (Daily Buddy) wellness platform. Transform from a pleasant light-theme app into an intimidating, editorial, clinical-grade dashboard with Nordic Clinical aesthetics. Mandatory auth, persistent wearable connections, enhanced data export, and smooth enterprise-grade animations.

**Current date:** 2026-07-03
**Repo:** `/Users/rohitdusanapudi/Documents/kimi/workspace/daily-buddy-v2`

---

## Stage 1: Design & Baseline (Main Agent)

- ✅ Design system created: `design/design.md`
- ⏳ Establish git baseline commit
- ⏳ Create worker worktrees

---

## Stage 2: Parallel Implementation (Agent Swarm)

### Worker A: Backend Overhaul
**Scope:** `backend/server.py`, `backend/requirements.txt`

**Tasks:**
1. **Enhanced Data Export:** Expand the `_bundle()` function to include ALL wearable fields: `steps`, `sleepHours`, `sleepQuality`, `heartRateAvg`, `restingHR`, `hrv`, `activeMinutes`, `distanceKm`, `caloriesBurned`, `provider`, `synced_at`. The JSON export should include complete history. The CSV export should support all collections. The PDF export should use the new Nordic Clinical color palette (deep teal headers, warm off-white backgrounds, slate text) and include all data categories with proper tables.
2. **Persistent Device Connections:** Add a `device_connections` collection that stores connection state. On login (`/auth/login`), auto-reconnect previously connected devices by calling sync logic. Add `/devices/reconnect-all` endpoint. Store `refresh_token`, `connected_at`, `last_sync`, `connection_metadata` per device.
3. **Subscription Trial Middleware:** Add a `require_subscription` dependency that checks `billing.active`. Return a clear 403 with `subscription_required: true` and `trial_days_left` / `paid_days_left` when inactive. Apply it to all premium endpoints (nutrition, journal, chat, export, insights). Keep `/auth/*`, `/health`, and `/billing/*` free.
4. **Enhanced Activity Data:** The `deterministic_activity()` function already generates `distanceKm`, `restingHR`, `hrv`, `activeMinutes`. Ensure these are returned in `/activity` and `/activity/history` endpoints. Add `/activity/history?fields=` to allow selective field export.
5. **Better Admin Stats:** Add revenue metrics, trial conversion rate, device connection rate.

**Validation:**
- `python -c "import server"` should not error
- All new endpoints must be callable

---

### Worker B: Global Theme & CSS
**Scope:** `frontend/index.html`, `frontend/src/index.css`, `frontend/tailwind.config.js`, `frontend/package.json`

**Tasks:**
1. Update `index.html` to load **Playfair Display** + **Inter** + **JetBrains Mono** fonts (replacing Fraunces + Geist).
2. Update `tailwind.config.js` with the new Nordic Clinical color palette: `bg: #F4F2ED`, `ink: #161B2E`, `teal: #0B4F5C`, `copper: #B87333`, `border: #DDD8CF`, etc. Update `fontFamily` to use `display: ['Playfair Display', ...]`, `sans: ['Inter', ...]`, `mono: ['JetBrains Mono', ...]`.
3. Rewrite `index.css` with the new design tokens, updated card styles, button styles, input styles, animation keyframes, scrollbar colors, and selection colors. Add `font-display` and `font-display-title` utility classes with proper `font-variation-settings` or CSS.
4. Ensure `package.json` dependencies are correct (no new packages needed unless for animations, but framer-motion is already there).
5. Update `theme-color` meta tag to `#F4F2ED`.

**Validation:**
- `cd frontend && npm install && npm run build` should succeed
- No Tailwind class errors

---

### Worker C: Auth + App Shell
**Scope:** `frontend/src/components/AuthScreen.jsx`, `frontend/src/components/Sidebar.jsx`, `frontend/src/components/TopBar.jsx`, `frontend/src/components/TrialBanner.jsx`, `frontend/src/App.jsx`

**Tasks:**
1. **AuthScreen.jsx:** Complete redesign with the new Nordic Clinical palette. Use Playfair Display for the hero text. Left panel: deep teal-to-slate gradient with editorial typography. Right panel: clean white auth form with refined inputs. **Remove any "Continue with Demo" button** (confirm none exists; if it does, remove it). Add intimidating copy: "Your health data is serious." The sign-up should feel like joining an elite club. Smooth entrance animations with Framer Motion.
2. **Sidebar.jsx:** Redesign with new colors. Playfair Display for the app title. Inter for nav items. Active state: deep teal background with white text. Hover: subtle background shift. Collapsible on mobile. Add a persistent device connection indicator in the sidebar footer.
3. **TopBar.jsx:** Redesign with new colors. User initials avatar instead of image. Trial status badge with clear visual indicator. Wellness score mini-display. Smooth animations.
4. **TrialBanner.jsx:** Redesign with more urgency. Countdown-style display for days remaining. Clear CTA to billing page. Better visual hierarchy.
5. **App.jsx:** Ensure all tab changes are smooth. Wrap content in Framer Motion `AnimatePresence` for page transitions. Ensure `ExportPanel` is properly imported (it currently doesn't exist — handle gracefully or note for Worker F).

**Validation:**
- `npm run build` succeeds
- Auth screen renders correctly
- Sidebar navigation works

---

### Worker D: Dashboard + Visualizations
**Scope:** `frontend/src/components/Dashboard.jsx`, `frontend/src/components/WellnessRing.jsx`, `frontend/src/components/InsightCard.jsx`

**Tasks:**
1. **Dashboard.jsx:** Complete redesign. Bento-style grid with the new color palette. Use Framer Motion for staggered entrance animations. Enhanced data density: show HRV, resting HR, active minutes, distance in the mini-stats. New charts: use the updated teal/copper color scheme for Recharts. Add a "Live Devices" panel showing connected wearables with real-time status. Add smooth transition between data states.
2. **WellnessRing.jsx:** Redesign the SVG ring. Use the new deep teal (`#0B4F5C`) with a glow effect (`drop-shadow`). Add concentric rings with `stroke-dasharray` for a telemetry effect. Smooth animation on score change. Add numeric display in JetBrains Mono.
3. **InsightCard.jsx:** Redesign with new card style. Category color coding: DIET = teal, FITNESS = moss, STRESS = rust, SLEEP = sky. Priority badge. Smooth hover animation. Better typography hierarchy.

**Validation:**
- Dashboard renders without errors
- Charts display with new colors
- Wellness ring animates correctly

---

### Worker E: Devices + Activity + Export
**Scope:** `frontend/src/components/DeviceManager.jsx`, `frontend/src/components/ActivityLog.jsx`, `frontend/src/components/ExportPanel.jsx` (NEW)

**Tasks:**
1. **DeviceManager.jsx:** Redesign with new palette. Add persistent connection status indicators. Show "Auto-reconnecting..." state on login. Better device cards with full metadata (last sync time, records synced, provider type). Add a "Connection History" section. Use Lucide icons (no emoji). Smooth connect/disconnect animations.
2. **ActivityLog.jsx:** Redesign with new palette. Show ALL data fields: steps, sleep, sleep quality, heart rate, resting HR, HRV, active minutes, distance, calories. Add a detailed data table view. Use JetBrains Mono for all numbers. Better manual entry form with the new input styles.
3. **ExportPanel.jsx (CREATE NEW):** This component is imported in `App.jsx` but does not exist. Create it with:
   - Export format selection: JSON, CSV, PDF
   - Date range picker (last 7 days, 30 days, 90 days, all time)
   - Data type selection: Activity, Nutrition, Journal, Devices, Chat, All
   - Export preview showing record counts
   - Download button with loading state
   - Use the new design system
   - Call the existing backend endpoints (`/export/all.json`, `/export/all.csv`, `/export/all.pdf`)

**Validation:**
- All components render without errors
- Export panel can trigger downloads

---

### Worker F: Other Pages
**Scope:** `frontend/src/components/NutritionTracker.jsx`, `frontend/src/components/VoiceJournal.jsx`, `frontend/src/components/AIChat.jsx`, `frontend/src/components/Billing.jsx`, `frontend/src/components/Guide.jsx`, `frontend/src/components/AdminPanel.jsx`, `frontend/src/components/NightlyCheckIn.jsx`, `frontend/src/components/Toast.jsx`

**Tasks:**
1. Redesign ALL remaining components with the new Nordic Clinical palette and typography.
2. **NutritionTracker:** New card styles, better photo upload UI, improved meal list with data metrics in mono font.
3. **VoiceJournal:** New card styles, better audio visualization, improved mood display.
4. **AIChat:** New message bubble styles, better input area, smooth message entrance animations.
5. **Billing:** Enhanced trial status display, better checkout flow UI, clear pricing visualization.
6. **Guide:** New card-based guide with step indicators.
7. **AdminPanel:** New data table styles, better stat cards.
8. **NightlyCheckIn:** Modal redesign with new palette, smooth entrance animation.
9. **Toast:** Redesigned toast notifications with new colors and smooth slide-in/out.

**Validation:**
- All components render without errors
- `npm run build` succeeds

---

## Stage 3: Merge & Integration (Main Agent)

1. Merge all worker branches back to main
2. Resolve any conflicts (expected: minimal — each worker owns distinct files)
3. Run `npm run build` in frontend
4. Verify `python -c "import server"` in backend
5. Do a final pass for any missing imports, broken routes, or style inconsistencies
6. Update `design_guidelines.json` to reflect the new design system
7. Commit everything

---

## Stage 4: Push & PR (Main Agent)

1. Push to `rohitdusanapudi/Dialy-Buddy` (or new branch on original)
2. Create a descriptive PR with the changes summary

---

## Shared Contract

### API Routes (DO NOT CHANGE without approval)
- `/api/auth/*` — Auth endpoints (register, login, me)
- `/api/billing/*` — Stripe billing
- `/api/devices/*` — Device management
- `/api/activity/*` — Activity data
- `/api/nutrition/*` — Nutrition tracking
- `/api/journal/*` — Journal entries
- `/api/chat/*` — AI chat
- `/api/insights` — Wellness insights
- `/api/export/*` — Data export (JSON, CSV, PDF)
- `/api/admin/*` — Admin stats
- `/api/health` — Health check

### Data Models (DO NOT CHANGE shape without approval)
- `User`: `{ _id, email, name, password_hash, role, created_at, trial_started_at, paid_until, streak, last_activity_date, badges }`
- `Activity`: `{ user_id, date, steps, sleepHours, sleepQuality, heartRateAvg, caloriesBurned, provider, synced_at }`
- `Device`: `{ user_id, id, name, provider, type, status, lastSync, connected_at }`

### Frontend Component Boundaries
- `App.jsx` owns routing/tab state. Workers can modify but not remove tabs.
- `AuthContext.jsx` owns auth state. Do not modify.
- `lib/api.js` owns API client. Do not modify unless adding new endpoints.
- Each component should be self-contained. No global state changes outside of App.jsx and AuthContext.

### Color Palette (STRICT — use only these)
```
bg: #F4F2ED
surface: #FFFFFF
surface2: #F9F7F2
border: #DDD8CF
ink: #161B2E
ink2: #3D4556
muted: #8B92A5
teal: #0B4F5C
emerald: #0F5C4F
moss: #3D6B5A
copper: #B87333
amber: #C8A040
rust: #8B3D3D
sky: #2D5F8F
```

### Typography (STRICT)
- Display: `font-family: 'Playfair Display', serif;`
- Body: `font-family: 'Inter', sans-serif;`
- Mono: `font-family: 'JetBrains Mono', monospace;`
