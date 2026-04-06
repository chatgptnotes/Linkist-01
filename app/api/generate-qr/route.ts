import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { getCurrentUser } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  try {
    // Require authenticated user
    const session = await getCurrentUser(request);
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { cardData } = await request.json();

    if (!cardData) {
      return NextResponse.json({ error: 'Card data is required' }, { status: 400 });
    }

    // Create a URL that will display the card data when scanned
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://linkist-nfc-bleakafne-chatgptnotes-6366s-projects.vercel.app';
    const qrDataUrl = `${baseUrl}/scan/${encodeURIComponent(JSON.stringify(cardData))}`;
    
    console.log('🔍 Generating QR code with URL:', qrDataUrl);

    // Generate QR code with high error correction for center logo overlay
    console.log('🎨 Generating QR code with options...');
    const qrCodeDataUrl = await QRCode.toDataURL(qrDataUrl, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('✅ QR code generated successfully, length:', qrCodeDataUrl.length);

    return NextResponse.json({ 
      qrCodeDataUrl,
      qrDataUrl 
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
