/**
 * lib/auditApi.ts — NEW (Epic 9)
 *
 * Typed wrappers for the audit log endpoint.
 * Uses cursor-based pagination — pass nextCursor from the previous response
 * to load older entries.
 */

import { api } from './api';

export type AuditAction =
  | 'user_registered'
  | 'user_login'
  | 'user_password_reset'
  | 'member_invited'
  | 'member_joined'
  | 'member_role_changed'
  | 'member_removed'
  | 'board_created'
  | 'board_updated'
  | 'card_created'
  | 'card_moved'
  | 'card_archived'
  | 'integration_connected'
  | 'integration_disconnected'
  | 'repo_linked'
  | 'repo_unlinked'
  | 'webhook_secret_rotated';

export const ACTION_LABELS: Record<AuditAction, string> = {
  user_registered: 'Signed up',
  user_login: 'Signed in',
  user_password_reset: 'Reset password',
  member_invited: 'Invited member',
  member_joined: 'Joined workspace',
  member_role_changed: 'Role changed',
  member_removed: 'Member removed',
  board_created: 'Created board',
  board_updated: 'Updated board',
  card_created: 'Created card',
  card_moved: 'Moved card',
  card_archived: 'Archived card',
  integration_connected: 'Connected integration',
  integration_disconnected: 'Disconnected integration',
  repo_linked: 'Linked repo',
  repo_unlinked: 'Unlinked repo',
  webhook_secret_rotated: 'Rotated webhook secret',
};

export interface AuditLogEntry {
  id: string;
  workspaceId: string;
  actorId: string | null;
  actorName: string | null;
  actorEmail: string | null;
  action: AuditAction;
  targetType: string | null;
  targetId: string | null;
  targetLabel: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string; // ISO date string
}

export interface AuditLogPage {
  entries: AuditLogEntry[];
  nextCursor: string | null;
}

export function getAuditLog(
  workspaceId: string,
  cursor?: string | null,
): Promise<AuditLogPage> {
  const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return api.get<AuditLogPage>(`/workspaces/${workspaceId}/audit-log${params}`);
}

export function rotateWebhookSecret(
  repoId: string,
): Promise<{ secret: string; message: string }> {
  return api.post<{ secret: string; message: string }>(
    `/integrations/repos/${repoId}/rotate-secret`,
  );
}
