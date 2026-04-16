'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
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
  PersonAdd,
  Close,
  Crop as CropIcon
} from '@mui/icons-material';
import { normalizeMainProfile } from '@/components/profile/types';
import ThemeRenderer from '@/components/profile/themes/ThemeRenderer';
import type { ThemeId } from '@/components/profile/themes';

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
    link?: string;
    showPublicly: boolean;
  }>;
  // Theme
  selectedTheme?: string;
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

  // Image crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [cropAspect, setCropAspect] = useState<number>(1);
  const [isCropInteracting, setIsCropInteracting] = useState(false);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const cropInteractionTimer = useRef<NodeJS.Timeout | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropInteractionStart = useCallback(() => {
    if (cropInteractionTimer.current) clearTimeout(cropInteractionTimer.current);
    setIsCropInteracting(true);
  }, []);

  const handleCropInteractionEnd = useCallback(() => {
    cropInteractionTimer.current = setTimeout(() => setIsCropInteracting(false), 600);
  }, []);

  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    await new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.src = imageSrc;
    });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleOpenCrop = () => {
    if (!profileData?.profilePhoto) return;
    setCropImage(profileData.profilePhoto);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropAspect(4 / 5);
    setShowCropModal(true);
  };

  const handleCropSave = async () => {
    if (!cropImage || !croppedAreaPixels || !profileData) return;
    try {
      setIsSavingCrop(true);
      const croppedBase64 = await getCroppedImg(cropImage, croppedAreaPixels);
      if (!croppedBase64) return;

      // Convert base64 to Blob and upload to profile-photos bucket
      const res = await fetch(croppedBase64);
      const blob = await res.blob();
      const file = new File([blob], `profile-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Use a fixed filename per user so each upload overwrites the previous photo
      const sanitizedEmail = (profileData.primaryEmail || 'user').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      const fixedFilename = `profiles/profile-${sanitizedEmail}.jpg`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'profiles');
      formData.append('filename', fixedFilename);

      const uploadRes = await fetch('/api/upload-image', { method: 'POST', body: formData });
      const uploadResult = await uploadRes.json();

      if (!uploadResult.url) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      // Append cache-busting param so the browser fetches the new image even though the URL path is the same
      const photoUrl = `${uploadResult.url}?t=${Date.now()}`;

      // Save URL to server
      const response = await fetch('/api/profiles/save', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profileData.primaryEmail,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          profilePhoto: photoUrl,
        }),
      });

      if (response.ok) {
        setProfileData({ ...profileData, profilePhoto: photoUrl });
      } else {
        console.error('Failed to save cropped photo:', await response.text());
      }
    } catch (error) {
      console.error('Error saving cropped photo:', error);
    } finally {
      setIsSavingCrop(false);
      setShowCropModal(false);
      setCropImage(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCropAspect(1);
      setIsCropInteracting(false);
    }
  };

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
            // Theme
            selectedTheme: dbProfile.display_settings?.selectedTheme || 'bottom-sheet',
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

  // Generate QR Code with Linkist logo when custom URL is set
  useEffect(() => {
    const generateQrCode = async () => {
      if (!customUrl) return;

      try {
        const qrDataUrl = await QRCode.toDataURL(customUrl, {
          width: 600,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Overlay Linkist logo at center of QR code
        const qrImg = new Image();
        qrImg.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = qrImg.width;
          canvas.height = qrImg.height;
          const ctx = canvas.getContext('2d')!;
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(qrImg, 0, 0);

          const logo = new Image();
          logo.onload = () => {
            const centerX = qrImg.width / 2;
            const centerY = qrImg.height / 2;
            const radius = qrImg.width * 0.15;

            // Auto-detect the actual mark bounds by scanning non-white pixels
            const tmpCanvas = document.createElement('canvas');
            tmpCanvas.width = logo.naturalWidth;
            tmpCanvas.height = logo.naturalHeight;
            const tmpCtx = tmpCanvas.getContext('2d')!;
            tmpCtx.drawImage(logo, 0, 0);
            const { data, width: iw, height: ih } = tmpCtx.getImageData(0, 0, logo.naturalWidth, logo.naturalHeight);
            let minX = iw, maxX = 0, minY = ih, maxY = 0;
            for (let y = 0; y < ih; y++) {
              for (let x = 0; x < iw; x++) {
                const i = (y * iw + x) * 4;
                // Non-white (or non-transparent) pixel = part of the mark
                if (data[i + 3] > 10 && (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240)) {
                  if (x < minX) minX = x;
                  if (x > maxX) maxX = x;
                  if (y < minY) minY = y;
                  if (y > maxY) maxY = y;
                }
              }
            }

            // White circular background
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
            ctx.fill();
            // Clip to circle
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.clip();

            // Crop exactly to the detected mark and center it in the circle
            const markW = maxX - minX;
            const markH = maxY - minY;
            const targetSize = radius * 0.63; // fill ~63% of radius — full mark visible with padding
            const scale = targetSize * 2 / Math.max(markW, markH);
            const dw = markW * scale;
            const dh = markH * scale;
            ctx.drawImage(logo, minX, minY, markW, markH, centerX - dw / 2 - radius * 0.06, centerY - dh / 2, dw, dh);
            ctx.restore();
            setQrCodeUrl(canvas.toDataURL('image/png'));
          };
          logo.src = '/logo_linkist.png';
        };
        qrImg.src = qrDataUrl;
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
          text: 'Check out my digital profile!',
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

    const ownerName = profileData
      ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'My Profile'
      : 'My Profile';

    const profileUrl = customUrl
      ? customUrl.replace(/^https?:\/\//, '')
      : '';

    const img = new Image();
    img.onload = () => {
      const padding = 40;
      const nameHeight = 72;
      const urlHeight = profileUrl ? 52 : 0;
      const gap = profileUrl ? 14 : 0;
      const qrTopY = padding + nameHeight + gap + urlHeight + 24;
      const bottomPadding = 40;
      const canvasWidth = img.width + padding * 2;
      const canvasHeight = qrTopY + img.height + bottomPadding;

      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d')!;

      // White background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw owner name at the top
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ownerName, canvasWidth / 2, padding + nameHeight - 8);

      // Draw profile URL below name
      if (profileUrl) {
        ctx.fillStyle = '#6B7280';
        ctx.font = '40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(profileUrl, canvasWidth / 2, padding + nameHeight + gap + urlHeight - 6);
      }

      // Draw QR code below text
      ctx.drawImage(img, padding, qrTopY, img.width, img.height);

      // Download
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${ownerName.replace(/\s+/g, '-').toLowerCase()}-qr-code.png`;
      a.click();
    };
    img.src = qrCodeUrl;
  };

  const handleShareQrCode = async () => {
    const profileUrl = customUrl || (typeof window !== 'undefined' ? window.location.href : '');

    try {
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
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(profileUrl);
      alert('Profile link copied to clipboard!');
    } catch (err) {
      alert('Failed to copy link');
    }
  };

  // Navigate to vCard endpoint — iOS shows contact preview, Android downloads the file
  const handleSaveToContacts = () => {
    if (!profileData || !customUrl) return;
    const slug = customUrl.split('/').pop() || '';
    if (!slug) return;
    window.location.href = `/api/vcard/${slug}`;
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
          <div className="flex items-center gap-2">
            {profileData.profilePhoto && (
              <button
                onClick={handleOpenCrop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-md border border-black/10 text-white shadow-md transition-colors"
                style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
              >
                <CropIcon className="w-4 h-4" />
                Adjust
              </button>
            )}
            <button
              onClick={() => router.push('/profiles/builder')}
              className="px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-md border border-black/10 text-white shadow-md transition-colors"
              style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Theme-aware profile rendering */}
        <ThemeRenderer
          data={normalized}
          themeId={(profileData.selectedTheme || 'bottom-sheet') as ThemeId}
          onShare={handleShare}
          onSaveContact={handleSaveToContacts}
          extraActions={[
            { label: 'Save shortcut', icon: BookmarkAdd, onClick: handleAddToHomeScreen },
          ]}
        >

          {/* Profile URL section */}
          {customUrl && (
            <div className="mb-6">
              <div className="p-4 border border-white/15 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-white" />
                    <span className="text-sm font-semibold text-white">Your Profile URL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowQrCode(true)}
                      className="flex-shrink-0 p-2 border border-white/20 text-white/70 rounded hover:bg-white/10 transition"
                      title="Show QR Code"
                    >
                      <QrCode2 className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={handleCopyUrl}
                      className="flex-shrink-0 p-2 border border-white/20 text-white/70 rounded hover:bg-white/10 transition"
                      title="Copy URL"
                    >
                      {copied ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <ContentCopy className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>
                <a
                  href={customUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white hover:text-white/80 font-medium break-all block"
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
                {normalized.certifications.map((cert) => {
                  const hasDoc = !!cert.url;
                  const hasLink = !!cert.link;

                  if (hasDoc || hasLink) {
                    const isPdf = hasDoc && (cert.type === 'application/pdf' || cert.url.toLowerCase().endsWith('.pdf'));
                    const viewUrl = hasDoc
                      ? (isPdf ? `https://docs.google.com/gview?url=${encodeURIComponent(cert.url)}&embedded=true` : cert.url)
                      : null;

                    return (
                      <div
                        key={cert.id}
                        className="block px-4 py-3 rounded-lg border border-white/12"
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                      >
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                            <path d="M14 2v6h6"/>
                          </svg>
                          <span className="text-sm text-white/80 font-medium flex-1">{cert.title}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {hasDoc && viewUrl && (
                              <button
                                onClick={() => window.open(viewUrl, '_blank', 'noopener,noreferrer')}
                                className="p-1 rounded hover:bg-white/10 transition-colors"
                                title="View Document"
                              >
                                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            )}
                            {hasLink && (
                              <button
                                onClick={() => window.open(cert.link, '_blank', 'noopener,noreferrer')}
                                className="p-1 rounded hover:bg-white/10 transition-colors"
                                title="View Credential"
                              >
                                <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={cert.id}
                      className="block px-4 py-3 rounded-lg border border-white/12"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                          <path d="M14 2v6h6"/>
                        </svg>
                        <span className="text-sm text-white/80 font-medium flex-1">{cert.title}</span>
                      </div>
                    </div>
                  );
                })}
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
              onClick={() => router.push('/profile-dashboard')}
              className="flex-1 px-4 py-3 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
              style={{ backgroundColor: '#dc2626' }}
            >
              Go to Dashboard
            </button>
          </div>
        </ThemeRenderer>

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
              <p className="text-lg font-semibold text-gray-900">
                {profileData ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'My Profile' : 'My Profile'}
              </p>
              {customUrl && (
                <p className="text-sm text-gray-500 mt-1">
                  {customUrl.replace(/^https?:\/\//, '')}
                </p>
              )}
              <img
                src={qrCodeUrl}
                alt="Profile QR Code"
                className="w-64 h-64 border-2 border-gray-300 rounded-xl bg-white p-4 mt-4"
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

      {/* Image Crop Modal */}
      {showCropModal && cropImage && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Adjust Photo</h3>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setCropImage(null);
                  setCropAspect(1);
                  setIsCropInteracting(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <Close className="w-5 h-5" />
              </button>
            </div>

            {/* Crop Area */}
            <div
              className="relative w-full bg-black"
              style={{ height: '400px' }}
              onMouseDown={handleCropInteractionStart}
              onMouseUp={handleCropInteractionEnd}
              onTouchStart={handleCropInteractionStart}
              onTouchEnd={handleCropInteractionEnd}
            >
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={cropAspect}
                cropShape="rect"
                showGrid={false}
                restrictPosition={true}
                minZoom={1}
                maxZoom={3}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                onInteractionStart={handleCropInteractionStart}
                onInteractionEnd={handleCropInteractionEnd}
                style={{
                  cropAreaStyle: {
                    border: '1px solid rgba(255,255,255,0.4)',
                    color: 'rgba(0,0,0,0.6)',
                  },
                }}
              />

              {/* 3x3 Grid Overlay - visible only during interaction */}
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-300"
                style={{ opacity: isCropInteracting ? 1 : 0 }}
              >
                <div
                  className="relative"
                  style={{
                    width: cropAspect >= 1 ? '70%' : `${70 * cropAspect}%`,
                    aspectRatio: `${cropAspect}`,
                    maxHeight: '80%',
                  }}
                >
                  <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/40" />
                  <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/40" />
                  <div className="absolute left-0 right-0 top-1/3 h-px bg-white/40" />
                  <div className="absolute left-0 right-0 top-2/3 h-px bg-white/40" />
                </div>
              </div>
            </div>

            {/* Aspect Ratio Presets */}
            <div className="flex items-center justify-center gap-3 px-5 py-3 border-t border-gray-100">
              <span className="text-xs text-gray-400 mr-1">Ratio:</span>
              <button
                onClick={() => { setCropAspect(1); setCrop({ x: 0, y: 0 }); setZoom(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  cropAspect === 1 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                1:1
              </button>
              <button
                onClick={() => { setCropAspect(4 / 5); setCrop({ x: 0, y: 0 }); setZoom(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  cropAspect === 4 / 5 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                4:5
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-5 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setCropImage(null);
                  setCropAspect(1);
                  setIsCropInteracting(false);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCropSave}
                disabled={isSavingCrop}
                className="flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-colors disabled:opacity-60"
                style={{ backgroundColor: '#dc2626' }}
              >
                {isSavingCrop ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
