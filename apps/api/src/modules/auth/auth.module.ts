import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClientHeaderGuard } from './guards/client-header.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasswordService } from './password.service';
import { PrincipalService } from './principal.service';
import { SessionsService } from './sessions.service';
import { TokenService } from './token.service';

@Module({
  // Secrets and options are supplied per call by TokenService.
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    SessionsService,
    PrincipalService,
    JwtAuthGuard,
    ClientHeaderGuard,
  ],
  exports: [PasswordService, SessionsService, JwtAuthGuard],
})
export class AuthModule {}
