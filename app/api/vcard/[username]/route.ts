import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    if (profile.whatsapp_number && preferences.showWhatsappPublicly !== false) {
      lines.push(`TEL;TYPE=WHATSAPP:${profile.whatsapp_number}`);
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
    if (profile.profile_photo_url) {
      lines.push(`PHOTO;VALUE=URI:${profile.profile_photo_url}`);
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
