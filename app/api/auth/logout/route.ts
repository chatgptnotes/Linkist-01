import { NextRequest, NextResponse } from 'next/server';
import { SessionStore } from '@/lib/session-store';

/**
 * POST /api/auth/logout
 *
 * Logs out the user by deleting their session.
 * This endpoint does NOT require authentication - anyone can logout.
 * This is important for the welcome flow where users may want to reject and logout.
 */
export async function POST(request: NextRequest) {
  try {
    // Get session from cookie (may not exist)
    const sessionId = request.cookies.get('session')?.value;

    if (sessionId) {
      // Delete session from database
      try {
        const deleted = await SessionStore.delete(sessionId);
        if (deleted) {
          console.log('✅ Session deleted from database:', sessionId);
        } else {
          console.warn('⚠️ Session not found in database (may have already been deleted)');
        }
      } catch (dbError) {
        // Don't fail the logout if database deletion fails
        console.error('❌ Failed to delete session from database:', dbError);
      }
    } else {
      console.log('ℹ️ No session cookie found - user may already be logged out');
    }

    // Always clear session cookie and return success
    // This ensures users can always logout, even if session is invalid
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    // Clear session cookie
    response.cookies.delete('session');

    // Also clear userEmail cookie if it exists
    response.cookies.delete('userEmail');

    console.log('✅ Logout completed - all cookies cleared');

    return response;

  } catch (error) {
    // Even if there's an error, we should still clear the cookies
    // and return success to avoid blocking the user
    console.error('⚠️ Error during logout (non-fatal):', error);

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

    response.cookies.delete('session');
    response.cookies.delete('userEmail');

    return response;
  }
}