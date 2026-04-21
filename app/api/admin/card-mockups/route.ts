import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdminRole } from '@/lib/auth-middleware';
import { supabaseAdmin } from '@/lib/supabase/admin-client';

type MockupSide = 'front' | 'back_with_logo' | 'back_without_logo';

const VALID_SIDES: MockupSide[] = ['front', 'back_with_logo', 'back_without_logo'];

// GET - Fetch mockups with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser(request);
    if (!session.isAuthenticated || !isAdminRole(session.user?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const material = searchParams.get('material');
    const colour = searchParams.get('colour');
    const pattern = searchParams.get('pattern');

    let query = supabaseAdmin
      .from('card_mockup_images')
      .select('*')
      .order('base_material')
      .order('colour')
      .order('pattern')
      .order('side');

    if (material) query = query.eq('base_material', material);
    if (colour) query = query.eq('colour', colour);
    if (pattern) query = query.eq('pattern', pattern);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Group by combo key for easier frontend consumption
    const grouped: Record<string, Record<string, { id: string; image_url: string }>> = {};
    for (const row of data || []) {
      const key = `${row.base_material}|${row.colour}|${row.pattern}`;
      if (!grouped[key]) grouped[key] = {};
      grouped[key][row.side] = { id: row.id, image_url: row.image_url };
    }

    return NextResponse.json({ mockups: data, grouped });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST - Upload a mockup image
export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser(request);
    if (!session.isAuthenticated || !isAdminRole(session.user?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const material = formData.get('material') as string | null;
    const colour = formData.get('colour') as string | null;
    const pattern = formData.get('pattern') as string | null;
    const side = formData.get('side') as MockupSide | null;

    if (!file || !material || !colour || !pattern || !side) {
      return NextResponse.json(
        { error: 'Missing required fields: file, material, colour, pattern, side' },
        { status: 400 }
      );
    }

    if (!VALID_SIDES.includes(side)) {
      return NextResponse.json(
        { error: `Invalid side. Must be one of: ${VALID_SIDES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 });
    }

    // Build storage path: card-mockups/{material}/{colour}/{pattern}/{side}.png
    const ext = file.name.split('.').pop() || 'png';
    const storagePath = `${material}/${colour}/${pattern}/${side}.${ext}`;

    // Delete existing file at this path if it exists
    await supabaseAdmin.storage.from('card-mockups').remove([storagePath]);

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from('card-mockups')
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('card-mockups')
      .getPublicUrl(storagePath);

    const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // Upsert into card_mockup_images table (skip uploaded_by to avoid FK issues)
    const { data: mockup, error: dbError } = await supabaseAdmin
      .from('card_mockup_images')
      .upsert(
        {
          base_material: material,
          colour,
          pattern,
          side,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'base_material,colour,pattern,side' }
      )
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: `Database error: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ mockup, image_url: imageUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE - Remove a mockup
export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser(request);
    if (!session.isAuthenticated || !isAdminRole(session.user?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const material = searchParams.get('material');
    const colour = searchParams.get('colour');
    const pattern = searchParams.get('pattern');
    const side = searchParams.get('side');

    if (id) {
      // Delete by ID
      const { data: existing } = await supabaseAdmin
        .from('card_mockup_images')
        .select('*')
        .eq('id', id)
        .single();

      if (existing) {
        const ext = existing.image_url.split('.').pop() || 'png';
        const storagePath = `${existing.base_material}/${existing.colour}/${existing.pattern}/${existing.side}.${ext}`;
        await supabaseAdmin.storage.from('card-mockups').remove([storagePath]);
      }

      const { error } = await supabaseAdmin
        .from('card_mockup_images')
        .delete()
        .eq('id', id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (material && colour && pattern && side) {
      // Delete by combo
      const storagePath = `${material}/${colour}/${pattern}/${side}.png`;
      await supabaseAdmin.storage.from('card-mockups').remove([storagePath]);

      const { error } = await supabaseAdmin
        .from('card_mockup_images')
        .delete()
        .eq('base_material', material)
        .eq('colour', colour)
        .eq('pattern', pattern)
        .eq('side', side);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Provide id or material+colour+pattern+side' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
