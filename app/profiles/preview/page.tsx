'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import Logo from '@/components/Logo';
import { usePWA } from '@/contexts/PWAContext';
import {
  CheckCircle,
  Email,
  Phone,
  WhatsApp,
  Work,
  Business,
  LinkedIn,
  Instagram,
  Facebook,
  X as XIcon,
  GitHub,
  YouTube,
  Language,
  LocationOn,
  Star,
  Link as LinkIcon,
  ContentCopy,
  QrCode2,
  CloudDownload,
  Share as ShareIcon,
  BookmarkAdd,
  PersonAdd
} from '@mui/icons-material';
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
  // Founding member
  isFoundingMember?: boolean;
  foundingMemberPlan?: string | null;
  // Services
  services?: Array<{
    id: string;
    title: string;
    description?: string;
    pricing: string;
    pricingUnit?: string;
    currency?: string;
    category: string;
    showPublicly?: boolean;
  }>;
  // Certifications
  certifications?: Array<{
    id: string;
    name: string;
    title: string;
    url: string;
    size: number;
    type: string;
    showPublicly: boolean;
  }>;
}

export default function ProfilePreviewPage() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);
  const [showShareSection, setShowShareSection] = useState(false);
  const [showAddToHomePopup, setShowAddToHomePopup] = useState(false);
  const [shortcutName, setShortcutName] = useState('');
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);

  // Use centralized PWA context
  const { isIOS, isAndroid, isInstallable, triggerInstall } = usePWA();

  useEffect(() => {
    const fetchProfileData = async () => {
      // First, try to get custom URL from localStorage
      const claimedUsername = localStorage.getItem('claimedUsername');
      if (claimedUsername) {
        const baseUrl = window.location.origin;
        setCustomUrl(`${baseUrl}/${claimedUsername}`);
      }
      try {
        console.log('🔍 Fetching profile data for preview...');

        // Fetch profile from database (API uses authenticated user from session)
        const profileResponse = await fetch('/api/profiles');

        if (!profileResponse.ok) {
          console.log('⚠️ Profile fetch failed, trying localStorage fallback...');

          // Try to get current user email for filtering
          let currentUserEmail = null;
          try {
            const authResponse = await fetch('/api/auth/me');
            if (authResponse.ok) {
              const authData = await authResponse.json();
              currentUserEmail = authData.user?.email;
            }
          } catch (e) {
            console.log('Could not fetch user email for filtering');
          }

          // Not authenticated or no profile, try localStorage as fallback
          const profilesStr = localStorage.getItem('userProfiles');
          if (profilesStr) {
            const profiles = JSON.parse(profilesStr);

            // Filter to current user's profiles only
            const userProfiles = currentUserEmail
              ? profiles.filter((p: any) => p.email === currentUserEmail || p.userEmail === currentUserEmail)
              : profiles;

            if (userProfiles && userProfiles.length > 0) {
              console.log(`✅ Found ${userProfiles.length} profile(s) in localStorage`);
              setProfileData(userProfiles[userProfiles.length - 1]);
            }
          }
          setLoading(false);
          return;
        }

        const data = await profileResponse.json();
        console.log('📦 Profile API response:', data);

        if (data.profiles && data.profiles.length > 0) {
          // Get the most recent profile
          const dbProfile = data.profiles[0];
          console.log('✅ Found profile in database:', dbProfile.id);
          console.log('🔍 DEBUG - dbProfile.whatsapp_number:', dbProfile.whatsapp_number);
          console.log('🔍 DEBUG - dbProfile.display_settings:', JSON.stringify(dbProfile.display_settings, null, 2));

          // Map database profile to preview format
          const mappedProfile: ProfileData = {
            salutation: dbProfile.preferences?.salutation || '',
            firstName: dbProfile.first_name || '',
            lastName: dbProfile.last_name || '',
            primaryEmail: dbProfile.email || '',
            secondaryEmail: dbProfile.alternate_email || '',
            mobileNumber: dbProfile.phone_number || '',
            whatsappNumber: dbProfile.whatsapp_number || '',
            jobTitle: dbProfile.job_title || '',
            companyName: dbProfile.company_name || '',
            companyWebsite: dbProfile.company_website || '',
            companyAddress: dbProfile.company_address || '',
            companyLogo: dbProfile.company_logo_url,
            industry: dbProfile.industry || '',
            subDomain: dbProfile.sub_domain || '',
            skills: dbProfile.skills || [],
            professionalSummary: dbProfile.professional_summary || '',
            linkedinUrl: dbProfile.social_links?.linkedin || '',
            instagramUrl: dbProfile.social_links?.instagram || '',
            facebookUrl: dbProfile.social_links?.facebook || '',
            twitterUrl: dbProfile.social_links?.twitter || '',
            behanceUrl: dbProfile.social_links?.behance || '',
            dribbbleUrl: dbProfile.social_links?.dribbble || '',
            githubUrl: dbProfile.social_links?.github || '',
            youtubeUrl: dbProfile.social_links?.youtube || '',
            // Read toggle values from display_settings (preferred) or preferences (fallback)
            showEmailPublicly: dbProfile.display_settings?.showEmailPublicly ?? dbProfile.preferences?.showEmailPublicly ?? true,
            showSecondaryEmailPublicly: dbProfile.display_settings?.showSecondaryEmailPublicly ?? dbProfile.preferences?.showSecondaryEmailPublicly ?? true,
            showMobilePublicly: dbProfile.display_settings?.showMobilePublicly ?? dbProfile.preferences?.showMobilePublicly ?? true,
            showWhatsappPublicly: dbProfile.display_settings?.showWhatsappPublicly ?? dbProfile.preferences?.showWhatsappPublicly ?? false,
            showJobTitle: dbProfile.display_settings?.showJobTitle ?? dbProfile.preferences?.showJobTitle ?? true,
            showCompanyName: dbProfile.display_settings?.showCompanyName ?? dbProfile.preferences?.showCompanyName ?? true,
            showCompanyWebsite: dbProfile.display_settings?.showCompanyWebsite ?? dbProfile.preferences?.showCompanyWebsite ?? true,
            showCompanyAddress: dbProfile.display_settings?.showCompanyAddress ?? dbProfile.preferences?.showCompanyAddress ?? true,
            showIndustry: dbProfile.display_settings?.showIndustry ?? dbProfile.preferences?.showIndustry ?? true,
            showSkills: dbProfile.display_settings?.showSkills ?? dbProfile.preferences?.showSkills ?? true,
            showLinkedin: dbProfile.display_settings?.showLinkedin ?? dbProfile.preferences?.showLinkedin ?? false,
            showInstagram: dbProfile.display_settings?.showInstagram ?? dbProfile.preferences?.showInstagram ?? false,
            showFacebook: dbProfile.display_settings?.showFacebook ?? dbProfile.preferences?.showFacebook ?? false,
            showTwitter: dbProfile.display_settings?.showTwitter ?? dbProfile.preferences?.showTwitter ?? false,
            showBehance: dbProfile.display_settings?.showBehance ?? dbProfile.preferences?.showBehance ?? false,
            showDribbble: dbProfile.display_settings?.showDribbble ?? dbProfile.preferences?.showDribbble ?? false,
            showGithub: dbProfile.display_settings?.showGithub ?? dbProfile.preferences?.showGithub ?? false,
            showYoutube: dbProfile.display_settings?.showYoutube ?? dbProfile.preferences?.showYoutube ?? false,
            profilePhoto: dbProfile.profile_photo_url,
            backgroundImage: dbProfile.background_image_url,
            showProfilePhoto: dbProfile.preferences?.showProfilePhoto ?? true,
            showBackgroundImage: dbProfile.preferences?.showBackgroundImage ?? true,
            // Founding member status (from API response)
            isFoundingMember: data.isFoundingMember || false,
            foundingMemberPlan: data.foundingMemberPlan || null,
            // Services
            services: dbProfile.services || [],
            // Certifications
            certifications: dbProfile.preferences?.certifications || [],
          };

          console.log('✅ Mapped profile data for preview');
          console.log('📋 Services loaded:', dbProfile.services?.length || 0);
          console.log('🔍 DEBUG - mappedProfile.whatsappNumber:', mappedProfile.whatsappNumber);
          console.log('🔍 DEBUG - mappedProfile.showWhatsappPublicly:', mappedProfile.showWhatsappPublicly);
          setProfileData(mappedProfile);

          // Set customUrl from database if not already set from localStorage
          if (!customUrl) {
            const baseUrl = window.location.origin;
            let username = 'your-profile';

            if (dbProfile.custom_url) {
              // Use custom_url from database (same as dashboard)
              username = dbProfile.custom_url;
            } else if (dbProfile.first_name) {
              // Use first name as username
              username = dbProfile.first_name.toLowerCase().replace(/\s+/g, '-');
            } else if (dbProfile.email) {
              // Last resort fallback to email username
              username = dbProfile.email.split('@')[0];
            }

            setCustomUrl(`${baseUrl}/${username}`);
            console.log('✅ Set customUrl from database:', username);
          }
        } else {
          console.log('⚠️ No profiles found in database, redirecting to profile builder...');
          // No profiles found - don't use localStorage as it might have stale data
          // Redirect to create a new profile
          setTimeout(() => {
            router.push('/profiles/templates');
          }, 2000);
        }
      } catch (error) {
        console.error('❌ Error fetching profile:', error);
        // On error, don't use localStorage fallback to prevent showing wrong user's data
        // Instead, redirect to login
        setTimeout(() => {
          router.push('/login?redirect=/profiles/preview');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Generate QR Code when custom URL is set
  useEffect(() => {
    const generateQrCode = async () => {
      if (!customUrl) return;

      try {
        const qrDataUrl = await QRCode.toDataURL(customUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    if (customUrl) {
      generateQrCode();
    }
  }, [customUrl]);


  // Set default shortcut name when profile loads
  useEffect(() => {
    if (profileData) {
      const defaultName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'My Profile';
      setShortcutName(defaultName);
    }
  }, [profileData]);

  // Handle Add to Home Screen
  const handleAddToHomeScreen = async () => {
    console.log('🏠 Add to Home Screen clicked');
    console.log('📱 Platform: iOS =', isIOS, ', Android =', isAndroid);
    console.log('📦 PWA Installable:', isInstallable);
    console.log('🔍 Window deferred prompt:', typeof window !== 'undefined' ? !!(window as any).deferredPrompt : 'N/A');

    if (isIOS) {
      // iOS doesn't support programmatic install, show instructions directly
      console.log('📱 iOS detected - showing instructions');
      setShowIOSInstructions(true);
      return;
    }

    // Try native PWA install first
    const result = await triggerInstall();

    if (result === 'accepted') {
      console.log('✅ User accepted the install prompt');
      // Success - native popup handled everything
    } else if (result === 'dismissed') {
      console.log('❌ User dismissed the install prompt');
      // User dismissed - that's fine, no fallback needed
    } else {
      // No deferred prompt available - show instructions modal
      console.log('❌ No deferred prompt available, showing instructions');
      console.log('ℹ️ This usually means: not HTTPS, already installed, or browser doesn\'t support beforeinstallprompt');
      setShowAndroidInstructions(true);
    }
  };

  const handleCopyUrl = async () => {
    if (!customUrl) return;

    try {
      await navigator.clipboard.writeText(customUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  const handleShare = async () => {
    if (!customUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profileData?.firstName} ${profileData?.lastName}'s Profile`,
          text: `Check out my professional profile!`,
          url: customUrl
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(customUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Failed to share:', error);
        // Fallback to copy on error
        try {
          await navigator.clipboard.writeText(customUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (copyError) {
          console.error('Failed to copy URL:', copyError);
        }
      }
    }
  };

  const handleDownloadQrCode = () => {
    if (!qrCodeUrl) return;

    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `profile-qr-code.png`;
    a.click();
  };

  const handleShareQrCode = async () => {
    const profileUrl = typeof window !== 'undefined' ? window.location.href : '';

    try {
      // First try Web Share API with just URL (works on most browsers)
      if (navigator.share) {
        await navigator.share({
          title: `${profileData?.firstName} ${profileData?.lastName}'s Profile`,
          text: 'Check out my digital profile!',
          url: profileUrl
        });
        return;
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return; // User cancelled
      // Share failed, fall through to clipboard fallback
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(profileUrl);
      alert('Profile link copied to clipboard!');
    } catch (err) {
      alert('Failed to copy link');
    }
  };

  // Generate and download vCard for saving to contacts
  const handleSaveToContacts = async () => {
    if (!profileData) return;

    // Create vCard format (v3.0 for maximum compatibility)
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

    // Create blob
    const blob = new Blob([vCard], { type: 'text/vcard;charset=utf-8' });
    const fileName = `${profileData.firstName}-${profileData.lastName}.vcf`;

    // Try Web Share API first (works on mobile browsers including Chrome iOS)
    if (navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], fileName, { type: 'text/vcard;charset=utf-8' });

        // Check if files can be shared
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${profileData.firstName} ${profileData.lastName} Contact`,
            text: `Save ${profileData.firstName} ${profileData.lastName} to your contacts`
          });
          return; // Exit if sharing was successful
        }
      } catch (error: any) {
        // If user cancels the share, don't show error
        if (error.name === 'AbortError') {
          return;
        }
        console.log('Web Share API not available or failed, falling back to download');
      }
    }

    // Fallback: Traditional download method (for desktop and browsers that don't support Web Share API)
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;

      // For iOS devices, open in new tab as additional fallback
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        link.target = '_blank';
      }

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No profile data found</p>
          <button
            onClick={() => router.push('/profiles/builder')}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  const normalized = normalizeMainProfile(profileData, customUrl ? customUrl.split('/').pop() : undefined);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-100 md:flex md:items-center md:justify-center">
      <div className="relative w-full md:max-w-[430px] md:h-[932px] md:rounded-3xl md:overflow-hidden md:shadow-2xl">
        {/* Floating preview header */}
        <div className="fixed top-0 left-0 right-0 z-30 px-4 py-3 flex justify-between items-center md:absolute md:max-w-[430px] md:mx-auto md:left-0 md:right-0">
          <span className="text-white text-sm font-bold drop-shadow-lg">Profile Preview</span>
          <button
            onClick={() => router.push('/profiles/builder')}
            className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-700"
          >
            Edit Profile
          </button>
        </div>

        {/* Full-screen profile photo background */}
        <ProfileBackground
          profilePhoto={profileData.showProfilePhoto ? profileData.profilePhoto : null}
          backgroundImage={profileData.showBackgroundImage ? profileData.backgroundImage : null}
          firstName={profileData.firstName}
          lastName={profileData.lastName}
        />

        {/* Draggable bottom sheet */}
        <BottomSheetCard>
          <div className="flex items-start justify-between gap-3">
            <ProfileHeader data={normalized} />
            <ActionButtons
              onShare={() => setShowShareSection(!showShareSection)}
              onSaveContact={handleSaveToContacts}
              extraActions={[
                { label: 'Save shortcut', icon: BookmarkAdd, onClick: handleAddToHomeScreen },
              ]}
            />
          </div>
          <SocialIconsRow links={normalized.socialLinks} />
          <AboutSection summary={normalized.professionalSummary} />
          <ContactInfoSection items={normalized.contactItems} />
          <SkillsSection skills={normalized.skills} />

          {/* Profile URL section */}
          {customUrl && (
            <div className="mb-6">
              <div className="p-4 border border-white/15 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-semibold text-white">Your Profile URL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowQrCode(true)}
                      className="flex-shrink-0 p-2 border border-white/20 text-white/70 rounded hover:bg-white/10 transition"
                      title="Show QR Code"
                    >
                      <QrCode2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleCopyUrl}
                      className="flex-shrink-0 p-2 border border-white/20 text-white/70 rounded hover:bg-white/10 transition"
                      title="Copy URL"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <ContentCopy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <a
                  href={customUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 font-medium break-all block"
                >
                  {customUrl}
                </a>
              </div>
            </div>
          )}

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

          {/* Bottom navigation buttons */}
          <div className="flex gap-3 mt-4 mb-6">
            <button
              onClick={() => router.push('/profiles/builder')}
              className="flex-1 px-4 py-3 text-white/80 border border-white/20 rounded-lg font-medium hover:bg-white/10 transition-colors text-sm"
            >
              Edit Profile
            </button>
            <button
              onClick={() => router.push('/profile-dashboard')}
              className="flex-1 px-4 py-3 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
              style={{ backgroundColor: '#dc2626' }}
            >
              Go to Dashboard
            </button>
          </div>
        </BottomSheetCard>

      </div>
      {/* QR Code Modal */}
      {showQrCode && qrCodeUrl && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          onClick={() => setShowQrCode(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Profile QR Code</h3>
              <button
                onClick={() => setShowQrCode(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col items-center">
              <img
                src={qrCodeUrl}
                alt="Profile QR Code"
                className="w-64 h-64 border-2 border-blue-300 rounded-lg bg-white p-4"
              />
              <p className="text-sm text-gray-600 mt-4 text-center">
                Scan this QR code to visit this profile
              </p>

              <div className="flex gap-3 mt-6 w-full">
                <button
                  onClick={handleDownloadQrCode}
                  className="flex-1 px-4 py-3 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 font-medium border-2 border-red-600"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  <CloudDownload className="w-5 h-5" />
                  Download
                </button>
                <button
                  onClick={handleShareQrCode}
                  className="flex-1 px-4 py-3 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2 font-medium border-2 border-red-600"
                  style={{ backgroundColor: '#dc2626' }}
                >
                  <ShareIcon className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Home Screen Popup */}
      {showAddToHomePopup && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={() => setShowAddToHomePopup(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add to Home Screen</h3>
              <button
                onClick={() => setShowAddToHomePopup(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Enter a name for your shortcut. This will appear on your home screen.
            </p>

            <input
              type="text"
              value={shortcutName}
              onChange={(e) => setShortcutName(e.target.value)}
              placeholder="Shortcut name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-4 text-gray-900"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddToHomePopup(false)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToHomeScreen}
                className="flex-1 px-4 py-3 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                style={{ backgroundColor: '#dc2626' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={() => setShowIOSInstructions(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add to Home Screen</h3>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                To add <strong>&quot;{shortcutName}&quot;</strong> to your home screen:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <p className="text-sm text-gray-700">
                    Tap the <strong>Share</strong> button{' '}
                    <svg className="inline-block w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>{' '}
                    at the bottom of Safari
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <p className="text-sm text-gray-700">
                    Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <p className="text-sm text-gray-700">
                    Name it <strong>&quot;{shortcutName}&quot;</strong> and tap <strong>Add</strong>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full mt-6 px-4 py-3 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              style={{ backgroundColor: '#dc2626' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Android/Chrome Instructions Modal */}
      {showAndroidInstructions && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={() => setShowAndroidInstructions(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add to Home Screen</h3>
              <button
                onClick={() => setShowAndroidInstructions(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                To add <strong>&quot;{shortcutName}&quot;</strong> to your home screen:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <p className="text-sm text-gray-700">
                    Tap the <strong>menu button</strong>{' '}
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-200 rounded text-gray-700 font-bold text-lg">⋮</span>{' '}
                    in Chrome
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <p className="text-sm text-gray-700">
                    Select <strong>&quot;Add to Home screen&quot;</strong> or <strong>&quot;Install app&quot;</strong>
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <p className="text-sm text-gray-700">
                    Name it <strong>&quot;{shortcutName}&quot;</strong> and tap <strong>Add</strong>
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> This works best on the live site with HTTPS. The native install prompt will appear automatically in production.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidInstructions(false)}
              className="w-full mt-6 px-4 py-3 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              style={{ backgroundColor: '#dc2626' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
