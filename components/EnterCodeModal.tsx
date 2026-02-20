'use client';

import { useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CircularProgress from '@mui/material/CircularProgress';

interface EnterCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (validatedData: { code: string; email: string }) => void;
}

export default function EnterCodeModal({ isOpen, onClose, onSuccess }: EnterCodeModalProps) {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Format code to uppercase and add prefix if not present
    let formattedCode = code.toUpperCase().trim();
    if (!formattedCode.startsWith('FC-')) {
      formattedCode = `FC-${formattedCode}`;
    }

    try {
      // Use the activate endpoint which validates code AND creates account/session
      const response = await fetch('/api/founders/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formattedCode,
          email: email.trim().toLowerCase()
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        // Store validated code and user data in localStorage
        localStorage.setItem('foundersClubCode', formattedCode);
        localStorage.setItem('foundersClubEmail', email.trim().toLowerCase());
        // NOTE: Founding member status is verified via API (/api/auth/me), not localStorage

        // Store user profile if returned
        if (data.user) {
          localStorage.setItem('userProfile', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            firstName: data.user.first_name,
            lastName: data.user.last_name,
            mobile: data.user.phone_number,
            phone: data.user.phone_number,
          }));
        }

        setTimeout(() => {
          onSuccess({ code: formattedCode, email: email.trim().toLowerCase() });
        }, 1500);
      } else {
        setError(data.error || 'Invalid or expired code. Please check and try again.');
      }
    } catch (err) {
      console.error('Error activating founders account:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setEmail('');
    setError('');
    setSuccess(false);
    onClose();
  };

  // Format code input (add dashes, uppercase)
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');

    // Remove FC- prefix for easier input, we'll add it back
    if (value.startsWith('FC-')) {
      value = value.slice(3);
    }

    // Limit to 8 characters (excluding FC- prefix)
    if (value.length > 8) {
      value = value.slice(0, 8);
    }

    setCode(value);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {success ? (
          // Success State
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Founders Circle!
            </h2>
            <p className="text-gray-600 mb-4">
              Your code has been verified. You now have access to exclusive Founders Circle benefits.
            </p>
            <div className="animate-pulse text-sm text-gray-500">
              Unlocking Founders Circle...
            </div>
          </div>
        ) : (
          // Form State
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 mb-4">
                <VpnKeyIcon className="w-7 h-7 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Enter Your Invite Code
              </h2>
              <p className="text-gray-600 text-sm">
                Enter the invite code you received via email to unlock Founders Circle access.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <ErrorIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  required
                  placeholder="Enter the email you used to request access"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This must match the email you used when requesting access
                </p>
              </div>

              {/* Code Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invite Code <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-lg">
                    FC-
                  </span>
                  <input
                    type="text"
                    value={code}
                    onChange={handleCodeChange}
                    required
                    placeholder="XXXXXXXX"
                    className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-lg tracking-wider text-center text-gray-900 placeholder-gray-400"
                    maxLength={8}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  8-character code from your invite email
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || code.length < 8 || !email}
                className="w-full py-3 px-6 rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700"
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} style={{ color: 'white' }} />
                    <span className="ml-2">Validating...</span>
                  </>
                ) : (
                  'Verify Code'
                )}
              </button>

              {/* Help Text */}
              <p className="text-center text-xs text-gray-500">
                Don't have a code?{' '}
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-red-600 hover:underline font-medium"
                >
                  Request Access
                </button>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
