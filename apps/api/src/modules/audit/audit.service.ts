import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuditAction, AuditLogDto, ListAuditLogsQuery, Paginated } from '@skoolledger/shared';
import { PrismaService, type PrismaTx } from '../../database/prisma.service';
import type { RequestContext } from '../../common/types/request-user';
import { redact } from './audit-values';

export interface AuditEntry {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  schoolId?: string | null;
  actorId?: string | null;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  context?: RequestContext | null;
}

const toJson = (value: Record<string, unknown> | null | undefined) =>
  value ? (redact(value) as Prisma.InputJsonValue) : Prisma.DbNull;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Appends an audit record. Pass the transaction client when the audited
   * change happens inside a transaction so both commit (or fail) together.
   */
  async record(entry: AuditEntry, tx?: PrismaTx): Promise<void> {
    const client = tx ?? this.prisma;
    const metadata = {
      ...(entry.metadata ?? {}),
      ...(entry.context?.requestId ? { requestId: entry.context.requestId } : {}),
    };
    await client.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        schoolId: entry.schoolId ?? null,
        actorId: entry.actorId ?? null,
        previousValues: toJson(entry.previousValues),
        newValues: toJson(entry.newValues),
        metadata: toJson(Object.keys(metadata).length > 0 ? metadata : null),
        ipAddress: entry.context?.ipAddress ?? null,
        userAgent: entry.context?.userAgent ?? null,
      },
    });
  }

  /**
   * Lists audit records for a school. Installation-level events that are not
   * tied to any school (e.g. a failed sign-in for an unknown username) are only
   * included when `includeUnscoped` is true (Super Admin).
   */
  async list(
    schoolId: string,
    query: ListAuditLogsQuery,
    includeUnscoped: boolean,
  ): Promise<Paginated<AuditLogDto>> {
    const where: Prisma.AuditLogWhereInput = {
      OR: includeUnscoped ? [{ schoolId }, { schoolId: null }] : [{ schoolId }],
      ...(query.action ? { action: query.action } : {}),
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from && { gte: query.from }),
              ...(query.to && { lte: query.to }),
            },
          }
        : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: { actor: { select: { id: true, fullName: true, username: true } } },
      }),
    ]);

    return {
      total,
      page: query.page,
      pageSize: query.pageSize,
      items: rows.map((row) => ({
        id: row.id,
        action: row.action,
        entity: row.entity,
        entityId: row.entityId,
        actor: row.actor,
        previousValues: row.previousValues as Record<string, unknown> | null,
        newValues: row.newValues as Record<string, unknown> | null,
        metadata: row.metadata as Record<string, unknown> | null,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }
}
