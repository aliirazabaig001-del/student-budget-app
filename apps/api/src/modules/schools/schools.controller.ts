import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { RequestUser } from '../../common/types/request-user';
import { SchoolsService } from './schools.service';

@Controller('schools')
export class SchoolsController {
  constructor(private readonly schools: SchoolsService) {}

  /** Basic details of the signed-in user's school. */
  @Get('current')
  current(@CurrentUser() user: RequestUser) {
    return this.schools.getById(user.schoolId);
  }
}
