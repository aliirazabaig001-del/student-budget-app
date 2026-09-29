import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { ActorContext, AuthenticatedRequest, RequestUser } from '../types/request-user';
import { buildRequestContext } from '../utils/request-context';

/** Injects the authenticated user. Throws if used on a public route without a user. */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.user) throw new UnauthorizedException();
  return request.user satisfies RequestUser;
});

/** Injects the authenticated user together with IP / user agent for auditing. */
export const Actor = createParamDecorator((_: unknown, ctx: ExecutionContext): ActorContext => {
  const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!request.user) throw new UnauthorizedException();
  return { ...buildRequestContext(request), user: request.user };
});

/** Injects IP / user agent / request id. Works on public routes. */
export const ReqContext = createParamDecorator((_: unknown, ctx: ExecutionContext) =>
  buildRequestContext(ctx.switchToHttp().getRequest<AuthenticatedRequest>()),
);
