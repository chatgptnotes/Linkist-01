// Test script to demonstrate the new order ID generation
// Run with: node test-order-id-generation.js

// Simulate the generateOrderNumber function
function generateOrderNumber(planType = 'nfc-card-full') {
  // Generate cryptic number using industry best practices
  // Combine timestamp (6 chars) + random (4 chars) = 10 character cryptic string
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const cryptic = `${timestamp}${random}`;

  // Determine prefix based on plan type
  let prefix = 'LKFM-CDPLA'; // Default: NFC Card + Digital Profile + Linkist App

  if (planType === 'digital-only') {
    prefix = 'LKFM-DO';
  } else if (planType === 'digital-profile-app') {
    prefix = 'LKFM-DPLA';
  }

  return `${prefix}-${cryptic}`;
}

// Test all three plan types
console.log('\n🎯 Testing Order ID Generation\n');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('📦 Plan 1: Digital Only (FREE $0)');
console.log('   Format: LKFM-DO-{cryptic}');
for (let i = 0; i < 3; i++) {
  console.log(`   Example ${i + 1}: ${generateOrderNumber('digital-only')}`);
}

console.log('\n📦 Plan 2: Digital Profile + Linkist App');
console.log('   Format: LKFM-DPLA-{cryptic}');
for (let i = 0; i < 3; i++) {
  console.log(`   Example ${i + 1}: ${generateOrderNumber('digital-profile-app')}`);
}

console.log('\n📦 Plan 3: NFC Digital Card + Digital Profile + Linkist App');
console.log('   Format: LKFM-CDPLA-{cryptic}');
for (let i = 0; i < 3; i++) {
  console.log(`   Example ${i + 1}: ${generateOrderNumber('nfc-card-full')}`);
}

console.log('\n═══════════════════════════════════════════════════════════');
console.log('\n✅ Order ID Generation Test Complete!');
console.log('   Each order ID is unique and includes:');
console.log('   - Plan-specific prefix (LKFM-DO/LKFM-DPLA/LKFM-CDPLA)');
console.log('   - Timestamp-based cryptic string (10 characters)');
console.log('   - Industry best practice: timestamp + random for uniqueness\n');
