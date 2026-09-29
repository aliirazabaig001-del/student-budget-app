import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CREDENTIAL_ROUTE_KEY } from './common/decorators/credential-throttle.decorator';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AppConfigService } from './config/app-config.service';
import { AppConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HealthController } from './modules/health/health.controller';
import { PermissionsGuard } from './modules/permissions/permissions.guard';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UsersModule } from './modules/users/users.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    AppConfigModule,
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        throttlers: [
          { name: 'default', ttl: 60_000, limit: config.get('RATE_LIMIT_PER_MINUTE') },
          {
            name: 'credentials',
            ttl: 60_000,
            limit: config.get('LOGIN_RATE_LIMIT_PER_MINUTE'),
            skipIf: (context) => !Reflect.getMetadata(CREDENTIAL_ROUTE_KEY, context.getHandler()),
          },
        ],
        errorMessage: 'Too many requests. Please wait a moment and try again.',
      }),
    }),
    PrismaModule,
    StorageModule,
    AuditModule,
    AuthModule,
    PermissionsModule,
    RolesModule,
    SchoolsModule,
    UsersModule,
    SettingsModule,
    // Future modules (Students, Fees, Payroll, ...) are registered here.
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Global guards run in this order: rate limit → authenticate → authorise.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useExisting: PermissionsGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
