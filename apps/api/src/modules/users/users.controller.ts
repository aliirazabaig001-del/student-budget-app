import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import {
  PERMISSIONS,
  createUserSchema,
  listUsersQuerySchema,
  resetUserPasswordSchema,
  setUserRolesSchema,
  updateUserSchema,
  type CreateUserInput,
  type ListUsersQuery,
  type ResetUserPasswordInput,
  type SetUserRolesInput,
  type UpdateUserInput,
} from '@skoolledger/shared';
import { Actor, CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { UuidParam } from '../../common/pipes/parse-uuid.pipe';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { ActorContext, RequestUser } from '../../common/types/request-user';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_READ)
  list(
    @CurrentUser() user: RequestUser,
    @Query(new ZodValidationPipe(listUsersQuerySchema)) query: ListUsersQuery,
  ) {
    return this.users.list(user.schoolId, query);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USERS_READ)
  get(@CurrentUser() user: RequestUser, @Param('id', UuidParam) id: string) {
    return this.users.get(user.schoolId, id);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.USERS_CREATE, PERMISSIONS.ROLES_ASSIGN)
  create(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput,
    @Actor() actor: ActorContext,
  ) {
    return this.users.create(body, actor);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.USERS_UPDATE)
  update(
    @Param('id', UuidParam) id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserInput,
    @Actor() actor: ActorContext,
  ) {
    return this.users.update(id, body, actor);
  }

  @Put(':id/roles')
  @RequirePermissions(PERMISSIONS.ROLES_ASSIGN)
  setRoles(
    @Param('id', UuidParam) id: string,
    @Body(new ZodValidationPipe(setUserRolesSchema)) body: SetUserRolesInput,
    @Actor() actor: ActorContext,
  ) {
    return this.users.setRoles(id, body.roleKeys, actor);
  }

  @Post(':id/reset-password')
  @RequirePermissions(PERMISSIONS.USERS_RESET_PASSWORD)
  resetPassword(
    @Param('id', UuidParam) id: string,
    @Body(new ZodValidationPipe(resetUserPasswordSchema)) body: ResetUserPasswordInput,
    @Actor() actor: ActorContext,
  ) {
    return this.users.resetPassword(id, body, actor);
  }
}
