import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  hasAllPermissions,
  type CreateUserInput,
  type ListUsersQuery,
  type Paginated,
  type ResetUserPasswordInput,
  type UpdateUserInput,
  type UserDto,
} from '@skoolledger/shared';
import { PrismaService, type PrismaTx } from '../../database/prisma.service';
import type { ActorContext } from '../../common/types/request-user';
import { diffValues } from '../audit/audit-values';
import { AuditService } from '../audit/audit.service';
import { PasswordService } from '../auth/password.service';
import { SessionsService } from '../auth/sessions.service';
import {
  collectPermissions,
  roleWithPermissionsInclude,
  RolesService,
} from '../roles/roles.service';

const userInclude = {
  roles: { include: { role: { include: roleWithPermissionsInclude } } },
} as const satisfies Prisma.UserInclude;

type UserWithRoles = Prisma.UserGetPayload<{ include: typeof userInclude }>;

const UPDATABLE_FIELDS = ['fullName', 'email', 'username', 'isActive'] as const;

function toDto(user: UserWithRoles): UserDto {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    roles: user.roles
      .filter((ur) => !ur.role.deletedAt)
      .map((ur) => ({ key: ur.role.key, name: ur.role.name })),
  };
}

/**
 * User administration. All queries are scoped to the actor's school, and two
 * rules prevent privilege escalation:
 *  1. You can only manage users whose permissions are a subset of yours
 *     (a School Admin cannot edit a Super Admin).
 *  2. You can only grant roles whose permissions you already hold.
 * Users also cannot deactivate themselves or change their own roles, which
 * prevents an installation from being locked out of administration.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionsService,
    private readonly roles: RolesService,
    private readonly audit: AuditService,
  ) {}

  async list(schoolId: string, query: ListUsersQuery): Promise<Paginated<UserDto>> {
    const search = query.search?.trim();
    const where: Prisma.UserWhereInput = {
      schoolId,
      deletedAt: null,
      ...(query.status === 'active' ? { isActive: true } : {}),
      ...(query.status === 'inactive' ? { isActive: false } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: userInclude,
        orderBy: [{ fullName: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return { items: users.map(toDto), total, page: query.page, pageSize: query.pageSize };
  }

  async get(schoolId: string, userId: string): Promise<UserDto> {
    return toDto(await this.load(schoolId, userId));
  }

  async create(input: CreateUserInput, actor: ActorContext): Promise<UserDto> {
    const { schoolId, id: actorId } = actor.user;
    const passwordHash = await this.passwords.hash(input.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const roles = await this.roles.resolveAssignableRoles(
        schoolId,
        input.roleKeys,
        actor.user.permissions,
        tx,
      );
      const created = await tx.user.create({
        data: {
          schoolId,
          fullName: input.fullName,
          email: input.email,
          username: input.username,
          passwordHash,
          mustChangePassword: input.mustChangePassword,
          passwordChangedAt: new Date(),
          createdById: actorId,
          roles: { create: roles.map((role) => ({ roleId: role.id, assignedById: actorId })) },
        },
        include: userInclude,
      });
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.USER_CREATED,
          entity: AUDIT_ENTITIES.USER,
          entityId: created.id,
          schoolId,
          actorId,
          newValues: {
            fullName: created.fullName,
            email: created.email,
            username: created.username,
            roles: input.roleKeys,
            mustChangePassword: created.mustChangePassword,
          },
          context: actor,
        },
        tx,
      );
      return created;
    });
    return toDto(user);
  }

  async update(userId: string, input: UpdateUserInput, actor: ActorContext): Promise<UserDto> {
    const { schoolId, id: actorId } = actor.user;
    const before = await this.loadManageable(schoolId, userId, actor);

    if (userId === actorId && input.isActive === false) {
      throw new BadRequestException('You cannot deactivate your own account.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: input,
        include: userInclude,
      });
      if (before.isActive && input.isActive === false) {
        await this.sessions.revokeAllForUser(userId, 'user_deactivated', undefined, tx);
      }
      const changes = diffValues(before, input, UPDATABLE_FIELDS);
      if (changes.newValues) {
        await this.audit.record(
          {
            action: AUDIT_ACTIONS.USER_UPDATED,
            entity: AUDIT_ENTITIES.USER,
            entityId: userId,
            schoolId,
            actorId,
            ...changes,
            context: actor,
          },
          tx,
        );
      }
      return user;
    });
    return toDto(updated);
  }

  async setRoles(userId: string, roleKeys: string[], actor: ActorContext): Promise<UserDto> {
    const { schoolId, id: actorId } = actor.user;
    if (userId === actorId) {
      throw new BadRequestException(
        'You cannot change your own roles. Ask another administrator to do this.',
      );
    }
    const before = await this.loadManageable(schoolId, userId, actor);
    const previousKeys = toDto(before)
      .roles.map((r) => r.key)
      .sort();

    const updated = await this.prisma.$transaction(async (tx) => {
      const roles = await this.roles.resolveAssignableRoles(
        schoolId,
        roleKeys,
        actor.user.permissions,
        tx,
      );
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.createMany({
        data: roles.map((role) => ({ userId, roleId: role.id, assignedById: actorId })),
      });
      const nextKeys = roles.map((r) => r.key).sort();
      if (JSON.stringify(previousKeys) !== JSON.stringify(nextKeys)) {
        await this.audit.record(
          {
            action: AUDIT_ACTIONS.USER_ROLES_CHANGED,
            entity: AUDIT_ENTITIES.USER,
            entityId: userId,
            schoolId,
            actorId,
            previousValues: { roles: previousKeys },
            newValues: { roles: nextKeys },
            context: actor,
          },
          tx,
        );
      }
      return tx.user.findUniqueOrThrow({ where: { id: userId }, include: userInclude });
    });
    return toDto(updated);
  }

  async resetPassword(
    userId: string,
    input: ResetUserPasswordInput,
    actor: ActorContext,
  ): Promise<UserDto> {
    const { schoolId, id: actorId } = actor.user;
    if (userId === actorId) {
      throw new BadRequestException('Use "Change password" to change your own password.');
    }
    await this.loadManageable(schoolId, userId, actor);
    const passwordHash = await this.passwords.hash(input.newPassword);

    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          passwordChangedAt: new Date(),
          mustChangePassword: input.mustChangePassword,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
        include: userInclude,
      });
      await this.sessions.revokeAllForUser(userId, 'password_reset', undefined, tx);
      await this.audit.record(
        {
          action: AUDIT_ACTIONS.USER_PASSWORD_RESET,
          entity: AUDIT_ENTITIES.USER,
          entityId: userId,
          schoolId,
          actorId,
          metadata: { mustChangePassword: input.mustChangePassword, sessionsEnded: true },
          context: actor,
        },
        tx,
      );
      return user;
    });
    return toDto(updated);
  }

  private async load(schoolId: string, userId: string, tx?: PrismaTx): Promise<UserWithRoles> {
    const user = await (tx ?? this.prisma).user.findFirst({
      where: { id: userId, schoolId, deletedAt: null },
      include: userInclude,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Loads a user and checks the actor outranks (or equals) them. */
  private async loadManageable(
    schoolId: string,
    userId: string,
    actor: ActorContext,
  ): Promise<UserWithRoles> {
    const user = await this.load(schoolId, userId);
    const targetPermissions = collectPermissions(user.roles.map((ur) => ur.role));
    if (!hasAllPermissions(actor.user.permissions, targetPermissions)) {
      throw new ForbiddenException(
        'You cannot manage this user because they have permissions you do not have.',
      );
    }
    return user;
  }
}
