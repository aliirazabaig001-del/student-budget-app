import { Controller, Get } from '@nestjs/common';
import { PERMISSIONS } from '@skoolledger/shared';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissions: PermissionsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  list() {
    return this.permissions.list();
  }
}
