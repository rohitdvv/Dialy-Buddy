# HealthGuardAI v2 — Design System

## Concept

An **intimidating, editorial, clinical-grade wellness platform**. The interface feels like a high-end medical dashboard crossed with a luxury lifestyle journal. Every pixel is intentional. Users feel the weight of their health data — the app is serious, authoritative, and demands engagement.

**Vibe:** Nordic Clinical + Editorial Authority. Think: Oura Ring meets The New Yorker meets a Scandinavian private clinic. Warm, human, but precise.

---

## Color Palette — Nordic Clinical

| Token | Hex | Role |
|---|---|---|
| `bg` | `#F4F2ED` | Warm off-white base. Slightly cooler than ivory. |
| `surface` | `#FFFFFF` | Primary card surface. |
| `surface2` | `#F9F7F2` | Subtle depth, secondary surfaces. |
| `surface-glass` | `rgba(244, 242, 237, 0.92)` | Glassmorphism fallback. |
| `border` | `#DDD8CF` | Hairline borders. Warm gray. |
| `border-strong` | `#C8C2B8` | Stronger borders, dividers. |
| `ink` | `#161B2E` | Primary text. Deep slate-navy. Almost black. Intimidating. |
| `ink2` | `#3D4556` | Secondary text. Slate. |
| `muted` | `#8B92A5` | Tertiary / disabled text. Cool gray. |
| `teal` | `#0B4F5C` | Primary accent. Deep teal. Dominant, clinical. |
| `emerald` | `#0F5C4F` | Secondary accent. Forest teal. |
| `moss` | `#3D6B5A` | Success / positive. Muted forest. |
| `copper` | `#B87333` | Warm accent. Copper. Use sparingly for highlights. |
| `amber` | `#C8A040` | Gold accent. Badges, achievements. |
| `rust` | `#8B3D3D` | Alert / danger. Deep burgundy. |
| `sky` | `#2D5F8F` | Info / links. Steel blue. |
| `shadow` | `rgba(22, 27, 46, 0.06)` | Card shadows. |

---

## Typography

| Role | Font | Weights | Usage |
|---|---|---|---|
| Display | **Playfair Display** | 400, 500, 600, 700, 800, 900 | Headlines, page titles, hero text. High-contrast editorial serifs. |
| Body | **Inter** | 300, 400, 500, 600 | Body text, UI labels, navigation. Clean, neutral, modern. |
| Mono | **JetBrains Mono** | 300, 400, 500 | Data metrics, scores, technical values, code. |

### Scale

| Level | Size | Font | Weight | Tracking | Notes |
|---|---|---|---|---|---|
| H1 | `text-5xl` / `48px` | Playfair Display | 700 | `-0.03em` | Page titles |
| H2 | `text-3xl` / `30px` | Playfair Display | 600 | `-0.02em` | Section headers |
| H3 | `text-xl` / `20px` | Inter | 600 | `-0.01em` | Card titles |
| Body | `text-sm` / `14px` | Inter | 400 | `0` | Default body |
| Caption | `text-xs` / `12px` | Inter | 500 | `0.08em` (uppercase) | Labels, metadata |
| Data | `text-sm` / `14px` | JetBrains Mono | 400 | `0` | Numeric values |

---

## Layout & Spacing

- **Dashboard grid:** Bento-style, tightly packed. `gap-6` on desktop, `gap-4` on mobile.
- **Card padding:** `p-6` or `p-8`. Generous inner padding.
- **Card radius:** `rounded-2xl` (`16px`) for primary cards, `rounded-xl` (`12px`) for nested.
- **Max content width:** `1440px` centered with `px-6` / `px-10` gutters.
- **Sidebar:** `280px` fixed on desktop, slide-in drawer on mobile.
- **Optical alignment:** Left-align dense data. Avoid centering in data-heavy cards.

---

## Surfaces & Depth

- **Primary cards:** White background, `1px solid #DDD8CF` border, subtle shadow.
- **Glass cards:** `bg-white/70 backdrop-blur-xl border border-white/40` over dark backgrounds (if any).
- **Elevated cards:** On hover, `-translate-y-0.5` + `shadow-lg`.
- **No gradient backgrounds on the main page.** The `#F4F2ED` base is the only background. Gradients are reserved for decorative accents (e.g., auth screen left panel).

---

## Interaction Language

