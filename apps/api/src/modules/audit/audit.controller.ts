import { Controller, Get, Query } from '@nestjs/common';
import {
  AUDIT_ACTION_LABELS,
  PERMISSIONS,
  listAuditLogsQuerySchema,
  type ListAuditLogsQuery,
} from '@skoolledger/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { RequestUser } from '../../common/types/request-user';
import { AuditService } from './audit.service';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(listAuditLogsQuerySchema)) query: ListAuditLogsQuery,
  ) {
    const includeUnscoped = user.permissions.includes(PERMISSIONS.SYSTEM_MANAGE);
    return this.audit.list(user.schoolId, query, includeUnscoped);
  }

  /** Human-readable labels for the action filter. */
  @Get('actions')
  @RequirePermissions(PERMISSIONS.AUDIT_READ)
  actions() {
    return Object.entries(AUDIT_ACTION_LABELS).map(([code, label]) => ({ code, label }));
  }
}
