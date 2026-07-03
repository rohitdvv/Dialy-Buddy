# HealthGuardAI — Test Credentials

## Admin
- Email: `admin@healthguard.ai`
- Password: `HealthGuard2026!`
- Role: `admin`

## Demo user
- Email: `demo@healthguard.ai`
- Password: `Demo2026!`
- Role: `user`

## Auth endpoints
- `POST /api/auth/register` — Fields: `{ name, email, password }` (min 6 chars). Returns `{ user, token }`.
- `POST /api/auth/login` — Fields: `{ email, password }`. Returns `{ user, token }`.
- `GET  /api/auth/me` — Requires `Authorization: Bearer <token>`.

## Token flow
- JWT is returned in the `token` field of `/api/auth/{register,login}` responses.
- Frontend stores token in `localStorage["hg_token"]` and sends it as `Authorization: Bearer <token>`.
