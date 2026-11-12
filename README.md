# QR Record Verify

A private organization's record-management application with a React administrator portal, an Express/MongoDB API, secure public verification links, and QR downloads. The public page is not a government service and does not claim government authentication or independently prove an underlying event.

## Features

- Administrator login with bcrypt password hashes, JWT in an HTTP-only cookie, account recovery, and profile/password updates.
- Record creation, editing, search, date/status/type filters, sorting, pagination, revocation, restoration, and archival.
- Cryptographically unpredictable verification IDs. QR images encode only the public verification URL, never personal record fields.
- Public mobile-friendly verification page; record lookup/status is dynamically read from MongoDB.
- PNG and printable PDF QR downloads, audit entries for administrator changes, verification logs without visitor IP addresses, and dashboard statistics.
- Helmet, strict CORS origin, request validation, bounded JSON payloads, and rate limits on login, recovery, and public verification.

## Requirements

- Node.js 20.19+ (or 22.12+) and npm. Vite 8 requires a recent Node 20/22 release.
- MongoDB Atlas or another MongoDB deployment reachable by the API.
- An administrator-provisioned SMTP account for production password recovery.

## Local setup

1. Create a MongoDB database and configure its network access and database user.
2. Copy `server/.env.example` to `server/.env`. Set `MONGODB_URI`, a random `JWT_SECRET` of at least 32 characters, `FRONTEND_URL=http://localhost:5173`, and `PUBLIC_BASE_URL=http://localhost:5173`.
3. In `server`, run `npm ci`, then create the first administrator by setting `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_USERNAME`, and a 12+ character `ADMIN_PASSWORD` in the process environment and running `npm run create-admin`. The login accepts the email or username. The seed script does not create public registration.
4. In a terminal, start the API from `server` with `npm run dev`.
5. Copy `client/.env.example` to `client/.env.local`, retaining `VITE_API_URL=http://localhost:5000/api`.
6. In another terminal, run `npm ci` and `npm run dev` from `client`.
7. Open `http://localhost:5173/admin/login`.

No sample records or administrator credentials are included. Keep `.env` files private and out of source control.

## Configuration

| Variable | Purpose |
|---|---|
| `PORT` | API listening port (default `5000`) |
| `NODE_ENV` | Set to `production` on the deployed API |
| `MONGODB_URI` | MongoDB connection string; API fails startup if absent |
| `JWT_SECRET` | Private signing secret, at least 32 characters |
| `JWT_EXPIRES_IN` | JWT lifetime (default `1d`) |
| `FRONTEND_URL` | Exact allowed browser origin, without a trailing slash |
| `PUBLIC_BASE_URL` | Public frontend origin used in QR links |
| `COOKIE_SECURE` | Set `true` when HTTPS is enabled (also enabled automatically in production) |
| `TRUST_PROXY` | Set `true` only when the API is behind a trusted reverse proxy |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | SMTP settings for password recovery |
| `VITE_API_URL` | Frontend API base URL, e.g. `https://api.example.org/api` |

Set `FRONTEND_URL` and `PUBLIC_BASE_URL` to the deployed frontend origin. If frontend and API are on different sites, configure the API cookie and browser deployment for cross-site credentials before deployment; same-site subdomains are preferred.

## API outline

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `GET|PUT /api/auth/profile`, `PUT /api/auth/password`
- `GET|POST /api/records`, `GET|PUT /api/records/:id`, `PATCH /api/records/:id/status`
- `GET /api/records/:id/qr` (PNG by default, `?format=pdf` for PDF; admin-only)
- `GET /api/dashboard/stats`, `GET /api/dashboard/recent-records`
- `GET /api/public/verify/:verificationId` (public, rate-limited)
- `GET /api/admin/verification-logs` (admin-only)

The public response intentionally omits internal Mongo IDs, administrator IDs, remarks, supporting-document references, and location subdivisions. It currently displays the fields listed in `client/src/pages/public/VerifyRecord.jsx`; review this allowlist against the organization's legal basis and policy before accepting real data.

## Production deployment

1. Build the client with `npm ci && npm run build` in `client`; deploy `client/dist` to a static host. Configure SPA fallback to `index.html`, HTTPS, and `VITE_API_URL` at build time.
2. Deploy `server` to an Ubuntu host with Node.js 22, configure all environment variables outside the repository, restrict MongoDB access to the API host, and ensure the frontend origin is the exact CORS allowlist value.
3. Install server dependencies with `npm ci`; start using PM2, e.g. `pm2 start src/server.js --name qr-record-verify-api`. Configure PM2 startup and save its process list.
4. Use Nginx as a reverse proxy to the API port, enable TLS with Let's Encrypt, forward `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto`, and set `TRUST_PROXY=true` only for this known proxy.
5. Set `NODE_ENV=production`, `COOKIE_SECURE=true`, and configure SMTP before enabling account recovery. Use a strong random `JWT_SECRET`. Do not expose the MongoDB URI, SMTP credentials, or JWT secret to the frontend.
6. Monitor server logs, MongoDB backups, certificate renewal, and dependency advisories. Define an organization-specific data retention and access policy before onboarding live records.

Example Nginx location:

```nginx
location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Validation

Run `npm run build` in `client`. The server uses Node's built-in syntax checks and test runner; run `npm test` from `server`.

## Privacy and operational notes

- Public record lookup reveals selected personal information. Only create records and publish fields that the organization is authorized to disclose. Restrict public display further if required by local law or the person's circumstances.
- A verification lookup only confirms that the issuing organization's record exists and its current status; it is not government authentication or independent evidence.
- QR identifiers are opaque random tokens. A QR code is a public reference, not an access-control mechanism.
- Verification logs record the token, result, and timestamp, but not visitor IP addresses or user-agent strings.
- Archiving makes a record unavailable publicly while preserving it administratively. Revocation keeps the public status visible so a previously issued QR clearly reports invalidity.
