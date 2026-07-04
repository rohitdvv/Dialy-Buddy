# HealthGuardAI — Mobile apps (iOS + Android)

The app is set up with **Capacitor**, which turns the existing React web app into real
native iOS and Android apps that can be submitted to the **App Store** and **Play Store**.

- App name: **HealthGuardAI**
- App ID (bundle id): **com.healthguard.app**
- The web build in `frontend/dist` is what runs inside the native shell.

---

## Phase 1 status

| Piece | Status |
|---|---|
| Capacitor installed + configured | ✅ done |
| Splash screen / status bar / preferences plugins | ✅ installed |
| Web build → native (`dist`) | ✅ wired |
| iOS native project generated | ⏳ needs full Xcode + CocoaPods (below) |
| Android native project generated | ⏳ needs Android Studio (below) |
| Real Apple Watch / Wear OS health data (HealthKit / Health Connect) | ⏳ added once native projects exist |

---

## What you need to install (one time, free)

**For iPhone (iOS):**
1. **Xcode** — free from the Mac App Store (large, ~7 GB).
2. **CocoaPods** — in Terminal: `brew install cocoapods`

**For Android:**
1. **Android Studio** — free from https://developer.android.com/studio
   (installs the Android SDK + a Java runtime).

---

## Generate the native apps (after the installs above)

From the `frontend` folder:

```bash
# creates the ios/ Xcode project
npm run cap:add:ios

# creates the android/ Android Studio project
npm run cap:add:android
```

## Open + run them

```bash
npm run cap:ios       # builds web, syncs, opens Xcode → press ▶ to run on a simulator/device
npm run cap:android   # builds web, syncs, opens Android Studio → press ▶ to run on an emulator/device
```

Every time you change the web app, run `npm run cap:sync` to push the update into the
native shells.

---

## Real Apple Watch / phone health data

Once the native projects exist, we add a health plugin:
- **iOS:** Apple **HealthKit** (steps, sleep, heart rate, HRV, workouts from the Apple Watch).
  Requires a paid Apple Developer account to enable the HealthKit *entitlement* and to ship.
- **Android:** **Health Connect** (steps, sleep, heart rate from Wear OS / phone).

> A website cannot read the Apple Watch — this native layer is the only way to get real
> watch data into the app. That is exactly why we packaged it with Capacitor.

---

## Pointing the app at your backend

Inside the native app, `localhost` is the phone, not your computer. Set the API URL to a
reachable backend before building for a real device:

- Local testing (iOS simulator can reach your Mac): keep `REACT_APP_BACKEND_URL=http://localhost:8000`
- Real device / production: set `REACT_APP_BACKEND_URL=https://api.yourdomain.com` in
  `frontend/.env`, then `npm run cap:sync`.

---

## Before store submission (later phases)

- Apple Developer account ($99/yr) + Google Play account ($25 once)
- App icons + splash + screenshots
- Privacy policy + terms (mandatory — this is a health app)
- Privacy "nutrition labels" (Apple) / Data safety form (Google)
- **Subscriptions:** Apple/Google usually require *their* in-app purchase for the $10/mo
  plan (they take 15–30%). Plan for this before wiring Stripe as the store payment method.
