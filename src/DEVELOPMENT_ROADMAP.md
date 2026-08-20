# Workello — Development Roadmap

> **Purpose:** This document is for any developer (or AI assistant) picking
> up this project. It records what has been built, in what order, what files
> were delivered in each phase, and what the next phases look like. Read this
> before touching any code.

---

## What Workello is

A unified project management platform — Kanban board, team chat, in-app
calling, GitHub/GitLab integration, CI/deployment tracking, and admin
observability — built on:

- **Frontend:** React + TypeScript + Vite, TailwindCSS, @dnd-kit, Zustand,
  React Router v7, Socket.IO client
- **Backend:** NestJS + TypeScript, Prisma ORM, PostgreSQL, Socket.IO,
  Passport.js (local + JWT + Google OAuth2), Nodemailer
- **Realtime:** Socket.IO (board sync namespace + notifications namespace)
- **Dev integrations:** GitHub and GitLab webhooks + OAuth

The project started as **SyncBoard** — a pure-frontend Kanban app with mock
data — and has been incrementally extended to the full platform described
above. The `sn.zip` file in the repo root is the original SyncBoard source.

---

## Build history

### Sprint 0 — Foundation scaffold
**Status: Done**

What was established:

- NestJS project structure with `AppModule`, `PrismaModule`, `ConfigModule`,
  `ThrottlerModule`
- Prisma schema: `User`, `RefreshToken`, `Workspace`, `WorkspaceMember`,
  `Board`, `List`, `Card`, `Task`
- Auth scaffold: email/password (bcrypt + Passport local), Google OAuth2
  entry point, JWT access tokens (15 min), rotating refresh tokens (httpOnly
  cookie, 7 days), `JwtAuthGuard`, role guard (admin/member/viewer)
- CRUD modules: `UsersModule`, `WorkspacesModule`, `BoardsModule`,
  `ListsModule`, `CardsModule`, `TasksModule`
- `PATCH /cards/:id/move` endpoint (position + list change, drag-source
  agnostic)

**Known gaps at time of delivery (now closed in Epic 6):**
- `main.ts` was not finalized
- `auth.service.ts` methods were stubs
- `auth.controller.ts` Google callback was not wired
- `.env.example` was not delivered

---

### Epic 1 — Core board reliability
**Status: Done**

What was built:

- Touch-screen drag support added to `Board.tsx` via `@dnd-kit` sensors:
  `PointerSensor` with a 200 ms delay + 8 px tolerance for touch,
  `KeyboardSensor` for accessibility
- Card moves persisted to backend via `PATCH /cards/:id/move`
- Board state (lists, cards, positions) loaded from backend via
  `useRemoteBoard` hook on mount instead of `mockData.ts`
- Business rules enforced in `useBoardReducer`:
  - Cannot move a card backwards past "In Progress" without confirmation
  - Cannot move to "Done" unless all tasks are complete
  - Cannot move a "not started" card to Done directly
  - `BlockedMoveModal`, `ConfirmMoveModal`, `TaskCompletionModal`

**Key files changed:**
- `hooks/useBoardReducer.ts` — full discriminated-union state machine
- `hooks/useRemoteBoard.ts` — backend hydration hook (NEW)
- `lib/boardApi.ts` — `moveCardRemote`, `toggleTaskRemote` (NEW)
- `screens/board_components/Board.tsx` — sensors + modal wiring
- `screens/board_components/blockedMoveModal.tsx` (NEW)
- `screens/board_components/confirmMoveModal.tsx` (NEW)
- `screens/board_components/taskCompletionModal.tsx` (NEW)

---

### Epic 2 — Collaboration
**Status: Done**

What was built:

- **Realtime board sync:** Socket.IO gateway (`/` namespace), `useBoardSocket`
  hook. When any user moves a card, all other users on the same board see it
  move immediately without a reload. Presence avatars in the board header show
  who else is viewing.
