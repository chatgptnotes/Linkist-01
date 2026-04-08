'use client';

import { useState } from 'react';
import Logo from '@/components/Logo';
import { normalizeMainProfile } from '@/components/profile/types';
import ThemeRenderer from '@/components/profile/themes/ThemeRenderer';
import type { ThemeId } from '@/components/profile/themes';

// Currency symbols mapping
const CURRENCIES = [
  { code: 'USD', symbol: '$' }, { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' }, { code: 'INR', symbol: '₹' },
  { code: 'JPY', symbol: '¥' }, { code: 'CNY', symbol: '¥' },
  { code: 'AUD', symbol: 'A$' }, { code: 'CAD', symbol: 'C$' },
  { code: 'CHF', symbol: 'CHF' }, { code: 'AED', symbol: 'AED' },
  { code: 'SAR', symbol: 'SAR' }, { code: 'SGD', symbol: 'S$' },
  { code: 'HKD', symbol: 'HK$' }, { code: 'MXN', symbol: 'MX$' },
  { code: 'BRL', symbol: 'R$' }, { code: 'ZAR', symbol: 'R' },
  { code: 'KRW', symbol: '₩' }, { code: 'SEK', symbol: 'kr' },
  { code: 'NOK', symbol: 'kr' }, { code: 'NZD', symbol: 'NZ$' },
];

export interface ProfileData {
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
  showEmailPublicly: boolean;
  showSecondaryEmailPublicly: boolean;
  showMobilePublicly: boolean;
  showWhatsappPublicly: boolean;
  showJobTitle: boolean;
  showCompanyName: boolean;
  showCompanyWebsite: boolean;
  showCompanyAddress: boolean;
  showIndustry: boolean;
  showSkills: boolean;
  showLinkedin: boolean;
  showInstagram: boolean;
  showFacebook: boolean;
  showTwitter: boolean;
  showBehance: boolean;
  showDribbble: boolean;
  showGithub: boolean;
  showYoutube: boolean;
  profilePhoto: string | null;
  backgroundImage: string | null;
  showProfilePhoto: boolean;
  showBackgroundImage: boolean;
  services?: Array<{ id: string; title: string; description: string; pricing: string; pricingUnit?: string; currency?: string; category: string; showPublicly?: boolean }>;
  certifications?: Array<{ id: string; name: string; title: string; url: string; size: number; type: string; link?: string; showPublicly: boolean }>;
  isFoundingMember?: boolean;
  foundingMemberPlan?: string | null;
  selectedTheme?: string;
}

interface ProfileViewProps {
  profileData: ProfileData | null;
  username: string;
}

export default function ProfileView({ profileData, username }: ProfileViewProps) {
  const [showToast, setShowToast] = useState(false);

  const handleShare = async () => {
    const profileUrl = typeof window !== 'undefined' ? window.location.href : '';

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
      if (error.name === 'AbortError') return;
    }

    const copyToClipboard = async (text: string): Promise<boolean> => {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
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
      } catch {
        return false;
      }
    };

    const success = await copyToClipboard(profileUrl);
    if (success) {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    }
  };

  const handleSaveToContacts = () => {
    if (!profileData || !username) return;
    window.location.href = `/api/vcard/${username}`;
  };

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
            <a
              href="/"
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium inline-block"
            >
              Go to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  const normalized = normalizeMainProfile(profileData, username);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black md:flex md:items-center md:justify-center">
      <div className="relative w-full md:w-[70%] md:min-h-screen md:rounded-3xl md:overflow-hidden">
        <ThemeRenderer
          data={normalized}
          themeId={(profileData.selectedTheme || 'bottom-sheet') as ThemeId}
          onShare={handleShare}
          onSaveContact={handleSaveToContacts}
        >

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
        </ThemeRenderer>
      </div>

      {/* Toast notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-white/15 backdrop-blur-md text-white text-sm font-medium shadow-lg animate-fade-in">
          Link copied to clipboard
        </div>
      )}
    </div>
  );
}
