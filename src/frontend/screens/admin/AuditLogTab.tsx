/**
 * screens/admin/AuditLogTab.tsx — NEW (Epic 9)
 *
 * Paginated, infinite-scroll audit log for a workspace.
 * Embedded as a new tab in AdminDashboard.tsx.
 *
 * Features:
 *  - Loads first 50 entries on mount (newest first)
 *  - "Load older" button appends the next page (cursor-based, no drift)
 *  - Actor avatar + name, action label, target, relative timestamp
 *  - Action badge colour-coded by category (auth / membership / board / git / security)
 */

import { useEffect, useState, useCallback } from 'react';
import {
  getAuditLog,
  ACTION_LABELS,
  type AuditLogEntry,
  type AuditAction,
} from '../../lib/auditApi';

interface Props {
  workspaceId: string;
}

// ── Badge colours by action category ─────────────────────────────────────────

function badgeStyle(action: AuditAction): string {
  if (action.startsWith('user_')) return 'bg-blue-900/40 text-blue-300';
  if (action.startsWith('member_')) return 'bg-purple-900/40 text-purple-300';
  if (action.startsWith('board_') || action.startsWith('card_'))
    return 'bg-slate-700 text-slate-300';
  if (action.startsWith('integration_') || action.startsWith('repo_'))
    return 'bg-emerald-900/40 text-emerald-300';
  if (action === 'webhook_secret_rotated') return 'bg-amber-900/40 text-amber-300';
  return 'bg-slate-700 text-slate-400';
}

// ── Relative time helper ──────────────────────────────────────────────────────

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AuditLogTab({ workspaceId }: Props) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const loadPage = useCallback(
    async (cursor?: string | null, append = false) => {
      append ? setLoadingMore(true) : setLoading(true);
      try {
        const page = await getAuditLog(workspaceId, cursor);
        setEntries((prev) => (append ? [...prev, ...page.entries] : page.entries));
        setNextCursor(page.nextCursor);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit log.');
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [workspaceId],
  );

  useEffect(() => { loadPage(); }, [loadPage]);

  return (
    <div className="space-y-3">
      {loading && (
        <p className="text-sm text-slate-500 py-4">Loading audit log…</p>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {!loading && entries.length === 0 && (
        <p className="text-sm text-slate-600 py-4">
          No audit events yet. Actions like inviting members, connecting integrations,
          and moving cards will appear here.
        </p>
      )}

      <div className="space-y-1">
        {entries.map((entry) => (
          <AuditRow key={entry.id} entry={entry} />
        ))}
      </div>

      {nextCursor && (
        <button
          onClick={() => loadPage(nextCursor, true)}
          disabled={loadingMore}
          className="w-full rounded-md border border-slate-800 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50 transition-colors"
        >
          {loadingMore ? 'Loading…' : 'Load older entries'}
        </button>
      )}
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  const initials = entry.actorName
    ? entry.actorName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const avatarSrc = entry.actorName
    ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(entry.actorName)}`
    : undefined;

  return (
    <div className="flex items-start gap-3 rounded-md px-2 py-2.5 hover:bg-slate-800/50 transition-colors">
      {/* Actor avatar */}
      <div className="flex-shrink-0">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={entry.actorName ?? 'System'}
            className="h-7 w-7 rounded-full bg-slate-700"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-400">
            {initials}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Actor */}
          <span className="text-sm font-medium text-slate-200">
            {entry.actorName ?? 'System'}
          </span>

          {/* Action badge */}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle(entry.action as AuditAction)}`}>
            {ACTION_LABELS[entry.action as AuditAction] ?? entry.action}
          </span>

          {/* Target */}
          {entry.targetLabel && (
            <span className="text-sm text-slate-400 truncate">
              {entry.targetType && (
                <span className="text-slate-600">{entry.targetType} · </span>
              )}
              {entry.targetLabel}
            </span>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-xs text-slate-600">{relTime(entry.createdAt)}</p>
      </div>
    </div>
  );
}
