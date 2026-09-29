import { Injectable } from '@nestjs/common';
import type { AuthUser } from '@skoolledger/shared';
import { PrismaService } from '../../database/prisma.service';
import type { RequestUser } from '../../common/types/request-user';
import { collectPermissions, roleWithPermissionsInclude } from '../roles/roles.service';
import { SessionsService } from './sessions.service';

/**
 * Builds the authenticated principal for a request.
 *
 * Roles and permissions are read from the database on every request instead of
 * being baked into the JWT, so deactivating a user, changing their roles, or
 * logging them out takes effect immediately rather than when a token expires.
 */
@Injectable()
export class PrincipalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService,
  ) {}

  async load(userId: string, sessionId: string): Promise<RequestUser | null> {
    const [user, sessionActive] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: userId, deletedAt: null, isActive: true, school: { deletedAt: null } },
        include: { roles: { include: { role: { include: roleWithPermissionsInclude } } } },
      }),
      this.sessions.isFamilyActive(sessionId, userId),
    ]);
    if (!user || !sessionActive) return null;

    const roles = user.roles.map((ur) => ur.role).filter((role) => !role.deletedAt);
    return {
      id: user.id,
      schoolId: user.schoolId,
      sessionId,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      mustChangePassword: user.mustChangePassword,
      roles: roles.map((role) => ({ key: role.key, name: role.name })),
      permissions: collectPermissions(roles),
    };
  }
}

export function toAuthUser(user: RequestUser): AuthUser {
  return {
    id: user.id,
    schoolId: user.schoolId,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    mustChangePassword: user.mustChangePassword,
    roles: user.roles,
    permissions: user.permissions,
  };
}
