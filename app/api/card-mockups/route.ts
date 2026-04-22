import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/admin-client';

// GET - Public endpoint to fetch card mockups for preview
// Query: ?material=metal&colour=black&pattern=geometric
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const material = searchParams.get('material');
    const colour = searchParams.get('colour');
    const pattern = searchParams.get('pattern');

    if (!material || !colour || !pattern) {
      return NextResponse.json(
        { error: 'Required params: material, colour, pattern' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('card_mockup_images')
      .select('side, image_url')
      .eq('base_material', material)
      .eq('colour', colour)
      .eq('pattern', pattern);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build a map: { front: url, back_with_logo: url, back_without_logo: url }
    const mockups: Record<string, string> = {};
    for (const row of data || []) {
      mockups[row.side] = row.image_url;
    }

    // Return null if no mockups found for this combo
    const hasMockups = Object.keys(mockups).length > 0;

    return NextResponse.json({
      hasMockups,
      mockups: hasMockups ? mockups : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
