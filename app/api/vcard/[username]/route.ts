import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function fetchPhotoAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return { base64, mimeType: contentType.split(';')[0] };
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return new Response('Username is required', { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('custom_url', username)
      .maybeSingle();

    if (error || !profile) {
      return new Response('Profile not found', { status: 404 });
    }

    const preferences = profile.preferences || {};
    const socialLinks = profile.social_links || {};

    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    const salutation = profile.salutation || '';
    const fullName = salutation ? `${salutation} ${firstName} ${lastName}` : `${firstName} ${lastName}`;

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${fullName}`,
      `N:${lastName};${firstName};;${salutation};`,
    ];

    if (profile.job_title && preferences.showJobTitle !== false) {
      lines.push(`TITLE:${profile.job_title}`);
    }
    if ((profile.company_name || profile.company) && preferences.showCompanyName !== false) {
      lines.push(`ORG:${profile.company_name || profile.company}`);
    }
    if ((profile.primary_email || profile.email) && preferences.showEmailPublicly !== false) {
      lines.push(`EMAIL;TYPE=INTERNET:${profile.primary_email || profile.email}`);
    }
    if (profile.alternate_email && preferences.showSecondaryEmailPublicly !== false) {
      lines.push(`EMAIL;TYPE=INTERNET:${profile.alternate_email}`);
    }
    if ((profile.mobile_number || profile.phone_number) && preferences.showMobilePublicly !== false) {
      lines.push(`TEL;TYPE=CELL:${profile.mobile_number || profile.phone_number}`);
    }
    // WhatsApp number as a clickable URL that opens WhatsApp to text (not call)
    if (profile.whatsapp_number && preferences.showWhatsappPublicly !== false) {
      const cleanNumber = profile.whatsapp_number.replace(/[^0-9+]/g, '').replace('+', '');
      lines.push(`item1.URL:https://wa.me/${cleanNumber}`);
      lines.push(`item1.X-ABLabel:WHATSAPP`);
    }
    if (profile.company_website && preferences.showCompanyWebsite !== false) {
      lines.push(`URL:${profile.company_website}`);
    }
    if (profile.company_address && preferences.showCompanyAddress !== false) {
      lines.push(`ADR;TYPE=WORK:;;${profile.company_address};;;;`);
    }
    if (profile.custom_url) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://linkist.ai';
      lines.push(`URL:${baseUrl}/${profile.custom_url}`);
    }
    if (profile.professional_summary) {
      lines.push(`NOTE:${profile.professional_summary.replace(/\n/g, '\\n')}`);
    }

    // Profile photo - fetch and embed as base64 for iOS/Android compatibility
    if (profile.profile_photo_url) {
      const photo = await fetchPhotoAsBase64(profile.profile_photo_url);
      if (photo) {
        lines.push(`PHOTO;ENCODING=b;TYPE=${photo.mimeType}:${photo.base64}`);
      } else {
        // Fallback to URI if fetch fails
        lines.push(`PHOTO;VALUE=URI:${profile.profile_photo_url}`);
      }
    }

    // Social media links
    let itemIndex = 2; // Start at 2 since item1 is used for WhatsApp

    if (socialLinks.linkedin && preferences.showLinkedin !== false) {
      lines.push(`item${itemIndex}.URL:${socialLinks.linkedin}`);
      lines.push(`item${itemIndex}.X-ABLabel:LinkedIn`);
      itemIndex++;
    }
    if (socialLinks.instagram && preferences.showInstagram !== false) {
      lines.push(`item${itemIndex}.URL:${socialLinks.instagram}`);
      lines.push(`item${itemIndex}.X-ABLabel:Instagram`);
      itemIndex++;
    }
    if (socialLinks.facebook && preferences.showFacebook !== false) {
      lines.push(`item${itemIndex}.URL:${socialLinks.facebook}`);
      lines.push(`item${itemIndex}.X-ABLabel:Facebook`);
      itemIndex++;
    }
    if (socialLinks.twitter && preferences.showTwitter !== false) {
      lines.push(`item${itemIndex}.URL:${socialLinks.twitter}`);
      lines.push(`item${itemIndex}.X-ABLabel:X (Twitter)`);
      itemIndex++;
    }
    if (socialLinks.youtube && preferences.showYoutube !== false) {
      lines.push(`item${itemIndex}.URL:${socialLinks.youtube}`);
      lines.push(`item${itemIndex}.X-ABLabel:YouTube`);
      itemIndex++;
    }
    if (socialLinks.github && preferences.showGithub !== false) {
      lines.push(`item${itemIndex}.URL:${socialLinks.github}`);
      lines.push(`item${itemIndex}.X-ABLabel:GitHub`);
      itemIndex++;
    }
    if (socialLinks.behance && preferences.showBehance !== false) {
      lines.push(`item${itemIndex}.URL:${socialLinks.behance}`);
      lines.push(`item${itemIndex}.X-ABLabel:Behance`);
      itemIndex++;
    }
    if (socialLinks.dribbble && preferences.showDribbble !== false) {
      lines.push(`item${itemIndex}.URL:${socialLinks.dribbble}`);
      lines.push(`item${itemIndex}.X-ABLabel:Dribbble`);
      itemIndex++;
    }

    lines.push('END:VCARD');

    const vCard = lines.join('\r\n');
    const fileName = `${firstName}-${lastName}.vcf`;

    return new Response(vCard, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error generating vCard:', error);
    return new Response('Failed to generate contact', { status: 500 });
  }
}
