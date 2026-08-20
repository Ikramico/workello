/**
 * src/webhooks/webhooks.service.ts — REPLACES Epic 4 version (Epic 9)
 *
 * Three additions:
 *
 * 1. Per-repo webhook secrets
 *    verifyGithubSignature() and verifyGitlabToken() now accept a LinkedRepo
 *    and check `repo.webhookSecret` (decrypted at call time) before falling
 *    back to the global env-var secret. This means each repo can have its
 *    own HMAC key, preventing a compromised repo from spoofing events for
 *    other repos on the same server.
 *
 *    rotateSecret(linkedRepoId, actorId) generates a new random secret,
 *    encrypts it, saves it, and logs the action to the audit log. Returns
 *    the raw secret once (caller shows it to the admin; it's never stored
 *    in plaintext after this point).
 *
 * 2. GitLab Job Hook handling
 *    `processGitlabEvent()` gains an `else if (eventType === 'Job Hook')`
 *    branch. GitLab fires Job Hooks per individual job inside a pipeline,
 *    giving per-job granularity vs. the Pipeline Hook's overall result.
 *    Each job is upserted as a DeliveryCheck with externalId `job:<id>`.
 *
 * 3. Audit log calls
 *    webhook_secret_rotated is logged via AuditService.log().
 *    All other webhook actions are system-generated (no actor) and are
 *    already captured as WebhookEvent rows — no redundant audit entries.
 *
 * Every existing method signature is unchanged — all callers continue to work.
 */

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CardLinksService } from '../card-links/card-links.service';
import { DeliveryService } from '../delivery/delivery.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { GitProvider, GitRefState, GitRefType, DeliveryState } from '@prisma/client';

// ── Encryption helpers (reuse EncryptionService pattern from Epic 3) ──────────
// If your project has a dedicated EncryptionService, import and inject it
// instead of these helpers. These are self-contained for portability.

