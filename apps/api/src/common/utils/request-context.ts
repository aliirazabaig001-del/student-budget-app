import type { AuthenticatedRequest, RequestContext } from '../types/request-user';

export function buildRequestContext(request: AuthenticatedRequest): RequestContext {
  // `request.ip` honours the Express "trust proxy" setting, so behind the
  // bundled Nginx it is the real client address rather than the proxy's.
  const ip = request.ip ?? request.socket?.remoteAddress ?? null;
  const userAgent = request.headers['user-agent'];
  return {
    ipAddress: ip ? normaliseIp(ip).slice(0, 64) : null,
    userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 500) : null,
    requestId: request.requestId ?? null,
  };
}

/** Strips the IPv4-mapped IPv6 prefix (`::ffff:192.168.1.5` → `192.168.1.5`). */
export function normaliseIp(ip: string): string {
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}
