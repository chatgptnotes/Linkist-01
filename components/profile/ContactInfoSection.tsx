'use client';

import type { ContactItem } from './types';
import { neuStyles } from './neumorphic';

const ICON_MAP: Record<string, string> = {
  email: '/icons/mail.png',
  'secondary-email': '/icons/mail.png',
  phone: '/icons/phone.png',
  whatsapp: '/icons/phone.png',
  website: '/icons/website.png',
  location: '/icons/location.png',
};

interface ContactInfoSectionProps {
  items: ContactItem[];
}

export default function ContactInfoSection({ items }: ContactInfoSectionProps) {
  const filtered = items.filter(item => item.value && item.value.trim().length > 0);
  if (filtered.length === 0) return null;

  return (
    <div className="mb-6">
      <h3
        className="text-white mb-4"
        style={{
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          fontWeight: 600,
          fontSize: '20.37px',
          lineHeight: '24.44px',
          letterSpacing: '0%',
        }}
      >
        Contact Information
      </h3>
      <div className="flex flex-col gap-3 items-start">
        {filtered.map((item, index) => {
          const iconSrc = ICON_MAP[item.type];
          if (!iconSrc) return null;

          const content = (
            <div
              key={index}
              className="inline-flex items-center gap-2.5 px-3"
              style={{
                ...neuStyles.pill,
                height: '36.66px',
              }}
            >
              <img
                src={iconSrc}
                alt={item.type}
                className="flex-shrink-0 w-5 h-5 object-contain"
              />
              <span
                className="text-white/80"
                style={{
                  fontFamily: 'var(--font-inter), Inter, sans-serif',
                  fontWeight: 400,
                  fontSize: '15.28px',
                  lineHeight: '150%',
                  letterSpacing: '0.8%',
                }}
              >
                {item.value}
              </span>
            </div>
          );

          if (item.href) {
            return (
              <a
                key={index}
                href={item.href}
                target={item.type === 'website' || item.type === 'whatsapp' ? '_blank' : undefined}
                rel={item.type === 'website' || item.type === 'whatsapp' ? 'noopener noreferrer' : undefined}
                style={{ textDecoration: 'none' }}
              >
                {content}
              </a>
            );
          }

          return content;
        })}
      </div>
    </div>
  );
}
