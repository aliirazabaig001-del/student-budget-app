import { Controller, Get } from '@nestjs/common';
import { PERMISSIONS } from '@skoolledger/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { RequestUser } from '../../common/types/request-user';
import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  list(@CurrentUser() user: RequestUser) {
    return this.roles.list(user.schoolId);
  }
}
