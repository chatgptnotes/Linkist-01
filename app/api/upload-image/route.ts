import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'profiles'
    const fixedFilename = formData.get('filename') as string | null
    const bucket = formData.get('bucket') as string || 'profile-photos'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = fixedFilename
      ? fixedFilename
      : `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    console.log(`[upload-image] bucket: ${bucket}, fileName: ${fileName}, fixedFilename: ${fixedFilename}`)

    // Step 1: Delete old file first (ignore errors — might not exist on first upload)
    if (fixedFilename) {
      const { error: removeError } = await supabase.storage
        .from(bucket)
        .remove([fixedFilename])
      if (removeError) {
        console.warn(`[upload-image] remove() failed (continuing with upsert): ${removeError.message}`)
      } else {
        console.log(`[upload-image] remove() succeeded for: ${fixedFilename}`)
      }
    }

    // Step 2: Upload — upsert:true as backup in case remove() failed
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '0',
        upsert: !!fixedFilename
      })

    if (error || !data?.path) {
      console.error(`[upload-image] upload() failed: ${error?.message}`)
      return NextResponse.json({
        error: 'Failed to upload image',
        details: error?.message
      }, { status: 500 })
    }

    console.log(`[upload-image] upload() succeeded: ${data.path}`)

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path
    })
  } catch (error) {
    console.error('[upload-image] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
