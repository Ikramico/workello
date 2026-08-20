# Workello — Epic 9: Audit log, per-repo webhook secrets & GitLab per-job status

---

## Files in this zip

```
backend/prisma-schema-additions-epic9.prisma             ← NEW
backend/src/audit/audit.service.ts                       ← NEW
backend/src/audit/audit.module.ts                        ← NEW (also contains AuditController)
backend/src/webhooks/webhooks.service.ts                 ← REPLACES Epic 4
backend/src/webhooks/webhooks.controller.ts              ← EXTENDS Epic 3

frontend/lib/auditApi.ts                                 ← NEW
frontend/screens/admin/AuditLogTab.tsx                   ← NEW
frontend/screens/admin/AdminDashboard.tsx                ← REPLACES Epic 8
```

---

## What was built

### 1. Audit log

**Backend:**
- `AuditLog` model — append-only, one row per significant action.
- `AuditService.log()` — fire-and-forget (never throws, never blocks a response).
- `GET /workspaces/:id/audit-log?cursor=<ISO>` — paginated (50/page), newest-first,
  cursor-based so pages don't drift as new events arrive. Admin-only.

**Frontend:**
- `AuditLogTab` — colour-coded action badges, actor avatar, relative timestamp,
  "Load older" cursor pagination.
- `AdminDashboard` — gets an "Overview / Audit log" tab bar. Overview is unchanged
  from Epic 8; Audit log tab shows `AuditLogTab`.

### 2. Per-repo webhook secrets

**Backend:**
- `webhookSecret String?` column added to `LinkedRepo` (encrypted at rest with AES-256).
- `WebhooksService.verifyGithubSignature()` and `verifyGitlabToken()` now accept the repo
  and check `repo.webhookSecret` before falling back to the global env-var secret.
  Fully backwards-compatible — repos without a per-repo secret continue to use the env var.
- `WebhooksService.rotateSecret(repoId, actorId)` — generates a new 32-byte secret,
  encrypts and saves it, logs `webhook_secret_rotated` to the audit log, returns the raw
  secret ONCE.
- `POST /integrations/repos/:repoId/rotate-secret` — admin-only; returns `{ secret, message }`.

**Frontend:**
- `auditApi.ts` exports `rotateWebhookSecret(repoId)`.
- Add a "Rotate secret" button to your existing `IntegrationsPage` (see wiring step 6).

### 3. GitLab per-job status

