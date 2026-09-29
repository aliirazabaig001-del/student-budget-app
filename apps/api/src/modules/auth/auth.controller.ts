import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  changePasswordSchema,
  loginSchema,
  type AuthUser,
  type ChangePasswordInput,
  type LoginInput,
  type LoginResponse,
} from '@skoolledger/shared';
import type { Request, Response } from 'express';
import { AllowPendingPasswordChange } from '../../common/decorators/allow-pending-password-change.decorator';
import { CredentialThrottle } from '../../common/decorators/credential-throttle.decorator';
import { Actor, CurrentUser, ReqContext } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { ActorContext, RequestContext, RequestUser } from '../../common/types/request-user';
import { AppConfigService } from '../../config/app-config.service';
import { REFRESH_COOKIE, clearRefreshCookie, refreshCookieOptions } from './auth-cookie';
import { AuthService, type AuthResult } from './auth.service';
import { ClientHeaderGuard } from './guards/client-header.guard';
import { toAuthUser } from './principal.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: AppConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @CredentialThrottle()
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @ReqContext() context: RequestContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    return this.respond(await this.auth.login(body, context), response);
  }

  @Public()
  @UseGuards(ClientHeaderGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @ReqContext() context: RequestContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResponse> {
    try {
      return this.respond(await this.auth.refresh(readRefreshCookie(request), context), response);
    } catch (error) {
      clearRefreshCookie(response, this.config.get('COOKIE_SECURE'));
      throw error;
    }
  }

  @Public()
  @UseGuards(ClientHeaderGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @ReqContext() context: RequestContext,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.logout(readRefreshCookie(request), context);
    clearRefreshCookie(response, this.config.get('COOKIE_SECURE'));
  }

  @AllowPendingPasswordChange()
  @Get('me')
  me(@CurrentUser() user: RequestUser): AuthUser {
    return toAuthUser(user);
  }

  @AllowPendingPasswordChange()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @CredentialThrottle()
  changePassword(
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordInput,
    @Actor() actor: ActorContext,
  ): Promise<LoginResponse> {
    return this.auth.changePassword(body, actor);
  }

  private respond(result: AuthResult, response: Response): LoginResponse {
    if (result.refreshToken) {
      response.cookie(
        REFRESH_COOKIE,
        result.refreshToken,
        refreshCookieOptions(this.config.get('COOKIE_SECURE'), this.config.refreshTokenTtlMs),
      );
    }
    return result.response;
  }
}

function readRefreshCookie(request: Request): string | undefined {
  const value: unknown = request.cookies?.[REFRESH_COOKIE];
  return typeof value === 'string' && value.length > 0 && value.length <= 200 ? value : undefined;
}