### Transitions
- All interactive elements: `transition-all duration-300 ease-out` (or `cubic-bezier(0.16, 1, 0.3, 1)` for entrances).
- Cards: `transition: transform 260ms, box-shadow 260ms, border-color 260ms`.
- Buttons: `transition: transform 220ms, background 220ms, box-shadow 220ms`.
- Inputs: `transition: border-color 220ms, background 220ms, box-shadow 220ms`.

### Hover States
- Cards: `-translate-y-0.5`, `shadow-lg`, border darkens slightly.
- Buttons: `translateY(-1px)`, shadow intensifies, background darkens.
- Links: Underline appears, color shifts to `teal`.

### Entrance Animations
- Staggered fade-up for dashboard tiles. Use Framer Motion.
- `initial={{ opacity: 0, y: 14 }}` → `animate={{ opacity: 1, y: 0 }}`
- Duration: `0.5s`, ease: `[0.16, 1, 0.3, 1]`
- Stagger: `0.08s` between items.

### Loading States
- Skeletons: shimmer effect on `#E8E4DC` → `#F4F2ED` → `#E8E4DC`.
- Spinners: `teal` color, subtle pulse.

---

## Components

### Buttons
- **Primary:** `bg-teal text-white rounded-full px-6 py-3`. Hover: darker teal, lift, shadow.
- **Secondary:** `bg-transparent border border-border text-ink rounded-full px-5 py-2.5`. Hover: `bg-surface2`.
- **Danger/Disconnect:** `bg-rust/10 border border-rust/30 text-rust rounded-full`. Hover: `bg-rust/20`.

### Inputs
- Background: `#F9F7F2`. Border: `#DDD8CF`. Radius: `14px`.
- Focus: border `teal`, `box-shadow: 0 0 0 4px rgba(11, 79, 92, 0.10)`.
- Placeholder: `#A9B2AF`.

### Cards
- Background: `white`. Border: `1px solid #DDD8CF`. Radius: `24px`.
- Shadow: `0 1px 2px rgba(22,27,46,0.04), 0 12px 40px -18px rgba(11,79,92,0.10)`.
- Hover shadow: `0 1px 2px rgba(22,27,46,0.05), 0 12px 40px -18px rgba(11,79,92,0.18)`.

### Wellness Ring (Biometric Orbital)
- SVG-based concentric rings.
- Primary ring: `teal` with `drop-shadow-[0_0_12px_rgba(11,79,92,0.35)]`.
- Secondary rings: `muted` with `stroke-dasharray` for dashed telemetry effect.
- Score number: `font-mono text-4xl font-medium`.

### Data Metrics
- All numeric values: `font-mono` (JetBrains Mono).
- Tabular numbers: `font-variant-numeric: tabular-nums`.
- Large metrics: `text-3xl` or `text-4xl`, `font-weight: 500`.

---

## Dependencies

### Frontend additions
- `framer-motion` (already present) — for animations
- `recharts` (already present) — for charts
- `lucide-react` (already present) — for icons

### Google Fonts (in index.html)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet">
```

---

## Pages & Routes

| Route | Component | Purpose | Priority |
|---|---|---|---|
| `/` (auth) | `AuthScreen` | Login / Signup only. No demo. | High |
| `DASHBOARD` | `Dashboard` | Main hub: wellness score, trends, insights | High |
| `NUTRITION` | `NutritionTracker` | Photo food analysis, meal log | Medium |
| `JOURNAL` | `VoiceJournal` | Voice/text mood journal | Medium |
| `ACTIVITY` | `ActivityLog` + `DeviceManager` | Wearable sync, manual entry | High |
| `CHAT` | `AIChat` | AI companion chat | Medium |
| `EXPORT` | `ExportPanel` | **NEW** — Full data export UI | High |
| `BILLING` | `Billing` | Subscription, trial status, checkout | High |
| `GUIDE` | `Guide` | Onboarding guide | Low |
| `ADMIN` | `AdminPanel` | Admin stats dashboard | Low |

---

## Asset Manifest

- No custom images needed. Use Lucide icons throughout.
- Abstract backgrounds: use CSS radial gradients only.
- User avatar: keep existing Pexels placeholder or use a initials-based avatar.

---

## Key UX Rules

1. **Mandatory auth.** No "Continue with Demo" anywhere. If not logged in, show AuthScreen.
2. **Trial gating.** Show trial status prominently. Soft-lock features after trial ends with upgrade prompt.
3. **Device persistence.** On login, auto-reconnect previously connected devices. Show status clearly.
4. **Data density.** Show more data, not less. Every metric has context.
5. **Smooth transitions.** Every view change animates. Every card entrance staggers.
6. **Intimidating typography.** Large display headings, tight tracking, high contrast.
