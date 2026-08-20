/**
 * src/audit/audit.service.ts — NEW (Epic 9)
 *
 * Append-only audit log. Other services call log() to record significant
 * actions; nothing in this service ever updates or deletes an audit row.
 *
 * Design:
 *  - `log()` is fire-and-forget from call sites — it never throws and
 *    never blocks a response. A failed write goes to the logger, not the
 *    user's error response.
 *  - `list()` returns a paginated, descending-time view of the workspace
 *    audit log, restricted to workspace admins by the controller.
 *  - Cursor-based pagination (ISO timestamp + id) keeps pages stable as
 *    new events arrive — offset pagination drifts on insert-heavy logs.
 *
 * Call sites (add a log() call wherever the action already happens):
 *   AuthService.register()            → user_registered
 *   AuthService.loginWithEmail()      → user_login
 *   AuthService.resetPassword()       → user_password_reset
 *   WorkspacesService.inviteMember()  → member_invited
 *   WorkspacesService.acceptInvite()  → member_joined
 *   WorkspacesService.updateMemberRole() → member_role_changed
 *   WorkspacesService.removeMember()  → member_removed
 *   BoardsService.create()            → board_created
 *   CardsService.create()             → card_created
 *   CardsService.move()               → card_moved
 *   IntegrationsService.connect()     → integration_connected
 *   IntegrationsService.disconnect()  → integration_disconnected
 *   LinkedReposService.link()         → repo_linked
 *   LinkedReposService.unlink()       → repo_unlinked
 *   WebhooksService.rotateSecret()    → webhook_secret_rotated
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuditAction } from '@prisma/client';

export interface LogInput {
  workspaceId: string;
  actorId?: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
}

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
  createdAt: Date;
}

const PAGE_SIZE = 50;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Write ─────────────────────────────────────────────────────────────────

  /**
   * Fire-and-forget audit write. Never throws — call sites don't need a
   * try/catch and the action isn't blocked by a logging failure.
   */
  log(input: LogInput): void {
    this.prisma.auditLog
      .create({
        data: {
          workspaceId: input.workspaceId,
          actorId: input.actorId ?? null,
          action: input.action,
          targetType: input.targetType ?? null,
          targetId: input.targetId ?? null,
          targetLabel: input.targetLabel ?? null,
          metadata: (input.metadata as any) ?? undefined,
        },
      })
      .catch((err) =>
        this.logger.error(`Failed to write audit log [${input.action}]: ${String(err)}`),
      );
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  /**
   * Returns PAGE_SIZE audit entries for a workspace, newest first.
   * Pass `cursor` (ISO string of the last entry's createdAt) to get the next page.
   */
  async list(
    workspaceId: string,
    cursor?: string,
  ): Promise<{ entries: AuditLogEntry[]; nextCursor: string | null }> {
    const rows = await this.prisma.auditLog.findMany({
      where: {
        workspaceId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        actor: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: PAGE_SIZE + 1, // fetch one extra to know if there's a next page
    });

    const hasMore = rows.length > PAGE_SIZE;
    const entries = (hasMore ? rows.slice(0, PAGE_SIZE) : rows).map((r) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      actorId: r.actorId,
      actorName: r.actor?.name ?? null,
      actorEmail: r.actor?.email ?? null,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      targetLabel: r.targetLabel,
      metadata: r.metadata as Record<string, unknown> | null,
      createdAt: r.createdAt,
    }));

    const nextCursor =
      hasMore ? rows[PAGE_SIZE - 1].createdAt.toISOString() : null;

    return { entries, nextCursor };
  }
}
