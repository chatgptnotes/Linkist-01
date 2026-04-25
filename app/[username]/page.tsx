import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import ProfileView from './ProfileView';
import type { ProfileData } from './ProfileView';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePreviewPage({ params }: PageProps) {
  const { username } = await params;

  if (!username) {
    return <ProfileView profileData={null} username="" />;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Parallel fetch: profile + we'll get services and founding member status after we have the profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('custom_url', username)
    .maybeSingle();

  if (!profile) {
    return <ProfileView profileData={null} username={username} />;
  }

  // Parallel fetch: founding member status + services
  const [founderResult, servicesResult] = await Promise.all([
    profile.user_id
      ? supabase
          .from('users')
          .select('is_founding_member, founding_member_plan')
          .eq('id', profile.user_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('profile_services')
      .select('*')
      .eq('profile_id', profile.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
  ]);

  // Founder's Club status gates on founding_member_plan only — set after a verified
  // payment via app/api/process-order/route.ts. is_founding_member alone (set on invite
  // activation) is not enough.
  const userData = founderResult.data;
  const foundingMemberPlan: string | null = userData?.founding_member_plan ?? null;
  const isFoundingMember: boolean = !!foundingMemberPlan;

  const services = servicesResult.data;
  const socialLinks = profile.social_links || {};
  const preferences = profile.preferences || {};
  const displaySettings = profile.display_settings || {};

  const profileData: ProfileData = {
    salutation: preferences.salutation || '',
    firstName: profile.first_name || '',
    lastName: profile.last_name || '',
    primaryEmail: profile.primary_email || profile.email || '',
    secondaryEmail: profile.alternate_email || '',
    mobileNumber: profile.mobile_number || profile.phone_number || '',
    whatsappNumber: profile.whatsapp_number || '',
    jobTitle: profile.job_title || '',
    companyName: profile.company_name || profile.company || '',
    companyWebsite: profile.company_website || '',
    companyAddress: profile.company_address || '',
    companyLogo: profile.company_logo_url || null,
    industry: profile.industry || '',
    subDomain: '',
    skills: profile.skills || [],
    professionalSummary: profile.professional_summary || '',
    linkedinUrl: socialLinks.linkedin || '',
    instagramUrl: socialLinks.instagram || '',
    facebookUrl: socialLinks.facebook || '',
    twitterUrl: socialLinks.twitter || '',
    behanceUrl: socialLinks.behance || '',
    dribbbleUrl: socialLinks.dribbble || '',
    githubUrl: socialLinks.github || '',
    youtubeUrl: socialLinks.youtube || '',
    showEmailPublicly: displaySettings.showEmailPublicly ?? preferences.showEmailPublicly ?? true,
    showSecondaryEmailPublicly: displaySettings.showSecondaryEmailPublicly ?? preferences.showSecondaryEmailPublicly ?? true,
    showMobilePublicly: displaySettings.showMobilePublicly ?? preferences.showMobilePublicly ?? true,
    showWhatsappPublicly: displaySettings.showWhatsappPublicly ?? preferences.showWhatsappPublicly ?? false,
    showJobTitle: displaySettings.showJobTitle ?? preferences.showJobTitle ?? true,
    showCompanyName: displaySettings.showCompanyName ?? preferences.showCompanyName ?? true,
    showCompanyWebsite: displaySettings.showCompanyWebsite ?? preferences.showCompanyWebsite ?? true,
    showCompanyAddress: displaySettings.showCompanyAddress ?? preferences.showCompanyAddress ?? true,
    showIndustry: displaySettings.showIndustry ?? preferences.showIndustry ?? true,
    showSkills: displaySettings.showSkills ?? preferences.showSkills ?? true,
    showLinkedin: displaySettings.showLinkedin ?? preferences.showLinkedin ?? false,
    showInstagram: displaySettings.showInstagram ?? preferences.showInstagram ?? false,
    showFacebook: displaySettings.showFacebook ?? preferences.showFacebook ?? false,
    showTwitter: displaySettings.showTwitter ?? preferences.showTwitter ?? false,
    showBehance: displaySettings.showBehance ?? preferences.showBehance ?? false,
    showDribbble: displaySettings.showDribbble ?? preferences.showDribbble ?? false,
    showGithub: displaySettings.showGithub ?? preferences.showGithub ?? false,
    showYoutube: displaySettings.showYoutube ?? preferences.showYoutube ?? false,
    profilePhoto: profile.profile_photo_url || profile.avatar_url || null,
    backgroundImage: profile.background_image_url || null,
    showProfilePhoto: preferences.showProfilePhoto ?? true,
    showBackgroundImage: preferences.showBackgroundImage ?? true,
    services: (services || []).map((s: any) => ({
      id: s.id.toString(),
      title: s.title,
      description: s.description || '',
      pricing: s.pricing || '',
      pricingUnit: s.pricing_unit || '',
      category: s.category || '',
      currency: s.currency || 'USD',
      showPublicly: true,
    })),
    certifications: preferences.certifications || [],
    isFoundingMember,
    foundingMemberPlan,
    selectedTheme: displaySettings.selectedTheme || 'bottom-sheet',
  };

  // Fire-and-forget: track profile view (non-blocking)
  const headersList = await headers();
  const viewerIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   headersList.get('x-real-ip') ||
                   'unknown';
  const viewerUserAgent = headersList.get('user-agent') || null;

  supabase
    .from('profile_views')
    .insert({
      profile_email: profile.primary_email || profile.email,
      viewer_ip: viewerIp,
      viewer_user_agent: viewerUserAgent,
      viewed_at: new Date().toISOString(),
    })
    .then(() => {})
    .catch(() => {});

  return <ProfileView profileData={profileData} username={username} />;
}
