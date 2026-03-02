/**
 * Get the correct cookie domain based on the current request host.
 * Only sets COOKIE_DOMAIN when the request is from a matching domain.
 * This prevents cookies from being silently rejected on localhost or non-matching domains.
 */
export function getCookieDomain(requestHost: string): string | undefined {
  const cookieDomain = process.env.COOKIE_DOMAIN;
  if (!cookieDomain) return undefined;

  // Strip port from host (e.g., "localhost:3000" → "localhost")
  const hostWithoutPort = requestHost.split(':')[0];

  // Check if the request host matches the configured cookie domain
  // e.g., COOKIE_DOMAIN=".linkist.ai" should match "linkist.ai" and "www.linkist.ai"
  const domainWithoutDot = cookieDomain.replace(/^\./, '');
  if (hostWithoutPort === domainWithoutDot || hostWithoutPort.endsWith(`.${domainWithoutDot}`)) {
    return cookieDomain;
  }

  return undefined;
}

/**
 * Standard session cookie options for the app.
 */
export function getSessionCookieOptions(requestHost: string) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: '/',
    domain: getCookieDomain(requestHost),
  };
}
