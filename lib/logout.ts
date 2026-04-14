/**
 * Standard logout utility — clears all client-side state on every logout.
 *
 * Standard practices applied:
 *  1. Call server logout API (invalidates session in DB + clears server cookies)
 *  2. Clear localStorage (all user/app data)
 *  3. Clear sessionStorage (OTP state, temp flow data)
 *  4. Expire all auth cookies client-side (belt-and-suspenders over server clear)
 */
export async function performLogout(): Promise<void> {
  // 1. Server-side: invalidate session + clear server-set cookies
  try {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  } catch {
    // Non-fatal — proceed with client cleanup even if server call fails
  }

  // 2. Clear all localStorage
  localStorage.clear();

  // 3. Clear all sessionStorage
  sessionStorage.clear();

  // 4. Expire all auth cookies (client-side, belt-and-suspenders)
  const cookiesToClear = ['session', 'userEmail', 'admin_session'];
  for (const name of cookiesToClear) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; SameSite=None`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}
