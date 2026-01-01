function detectCountryCodeFromNumber(phoneNumber) {
  console.log('🔍 Testing detectCountryCodeFromNumber with:', phoneNumber);

  if (!phoneNumber) {
    console.log('❌ Empty phone number, returning default +971');
    return { countryCode: '+971', number: '' };
  }

  const cleaned = phoneNumber.trim().replace(/[\s-()]/g, '');
  console.log('🧹 Cleaned phone number:', cleaned);

  const countryCodes = [
    '+971', '+966', '+974', '+965', '+968', '+973', '+91', '+1', '+44',
    '+20', '+86', '+81', '+82', '+92', '+880', '+94'
  ];

  // First check if number starts with + and a country code
  for (const code of countryCodes) {
    if (cleaned.startsWith(code)) {
      const numberWithoutCode = cleaned.substring(code.length);
      console.log('✅ Detected country code (with +):', code, '| Number:', numberWithoutCode);
      return { countryCode: code, number: numberWithoutCode };
    }
  }

  // If no + prefix, check if number starts with country code digits (without +)
  for (const code of countryCodes) {
    const codeDigits = code.substring(1);
    if (cleaned.startsWith(codeDigits)) {
      const numberWithoutCode = cleaned.substring(codeDigits.length);
      console.log('✅ Detected country code (without +):', code, '| Number:', numberWithoutCode);
      return { countryCode: code, number: numberWithoutCode };
    }
  }

  console.log('⚠️ No country code detected, defaulting to +971');
  return { countryCode: '+971', number: cleaned.startsWith('+') ? cleaned.substring(1) : cleaned };
}

// Test cases
console.log('\n=== Test 1: +918999355932 ===');
console.log('Result:', detectCountryCodeFromNumber('+918999355932'));

console.log('\n=== Test 2: 918999355932 ===');
console.log('Result:', detectCountryCodeFromNumber('918999355932'));

console.log('\n=== Test 3: +971501234567 ===');
console.log('Result:', detectCountryCodeFromNumber('+971501234567'));

console.log('\n=== Test 4: 971501234567 ===');
console.log('Result:', detectCountryCodeFromNumber('971501234567'));
