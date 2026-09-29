import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  API_ERROR_CODES,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  type ChangePasswordInput,
  type LoginInput,
  type LoginResponse,
} from '@skoolledger/shared';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../database/prisma.service';
import type { ActorContext, RequestContext } from '../../common/types/request-user';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from './password.service';
import { PrincipalService, toAuthUser } from './principal.service';
import { SessionsService } from './sessions.service';
import { TokenService } from './token.service';

const INVALID_CREDENTIALS = 'Invalid email/username or password.';

export interface AuthResult {
  response: LoginResponse;
  /** New refresh token to set as a cookie; absent when the browser already has the latest one. */
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly sessions: SessionsService,
    private readonly principals: PrincipalService,
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
  ) {}

  async login(input: LoginInput, context: RequestContext): Promise<AuthResult> {
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ email: input.identifier }, { username: input.identifier }],
      },
    });

    if (!user) {
      await this.passwords.verifyDummy(input.password);
      await this.recordFailure(null, null, input.identifier, 'unknown_user', context);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.recordFailure(user.id, user.schoolId, input.identifier, 'locked', context);
      throw new HttpException(
        {
          message:
            'This account is temporarily locked after repeated failed sign-in attempts. Please try again later or ask an administrator.',
          code: API_ERROR_CODES.ACCOUNT_LOCKED,
        },
        HttpStatus.LOCKED,
      );
    }

    const valid = await this.passwords.verify(user.passwordHash, input.password);
    if (!valid) {
      await this.registerFailedAttempt(user.id);
      await this.recordFailure(
        user.id,
        user.schoolId,
        input.identifier,
        'invalid_password',
        context,
      );
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    // Only reveal the inactive state to someone who knows the password.
    if (!user.isActive) {
      await this.recordFailure(user.id, user.schoolId, input.identifier, 'inactive', context);
      throw new UnauthorizedException(
        'This account has been deactivated. Please contact your administrator.',
      );
    }

    const rehash = this.passwords.needsRehash(user.passwordHash)
      ? await this.passwords.hash(input.password)
      : null;

    const session = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          ...(rehash ? { passwordHash: rehash } : {}),
        },
      });
      const created = await this.sessions.create(user.id, context, undefined, tx);
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.AUTH_LOGIN,
          entity: AUDIT_ENTITIES.USER,
          entityId: user.id,
          schoolId: user.schoolId,
          actorId: user.id,
          metadata: { sessionId: created.familyId },
          context,
        },
        tx,
      );
      return created;
    });

    return {
      response: await this.buildResponse(user.id, session.familyId),
      refreshToken: session.refreshToken,
    };
  }

  async refresh(refreshToken: string | undefined, context: RequestContext): Promise<AuthResult> {
    if (!refreshToken) throw new UnauthorizedException('Please sign in.');

    const result = await this.sessions.rotate(refreshToken, context);
    if (result.kind === 'invalid') {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }
    if (result.kind === 'reuse') {
      const user = await this.prisma.user.findUnique({
        where: { id: result.userId },
        select: { schoolId: true },
      });
      await this.audit.record({
        action: AUDIT_ACTIONS.AUTH_REFRESH_REUSE_DETECTED,
        entity: AUDIT_ENTITIES.SESSION,
        entityId: result.familyId,
        schoolId: user?.schoolId ?? null,
        actorId: result.userId,
        metadata: { note: 'A previously used refresh token was presented; the session was ended.' },
        context,
      });
      throw new UnauthorizedException('Your session has ended. Please sign in again.');
    }

    return {
      response: await this.buildResponse(result.userId, result.familyId),
      refreshToken: result.kind === 'rotated' ? result.refreshToken : undefined,
    };
  }

  async logout(refreshToken: string | undefined, context: RequestContext): Promise<void> {
    if (!refreshToken) return;
    const session = await this.sessions.findFamilyByToken(refreshToken);
    if (!session) return;

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
      select: { schoolId: true },
    });
    await this.prisma.$transaction(async (tx) => {
      await this.sessions.revokeFamily(session.familyId, 'logout', tx);
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.AUTH_LOGOUT,
          entity: AUDIT_ENTITIES.USER,
          entityId: session.userId,
          schoolId: user?.schoolId ?? null,
          actorId: session.userId,
          metadata: { sessionId: session.familyId },
          context,
        },
        tx,
      );
    });
  }

  /**
   * Changes the caller's password and ends every *other* session, so a
   * password change also logs out anyone else using the old password.
   */
  async changePassword(input: ChangePasswordInput, actor: ActorContext): Promise<LoginResponse> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: actor.user.id } });

    const valid = await this.passwords.verify(user.passwordHash, input.currentPassword);
    if (!valid) {
      throw new HttpException(
        {
          message: 'Current password is incorrect.',
          fieldErrors: { currentPassword: ['Current password is incorrect'] },
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const passwordHash = await this.passwords.hash(input.newPassword);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordChangedAt: new Date(), mustChangePassword: false },
      });
      await this.sessions.revokeAllForUser(user.id, 'password_changed', actor.user.sessionId, tx);
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.AUTH_PASSWORD_CHANGED,
          entity: AUDIT_ENTITIES.USER,
          entityId: user.id,
          schoolId: user.schoolId,
          actorId: user.id,
          metadata: { otherSessionsEnded: true },
          context: actor,
        },
        tx,
      );
    });

    return this.buildResponse(user.id, actor.user.sessionId);
  }

  private async buildResponse(userId: string, sessionId: string): Promise<LoginResponse> {
    const principal = await this.principals.load(userId, sessionId);
    if (!principal)
      throw new UnauthorizedException('Your session has ended. Please sign in again.');
    const { token, expiresIn } = this.tokens.signAccessToken(userId, sessionId);
    return { accessToken: token, expiresIn, user: toAuthUser(principal) };
  }

  /** Atomically counts a failed attempt and locks the account at the limit. */
  private async registerFailedAttempt(userId: string): Promise<void> {
    const { failedLoginAttempts } = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true },
    });
    if (failedLoginAttempts >= this.config.get('LOGIN_MAX_ATTEMPTS')) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: new Date(Date.now() + this.config.get('LOGIN_LOCK_MINUTES') * 60_000),
        },
      });
    }
  }

  private recordFailure(
    userId: string | null,
    schoolId: string | null,
    identifier: string,
    reason: 'unknown_user' | 'invalid_password' | 'locked' | 'inactive',
    context: RequestContext,
  ): Promise<void> {
    return this.audit.record({
      action: AUDIT_ACTIONS.AUTH_LOGIN_FAILED,
      entity: AUDIT_ENTITIES.USER,
      entityId: userId,
      schoolId,
      // Failed attempts have no authenticated actor.
      actorId: null,
      metadata: { identifier: identifier.slice(0, 100), reason },
      context,
    });
  }
}