- **In-app messaging:** Thread-per-card chat panel (sidebar) + workspace-wide
  team chat. Messages stored in DB (`Message` model), delivered over the same
  board socket. `ChatPanel` component, `MessagesModule` backend.
- **In-app calling:** WebRTC peer-to-peer calls initiated from the card
  sidebar. Signalling (offer/answer/ICE candidates) done over Socket.IO.
  `GatewayModule` handles the signalling. Custom STUN/TURN config via env vars.

**New Prisma models:** `Message`

**Key files (NEW):**
- `backend/src/messages/` — full CRUD + socket delivery
- `backend/src/gateway/` — board sync + signalling gateway
- `frontend/hooks/useBoardSocket.ts`
- `frontend/screens/board_components/ChatPanel.tsx`
- `frontend/screens/board_components/CallPanel.tsx` (or equivalent)

---

### Epic 3 — Dev-tool integration
**Status: Done**

What was built:

- **GitHub and GitLab OAuth:** Users (admin role) can connect their GitHub or
  GitLab account. OAuth tokens are stored encrypted in the DB
  (`Integration` model, AES-256 via `ENCRYPTION_KEY`).
- **Repo linking:** Admins can link a GitHub/GitLab repo to a board
  (`LinkedRepo` model). Any card can then be linked to PRs, issues, or commits
  from that repo (`CardLink` model).
- **Webhook ingestion:** `POST /webhooks/github` and `POST /webhooks/gitlab`
  receive push, PR, issue, check-run, workflow-run, pipeline, and deployment
  events. HMAC signature verified before any processing.
- **Card Git panel:** Cards show their linked PRs/issues/commits with live
  state (open/merged/closed/draft) updated from webhooks. `GitPanel` component.
- **Blame:** Commit SHAs linked to cards surface author and message from the
  Git provider API.
- **Integrations page:** Admin-only UI at `/integrations` for connecting
  accounts and linking repos.

**New Prisma models:** `Integration`, `LinkedRepo`, `CardLink`, `WebhookEvent`

**Key files (NEW):**
- `backend/src/integrations/`
- `backend/src/card-links/`
- `backend/src/webhooks/webhooks.controller.ts`, `webhooks.service.ts`
- `frontend/lib/integrationApi.ts`
- `frontend/screens/board_components/GitPanel.tsx`
- `frontend/screens/IntegrationsPage.tsx`

---

### Epic 4 — Admin observability
**Status: Done**
**Source file:** `workello-admin-observability.zip`

What was built:

- **Admin-only notifications:** Every `WorkspaceMember` with `role: admin`
  receives a notification whenever a CI check fails, a deployment fails, a
  webhook can't be processed, or an internal 500 error occurs on a
  workspace-related request.
- **In-app notification bell:** `NotificationBell` component in the header.
  Unread count badge, dropdown list, per-notification and mark-all-read.
  Live updates over a dedicated Socket.IO namespace (`/notifications`).
- **Cross-tab read sync:** Marking a notification read on one browser tab
  syncs to all other tabs open for the same user (via `notification:read`
  socket event).
- **Email alerts:** `EmailService` (Nodemailer) sends the same alert to admin
  email addresses. Best-effort — the app keeps working if SMTP isn't
  configured.
- **Delivery checks panel:** "Checks" button in the board header opens
  `DeliveryStatusPanel` — a live list of CI runs and deployments for all
  repos linked to the board. State is upserted from webhook events
  (no polling). `DeliveryCheck` model.
- **Global exception filter:** `GlobalExceptionFilter` catches any unhandled
  500 error on a workspace-scoped request and notifies admins, completing the
  "any occurrence" requirement.

**New Prisma models:** `Notification`, `DeliveryCheck`
**New Prisma enums:** `NotificationType`, `NotificationSeverity`, `DeliveryState`

**Key files (NEW/REPLACED):**
- `backend/src/notifications/` — service, gateway, controller, email service,
  DTO, module
- `backend/src/delivery/` — service, controller, module
- `backend/src/webhooks/webhooks.service.ts` — REPLACES Epic 3 version (adds
  CI/deployment handling + admin notify on failure)
