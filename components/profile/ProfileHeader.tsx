'use client';

import { useState } from 'react';
import type { NormalizedProfileData } from './types';

function getLogoDomain(companyWebsite?: string, companyName?: string): string | null {
  // Try to extract domain from company website
  if (companyWebsite) {
    try {
      const url = companyWebsite.startsWith('http') ? companyWebsite : `https://${companyWebsite}`;
      return new URL(url).hostname.replace('www.', '');
    } catch {
      // fall through
    }
  }
  // For well-known companies, try their .com domain
  if (companyName) {
    const name = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${name}.com`;
  }
  return null;
}

interface ProfileHeaderProps {
  data: NormalizedProfileData;
}

export default function ProfileHeader({ data }: ProfileHeaderProps) {
  const [logoError, setLogoError] = useState(false);

  const logoDomain = getLogoDomain(data.companyWebsite, data.companyName);
  const autoLogoUrl = logoDomain ? `https://logo.clearbit.com/${logoDomain}` : null;
  const logoSrc = data.companyLogo || autoLogoUrl;

  return (
    <div className="mb-4">
      {/* Name */}
      <h1
        className="text-white capitalize"
        style={{
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          fontWeight: 700,
          fontSize: 'clamp(36px, 10vw, 52px)',
          lineHeight: '1.0',
          letterSpacing: '-0.01em',
        }}
      >
        {data.fullName}
      </h1>

      {/* Username handle */}
      {data.username && (
        <p
          className="text-white/50 mt-2"
          style={{ fontSize: '13px' }}
        >
          @{data.username}
        </p>
      )}

      {/* Job Title */}
      {data.jobTitle && (
        <p className="text-[15px] text-white/70 mt-0.5">{data.jobTitle}</p>
      )}

      {/* Company with logo */}
      {data.companyName && (
        <div className="flex items-center gap-2.5 mt-3">
          {logoSrc && !logoError && (
            <img
              src={logoSrc}
              alt={data.companyName}
              className="w-9 h-9 rounded-lg object-cover bg-white/10"
              onError={() => setLogoError(true)}
            />
          )}
          <div className="flex flex-col">
            <span
              className="text-white font-semibold"
              style={{ fontSize: '17px' }}
            >
              {data.companyName}
            </span>
            {(data.subDomain || data.industry) && (
              <span className="text-xs text-white/45">{data.subDomain || data.industry}</span>
            )}
          </div>
        </div>
      )}

      {/* Founder's Club Badge */}
      {data.isFoundingMember && data.foundingMemberPlan && (
        <div className="mt-3 inline-flex items-center bg-gradient-to-r from-yellow-400 to-amber-500 text-black px-3 py-1.5 rounded-full shadow-md">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-xs font-bold">Founder&apos;s Club</span>
        </div>
      )}
    </div>
  );
}
