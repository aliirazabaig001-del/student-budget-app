import { Injectable } from '@nestjs/common';
import type { PermissionDto } from '@skoolledger/shared';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<PermissionDto[]> {
    return this.prisma.permission.findMany({
      select: { code: true, module: true, description: true },
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });
  }
}