- `backend/src/common/global-exception.filter.ts`
- `frontend/lib/notificationsApi.ts`, `notificationsSocket.ts`, `deliveryApi.ts`
- `frontend/hooks/useNotifications.ts`
- `frontend/screens/board_components/NotificationBell.tsx`
- `frontend/screens/board_components/DeliveryStatusPanel.tsx`
- `frontend/screens/board_components/Header.tsx` — REPLACES Epic 3 version
- `frontend/screens/board_components/Board.tsx` — REPLACES Epic 3 version

**Test results at delivery:** Backend 47 passed, Frontend 6 passed, 0 failed.

---

### Epic 6 — Auth wiring & caveat close
**Status: Done**
**Source file:** `workello-epic6.zip`

What was built (closing 12 caveats accumulated across all prior epics):

- **`frontend/lib/api.ts`** — the core HTTP client that was referenced
  everywhere but never delivered. JWT Bearer auth on every request, automatic
  silent token refresh on 401, `getAccessToken()` export (closes the
  Epic 4 socket caveat). All other `lib/*.ts` files now compile cleanly.
- **Real `AuthContext`** — replaces the dummy mock. Calls `/auth/login`,
  `/auth/refresh` (on page load for session restore), `/auth/logout`,
  `/auth/me`. `isLoading` state prevents the reload flash-to-login.
- **Real `login.tsx`** — email + password form (async, error feedback) +
  "Continue with Google" button.
- **`GoogleCallback.tsx`** — handles `FRONTEND_URL/auth/callback?token=`
  redirect from the backend after Google OAuth.
- **`profile.tsx`** — removes the role self-assignment selector (security
  hole). Role is read-only from the backend.
- **`protectedRoute.tsx`** — waits for `isLoading` before deciding to redirect,
  eliminating the authenticated-user flash to `/login` on reload.
- **`App.tsx`** — adds `/auth/callback` and `/integrations` routes that were
  missing.
- **`backend/src/main.ts`** — the missing NestJS bootstrap. Raw-body parsing
  for webhook HMAC, CORS, cookie-parser, global ValidationPipe, `/api` prefix,
  shutdown hooks.
- **`auth.controller.ts`** — `GET /auth/me`, Google OAuth callback with
  redirect-to-frontend carrying only the short-lived access token.
- **`auth.service.ts`** — full implementations of `loginWithEmail`,
  `loginWithGoogle` (upsert by email), `refreshTokens` (with rotation),
  `revokeRefreshToken`, `getProfile` (role from `WorkspaceMember`).
- **`google.strategy.ts`** — Passport Google OAuth2 strategy.
- **`prisma-schema-additions-epic6.prisma`** — `googleId` on User, `lookupKey`
  + index on RefreshToken (needed for O(1) token lookup without a full-table
  bcrypt scan).
- **`.env.example`** — all env vars from Sprint 0 through Epic 6, annotated.

---

## Current architecture diagram

