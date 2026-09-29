import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(schoolId: string) {
    const school = await this.prisma.school.findFirst({
      where: { id: schoolId, deletedAt: null },
      select: { id: true, name: true, createdAt: true },
    });
    if (!school) throw new NotFoundException('School not found');
    return school;
  }

  /**
   * The installation's primary school (the first one created). Used for
   * pre-login branding. Multi-school installations will select the school
   * by host name or a campus picker in a later milestone.
   */
  getPrimarySchool() {
    return this.prisma.school.findFirst({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: { settings: true },
    });
  }
}
