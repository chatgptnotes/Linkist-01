'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import CircularProgress from '@mui/material/CircularProgress';
import Logo from '@/components/Logo';
import { Toaster, toast } from 'sonner';

const CheckCircle = CheckCircleIcon;
const Info = InfoIcon;
const Person = PersonIcon;

export default function ClaimURLPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fullName, setFullName] = useState('Jane Doe');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('UX/UI Design Lead');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [baseDomain, setBaseDomain] = useState('linkist.com');
  const [baseOrigin, setBaseOrigin] = useState('');

  // Set dynamic base domain from current URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseDomain(window.location.host);
      setBaseOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    // Get user profile info from localStorage (actual user name, not card name)
    const userProfileData = localStorage.getItem('userProfile');
    const orderData = localStorage.getItem('lastCompletedOrder');

    let first = '';
    let last = '';
    let userEmail = '';

    // Priority 1: Use actual user profile data (from registration/welcome flow)
    if (userProfileData) {
      const userProfile = JSON.parse(userProfileData);
      first = userProfile.firstName || '';
      last = userProfile.lastName || '';
      userEmail = userProfile.email || '';

      setFirstName(first);
      setLastName(last);
      setFullName(`${first} ${last}`.trim());
      setEmail(userEmail);
    }

    // Priority 2: Fallback to order data if no user profile (use shipping name, NOT card name)
    if (!first && !last && orderData) {
      const order = JSON.parse(orderData);

      // Use shipping full name (actual profile name), NOT cardConfig.fullName (card name)
      const shippingFullName = order.shipping?.fullName || order.customerName || '';
      if (shippingFullName) {
        setFullName(shippingFullName);
        const nameParts = shippingFullName.split(' ');
        first = nameParts[0] || '';
        last = nameParts.slice(1).join(' ') || '';
        setFirstName(first);
        setLastName(last);
      }

      // Get email
      if (order.shipping?.email || order.email) {
        userEmail = order.shipping?.email || order.email;
        setEmail(userEmail);
      }
    }

    // Generate username suggestion from first and last name
    if (first && last) {
      const suggestedUsername = `${first}-${last}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '');

      if (suggestedUsername && suggestedUsername.length >= 3) {
        setUsername(suggestedUsername);
        handleUsernameChange(suggestedUsername, userEmail);
      }
    }
  }, []);

  const generateSuggestions = (baseUsername: string, first: string, last: string) => {
    const suggestions: string[] = [];
    const randomNum = Math.floor(Math.random() * 999) + 1;
    const currentYear = new Date().getFullYear();

    // Add number suffix
    suggestions.push(`${baseUsername}${randomNum}`);
    suggestions.push(`${baseUsername}-${randomNum}`);

    // Add year
    suggestions.push(`${baseUsername}${currentYear}`);

    // First name + random number
    if (first) {
      suggestions.push(`${first.toLowerCase()}${randomNum}`);
      suggestions.push(`${first.toLowerCase()}-${last.toLowerCase()}`);
    }

    // Add "official" or "real"
    suggestions.push(`${baseUsername}-official`);

    // Return first 5 unique suggestions
    return [...new Set(suggestions)].slice(0, 5);
  };

  const validateUsername = (value: string) => {
    // Must be between 3 and 30 characters
    if (value.length < 3 || value.length > 30) {
      return 'Must be between 3 and 30 characters.';
    }

    // Can only contain letters, numbers, and hyphens
    if (!/^[a-z0-9-]+$/.test(value)) {
      return 'Can only contain letters (a-z), numbers (0-9), and hyphens (-).';
    }

    // Cannot start or end with a hyphen
    if (value.startsWith('-') || value.endsWith('-')) {
      return 'Cannot start or end with a hyphen.';
    }

    return '';
  };

  const handleUsernameChange = async (value: string, userEmail?: string) => {
    const lowercaseValue = value.toLowerCase();
    setUsername(lowercaseValue);
    setIsAvailable(false);
    setErrorMessage('');

    if (!lowercaseValue) {
      return;
    }

    const validationError = validateUsername(lowercaseValue);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    // Use passed email or fall back to state
    const emailToCheck = userEmail || email;

    // Check availability
    setIsChecking(true);
    try {
      const response = await fetch('/api/claim-url/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: lowercaseValue, email: emailToCheck }),
      });

      const data = await response.json();
      if (data.available) {
        setIsAvailable(true);
        setErrorMessage('');
        setSuggestions([]);
      } else {
        setIsAvailable(false);
        setErrorMessage('This username is already taken.');

        // Generate alternative suggestions
        const alternativeSuggestions = generateSuggestions(lowercaseValue, firstName, lastName);
        setSuggestions(alternativeSuggestions);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      // For now, assume available if API fails
      setIsAvailable(true);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSaveURL = async () => {
    if (!username || !isAvailable || errorMessage) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/claim-url/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          firstName,
          lastName,
          email,
          baseOrigin
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store the claimed username and full URL in localStorage
        localStorage.setItem('claimedUsername', username);
        localStorage.setItem('profileUrl', data.profileUrl);

        // Redirect to profile builder after a short delay
        setTimeout(() => {
          router.push('/profiles/builder');
        }, 1500);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'Failed to save username');
        toast.error(data.error || 'Failed to save username');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error saving username:', error);
      setErrorMessage('Failed to save username. Please try again.');
      toast.error('Failed to save username. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster position="top-center" richColors />

      {/* Simple Logo-only Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4">
          <Logo width={140} height={45} variant="light" />
        </div>
      </div>

      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <div className="max-w-2xl w-full">
        {/* Claim URL Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
           Choose Your Linkist Identity
          </h1>
          <p className="text-gray-600 mb-8">
            Change description to “Your Linkist ID is your personal digital handshake. Make it memorable.
          </p>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Your public profile URL
            </label>
            <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-500 transition-colors">
              <span className="bg-gray-100 text-gray-600 px-4 py-3 text-sm font-medium border-r border-gray-300">
                {baseDomain}/
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="jane-doe"
                className="flex-1 px-4 py-3 text-gray-900 outline-none"
              />
              {isAvailable && username && !errorMessage && (
                <div className="px-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              )}
            </div>

            {/* Name Suggestion Hint */}
            {firstName && lastName && (
              <p className="text-gray-500 text-xs mt-2">
                Suggested based on your name: {firstName} {lastName}
              </p>
            )}

            {/* Success Message */}
            {isAvailable && username && !errorMessage && (
              <p className="text-green-600 text-sm mt-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Sweet! {baseDomain}/{username} is available.
              </p>
            )}

            {/* Error Message */}
            {errorMessage && (
              <p className="text-red-600 text-sm mt-2">
                {errorMessage}
              </p>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Try these available usernames:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleUsernameChange(suggestion)}
                      className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-md text-sm hover:bg-blue-100 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading Message */}
            {isChecking && (
              <p className="text-gray-500 text-sm mt-2">
                Checking availability...
              </p>
            )}
          </div>

          {/* URL Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 text-sm mb-2">URL Guidelines</h3>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Must be between 3 and 30 characters.</li>
                  <li>• Can only contain letters (a-z), numbers (0-9), and hyphens (-).</li>
                  <li>• Cannot start or end with a hyphen.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Claim URL Button */}
          <button
            onClick={handleSaveURL}
            disabled={!isAvailable || !username || !!errorMessage || isLoading}
            style={{ backgroundColor: '#dc2626' }}
            className="w-full py-4 rounded-lg font-semibold text-white transition-all shadow-lg hover:shadow-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <CircularProgress size={24} style={{ color: 'white' }} />
            ) : (
              'Claim URL'
            )}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
