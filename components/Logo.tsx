'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  href?: string;
  className?: string;
  imageClassName?: string;
  width?: number;
  height?: number;
  noLink?: boolean; // Add flag to disable Link wrapper
  variant?: 'light' | 'dark'; // light = for white bg (dark text), dark = for dark bg (white text)
}

export default function Logo({
  href = '/',
  className = '',
  imageClassName = '',
  width = 120,
  height = 40,
  noLink = false,
  variant = 'dark', // Default to dark (white text for dark backgrounds)
}: LogoProps) {
  // Use logo1.png for light backgrounds (has dark text), new SVG for dark backgrounds (has white text)
  const logoSrc = variant === 'light' ? '/logo1.png' : '/Linkist Full Logo SVG (1).svg';

  const imageElement = (
    <Image
      src={logoSrc}
      alt="Linkist"
      width={width}
      height={height}
      className={imageClassName}
      style={{ width: `${width}px`, height: 'auto', maxHeight: `${height}px` }}
      priority
    />
  );

  if (noLink) {
    return (
      <div className={`flex items-center ${className}`}>
        {imageElement}
      </div>
    );
  }

  return (
    <Link href={href} className={`flex items-center ${className}`}>
      {imageElement}
    </Link>
  );
}
