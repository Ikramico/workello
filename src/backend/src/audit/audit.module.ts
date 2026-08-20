/**
 * src/audit/audit.module.ts — NEW (Epic 9)
 * src/audit/audit.controller.ts — NEW (Epic 9)
 *
 * Two files in one for brevity — split them if your project convention
 * requires one file per class.
 *
 * Route:
 *   GET /workspaces/:id/audit-log?cursor=<ISO>
 *     → admin-only, paginated audit log for a workspace
 *     → returns { entries: AuditLogEntry[], nextCursor: string | null }
 */

// ── Controller ────────────────────────────────────────────────────────────

import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('workspaces/:id/audit-log')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(
    private readonly audit: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async list(
    @Param('id') workspaceId: string,
    @Query('cursor') cursor: string | undefined,
    @Req() req: Request,
  ) {
    const userId = (req.user as { sub: string }).sub;

    const membership = await this.prisma.workspaceMember.findFirst({
      where: { workspaceId, userId, role: 'admin' },
    });
    if (!membership) {
      throw new ForbiddenException('Admin access required to view the audit log.');
    }

    return this.audit.list(workspaceId, cursor);
  }
}

// ── Module ────────────────────────────────────────────────────────────────

@Module({
  providers: [AuditService],
  controllers: [AuditController],
  exports: [AuditService], // exported so any service can inject and call log()
})
export class AuditModule {}