**Backend:**
- `processGitlabEvent()` gains an `else if (eventType === 'Job Hook')` branch.
- `handleGitlabJob()` upserts a `DeliveryCheck` with `externalId: job:<id>`, giving
  per-job granularity (vs. Pipeline Hook's overall pass/fail).
- Job failures notify admins at `severity: 'warning'` (vs. pipeline failures at `'critical'`).
- `mapGitlabJobState()` mapping helper exported alongside the existing pipeline/deployment mappers.

**GitLab setup:** enable the "Job events" checkbox in your GitLab repo's
Settings → Webhooks for any repo you want per-job visibility on.

---

## New backend endpoint

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /workspaces/:id/audit-log | JWT + admin | Paginated audit log |
| POST | /integrations/repos/:repoId/rotate-secret | JWT + admin | Rotate per-repo webhook secret |

---

## Setup steps (apply after Epic 8)

### 1. Apply Prisma schema changes

Follow `backend/prisma-schema-additions-epic9.prisma`, then:
```bash
npx prisma migrate dev --name epic9_audit_webhook_secrets
```

### 2. Copy backend files
```
backend/src/audit/audit.service.ts        → src/audit/audit.service.ts
backend/src/audit/audit.module.ts         → src/audit/audit.module.ts
backend/src/webhooks/webhooks.service.ts  → src/webhooks/webhooks.service.ts
backend/src/webhooks/webhooks.controller.ts → src/webhooks/webhooks.controller.ts
```
Create `src/audit/` folder if it doesn't exist.

### 3. Register AuditModule in AppModule

In `src/app.module.ts`:
```typescript
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ...existing...
    AuditModule,   // ADD — exports AuditService for injection everywhere
  ],
})
export class AppModule {}
```

### 4. Inject AuditService into WebhooksModule

In `src/webhooks/webhooks.module.ts`:
```typescript
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [...existing, AuditModule],
  ...
})
export class WebhooksModule {}
```

### 5. Wire AuditService.log() call sites

`AuditService` is now exported from `AuditModule`. Import `AuditModule` into any
module whose service needs to call `audit.log()`, then inject `AuditService` via
the constructor.

Add `this.audit.log({...})` at the following points (see audit.service.ts JSDoc
for the full list):

```typescript
// AuthService.register()
this.audit.log({
  workspaceId: workspace.id,   // the newly created workspace
  actorId: user.id,
  action: 'user_registered',
  targetType: 'user',
  targetId: user.id,
  targetLabel: user.email,
});

// WorkspacesService.inviteMember()
this.audit.log({
  workspaceId,
  actorId: callerId,
  action: 'member_invited',
  targetType: 'member',
  targetLabel: inviteeEmail,
  metadata: { role },
});

// WorkspacesService.acceptInvite()
this.audit.log({
  workspaceId: invite.workspaceId,
  actorId: userId,
  action: 'member_joined',
  targetType: 'member',
  targetId: userId,
});

// WorkspacesService.updateMemberRole()
this.audit.log({
  workspaceId,
  actorId: callerId,
  action: 'member_role_changed',
  targetType: 'member',
  targetId: targetUserId,
  metadata: { newRole },
});

// WorkspacesService.removeMember()
this.audit.log({
  workspaceId,
  actorId: callerId,
  action: 'member_removed',
  targetType: 'member',
  targetId: targetUserId,
});

// CardsService move handler
this.audit.log({
  workspaceId,
  actorId: userId,
  action: 'card_moved',
  targetType: 'card',
  targetId: cardId,
  targetLabel: card.title,
  metadata: { fromList, toList },
});
```

### 6. Add "Rotate secret" button to IntegrationsPage

In your existing `screens/IntegrationsPage.tsx`, for each linked repo row add:

```tsx
import { rotateWebhookSecret } from '../lib/auditApi';

// In the repo row:
const [rotating, setRotating] = useState(false);
const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

const handleRotate = async () => {
  if (!confirm('Generate a new webhook secret? You must update GitHub/GitLab immediately.')) return;
  setRotating(true);
  try {
    const { secret } = await rotateWebhookSecret(repo.id);
    setRevealedSecret(secret);
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Failed to rotate secret.');
  } finally {
    setRotating(false);
  }
};

// Button:
<button onClick={handleRotate} disabled={rotating}
  className="text-xs text-amber-400 hover:underline disabled:opacity-50">
  {rotating ? 'Rotating…' : 'Rotate secret'}
</button>

// One-time reveal (disappears on next render):
{revealedSecret && (
  <div className="mt-2 rounded bg-slate-800 p-2 font-mono text-xs text-emerald-300 break-all">
    <p className="text-slate-500 mb-1">Copy this secret into GitHub/GitLab now — shown once only:</p>
    {revealedSecret}
    <button onClick={() => setRevealedSecret(null)} className="ml-2 text-slate-600 hover:text-slate-400">✕</button>
  </div>
)}
```

### 7. Copy frontend files
```
frontend/lib/auditApi.ts                         → src/lib/auditApi.ts
frontend/screens/admin/AuditLogTab.tsx           → src/screens/admin/AuditLogTab.tsx
frontend/screens/admin/AdminDashboard.tsx        → src/screens/admin/AdminDashboard.tsx
```

### 8. Enable GitLab Job Hook in GitLab

For any GitLab repo linked to Workello:
Settings → Webhooks → edit your Workello webhook → tick "Job events" → Save changes.

No backend config change needed — the Job Hook handler is live after you deploy.

---

## No open caveats
All three items from the roadmap's "Lower priority / future" section that map to
backend completeness are now delivered. See DEVELOPMENT_ROADMAP.md for Epic 10 (Push/SMS)
and Epic 11 (Flutter).
