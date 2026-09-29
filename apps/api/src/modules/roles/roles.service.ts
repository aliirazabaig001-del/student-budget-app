import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { hasAllPermissions, type RoleDto } from '@skoolledger/shared';
import { PrismaService, type PrismaTx } from '../../database/prisma.service';

export const roleWithPermissionsInclude = {
  permissions: { include: { permission: { select: { code: true } } } },
} as const;

interface RoleWithPermissionCodes {
  key: string;
  name: string;
  deletedAt: Date | null;
  permissions: { permission: { code: string } }[];
}

/** Union of permission codes granted by a set of (non-deleted) roles. */
export function collectPermissions(roles: readonly RoleWithPermissionCodes[]): string[] {
  const codes = new Set<string>();
  for (const role of roles) {
    if (role.deletedAt) continue;
    for (const rp of role.permissions) codes.add(rp.permission.code);
  }
  return [...codes].sort();
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Roles visible to a school: the built-in system roles plus its own custom roles. */
  async list(schoolId: string): Promise<RoleDto[]> {
    const roles = await this.prisma.role.findMany({
      where: { deletedAt: null, OR: [{ schoolId: null }, { schoolId }] },
      include: roleWithPermissionsInclude,
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }],
    });
    return roles.map((role) => ({
      id: role.id,
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((rp) => rp.permission.code).sort(),
    }));
  }

  /**
   * Resolves role keys for assignment and enforces the anti-escalation rule:
   * a user can only grant roles whose permissions they already hold themselves.
   */
  async resolveAssignableRoles(
    schoolId: string,
    roleKeys: readonly string[],
    actorPermissions: readonly string[],
    tx?: PrismaTx,
  ) {
    const client = tx ?? this.prisma;
    const roles = await client.role.findMany({
      where: {
        key: { in: [...roleKeys] },
        deletedAt: null,
        OR: [{ schoolId: null }, { schoolId }],
      },
      include: roleWithPermissionsInclude,
    });

    const found = new Set(roles.map((r) => r.key));
    const unknown = roleKeys.filter((key) => !found.has(key));
    if (unknown.length > 0) {
      throw new BadRequestException({
        message: `Unknown role: ${unknown.join(', ')}`,
        fieldErrors: { roleKeys: ['One or more selected roles do not exist'] },
      });
    }

    for (const role of roles) {
      if (!hasAllPermissions(actorPermissions, collectPermissions([role]))) {
        throw new ForbiddenException(
          `You cannot assign the "${role.name}" role because it has permissions you do not have.`,
        );
      }
    }
    return roles;
  }
}
