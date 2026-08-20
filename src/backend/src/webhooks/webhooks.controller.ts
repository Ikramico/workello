/**
 * src/webhooks/webhooks.controller.ts — EXTENDS Epic 3 (Epic 9)
 *
 * Existing routes (unchanged):
 *   POST /webhooks/github   → handleGithub()
 *   POST /webhooks/gitlab   → handleGitlab()
 *
 * New route:
 *   POST /integrations/repos/:repoId/rotate-secret
 *     → admin-only; calls WebhooksService.rotateSecret() which:
 *         1. Generates a new 32-byte random secret
 *         2. Encrypts and stores it in LinkedRepo.webhookSecret
 *         3. Logs webhook_secret_rotated to the audit log
 *         4. Returns the raw secret ONE TIME — the admin must copy it into
 *            GitHub/GitLab's webhook settings immediately
 *
 * The rotate endpoint lives in this controller (not IntegrationsController)
 * because the secret concerns webhook verification, not OAuth token management.
 * If your project already has a WebhookSecretsController, move it there.
 */

import {
  Controller,
  Post,
  Req,
  Param,
  Headers,
  RawBodyRequest,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class WebhooksController {
  constructor(
    private readonly webhooks: WebhooksService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Public webhook ingestion (unchanged from Epic 3) ─────────────────────

  @Post('webhooks/github')
  @HttpCode(HttpStatus.NO_CONTENT)
  async github(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-event') eventType: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) return;
    await this.webhooks.handleGithub(rawBody, signature, eventType);
  }

  @Post('webhooks/gitlab')
  @HttpCode(HttpStatus.NO_CONTENT)
  async gitlab(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-gitlab-token') token: string,
    @Headers('x-gitlab-event') eventType: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) return;
    await this.webhooks.handleGitlab(rawBody, token, eventType);
  }

  // ── Per-repo secret rotation (NEW Epic 9) ─────────────────────────────────

  @Post('integrations/repos/:repoId/rotate-secret')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async rotateSecret(
    @Param('repoId') repoId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as { sub: string }).sub;

    // Verify the caller is an admin of the workspace that owns this repo.
    const repo = await this.prisma.linkedRepo.findUnique({
      where: { id: repoId },
      include: { board: { select: { workspaceId: true } } },
    });

    if (!repo) {
      throw new ForbiddenException('Repository not found or access denied.');
    }

    const membership = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId: repo.board.workspaceId, userId, role: 'admin' },
    });
    if (!membership) {
      throw new ForbiddenException('Only workspace admins can rotate webhook secrets.');
    }

    const rawSecret = await this.webhooks.rotateSecret(repoId, userId);

    return {
      secret: rawSecret,
      message:
        'Copy this secret into your GitHub/GitLab webhook settings now. ' +
        'It will not be shown again.',
    };
  }
}