```
Browser (React + Vite)
│
├── lib/api.ts          ← all REST calls, auto token-refresh
├── lib/*Api.ts         ← typed wrappers per domain
├── lib/notificationsSocket.ts
│
├── AuthContext         ← JWT in memory, refresh token in httpOnly cookie
├── Board (dnd-kit)     ← touch + mouse + keyboard drag
├── ChatPanel           ← per-card threads + workspace chat
├── CallPanel           ← WebRTC (signalled via Socket.IO)
├── GitPanel            ← linked PRs / issues / commits per card
├── DeliveryStatusPanel ← CI & deployment checks (webhook-driven)
└── NotificationBell    ← admin alerts, live over /notifications socket
         │
         │  REST  /api/*          HTTP
         │  WS    /              Socket.IO board + chat + signalling
         │  WS    /notifications  Socket.IO admin alerts
         ▼
NestJS backend (port 4000)
│
├── AuthModule          ← JWT + Google OAuth2 + refresh rotation
├── UsersModule         ← PATCH /users/me
├── WorkspacesModule
├── BoardsModule / ListsModule / CardsModule / TasksModule
├── MessagesModule      ← chat persistence
├── GatewayModule       ← board sync + WebRTC signalling
├── IntegrationsModule  ← GitHub / GitLab OAuth, token storage (encrypted)
├── CardLinksModule     ← PR / issue / commit links per card
├── WebhooksModule      ← GitHub + GitLab webhook ingestion + HMAC verify
├── NotificationsModule ← fan-out to admins, WS gateway, email
├── DeliveryModule      ← CI / deployment check upsert + query
└── GlobalExceptionFilter ← 500 errors → admin notification
         │
         ▼
PostgreSQL (via Prisma)
Models: User, RefreshToken, Workspace, WorkspaceMember, Board, List,
        Card, Task, Message, Integration, LinkedRepo, CardLink,
        WebhookEvent, Notification, DeliveryCheck
```

---

### Epic 7 — Registration, member management & multi-workspace
**Status: Done**
**Source file:** `workello-epic7.zip`

What was built:

- **User registration:** `POST /auth/register` creates User + default Workspace + admin
  WorkspaceMember in one transaction. Returns a full TokenPair so the user is logged in
  immediately. Sends a verification email (best-effort, non-blocking).
- **Email verification:** `POST /auth/verify-email` marks `emailVerified = true`.
  `POST /auth/resend-verification` lets users request a new link. Unverified banner on
  TeamPage with a one-click resend.
- **Password reset:** `POST /auth/forgot-password` (always 204, no enumeration) →
  `POST /auth/reset-password` (validates 15-min SHA-256 token, updates hash, invalidates
  all refresh tokens as a security event).
- **Workspace listing:** `GET /workspaces` returns all workspaces + role per workspace.
- **Invite flow:** Admin POSTs `/workspaces/:id/invite` → InviteToken created + invite
  email sent. Invitee clicks `/accept-invite?token=`. If they have no account, they're
  redirected to `/register?token=` and the invite is completed after registration.
- **Role management:** Admin can PATCH any member's role (not their own). Enforced
  server-side with a `ForbiddenException` if the caller isn't admin.
- **Remove member:** Admin can DELETE any member (not themselves) from the workspace.
- **Workspace switcher:** `WorkspaceSwitcher` dropdown in the board header. Persists
  the active workspace to localStorage. `WorkspaceContext` exposes the list and
  `switchWorkspace()` to all protected pages.
- **TeamPage:** `/team` — member list, inline role selector (admin), invite form,
  remove button, email verification banner.
- **Multi-workspace support:** `WorkspaceContext` wraps protected routes. `useRemoteBoard`
  should be scoped to `activeWorkspace.id` (see PROJECT_NOTES.md step 5).

**New Prisma models:** `InviteToken`, `PasswordResetToken`
**New User fields:** `emailVerified`, `verifyToken`

**Key files:**
- `backend/src/auth/auth.service.ts` — REPLACES Epic 6 (adds register, verifyEmail, forgotPassword, resetPassword)
- `backend/src/auth/auth.controller.ts` — REPLACES Epic 6 (5 new endpoints)
- `backend/src/email/email.service.ts` — REPLACES Epic 4 (adds verification, reset, invite templates)
- `backend/src/workspaces/workspaces.service.ts` — REPLACES Sprint 0 stub (full member management)
- `backend/src/workspaces/workspaces.controller.ts` — REPLACES Sprint 0 stub (6 new routes)
- `frontend/lib/workspaceApi.ts` (NEW)
- `frontend/data/contexts/workspaceContext.tsx` (NEW)
- `frontend/screens/auth/register.tsx` (NEW)
- `frontend/screens/auth/ForgotPassword.tsx` (NEW — exports ForgotPassword + ResetPassword)
- `frontend/screens/auth/VerifyEmail.tsx` (NEW — exports VerifyEmail + AcceptInvite)
- `frontend/screens/team/TeamPage.tsx` (NEW)
- `frontend/screens/board_components/WorkspaceSwitcher.tsx` (NEW)
- `frontend/data/contexts/authContexts.tsx` — REPLACES Epic 6 (adds register())
- `frontend/types/auth.types.ts` — REPLACES sn.zip (adds workspaceId, emailVerified)
- `frontend/App.tsx` — REPLACES Epic 6 (WorkspaceProvider + 6 new routes)

