/**
 * screens/admin/AdminDashboard.tsx — REPLACES Epic 8 version (Epic 9)
 *
 * Change: adds a tab bar at the top — "Overview" (everything from Epic 8)
 * and "Audit log" (new AuditLogTab component).
 *
 * No other logic changes — all data fetching, stat cards, and section
 * components are unchanged from Epic 8.
 */

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useWorkspace } from '../../data/contexts/workspaceContext';
import { useAuth } from '../../data/contexts/authContexts';
import {
  getDashboard,
  type DashboardData,
  type DashboardRepo,
  type DashboardFailure,
  type DashboardNotification,
} from '../../lib/dashboardApi';
import AuditLogTab from './AuditLogTab';

const REFRESH_MS = 60_000;

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-900/30 text-red-400 border-red-800/50',
  warning: 'bg-amber-900/30 text-amber-400 border-amber-800/50',
  info: 'bg-blue-900/30 text-blue-400 border-blue-800/50',
};

const CHECK_STATE_STYLE: Record<string, { dot: string; label: string }> = {
  success: { dot: 'bg-emerald-500', label: 'Passing' },
  failure: { dot: 'bg-red-500', label: 'Failing' },
  in_progress: { dot: 'bg-amber-400 animate-pulse', label: 'Running' },
  queued: { dot: 'bg-slate-500', label: 'Queued' },
  cancelled: { dot: 'bg-slate-600', label: 'Cancelled' },
};

type Tab = 'overview' | 'audit';

export default function AdminDashboard() {
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      setData(await getDashboard(activeWorkspace.id));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    load();
    const interval = setInterval(load, REFRESH_MS);
    return () => clearInterval(interval);
  }, [load]);

  if (user?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1117]">
        <p className="text-slate-500 text-sm">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Admin dashboard</h1>
            {data && <p className="text-sm text-slate-500">{data.workspace.name}</p>}
          </div>
          <button
            onClick={() => navigate('/team')}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Manage team →
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-slate-800 pb-px">
          {(['overview', 'audit'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab === 'audit' ? 'Audit log' : 'Overview'}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <>
            {loading && <p className="text-sm text-slate-500">Loading…</p>}
            {error && <p className="text-sm text-red-400">{error}</p>}

            {data && (
              <>
                {/* Stats strip */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Members" value={data.members.length} />
                  <StatCard label="Linked repos" value={data.linkedRepos.length} />
                  <StatCard
                    label="Open failures"
                    value={data.recentFailures.length}
                    highlight={data.recentFailures.length > 0}
                  />
                  <StatCard
                    label="Unread alerts"
                    value={data.recentNotifications.filter((n) => !n.read).length}
                    highlight={data.recentNotifications.some((n) => !n.read)}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Section title="Recent CI/deployment failures">
                    {data.recentFailures.length === 0 ? (
                      <EmptyState text="No failures — all green ✅" />
                    ) : (
                      data.recentFailures.map((f) => <FailureRow key={f.id} failure={f} />)
                    )}
                  </Section>

                  <Section title="Linked repositories">
                    {data.linkedRepos.length === 0 ? (
                      <EmptyState text="No repos linked yet. Connect them in Integrations." />
                    ) : (
                      data.linkedRepos.map((r) => <RepoRow key={r.id} repo={r} />)
                    )}
                  </Section>

                  <Section title="Recent notifications">
                    {data.recentNotifications.length === 0 ? (
                      <EmptyState text="No notifications yet." />
                    ) : (
                      data.recentNotifications.map((n) => <NotifRow key={n.id} notif={n} />)
                    )}
                  </Section>

                  <Section title="Team members">
                    {data.members.map((m) => (
                      <div key={m.userId} className="flex items-center gap-3 py-2">
                        <img
                          src={
                            m.image ??
                            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`
                          }
                          alt={m.name}
                          className="h-7 w-7 rounded-full bg-slate-700 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 truncate">{m.name}</p>
                          <p className="text-xs text-slate-500 truncate">{m.email}</p>
                        </div>
                        <span className="text-xs capitalize text-slate-500">{m.role}</span>
                      </div>
                    ))}
                  </Section>
                </div>
              </>
            )}
          </>
        )}

        {/* Audit log tab */}
        {activeTab === 'audit' && activeWorkspace && (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
            <AuditLogTab workspaceId={activeWorkspace.id} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components (unchanged from Epic 8) ────────────────────────────────────

function StatCard({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${highlight ? 'border-red-800/50 bg-red-900/10' : 'border-slate-800 bg-slate-900'}`}>
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-medium text-slate-300">{title}</h2>
      </div>
      <div className="divide-y divide-slate-800 px-4">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-4 text-sm text-slate-600">{text}</p>;
}

function FailureRow({ failure }: { failure: DashboardFailure }) {
  return (
    <div className="py-3 space-y-0.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-200 truncate">{failure.checkName}</p>
        <span className="text-xs text-slate-500 flex-shrink-0">
          {new Date(failure.updatedAt).toLocaleDateString()}
        </span>
      </div>
      <p className="text-xs text-slate-500 truncate">
        {failure.repoFullName} · {failure.boardName} · {failure.sha.slice(0, 7)}
      </p>
      {failure.url && (
        <a href={failure.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline">
          View run →
        </a>
      )}
    </div>
  );
}

function RepoRow({ repo }: { repo: DashboardRepo }) {
  const check = repo.latestCheck;
  const state = check ? (CHECK_STATE_STYLE[check.state] ?? CHECK_STATE_STYLE.queued) : null;
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${state ? state.dot : 'bg-slate-700'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{repo.fullName}</p>
        <p className="text-xs text-slate-500">{repo.boardName}</p>
      </div>
      {state && <span className="text-xs text-slate-500 flex-shrink-0">{state.label}</span>}
    </div>
  );
}

function NotifRow({ notif }: { notif: DashboardNotification }) {
  const style = SEVERITY_STYLE[notif.severity] ?? SEVERITY_STYLE.info;
  return (
    <div className={`my-2 rounded-md border px-3 py-2 ${style} ${notif.read ? 'opacity-50' : ''}`}>
      <p className="text-sm font-medium">{notif.title}</p>
      <p className="text-xs mt-0.5 opacity-80">{notif.body}</p>
      <p className="text-xs mt-1 opacity-60">{new Date(notif.createdAt).toLocaleString()}</p>
    </div>
  );
}
