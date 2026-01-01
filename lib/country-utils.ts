/**
 * Country Utilities
 * Single source of truth for country detection, normalization, and tax rates
 * Ensures backward compatibility with both ISO codes ('IN') and full names ('India')
 */

// Country code to name mapping
export const COUNTRY_CODE_MAP: Record<string, string> = {
  IN: 'India',
  AE: 'UAE',
  US: 'USA',
  GB: 'UK',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  SG: 'Singapore',
};

// Reverse mapping: name to code
export const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  'India': 'IN',
  'UAE': 'AE',
  'United Arab Emirates': 'AE',
  'USA': 'US',
  'United States': 'US',
  'UK': 'GB',
  'United Kingdom': 'GB',
  'Canada': 'CA',
  'Australia': 'AU',
  'Germany': 'DE',
  'France': 'FR',
  'Singapore': 'SG',
};

// Phone codes by country
export const PHONE_CODES: Record<string, string> = {
  IN: '+91',
  AE: '+971',
  US: '+1',
  GB: '+44',
  CA: '+1',
  AU: '+61',
  DE: '+49',
  FR: '+33',
  SG: '+65',
};

// Tax rate configuration
// SIMPLIFIED: India = 18% GST, All others = 5% VAT
export const INDIA_TAX_RATE = 0.18;
export const DEFAULT_TAX_RATE = 0.05;

export interface TaxInfo {
  rate: number;
  label: string;
}

/**
 * Normalize country input to ISO 2-letter code
 * Handles both formats: 'IN' or 'India'
 */
export function normalizeCountryCode(country: string | undefined | null): string {
  if (!country) return 'IN'; // Default to India

  const trimmed = country.trim();

  // Already a 2-letter code
  if (trimmed.length === 2) {
    return trimmed.toUpperCase();
  }

  // Full name - convert to code
  const code = COUNTRY_NAME_TO_CODE[trimmed];
  if (code) return code;

  // Check if it matches any key case-insensitively
  const upperTrimmed = trimmed.toUpperCase();
  for (const [name, code] of Object.entries(COUNTRY_NAME_TO_CODE)) {
    if (name.toUpperCase() === upperTrimmed) {
      return code;
    }
  }

  // Unknown country - return as-is (uppercase if 2 chars)
  return trimmed.length === 2 ? trimmed.toUpperCase() : trimmed;
}

/**
 * Get country name from code or name
 * Returns the display name for the country
 */
export function getCountryName(country: string | undefined | null): string {
  if (!country) return 'India';

  const code = normalizeCountryCode(country);
  return COUNTRY_CODE_MAP[code] || country;
}

/**
 * Get phone code for a country
 */
export function getPhoneCode(country: string | undefined | null): string {
  const code = normalizeCountryCode(country);
  return PHONE_CODES[code] || '+1'; // Default to US
}

/**
 * Check if country is India
 * Handles both 'IN' and 'India' formats
 */
export function isIndia(country: string | undefined | null): boolean {
  const code = normalizeCountryCode(country);
  return code === 'IN';
}

/**
 * Get tax rate and label for a country
 * SIMPLIFIED: India = 18% GST, All others = 5% VAT
 */
export function getTaxRate(country: string | undefined | null): TaxInfo {
  if (isIndia(country)) {
    return {
      rate: INDIA_TAX_RATE,
      label: 'GST (18%)',
    };
  }

  return {
    rate: DEFAULT_TAX_RATE,
    label: 'VAT (5%)',
  };
}

/**
 * Calculate tax amount for a given subtotal and country
 */
export function calculateTax(subtotal: number, country: string | undefined | null): {
  taxAmount: number;
  taxRate: number;
  taxLabel: string;
} {
  const { rate, label } = getTaxRate(country);
  const taxAmount = Math.round(subtotal * rate * 100) / 100;

  return {
    taxAmount,
    taxRate: rate,
    taxLabel: label,
  };
}

/**
 * Detect country from IP using ipapi.co
 * Returns country code (e.g., 'IN', 'US')
 */
export async function detectCountryFromIP(): Promise<{
  countryCode: string;
  countryName: string;
  phoneCode: string;
}> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      throw new Error('Failed to detect country');
    }

    const data = await response.json();
    const countryCode = data.country_code || 'IN';

    return {
      countryCode,
      countryName: getCountryName(countryCode),
      phoneCode: getPhoneCode(countryCode),
    };
  } catch (error) {
    // Default to India on error
    console.warn('Country detection failed, defaulting to India:', error);
    return {
      countryCode: 'IN',
      countryName: 'India',
      phoneCode: '+91',
    };
  }
}

/**
 * Get currency based on country
 */
export function getCurrency(country: string | undefined | null): 'INR' | 'USD' {
  return isIndia(country) ? 'INR' : 'USD';
}

/**
 * Allowed countries for physical card shipping
 */
export const ALLOWED_PHYSICAL_CARD_COUNTRIES = ['India', 'UAE', 'USA', 'UK'];

/**
 * Check if physical cards can be shipped to a country
 */
export function canShipPhysicalCard(country: string | undefined | null): boolean {
  const name = getCountryName(country);
  return ALLOWED_PHYSICAL_CARD_COUNTRIES.includes(name);
}
