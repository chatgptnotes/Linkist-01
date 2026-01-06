'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LanguageIcon from '@mui/icons-material/Language';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import { useToast } from '@/components/ToastProvider';

const Globe = LanguageIcon;
const Close = CloseIcon;

interface SignupOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProduct: string;
}

// Helper function to format names in title case (e.g., "tom hendrik" → "Tom Hendrik")
const toTitleCase = (str: string): string => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function SignupOverlay({ isOpen, onClose, selectedProduct }: SignupOverlayProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [detectingCountry, setDetectingCountry] = useState(true);
  const [detectedCountry, setDetectedCountry] = useState<string>('India');
  const [formData, setFormData] = useState({
    email: '',
    country: 'India',
    countryCode: '+91',
    mobileNumber: '',
    firstName: '',
    lastName: ''
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [mobileError, setMobileError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [checkingMobile, setCheckingMobile] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Auto-detect country based on IP
    const detectCountry = async () => {
      try {
        setDetectingCountry(true);
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          const countryCode = data.country_code;
          let country = 'India';
          let phoneCode = '+91';

          // Map country codes to our supported countries
          if (countryCode === 'AE') {
            country = 'UAE';
            phoneCode = '+971';
          } else if (countryCode === 'US') {
            country = 'USA';
            phoneCode = '+1';
          } else if (countryCode === 'GB') {
            country = 'UK';
            phoneCode = '+44';
          } else if (countryCode === 'IN') {
            country = 'India';
            phoneCode = '+91';
          }

          setDetectedCountry(country);
          setFormData(prev => ({
            ...prev,
            country,
            countryCode: phoneCode
          }));
        }
      } catch (error) {
        console.error('Country detection error:', error);
        // Keep default India
      } finally {
        setDetectingCountry(false);
      }
    };

    detectCountry();
  }, [isOpen]);

  // Check if email already exists
  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) return;

    setCheckingEmail(true);
    try {
      const response = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setEmailError('This email is already registered. Please login instead.');
          showToast('This email is already registered. Please login.', 'error');
        } else {
          setEmailError('');
        }
      }
    } catch (error) {
      console.error('Email check error:', error);
    } finally {
      setCheckingEmail(false);
    }
  };

  // Check if mobile number already exists
  const checkMobileExists = async (mobile: string) => {
    if (!mobile || mobile.length < 8) return;

    setCheckingMobile(true);
    try {
      const fullMobile = `${formData.countryCode}${mobile.replace(/\s/g, '')}`;
      const response = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: fullMobile })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          setMobileError('This mobile number is already registered. Please login instead.');
          showToast('This mobile number is already registered. Please login.', 'error');
        } else {
          // Only clear if no validation error
          const validationError = validateMobileNumber(mobile, formData.country);
          if (!validationError) {
            setMobileError('');
          }
        }
      }
    } catch (error) {
      console.error('Mobile check error:', error);
    } finally {
      setCheckingMobile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (loading) {
      console.log('Form submission already in progress, ignoring duplicate call');
      return;
    }

    // Show validation errors
    setShowValidationErrors(true);

    // Check if there are any existing errors
    if (emailError || mobileError) {
      showToast('Please fix the errors before continuing.', 'error');
      return;
    }

    // Validate mobile number
    const validationError = validateMobileNumber(formData.mobileNumber, formData.country);
    if (validationError) {
      setMobileError(validationError);
      showToast(validationError, 'error');
      return;
    }

    setMobileError('');
    setLoading(true);

    try {
      const fullMobile = `${formData.countryCode}${formData.mobileNumber.replace(/\s/g, '')}`;

      // Double-check if user already exists (in case onBlur didn't trigger)
      const checkResponse = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, mobile: fullMobile })
      });

      if (!checkResponse.ok) {
        showToast('Failed to verify user information. Please try again.', 'error');
        setLoading(false);
        return;
      }

      const checkData = await checkResponse.json();

      if (checkData.exists) {
        // User already exists - ask them to login
        setEmailError('This email is already registered. Please login instead.');
        showToast('This email is already registered. Please login instead.', 'error');
        setLoading(false);

        // Optionally redirect to login page
        setTimeout(() => {
          router.push('/login');
        }, 2500);
        return;
      }

      // Step 1: Register new user (no password - OTP-based authentication)
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: fullMobile,
        }),
      });

      if (!registerResponse.ok) {
        const registerData = await registerResponse.json();
        showToast(registerData.error || 'Failed to create account. Please try again.', 'error');
        setLoading(false);
        return;
      }

      // Registration successful - redirect to mobile verification
      console.log('User registered successfully, redirecting to mobile verification');

      // Mark as onboarded
      localStorage.setItem('userOnboarded', 'true');

      // Store user profile data
      localStorage.setItem('userProfile', JSON.stringify({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        country: formData.country,
        mobile: fullMobile
      }));

      // Store login identifier for OTP verification
      localStorage.setItem('loginIdentifier', fullMobile);

      // Keep pendingProductFlow flag set (already set in product-selection page)
      // This will be used after verification to redirect to the correct page

      // Redirect to mobile verification with phone number
      router.push(`/verify-mobile?phone=${encodeURIComponent(fullMobile)}`);
    } catch (error) {
      console.error('Registration error:', error);
      showToast('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Clear the pending flow flags when closing
    localStorage.removeItem('pendingProductFlow');
    onClose();
  };

  // Get placeholder based on country
  const getMobilePlaceholder = () => {
    switch (formData.country) {
      case 'India':
        return '98765 43210';
      case 'UAE':
        return '50 123 4567';
      case 'USA':
        return '555 123 4567';
      case 'UK':
        return '7700 900123';
      default:
        return '123456789';
    }
  };

  // Validate mobile number based on country
  const validateMobileNumber = (number: string, country: string): string | null => {
    // Remove spaces and non-digits for validation
    const cleanNumber = number.replace(/\s/g, '');

    switch (country) {
      case 'India':
        // India: 10 digits, should start with 6-9
        if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
          return 'Indian mobile numbers must be 10 digits starting with 6-9';
        }
        break;
      case 'UAE':
        // UAE: 9 digits, typically starts with 5
        if (!/^[5]\d{8}$/.test(cleanNumber)) {
          return 'UAE mobile numbers must be 9 digits starting with 5';
        }
        break;
      case 'USA':
        // USA: 10 digits
        if (!/^\d{10}$/.test(cleanNumber)) {
          return 'USA mobile numbers must be 10 digits';
        }
        break;
      case 'UK':
        // UK: 10 digits, typically starts with 7
        if (!/^[7]\d{9}$/.test(cleanNumber)) {
          return 'UK mobile numbers must be 10 digits starting with 7';
        }
        break;
    }
    return null;
  };

  // Get terms text based on country
  const getTermsText = () => {
    switch (formData.country) {
      case 'India':
        return 'All transactions are subject to Indian tax laws.';
      case 'UAE':
        return 'All transactions are subject to UAE tax laws and regulations.';
      case 'USA':
        return 'All transactions are subject to US federal and state tax laws.';
      case 'UK':
        return 'All transactions are subject to UK tax laws and HMRC regulations.';
      default:
        return 'All transactions are subject to local tax laws.';
    }
  };

  // Get missing required fields
  const getMissingFields = () => {
    const missing: string[] = [];
    if (!formData.email) missing.push('Email');
    if (!formData.firstName) missing.push('First Name');
    if (!formData.lastName) missing.push('Last Name');
    if (!formData.mobileNumber) missing.push('Mobile Number');
    if (!termsAccepted) missing.push('Terms & Conditions');
    return missing;
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.email &&
      formData.firstName &&
      formData.lastName &&
      formData.mobileNumber &&
      termsAccepted &&
      !emailError &&
      !mobileError
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto overflow-x-hidden">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-4 sm:p-6 relative my-8 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer z-10"
        >
          <Close className="w-6 h-6" />
        </button>

        {/* Title */}
        <div className="text-center mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Welcome to Linkist</h1>
          <p className="text-xs sm:text-sm text-gray-600">Please confirm your country to begin.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Country Detection - Full Width */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mb-4">
            <div className="flex items-start justify-center">
              <Globe className="h-4 w-4 text-blue-500 mt-0.5 mr-2" />
              <div className="text-xs text-gray-700">
                {detectingCountry ? (
                  <>Detecting your country...</>
                ) : (
                  <>
                    We've auto-detected your country as <strong>{detectedCountry}</strong>.
                    You can change it below.
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Country Selector */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Country / Region
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => {
                    const country = e.target.value;
                    let code = '+91';
                    if (country === 'UAE') code = '+971';
                    else if (country === 'USA') code = '+1';
                    else if (country === 'UK') code = '+44';
                    setFormData({ ...formData, country, countryCode: code });
                    setMobileError(''); // Clear error when country changes
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="India">India (INR)</option>
                  <option value="UAE">UAE (AED)</option>
                  <option value="USA">USA (USD)</option>
                  <option value="UK">UK (GBP)</option>
                </select>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="w-20">
                    <input
                      type="text"
                      value={formData.countryCode}
                      readOnly
                      className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-center"
                    />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      placeholder={getMobilePlaceholder()}
                      value={formData.mobileNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9\s]/g, '');
                        setFormData({ ...formData, mobileNumber: value });
                        setMobileError(''); // Clear error on input
                      }}
                      onBlur={(e) => checkMobileExists(e.target.value)}
                      pattern="[0-9\s]+"
                      title="Mobile number should only contain numbers"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                        mobileError || (showValidationErrors && !formData.mobileNumber) ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    />
                    {checkingMobile && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      </div>
                    )}
                  </div>
                </div>
                {mobileError && (
                  <div className="mt-1 flex items-start gap-1">
                    <p className="text-xs text-red-600 flex-1">{mobileError}</p>
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap"
                    >
                      Login
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="e.g., alex@example.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setEmailError('');
                    }}
                    onBlur={(e) => checkEmailExists(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      emailError || (showValidationErrors && !formData.email) ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {checkingEmail && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                    </div>
                  )}
                </div>
                {emailError && (
                  <div className="mt-1 flex items-start gap-1">
                    <p className="text-xs text-red-600 flex-1">{emailError}</p>
                    <button
                      type="button"
                      onClick={() => router.push('/login')}
                      className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap"
                    >
                      Login
                    </button>
                  </div>
                )}
              </div>

              {/* First Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., Alex"
                    value={formData.firstName}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[0-9]/g, '');
                      setFormData({ ...formData, firstName: toTitleCase(value) });
                    }}
                    minLength={2}
                    maxLength={30}
                    pattern="[A-Za-z\s]+"
                    title="Name should only contain letters"
                    className={`w-full px-3 py-2 pr-12 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      showValidationErrors && !formData.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    {formData.firstName.length} / 30
                  </span>
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., Thomas"
                    value={formData.lastName}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[0-9]/g, '');
                      setFormData({ ...formData, lastName: toTitleCase(value) });
                    }}
                    minLength={2}
                    maxLength={30}
                    pattern="[A-Za-z\s]+"
                    title="Name should only contain letters"
                    className={`w-full px-3 py-2 pr-12 text-sm border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      showValidationErrors && !formData.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    {formData.lastName.length} / 30
                  </span>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
                showValidationErrors && !termsAccepted ? 'bg-red-50 border border-red-300' : ''
              }`}>
                <input
                  type="checkbox"
                  id="termsCheckbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <label htmlFor="termsCheckbox" className="text-[10px] text-gray-600 cursor-pointer leading-relaxed">
                  <span className="text-red-500 font-semibold">* </span>
                  I agree to Linkist's{' '}
                  <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                    Privacy Policy
                  </a>
                  , and to receive OTP messages via SMS and WhatsApp. {getTermsText()}
                </label>
              </div>
              {showValidationErrors && !termsAccepted && (
                <p className="text-xs text-red-600 mt-1 ml-6">Please accept the terms and conditions to continue</p>
              )}
            </div>
          </div>

          {/* Validation Helper Text */}
          {!isFormValid() && (showValidationErrors || (!formData.email || !formData.firstName || !formData.lastName || !formData.mobileNumber || !termsAccepted)) && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-amber-800 mb-1">Please complete the following:</p>
                  <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
                    {getMissingFields().map((field, idx) => (
                      <li key={idx}>{field}</li>
                    ))}
                    {emailError && <li className="text-red-600">{emailError}</li>}
                    {mobileError && <li className="text-red-600">{mobileError}</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-6 justify-center">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              style={{ backgroundColor: '#6B7280', color: '#FFFFFF' }}
            >
              Reject
            </button>
            <button
              type="submit"
              disabled={loading || !termsAccepted || !!emailError || !!mobileError}
              className="w-full sm:w-auto px-6 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 cursor-pointer flex items-center justify-center"
              style={{ backgroundColor: (loading || !termsAccepted || emailError || mobileError) ? '#9CA3AF' : '#DC2626', color: '#FFFFFF' }}
              title={!isFormValid() ? `Please complete: ${getMissingFields().join(', ')}` : ''}
            >
              {loading ? (
                <CircularProgress size={16} style={{ color: 'white' }} />
              ) : (
                'Agree & Continue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