---

### Epic 8 — Notification preferences, admin dashboard & digests
**Status: Done**
**Source file:** `workello-epic8.zip`

What was built:

- **Notification preferences:** `NotificationPreference` model (one row per user per type,
  absent = opted in). Three channels per type: `inApp`, `email`, `digest`.
  `PreferencesService.getEffective()` is called by `NotificationsService.notifyWorkspaceAdmins()`
  before each fan-out step — preferences are respected at the point of notification, not filtering
  after the fact. `GET/PUT /notifications/preferences` endpoints. `NotificationPreferences`
  toggle-matrix component embedded in Profile (admin-only).

- **Admin dashboard:** `GET /workspaces/:id/dashboard` returns members, recent CI/deployment
  failures, linked repos with latest check state, and the admin's last 20 notifications — one
  call, no N+1. `AdminDashboard.tsx` at `/admin` with a 60 s auto-refresh. Stats strip (member
  count, open failures, unread alerts). Linked from `WorkspaceSwitcher` dropdown.

- **Notification digests:** `DigestService` with `@Cron(DIGEST_CRON)` (default 08:00 UTC daily).
  Per admin: fetches undigested Notification rows respecting the `digest` channel preference,
  sends one batch email, writes `DigestLog` rows to prevent re-sending. `POST /digest/run`
  for manual trigger. `@nestjs/schedule` added as a dependency.

**New Prisma models:** `NotificationPreference`, `DigestLog`

**Key files:**
- `backend/src/notifications/preferences.service.ts` (NEW)
- `backend/src/notifications/notifications.service.ts` (REPLACES Epic 4 — gates fan-out on prefs)
- `backend/src/notifications/notifications.controller.ts` (REPLACES Epic 4 — adds pref endpoints)
- `backend/src/digest/` (NEW — service, controller, module)
- `backend/src/users/users.controller.ts` (EXTENDS — adds /dashboard + /me/stats)
- `frontend/lib/preferencesApi.ts` (NEW)
- `frontend/lib/dashboardApi.ts` (NEW)
- `frontend/screens/admin/AdminDashboard.tsx` (NEW)
- `frontend/screens/board_components/NotificationPreferences.tsx` (NEW)
- `frontend/screens/auth/profile.tsx` (REPLACES — embeds NotificationPreferences)
- `frontend/App.tsx` (REPLACES — adds /admin route)

---

### Epic 9 — Audit log, per-repo webhook secrets & GitLab per-job status
**Status: Done**
**Source file:** `workello-epic9.zip`

What was built:

- **Audit log:** `AuditLog` model (append-only, workspace-scoped, actor + action + target).
  `AuditService.log()` is fire-and-forget — never throws, never blocks a response.
  `GET /workspaces/:id/audit-log` (admin-only, cursor-based pagination, 50/page).
  `AuditLogTab` in `AdminDashboard` — colour-coded badges, actor avatars, relative timestamps,
  "Load older" pagination.

- **Per-repo webhook secrets:** `webhookSecret String?` on `LinkedRepo` (AES-256 encrypted).
  `verifyGithubSignature()` and `verifyGitlabToken()` check the per-repo secret first, falling
  back to the global env var — fully backwards-compatible. `rotateSecret()` generates, encrypts,
  saves, audit-logs, and returns the raw secret once.
  `POST /integrations/repos/:repoId/rotate-secret` (admin-only).

