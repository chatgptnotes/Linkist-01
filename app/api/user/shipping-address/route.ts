import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-middleware';
import { SupabaseShippingAddressStore, ShippingAddress } from '@/lib/supabase-shipping-address-store';

// Check if an address is a real physical address (not a digital product placeholder)
function isValidPhysicalAddress(address: ShippingAddress): boolean {
  const placeholders = ['n/a', 'na', 'digital', 'none', '-', ''];
  const addr1 = (address.addressLine1 || '').toLowerCase().trim();

  // Skip addresses with placeholder/digital product values
  if (placeholders.some(p => addr1 === p) || addr1.includes('n/a') || addr1.includes('digital product')) {
    return false;
  }

  // Must have a real city
  const city = (address.city || '').toLowerCase().trim();
  if (!city || placeholders.some(p => city === p)) {
    return false;
  }

  return true;
}

export async function GET(request: NextRequest) {
  try {
    const authSession = await getCurrentUser(request);

    if (!authSession.isAuthenticated || !authSession.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = authSession.user.id;

    // Fetch all addresses for the user (sorted by default first, then most recent)
    const addresses = await SupabaseShippingAddressStore.getByUserId(userId);

    // Find the first valid physical address (skip digital product placeholders)
    const address = addresses.find(isValidPhysicalAddress) || null;

    // Also extract phone number from any previous address as fallback
    const fallbackPhone = addresses.find(a => {
      const phone = (a.phoneNumber || '').trim();
      return phone && phone.toLowerCase() !== 'n/a' && phone !== '-';
    })?.phoneNumber || null;

    return NextResponse.json({ address, fallbackPhone });
  } catch (error) {
    console.error('Error fetching shipping address:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping address' },
      { status: 500 }
    );
  }
}
