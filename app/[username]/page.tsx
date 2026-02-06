'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Logo from '@/components/Logo';
import { normalizeMainProfile } from '@/components/profile/types';
import ProfileBackground from '@/components/profile/ProfileBackground';
import BottomSheetCard from '@/components/profile/BottomSheetCard';
import ActionButtons from '@/components/profile/ActionButtons';
import ProfileHeader from '@/components/profile/ProfileHeader';
import SocialIconsRow from '@/components/profile/SocialIconsRow';
import AboutSection from '@/components/profile/AboutSection';
import ContactInfoSection from '@/components/profile/ContactInfoSection';
import SkillsSection from '@/components/profile/SkillsSection';

// Currency symbols mapping
const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' }
];

interface ProfileData {
  salutation: string;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  secondaryEmail: string;
  mobileNumber: string;
  whatsappNumber: string;
  jobTitle: string;
  companyName: string;
  companyWebsite: string;
  companyAddress: string;
  companyLogo: string | null;
  industry: string;
  subDomain: string;
  skills: string[];
  professionalSummary: string;
  linkedinUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  behanceUrl: string;
  dribbbleUrl: string;
  githubUrl: string;
  youtubeUrl: string;
  // Basic Information toggles
  showEmailPublicly: boolean;
  showSecondaryEmailPublicly: boolean;
  showMobilePublicly: boolean;
  showWhatsappPublicly: boolean;
  // Professional Information toggles
  showJobTitle: boolean;
  showCompanyName: boolean;
  showCompanyWebsite: boolean;
  showCompanyAddress: boolean;
  showIndustry: boolean;
  showSkills: boolean;
  // Social Media toggles
  showLinkedin: boolean;
  showInstagram: boolean;
  showFacebook: boolean;
  showTwitter: boolean;
  showBehance: boolean;
  showDribbble: boolean;
  showGithub: boolean;
  showYoutube: boolean;
  // Media toggles
  profilePhoto: string | null;
  backgroundImage: string | null;
  showProfilePhoto: boolean;
  showBackgroundImage: boolean;
  // Services
  services?: Array<{ id: string; title: string; description: string; pricing: string; pricingUnit?: string; currency?: string; category: string; showPublicly?: boolean }>;
  // Certifications
  certifications?: Array<{ id: string; name: string; title: string; url: string; size: number; type: string; showPublicly: boolean }>;
  // Founding member status
  isFoundingMember?: boolean;
  foundingMemberPlan?: string | null;
}