- **GitLab per-job status:** `Job Hook` event handler added to `processGitlabEvent()`.
  Each job upserted as a `DeliveryCheck` with `externalId: job:<id>`. Job failures notify
  at `warning` severity; `mapGitlabJobState()` helper covers all GitLab job statuses.

**New Prisma models:** `AuditLog`
**New Prisma enums:** `AuditAction`
**New LinkedRepo field:** `webhookSecret String?`

**Key files:**
- `backend/src/audit/audit.service.ts` (NEW)
- `backend/src/audit/audit.module.ts` (NEW — also contains AuditController)
- `backend/src/webhooks/webhooks.service.ts` (REPLACES Epic 4)
- `backend/src/webhooks/webhooks.controller.ts` (EXTENDS Epic 3 — adds rotate-secret)
- `frontend/lib/auditApi.ts` (NEW)
- `frontend/screens/admin/AuditLogTab.tsx` (NEW)
- `frontend/screens/admin/AdminDashboard.tsx` (REPLACES Epic 8 — adds Audit log tab)

---

## What comes next

These are features that were explicitly **not** in scope for any delivered
epic, listed in rough priority order. None of them require changing what has
already been built — each is a clean addition.

### Next up — high priority

All high-priority items are now delivered (Epics 6, 7, 8).

### Lower priority / future

**Push / SMS notifications** ← Epic 10
- Current channels: in-app (WebSocket) + email
- Future: Web Push API (service worker, `PushSubscription`) or SMS via Twilio
- Would slot into `NotificationsService.notifyWorkspaceAdmins()` as additional
  fan-out targets

**Mobile apps (Flutter)** ← Epic 11
- The original plan mentioned Flutter mobile (Flutteria)
- The REST API and WebSocket contracts are already stable enough to build
  against — no backend changes needed to start a Flutter client

~~**GitLab per-job status**~~ — Done (Epic 9)
~~**Audit log**~~ — Done (Epic 9)
~~**Per-board webhook secrets**~~ — Done (Epic 9)

---

## Environment variables — full reference

See `.env.example` (delivered in `workello-epic6.zip`) for annotated values.
Required to start the backend at all:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Signs 15-min access tokens |
| `FRONTEND_URL` | CORS origin + Google OAuth redirect base |

Required for Google login:

| Variable | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth2 client secret |
| `GOOGLE_CALLBACK_URL` | Must match the URI registered in Google Cloud Console |

Required for GitHub/GitLab integrations (Epic 3):
`GITHUB_WEBHOOK_SECRET`, `GITLAB_WEBHOOK_SECRET`, `GITHUB_CLIENT_ID`,
`GITHUB_CLIENT_SECRET`, `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`,
`ENCRYPTION_KEY`

Optional (Epic 4 admin emails):
`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`,
`SMTP_FROM`

---

## Running the project

```bash
# Backend
cd backend
cp ../.env.example .env   # fill in values
npm install
npx prisma migrate dev
npm run start:dev          # http://localhost:4000/api

# Frontend
cd frontend   # (or wherever your Vite project root is)
echo "VITE_API_URL=http://localhost:4000/api" > .env.local
npm install
npm run dev                # http://localhost:5173
```

---

## Zip delivery history

| Zip file | Contents |
|---|---|
| `sn.zip` | Original SyncBoard — frontend only, mock data, dummy auth |
| `workello-admin-observability.zip` | Epic 4 deliverable (Epics 1–3 were delivered in earlier sessions not captured as zips) |
| `workello-epic6.zip` | Epic 6 — auth wiring, missing files, all caveat close |
| `workello-epic7.zip` | Epic 7 — registration, email verification, password reset, member management, workspace switcher |
| `workello-epic8.zip` | Epic 8 — notification preferences, admin dashboard, scheduled digest emails |
| `workello-epic9.zip` | Epic 9 — audit log, per-repo webhook secrets, GitLab per-job status |

If you are picking this up fresh, apply the zips in the order above, run
the Prisma migrations after each one, and follow the setup steps in each
zip's `PROJECT_NOTES.md`.
