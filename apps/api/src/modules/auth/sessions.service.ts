import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService, type PrismaTx } from '../../database/prisma.service';
import type { RequestContext } from '../../common/types/request-user';
import { TokenService } from './token.service';

/**
 * When two browser tabs refresh at the same moment, the second one presents a
 * token that the first has just rotated. Within this window that is treated as
 * a benign race rather than token theft.
 */
export const ROTATION_GRACE_MS = 30_000;

export type RevokeReason =
  | 'rotated'
  | 'logout'
  | 'password_changed'
  | 'password_reset'
  | 'user_deactivated'
  | 'reuse_detected';

export type RotateResult =
  | { kind: 'rotated'; userId: string; familyId: string; refreshToken: string }
  /** Benign concurrent refresh: issue an access token, keep the browser's newer cookie. */
  | { kind: 'grace'; userId: string; familyId: string }
  | { kind: 'reuse'; userId: string; familyId: string }
  | { kind: 'invalid' };

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly config: AppConfigService,
  ) {}

  async create(
    userId: string,
    context: RequestContext,
    familyId: string = randomUUID(),
    tx?: PrismaTx,
  ): Promise<{ refreshToken: string; sessionId: string; familyId: string }> {
    const refreshToken = this.tokens.generateRefreshToken();
    const session = await (tx ?? this.prisma).session.create({
      data: {
        userId,
        familyId,
        tokenHash: this.tokens.hashRefreshToken(refreshToken),
        expiresAt: new Date(Date.now() + this.config.refreshTokenTtlMs),
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });
    return { refreshToken, sessionId: session.id, familyId };
  }

  async rotate(refreshToken: string, context: RequestContext): Promise<RotateResult> {
    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    const session = await this.prisma.session.findUnique({ where: { tokenHash } });
    if (!session) return { kind: 'invalid' };

    const { userId, familyId } = session;
    const now = Date.now();

    if (session.revokedAt) {
      if (session.revokeReason !== 'rotated') return { kind: 'invalid' };
      const withinGrace = now - session.revokedAt.getTime() < ROTATION_GRACE_MS;
      if (withinGrace && (await this.isFamilyActive(familyId, userId))) {
        return { kind: 'grace', userId, familyId };
      }
      await this.revokeFamily(familyId, 'reuse_detected');
      return { kind: 'reuse', userId, familyId };
    }

    if (session.expiresAt.getTime() <= now) return { kind: 'invalid' };

    return this.prisma.$transaction(async (tx) => {
      // Conditional update: if a concurrent request already rotated this
      // token, `count` is 0 and we fall back to the grace path.
      const claimed = await tx.session.updateMany({
        where: { id: session.id, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: 'rotated' },
      });
      if (claimed.count === 0) return { kind: 'grace', userId, familyId } as const;

      const next = await this.create(userId, context, familyId, tx);
      await tx.session.update({
        where: { id: session.id },
        data: { replacedById: next.sessionId },
      });
      return { kind: 'rotated', userId, familyId, refreshToken: next.refreshToken } as const;
    });
  }

  async isFamilyActive(familyId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.session.count({
      where: { familyId, userId, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    return count > 0;
  }

  /** Returns the family of a refresh token, if the token is known. */
  async findFamilyByToken(
    refreshToken: string,
  ): Promise<{ familyId: string; userId: string } | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: this.tokens.hashRefreshToken(refreshToken) },
      select: { familyId: true, userId: true },
    });
    return session;
  }

  async revokeFamily(familyId: string, reason: RevokeReason, tx?: PrismaTx): Promise<void> {
    await (tx ?? this.prisma).session.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
  }

  /** Ends every session of a user, optionally keeping the current one. */
  async revokeAllForUser(
    userId: string,
    reason: RevokeReason,
    exceptFamilyId?: string,
    tx?: PrismaTx,
  ): Promise<void> {
    await (tx ?? this.prisma).session.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptFamilyId ? { familyId: { not: exceptFamilyId } } : {}),
      },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
  }
}
