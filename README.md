# WebChem — Chemistry, in motion

WebChem is a chemistry-learning web app and PWA with lessons, chemistry calculators, quizzes/CBT practice, virtual learning tools, AI tutoring, learner profiles, and cloud progress.

## Current release candidate

- **Integration branch:** `webchem-upgrade`
- **Frontend:** static `index.html` + PWA manifest/service worker
- **Backend:** Node.js / Express / MongoDB in `backend/`
- **Production API configured in frontend:** `https://webchem-production.up.railway.app`
- **Preview source:** `smrutiranjandev0p/webchem-preview`

The frontend was brought over from the preview project. The upgrade branch includes the newer backend routes needed by the frontend (email OTP registration/reset, Google sign-in, cloud progress, AI tutor, and admin-curated knowledge).

## Run locally

Requirements: Node.js 20 LTS recommended, and a MongoDB database.

```bash
npm install
cp .env.example .env
# Set real local values in .env (never commit secrets)
npm run dev
```

The API starts on `http://localhost:5000`. Serve the static frontend from a local HTTP server (not `file://`) and set `FRONTEND_URL` to that origin in the backend environment.

## Backend environment

Configure the following in the deployment provider’s secret/environment settings:

- `NODE_ENV=production`
- `PORT` (provided by Railway)
- `MONGODB_URI` — correct production database connection
- `JWT_SECRET` — strong, unique secret
- `JWT_EXPIRE=7d`
- `FRONTEND_URL` — the published frontend origin
- `GOOGLE_CLIENT_ID` — OAuth client ID for the published domain
- `OPENAI_API_KEY` and optional `OPENAI_MODEL`
- `OTP_SECRET` — random secret at least 32 characters
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_FROM`

Do not commit `.env`, API keys, database URLs, JWT secrets, OTP secrets, or SMTP credentials. Keep production and staging databases/services isolated.

## PWA

- `manifest.webmanifest` provides install metadata and the app icon.
- `sw.js` caches the static app shell for offline opening.
- Auth, API, and learner-progress responses are intentionally excluded from service-worker caching to avoid storing account-specific data in the shared app cache.

## Verification and release

The release workflow checks:
- frontend inline JavaScript syntax
- backend JavaScript syntax
- PWA manifest/icon and service-worker safety
- expected production API origin and key frontend/backend route compatibility

Before production release, verify the production Railway service has the required environment variables, database backup/restore path, and rollback option. Then smoke-test registration/OTP, login/Google sign-in, refresh/session restore, progress save/restore, logout, AI tutor, and mobile PWA install on the deployed site.

The urea/fertilizer simulator is for learning only, not a validated industrial operating model.
