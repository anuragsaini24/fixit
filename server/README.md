# FixIt API

Express API using MongoDB/Mongoose. It runs separately from the Vite client and does not process payments.

## Setup

1. Copy the root `.env.example` to `.env` and set `MONGODB_URI` and a random `JWT_SECRET` with at least 32 characters. Set `PORT` if the default port `4000` is unavailable.
2. Optionally set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (at least 12 characters) to create the first admin account at startup. Leave both email and password unset to skip admin bootstrap.
3. Start MongoDB, then run `npm run server:dev` from the project root. The default API URL is `http://localhost:4000`.

Authentication routes allow 100 requests per IP per 15 minutes in development and 30 in production. Set `AUTH_RATE_LIMIT` to a positive integer to override the default; avoid raising it in production without considering brute-force protection.

The Smart Assistant uses the JavaScript keyword matcher when no AI credentials are configured or when the AI request fails. To enable AI analysis, set `AI_API_URL` to an OpenAI-compatible Chat Completions endpoint, plus `AI_API_KEY` and `AI_MODEL`, in the root `.env`. The key is used only by the server; do not expose it through a `VITE_` variable. Service price ranges and issue labels are configured in `server/config/servicePriceEstimates.js`; unlisted services use their `priceFrom` value as a starting estimate. Active services and their keywords are managed through the admin service endpoints.

Welcome emails are sent to new customer/provider accounts. Booking confirmation emails go to the customer and assigned provider, and a service-completed email goes to the customer. Delivery requires SMTP configured with `SMTP_HOST`, `EMAIL_FROM`, and any required `SMTP_USER`/`SMTP_PASS` in the root `.env`. `SMTP_PORT` defaults to `587`; set `SMTP_SECURE=true` for providers requiring implicit TLS (commonly port `465`). SMTP connection/greeting/socket timeouts default to 10/10/15 seconds. Without SMTP settings, email is skipped and logged; signup, booking, and status updates continue normally. Emails include responsive HTML and a plain-text alternative.

Customer and provider accounts can request a password reset at `/forgot-password`. Reset emails use `PUBLIC_APP_URL` (defaults to `http://localhost:5173`), and links expire after 30 minutes. Reset tokens are stored only as hashes, are one-time use, and resetting a password invalidates existing sessions. Admin accounts cannot use this self-service flow.

The Agentic Assistant exposes customer-only, authenticated `/api/assistant/session` endpoints. Sessions store a bounded user/assistant message history and expire through MongoDB TTL; `AGENT_SESSION_TTL_MINUTES` defaults to 30 and is bounded to 5–120 minutes. The agent tool registry is read-only; recommendation responses require approval, and this version does not create bookings or send agent-triggered notifications.

The API does not contain default credentials or seed records. Admin accounts are created only through the environment bootstrap; create services through the admin service endpoints after setup. The Vite client defaults to `/api` and proxies it to `http://127.0.0.1:4000` during development. Set `VITE_API_URL` to the deployed API origin for other environments.

The React client submits credentials only to the auth API, stores the returned bearer token, and calls `/api/auth/me` to restore a session. It sends the token in the `Authorization` header and removes it after a 401 response. Mock account storage strips legacy password fields; passwords are not kept in client storage.

## Routes

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/services`, `GET /api/services/:id`, `POST /api/services`, `PATCH /api/services/:id`, `DELETE /api/services/:id`
- `GET /api/providers`, `GET /api/providers/:id`, `PATCH /api/providers/me`
- `POST /api/bookings`, `GET /api/bookings/customer`, `GET /api/bookings/provider`, `GET /api/bookings/:id`, `PATCH /api/bookings/:id/status`, `PATCH /api/bookings/:id/cancel`
- `POST /api/reviews`, `GET /api/reviews/provider/:providerId`
- `POST /api/assistant/analyze`
- `GET /api/health`

Protected routes expect `Authorization: Bearer <token>`. Mutating service endpoints are admin-only. Booking lists and changes are scoped to the authenticated customer/provider; admins can inspect bookings. Services are soft-deleted by setting their status to `Inactive`.

Socket.io authenticates the same JWT via handshake `auth.token`, joins only the authenticated user's room and (for providers) their provider room, and disconnects at token expiry. Events are emitted only after a REST mutation is saved. New requests emit `booking:new-request` and `booking:created` to the selected provider; status changes emit `booking:accepted`, `booking:assigned`, `booking:on-the-way`, `booking:started`, `booking:completed`, `booking:rejected`, or `booking:cancelled` to the customer and provider. Payloads contain only the booking ID, status/flow status, timestamp, and for new requests service/date/time. Clients refetch the REST resource on events and reconnect, so socket messages never become persistent state.

All request bodies are JSON and validated. Responses use `{ user, token }`, `{ services }`, `{ providers }`, `{ bookings }`, or `{ review(s) }`; error responses use `{ error: { message, details? } }`.

## Verification

Passwords must be at least 8 characters and are hashed with bcrypt before persistence. Run `npm run test:server` for HTTP, validation, authorization, and JWT expiration tests that do not require MongoDB. Run `npm run build` to check that the React frontend still builds.