function encrypt(plaintext: string): string {
  const key = Buffer.from(process.env['ENCRYPTION_KEY'] ?? '', 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(ciphertext: string): string {
  const [ivHex, encHex] = ciphertext.split(':');
  const key = Buffer.from(process.env['ENCRYPTION_KEY'] ?? '', 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    key,
    Buffer.from(ivHex, 'hex'),
  );
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

// ── Types ────────────────────────────────────────────────────────────────────

type LinkedRepoWithBoard = {
  id: string;
  boardId: string;
  fullName: string;
  integrationId: string;
  webhookSecret: string | null;
  board: { workspaceId: string };
};

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cardLinks: CardLinksService,
    private readonly delivery: DeliveryService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  // ── GitHub ────────────────────────────────────────────────────────────────

  async handleGithub(
    rawBody: Buffer,
    signature: string,
    eventType: string,
  ): Promise<void> {
    const payload = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
    const repoFullName = (payload.repository as { full_name?: string })?.full_name;
    if (!repoFullName) return;

    const linkedRepos = await this.prisma.linkedRepo.findMany({
      where: { fullName: repoFullName },
      include: { integration: true, board: { select: { workspaceId: true } } },
    });
    if (linkedRepos.length === 0) return;

    for (const repo of linkedRepos as unknown as LinkedRepoWithBoard[]) {
      // Per-repo HMAC verification (falls back to global secret if no per-repo secret).
      this.verifyGithubSignature(rawBody, signature, repo);

      await this.prisma.webhookEvent.create({
        data: {
          integrationId: repo.integrationId,
          provider: GitProvider.github,
          eventType,
          payload,
        },
      });

      await this.processGithubEvent(repo, eventType, payload);
    }
  }

  // ── GitLab ────────────────────────────────────────────────────────────────

  async handleGitlab(
    rawBody: Buffer,
    token: string,
    eventType: string,
  ): Promise<void> {
    const payload = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
    const project = payload.project as { path_with_namespace?: string } | undefined;
    const repoFullName = project?.path_with_namespace;
    if (!repoFullName) return;

    const linkedRepos = await this.prisma.linkedRepo.findMany({
      where: { fullName: repoFullName },
      include: { board: { select: { workspaceId: true } } },
    });
    if (linkedRepos.length === 0) return;

    for (const repo of linkedRepos as unknown as LinkedRepoWithBoard[]) {
      this.verifyGitlabToken(token, repo);

      await this.prisma.webhookEvent.create({
        data: {
          integrationId: repo.integrationId,
          provider: GitProvider.gitlab,
          eventType,
          payload,
        },
      });

      await this.processGitlabEvent(repo, eventType, payload);
    }
  }

  // ── Per-repo secret rotation ──────────────────────────────────────────────

  /**
   * Generates a new random HMAC secret for a repo, encrypts and saves it,
   * returns the raw secret (shown once to the admin), and logs the rotation.
   *
   * Called from a new IntegrationsController endpoint:
   *   POST /integrations/repos/:repoId/rotate-secret
   */
  async rotateSecret(linkedRepoId: string, actorId: string): Promise<string> {
    const repo = await this.prisma.linkedRepo.findUnique({
      where: { id: linkedRepoId },
      include: { board: { select: { workspaceId: true } } },
    });
    if (!repo) throw new NotFoundException('Linked repo not found');

    const rawSecret = crypto.randomBytes(32).toString('hex');
    const encrypted = encrypt(rawSecret);

    await this.prisma.linkedRepo.update({
      where: { id: linkedRepoId },
      data: { webhookSecret: encrypted },
    });

    this.audit.log({
      workspaceId: repo.board.workspaceId,
      actorId,
      action: 'webhook_secret_rotated',
      targetType: 'repo',
      targetId: linkedRepoId,
      targetLabel: repo.fullName,
    });

    return rawSecret;
  }

  // ── GitHub event processing (unchanged from Epic 4 except signature call) ──

  private async processGithubEvent(
    repo: LinkedRepoWithBoard,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      if (eventType === 'pull_request') {
        const pr = payload.pull_request as {
          number: number; title: string; state: string;
          draft?: boolean; merged_at?: string | null;
        };
        let state: GitRefState = pr.state === 'open' ? 'open' : 'closed';
        if (pr.draft) state = 'draft';
        else if (pr.merged_at) state = 'merged';
        await this.cardLinks.updateLinkState(
          repo.id, GitRefType.pull_request, pr.number, null, state, pr.title,
        );
      } else if (eventType === 'issues') {
        const issue = payload.issue as { number: number; title: string; state: string };
        const state: GitRefState = issue.state === 'open' ? 'open' : 'closed';
        await this.cardLinks.updateLinkState(
          repo.id, GitRefType.issue, issue.number, null, state, issue.title,
        );
      } else if (eventType === 'push') {
        const commits = (payload.commits as Array<{ id: string; message: string }>) ?? [];
        for (const commit of commits) {
          await this.cardLinks.updateLinkState(
            repo.id, GitRefType.commit, null, commit.id, 'closed',
          );
        }
      } else if (eventType === 'check_run' || eventType === 'workflow_run') {
        await this.handleGithubCheck(repo, eventType, payload);
      } else if (eventType === 'deployment_status') {
        await this.handleGithubDeploymentStatus(repo, payload);
      }
    } catch (err) {
      this.logger.warn(`processGithubEvent error for repo ${repo.id}: ${String(err)}`);
      await this.notifyProcessingError(repo, eventType, err);
    }
  }

  private async handleGithubCheck(
    repo: LinkedRepoWithBoard,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const run = (payload[eventType === 'check_run' ? 'check_run' : 'workflow_run'] ?? {}) as {
      id: number; name: string; status: string; conclusion: string | null;
      html_url: string; head_sha: string;
    };
    if (!run.id) return;

    const state = mapGithubCheckState(run.status, run.conclusion);
    await this.delivery.upsertCheck({
      linkedRepoId: repo.id,
      provider: GitProvider.github,
      externalId: `${eventType}:${run.id}`,
      checkName: run.name,
      sha: run.head_sha,
      state,
      url: run.html_url,
    });

    if (state === DeliveryState.failure) {
      await this.notifications.notifyWorkspaceAdmins(repo.board.workspaceId, {
        type: 'ci_failure',
        severity: 'critical',
        title: `CI failed: ${run.name}`,
        body: `${repo.fullName} — "${run.name}" failed on ${run.head_sha.slice(0, 7)}`,
        boardId: repo.boardId,
        metadata: { url: run.html_url, sha: run.head_sha, repo: repo.fullName },
      });
    }
  }

  private async handleGithubDeploymentStatus(
    repo: LinkedRepoWithBoard,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const deploymentStatus = (payload.deployment_status ?? {}) as {
      id: number; state: string; target_url: string | null; environment?: string;
    };
    const deployment = (payload.deployment ?? {}) as { id: number; sha: string };
    if (!deploymentStatus.id) return;

    const state = mapGithubDeploymentState(deploymentStatus.state);
    await this.delivery.upsertCheck({
      linkedRepoId: repo.id,
      provider: GitProvider.github,
      externalId: `deployment:${deployment.id}`,
      checkName: `deploy${deploymentStatus.environment ? ` / ${deploymentStatus.environment}` : ''}`,
      sha: deployment.sha ?? 'unknown',
      state,
      url: deploymentStatus.target_url ?? undefined,
    });

    if (state === DeliveryState.failure) {
      await this.notifications.notifyWorkspaceAdmins(repo.board.workspaceId, {
        type: 'deployment_failure',
        severity: 'critical',
        title: `Deployment failed${deploymentStatus.environment ? ` (${deploymentStatus.environment})` : ''}`,
        body: `${repo.fullName} — deployment failed${deploymentStatus.environment ? ` in ${deploymentStatus.environment}` : ''}`,
        boardId: repo.boardId,
        metadata: { url: deploymentStatus.target_url, repo: repo.fullName },
      });
    }
  }

  // ── GitLab event processing ───────────────────────────────────────────────

  private async processGitlabEvent(
    repo: LinkedRepoWithBoard,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      if (eventType === 'Merge Request Hook') {
        const mr = payload.object_attributes as {
          iid: number; title: string; state: string; merge_status: string;
        };
        const state: GitRefState =
          mr.state === 'merged' ? 'merged'
          : mr.state === 'opened' ? 'open'
          : 'closed';
        await this.cardLinks.updateLinkState(
          repo.id, GitRefType.pull_request, mr.iid, null, state, mr.title,
        );
      } else if (eventType === 'Issue Hook') {
        const issue = payload.object_attributes as { iid: number; title: string; state: string };
        const state: GitRefState = issue.state === 'opened' ? 'open' : 'closed';
        await this.cardLinks.updateLinkState(
          repo.id, GitRefType.issue, issue.iid, null, state, issue.title,
        );
      } else if (eventType === 'Push Hook') {
        const commits = (payload.commits as Array<{ id: string; message: string }>) ?? [];
        for (const commit of commits) {
          await this.cardLinks.updateLinkState(
            repo.id, GitRefType.commit, null, commit.id, 'closed',
          );
        }
      } else if (eventType === 'Pipeline Hook') {
        await this.handleGitlabPipeline(repo, payload);
      } else if (eventType === 'Job Hook') {
        // ── NEW in Epic 9: per-job granularity ───────────────────────────
        await this.handleGitlabJob(repo, payload);
      } else if (eventType === 'Deployment Hook') {
        await this.handleGitlabDeployment(repo, payload);
      }
    } catch (err) {
      this.logger.warn(`processGitlabEvent error for repo ${repo.id}: ${String(err)}`);
      await this.notifyProcessingError(repo, eventType, err);
    }
  }

  // ── NEW: GitLab Job Hook ──────────────────────────────────────────────────

  /**
   * GitLab fires a Job Hook when an individual job within a pipeline starts,
   * finishes, or fails. This gives per-job visibility vs. the Pipeline Hook's
   * overall pass/fail.
   *
   * Job Hook payload shape (relevant fields):
   *   build_id       number    — unique job id
   *   build_name     string    — job name (e.g. "test", "lint", "deploy-staging")
   *   build_status   string    — "created" | "pending" | "running" | "success" |
   *                             "failed" | "canceled" | "skipped" | "waiting_for_resource"
   *   build_stage    string    — pipeline stage name
   *   sha            string    — commit SHA
   *   project_url    string    — project web URL (for building a direct link)
   *   pipeline_id    number    — owning pipeline id
   */
  private async handleGitlabJob(
    repo: LinkedRepoWithBoard,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const jobId = payload.build_id as number | undefined;
    const jobName = (payload.build_name as string | undefined) ?? 'job';
    const jobStatus = (payload.build_status as string | undefined) ?? '';
    const stage = (payload.build_stage as string | undefined) ?? '';
    const sha = (payload.sha as string | undefined) ?? 'unknown';
    const projectUrl = (payload.project_url as string | undefined) ?? '';

    if (!jobId) return;

    const state = mapGitlabJobState(jobStatus);

    await this.delivery.upsertCheck({
      linkedRepoId: repo.id,
      provider: GitProvider.gitlab,
      externalId: `job:${jobId}`,
      checkName: stage ? `${stage} / ${jobName}` : jobName,
      sha,
      state,
      url: projectUrl ? `${projectUrl}/-/jobs/${jobId}` : undefined,
    });

    // Only alert on failure — "running" and "success" are noise.
    if (state === DeliveryState.failure) {
      await this.notifications.notifyWorkspaceAdmins(repo.board.workspaceId, {
        type: 'ci_failure',
        severity: 'warning', // job-level = warning; pipeline-level = critical
        title: `Job failed: ${jobName}`,
        body: `${repo.fullName} — "${stage ? `${stage} / ` : ''}${jobName}" failed on ${sha.slice(0, 7)}`,
        boardId: repo.boardId,
        metadata: { jobId, sha, repo: repo.fullName, stage },
      });
    }
  }

  // ── Existing GitLab handlers (unchanged from Epic 4) ─────────────────────

  private async handleGitlabPipeline(
    repo: LinkedRepoWithBoard,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const pipeline = (payload.object_attributes ?? {}) as {
      id: number; status: string; sha: string;
    };
    if (!pipeline.id) return;

    const state = mapGitlabPipelineState(pipeline.status);
    const projectUrl = (payload.project as { web_url?: string } | undefined)?.web_url;

    await this.delivery.upsertCheck({
      linkedRepoId: repo.id,
      provider: GitProvider.gitlab,
      externalId: `pipeline:${pipeline.id}`,
      checkName: 'pipeline',
      sha: pipeline.sha,
      state,
      url: projectUrl ? `${projectUrl}/-/pipelines/${pipeline.id}` : undefined,
    });

    if (state === DeliveryState.failure) {
      await this.notifications.notifyWorkspaceAdmins(repo.board.workspaceId, {
        type: 'ci_failure',
        severity: 'critical',
        title: 'Pipeline failed',
        body: `${repo.fullName} — pipeline failed on ${pipeline.sha.slice(0, 7)}`,
        boardId: repo.boardId,
        metadata: { sha: pipeline.sha, repo: repo.fullName },
      });
    }
  }

  private async handleGitlabDeployment(
    repo: LinkedRepoWithBoard,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const status = payload.status as string | undefined;
    const deploymentId = payload.deployment_id as number | undefined;
    const environment = payload.environment as string | undefined;
    const sha = (payload.sha as string | undefined) ?? 'unknown';
    if (!deploymentId || !status) return;

    const state: DeliveryState =
      status === 'success' ? DeliveryState.success
      : status === 'failed' ? DeliveryState.failure
      : status === 'canceled' ? DeliveryState.cancelled
      : DeliveryState.in_progress;

    await this.delivery.upsertCheck({
      linkedRepoId: repo.id,
      provider: GitProvider.gitlab,
      externalId: `deployment:${deploymentId}`,
      checkName: `deploy${environment ? ` / ${environment}` : ''}`,
      sha,
      state,
    });

    if (state === DeliveryState.failure) {
      await this.notifications.notifyWorkspaceAdmins(repo.board.workspaceId, {
        type: 'deployment_failure',
        severity: 'critical',
        title: `Deployment failed${environment ? ` (${environment})` : ''}`,
        body: `${repo.fullName} — deployment failed${environment ? ` in ${environment}` : ''}`,
        boardId: repo.boardId,
        metadata: { repo: repo.fullName },
      });
    }
  }

  // ── Signature verification (now per-repo aware) ───────────────────────────

  /**
   * Checks `repo.webhookSecret` first (decrypted). Falls back to
   * GITHUB_WEBHOOK_SECRET env var if no per-repo secret is set.
   * This is backwards-compatible — existing repos without a per-repo secret
   * continue to use the global env var.
   */
  private verifyGithubSignature(
    rawBody: Buffer,
    signatureHeader: string,
    repo: LinkedRepoWithBoard,
  ): void {
    let secret: string;
    if (repo.webhookSecret) {
      try {
        secret = decrypt(repo.webhookSecret);
      } catch {
        throw new BadRequestException('Webhook secret for this repo is misconfigured.');
      }
    } else {
      secret = process.env['GITHUB_WEBHOOK_SECRET'] ?? '';
      if (!secret) throw new BadRequestException('GITHUB_WEBHOOK_SECRET not configured');
    }

    const expected =
      'sha256=' +
      crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const sigBuffer = Buffer.from(signatureHeader ?? '', 'utf8');
    const expBuffer = Buffer.from(expected, 'utf8');

    if (
      sigBuffer.length !== expBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, expBuffer)
    ) {
      throw new UnauthorizedException('Invalid GitHub webhook signature');
    }
  }

  private verifyGitlabToken(token: string, repo: LinkedRepoWithBoard): void {
    let secret: string;
    if (repo.webhookSecret) {
      try {
        secret = decrypt(repo.webhookSecret);
      } catch {
        throw new BadRequestException('Webhook secret for this repo is misconfigured.');
      }
    } else {
      secret = process.env['GITLAB_WEBHOOK_SECRET'] ?? '';
      if (!secret) throw new BadRequestException('GITLAB_WEBHOOK_SECRET not configured');
    }
    if (token !== secret) {
      throw new UnauthorizedException('Invalid GitLab webhook token');
    }
  }

  private async notifyProcessingError(
    repo: LinkedRepoWithBoard,
    eventType: string,
    err: unknown,
  ): Promise<void> {
    try {
      await this.notifications.notifyWorkspaceAdmins(repo.board.workspaceId, {
        type: 'webhook_error',
        severity: 'warning',
        title: 'Webhook processing error',
        body: `${repo.fullName} — failed to process "${eventType}": ${err instanceof Error ? err.message : String(err)}`,
        boardId: repo.boardId,
        metadata: { repo: repo.fullName, eventType },
      });
    } catch (notifyErr) {
      this.logger.error(`Failed to notify admins of processing error: ${String(notifyErr)}`);
    }
  }
}