export default function ProfilePreviewPage() {
  const router = useRouter();
  const params = useParams();
  const username = params?.username as string;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState<string>('');

  useEffect(() => {
    // Set custom URL based on username from URL params
    if (username) {
      const baseUrl = window.location.origin;
      setCustomUrl(`${baseUrl}/${username}`);
    }

    const fetchProfileData = async () => {
      try {
        console.log('🔍 Fetching profile data for username:', username);

        // Fetch profile from database using username from URL
        const profileResponse = await fetch(`/api/profile/${username}`);

        if (!profileResponse.ok) {
          console.log('⚠️ Profile not found for username:', username);
          setLoading(false);
          return;
        }

        const data = await profileResponse.json();
        console.log('📦 Profile API response:', data);

        if (data.success && data.profile) {
          const dbProfile = data.profile;
          console.log('✅ Found profile in database for username:', username);

          // Map API response to ProfileData format
          const prefs = dbProfile.preferences || {};

          const mappedProfile: ProfileData = {
            salutation: prefs.salutation || '',
            firstName: dbProfile.firstName || '',
            lastName: dbProfile.lastName || '',
            primaryEmail: dbProfile.email || '',
            secondaryEmail: dbProfile.alternate_email || '',
            mobileNumber: dbProfile.phone || '',
            whatsappNumber: dbProfile.whatsapp || '',
            jobTitle: dbProfile.title || '',
            companyName: dbProfile.company || '',
            companyWebsite: dbProfile.website || '',
            companyAddress: dbProfile.location || '',
            companyLogo: dbProfile.companyLogo || null,
            industry: dbProfile.industry || '',
            subDomain: '',
            skills: dbProfile.skills || [],
            professionalSummary: dbProfile.bio || '',
            linkedinUrl: dbProfile.linkedin || '',
            instagramUrl: dbProfile.instagram || '',
            facebookUrl: dbProfile.facebook || '',
            twitterUrl: dbProfile.twitter || '',
            behanceUrl: dbProfile.social_links?.behance || prefs.behanceUrl || '',
            dribbbleUrl: dbProfile.social_links?.dribbble || prefs.dribbbleUrl || '',
            githubUrl: dbProfile.github || '',
            youtubeUrl: dbProfile.youtube || '',
            // Read toggle values from display_settings (preferred) or preferences (fallback)
            showEmailPublicly: dbProfile.display_settings?.showEmailPublicly ?? prefs.showEmailPublicly ?? true,
            showSecondaryEmailPublicly: dbProfile.display_settings?.showSecondaryEmailPublicly ?? prefs.showSecondaryEmailPublicly ?? true,
            showMobilePublicly: dbProfile.display_settings?.showMobilePublicly ?? prefs.showMobilePublicly ?? true,
            showWhatsappPublicly: dbProfile.display_settings?.showWhatsappPublicly ?? prefs.showWhatsappPublicly ?? false,
            showJobTitle: dbProfile.display_settings?.showJobTitle ?? prefs.showJobTitle ?? true,
            showCompanyName: dbProfile.display_settings?.showCompanyName ?? prefs.showCompanyName ?? true,
            showCompanyWebsite: dbProfile.display_settings?.showCompanyWebsite ?? prefs.showCompanyWebsite ?? true,
            showCompanyAddress: dbProfile.display_settings?.showCompanyAddress ?? prefs.showCompanyAddress ?? true,
            showIndustry: dbProfile.display_settings?.showIndustry ?? prefs.showIndustry ?? true,
            showSkills: dbProfile.display_settings?.showSkills ?? prefs.showSkills ?? true,
            showLinkedin: dbProfile.display_settings?.showLinkedin ?? prefs.showLinkedin ?? false,
            showInstagram: dbProfile.display_settings?.showInstagram ?? prefs.showInstagram ?? false,
            showFacebook: dbProfile.display_settings?.showFacebook ?? prefs.showFacebook ?? false,
            showTwitter: dbProfile.display_settings?.showTwitter ?? prefs.showTwitter ?? false,
            showBehance: dbProfile.display_settings?.showBehance ?? prefs.showBehance ?? false,
            showDribbble: dbProfile.display_settings?.showDribbble ?? prefs.showDribbble ?? false,
            showGithub: dbProfile.display_settings?.showGithub ?? prefs.showGithub ?? false,
            showYoutube: dbProfile.display_settings?.showYoutube ?? prefs.showYoutube ?? false,
            profilePhoto: dbProfile.profileImage || null,
            backgroundImage: dbProfile.coverImage || null,
            showProfilePhoto: prefs.showProfilePhoto ?? true,
            showBackgroundImage: prefs.showBackgroundImage ?? true,
            // Services
            services: dbProfile.services || [],
            // Certifications
            certifications: prefs.certifications || [],
            // Founding member status
            isFoundingMember: dbProfile.isFoundingMember || false,
            foundingMemberPlan: dbProfile.foundingMemberPlan || null,
          };

          console.log('✅ Mapped profile data for preview');
          setProfileData(mappedProfile);
        }
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfileData();
    }
  }, [username]);

  const handleShare = async () => {
    const profileUrl = typeof window !== 'undefined' ? window.location.href : '';

    try {
      // First try Web Share API (works on mobile browsers)
      if (navigator.share) {
        await navigator.share({
          title: `${profileData?.firstName} ${profileData?.lastName}'s Profile`,
          text: 'Check out my digital profile!',
          url: profileUrl
        });
        return;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
    }

    // Fallback: copy URL to clipboard
    const copyToClipboard = async (text: string): Promise<boolean> => {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch (e) {
          // Fall through
        }
      }
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
      } catch (e) {
        return false;
      }
    };

    const success = await copyToClipboard(profileUrl);
    if (success) {
      alert('Profile link copied to clipboard!');
    } else {
      alert('Failed to copy link. Please copy manually: ' + profileUrl);
    }
  };

  // Generate and download vCard for saving to contacts
  const handleSaveToContacts = async () => {
    if (!profileData) return;

    const fullName = profileData.salutation
      ? `${profileData.salutation} ${profileData.firstName} ${profileData.lastName}`
      : `${profileData.firstName} ${profileData.lastName}`;
    const vCard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${fullName}`,
      `N:${profileData.lastName};${profileData.firstName};;${profileData.salutation || ''};`,
      profileData.jobTitle && profileData.showJobTitle ? `TITLE:${profileData.jobTitle}` : '',
      profileData.companyName && profileData.showCompanyName ? `ORG:${profileData.companyName}` : '',
      profileData.primaryEmail && profileData.showEmailPublicly ? `EMAIL;TYPE=INTERNET:${profileData.primaryEmail}` : '',
      profileData.secondaryEmail && profileData.showSecondaryEmailPublicly ? `EMAIL;TYPE=INTERNET:${profileData.secondaryEmail}` : '',
      profileData.mobileNumber && profileData.showMobilePublicly ? `TEL;TYPE=CELL:${profileData.mobileNumber}` : '',
      profileData.whatsappNumber && profileData.showWhatsappPublicly ? `TEL;TYPE=WHATSAPP:${profileData.whatsappNumber}` : '',
      profileData.companyWebsite && profileData.showCompanyWebsite ? `URL:${profileData.companyWebsite}` : '',
      profileData.companyAddress && profileData.showCompanyAddress ? `ADR;TYPE=WORK:;;${profileData.companyAddress};;;;` : '',
      customUrl ? `URL:${customUrl}` : '',
      profileData.professionalSummary ? `NOTE:${profileData.professionalSummary.replace(/\n/g, '\\n')}` : '',
      'END:VCARD'
    ].filter(line => line).join('\n');

    const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8' });
    const fileName = `${profileData.firstName}-${profileData.lastName}.vcf`;

    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], fileName, { type: 'text/vcard;charset=utf-8' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${profileData.firstName} ${profileData.lastName} Contact`,
            text: `Save ${profileData.firstName} ${profileData.lastName} to your contacts`
          });
          return;
        }
      } catch (error: any) {
        if (error.name === 'AbortError') return;
        console.log('Web Share API not available or failed, falling back to download');
      }
    }

    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download contact:', error);
      alert('Unable to save contact. Please try again or use a different browser.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
            <Logo width={140} height={45} variant="light" />
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-6">
              The profile <span className="font-semibold">/{username}</span> doesn&apos;t exist or has been removed.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const normalized = normalizeMainProfile(profileData, username);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-100 md:flex md:items-center md:justify-center">
      <div className="relative w-full md:max-w-[430px] md:h-[932px] md:rounded-3xl md:overflow-hidden md:shadow-2xl">
        {/* Full-screen profile photo background */}
        <ProfileBackground
          profilePhoto={normalized.profilePhoto}
          backgroundImage={normalized.backgroundImage}
          firstName={normalized.firstName}
          lastName={normalized.lastName}
        />

        {/* Draggable bottom sheet */}
        <BottomSheetCard>
          <div className="flex items-start justify-between gap-3">
            <ProfileHeader data={normalized} />
            <ActionButtons
              onShare={handleShare}
              onSaveContact={handleSaveToContacts}
            />
          </div>
          <SocialIconsRow links={normalized.socialLinks} />
          <AboutSection summary={normalized.professionalSummary} />
          <ContactInfoSection items={normalized.contactItems} />
          <SkillsSection skills={normalized.skills} />

          {/* Certifications */}
          {normalized.certifications && normalized.certifications.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Certifications</h3>
              <div className="space-y-2">
                {normalized.certifications.map((cert) => (
                  <a
                    key={cert.id}
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-3 rounded-lg transition-colors border border-white/12 hover:border-white/25"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                        <path d="M14 2v6h6"/>
                      </svg>
                      <span className="text-sm text-white/80 font-medium flex-1">{cert.title}</span>
                      <svg className="w-4 h-4 text-white/40 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {normalized.services && normalized.services.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Services</h3>
              <div className="space-y-3">
                {normalized.services.map((service) => (
                  <div key={service.id} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-base font-semibold text-white">{service.title}</h4>
                      {service.category && (
                        <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs font-medium">
                          {service.category}
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-white/60 mb-3 line-clamp-3">{service.description}</p>
                    )}
                    {service.pricing && (
                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <span className="text-xs text-white/50">Pricing</span>
                        <span className="text-sm font-semibold text-red-400">
                          {CURRENCIES.find(c => c.code === (service.currency || 'USD'))?.symbol || '$'}
                          {service.pricing}{service.pricingUnit || ''}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </BottomSheetCard>
      </div>
    </div>
  );
}
