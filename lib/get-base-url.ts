/**
 * Get the base URL for the application
 * Automatically detects environment and returns appropriate base URL
 *
 * Usage:
 * - Browser (client-side): Always uses window.location (works for any domain)
 * - Server-side: Uses NEXT_PUBLIC_SITE_URL from environment variable
 *
 * @returns {string} Base URL without trailing slash
 */
export function getBaseUrl(): string {
  // If in browser, ALWAYS use current window location (works for localhost, Vercel, production, etc.)
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }

  // Only use environment variable when running server-side (SSR/SSG)
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (envUrl) {
    // Remove trailing slash if present
    return envUrl.replace(/\/$/, '');
  }

  // Fallback to linkist.ai if no env variable is set
  console.warn('NEXT_PUBLIC_SITE_URL not set, using fallback: https://linkist.ai');
  return 'https://linkist.ai';
}

/**
 * Get the base domain (without protocol)
 * Useful for display purposes
 *
 * @returns {string} Base domain without protocol (e.g., "linkist.ai" or "localhost:3001")
 */
export function getBaseDomain(): string {
  const baseUrl = getBaseUrl();
  return baseUrl.replace(/^https?:\/\//, '');
}