// ── Mapping helpers (unchanged from Epic 4) ──────────────────────────────────

export function mapGithubCheckState(status: string, conclusion: string | null): DeliveryState {
  if (status !== 'completed') {
    return status === 'queued' ? DeliveryState.queued : DeliveryState.in_progress;
  }
  switch (conclusion) {
    case 'success': case 'neutral': case 'skipped': case 'stale':
      return DeliveryState.success;
    case 'cancelled':
      return DeliveryState.cancelled;
    default:
      return DeliveryState.failure;
  }
}

export function mapGithubDeploymentState(state: string): DeliveryState {
  switch (state) {
    case 'success': return DeliveryState.success;
    case 'failure': case 'error': return DeliveryState.failure;
    case 'pending': case 'queued': return DeliveryState.queued;
    default: return DeliveryState.in_progress;
  }
}

export function mapGitlabPipelineState(status: string): DeliveryState {
  switch (status) {
    case 'success': return DeliveryState.success;
    case 'failed': return DeliveryState.failure;
    case 'canceled': case 'skipped': return DeliveryState.cancelled;
    case 'pending': return DeliveryState.queued;
    default: return DeliveryState.in_progress;
  }
}

// ── NEW in Epic 9 ──────────────────────────────────────────────────────────────
export function mapGitlabJobState(status: string): DeliveryState {
  switch (status) {
    case 'success': return DeliveryState.success;
    case 'failed': return DeliveryState.failure;
    case 'canceled': case 'skipped': return DeliveryState.cancelled;
    case 'created': case 'pending': case 'waiting_for_resource':
      return DeliveryState.queued;
    default: // running
      return DeliveryState.in_progress;
  }
}
