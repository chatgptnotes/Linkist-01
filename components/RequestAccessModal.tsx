'use client';

import { useState, useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import NoteIcon from '@mui/icons-material/Note';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircularProgress from '@mui/material/CircularProgress';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckIcon from '@mui/icons-material/Check';
import BusinessIcon from '@mui/icons-material/Business';

const SUPPORTED_COUNTRIES = [
  { name: 'India', code: 'IN', phoneCode: '+91' },
  { name: 'UAE', code: 'AE', phoneCode: '+971' },
  { name: 'USA', code: 'US', phoneCode: '+1' },
  { name: 'UK', code: 'GB', phoneCode: '+44' },
];

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RequestAccessModal({ isOpen, onClose, onSuccess }: RequestAccessModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    countryCode: '+91',
    phone: '',
    profession: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showBenefitsPopup, setShowBenefitsPopup] = useState(false);
  const [detectingCountry, setDetectingCountry] = useState(true);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  // Auto-fill from logged-in user profile and detect country when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Auto-fill from user profile in localStorage
    try {
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        const phone = profile.mobile || profile.phoneNumber || profile.phone || '';
        // Strip country code prefix from phone if present
        let cleanPhone = phone;
        let detectedCode = '';
        for (const country of SUPPORTED_COUNTRIES) {
          if (phone.startsWith(country.phoneCode)) {
            cleanPhone = phone.slice(country.phoneCode.length).trim();
            detectedCode = country.phoneCode;
            break;
          }
        }

        setFormData(prev => ({
          ...prev,
          firstName: profile.firstName || profile.first_name || prev.firstName,
          lastName: profile.lastName || profile.last_name || prev.lastName,
          email: profile.email || prev.email,
          companyName: profile.company || profile.companyName || prev.companyName,
          phone: cleanPhone || prev.phone,
          ...(detectedCode ? { countryCode: detectedCode } : {}),
          profession: profile.title || profile.profession || profile.designation || prev.profession,
        }));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }

    // Auto-detect country based on IP
    const detectCountry = async () => {
      try {
        setDetectingCountry(true);
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          const countryCode = data.country_code;

          const matchedCountry = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
          if (matchedCountry) {
            setFormData(prev => ({
              ...prev,
              // Only set country code if not already set from user profile phone
              countryCode: prev.countryCode !== '+91' || !prev.phone ? matchedCountry.phoneCode : prev.countryCode
            }));
          }
        }
      } catch (error) {
        console.error('Country detection error:', error);
      } finally {
        setDetectingCountry(false);
      }
    };

    detectCountry();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/founders/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phone: `${formData.countryCode}${formData.phone.replace(/\s/g, '')}`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || 'Failed to submit request. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      countryCode: '+91',
      phone: '',
      profession: '',
      note: ''
    });
    setSuccess(false);
    setError('');
    setShowBenefitsPopup(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-1 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
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
              Request Submitted!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in the Founders Circle. We'll review your request and get back to you within 24-48 hours with an invite code.
            </p>
            <button
              onClick={handleClose}
              className="w-full py-3 px-6 rounded-xl font-semibold transition-all cursor-pointer"
              style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}
            >
              Close
            </button>
          </div>
        ) : (
          // Form State
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  Request Founders Circle Access
                </h2>
                <button
                  type="button"
                  onClick={() => setShowBenefitsPopup(true)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  title="View Founder's Circle benefits"
                >
                  <InfoOutlinedIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 text-sm">
                Fill in your details and we'll review your request. Approved members will receive an invite code via email.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* First Name and Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <PersonIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      placeholder="John"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <PersonIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      placeholder="Doe"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Company Name (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <BusinessIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="e.g., Acme Corporation"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <EmailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Phone Number with Country Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {/* Country Code Dropdown */}
                  <div className="w-32">
                    <select
                      value={formData.countryCode}
                      onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-gray-900 bg-white"
                    >
                      {SUPPORTED_COUNTRIES.map((country) => (
                        <option key={country.code} value={country.phoneCode}>
                          {country.phoneCode} ({country.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Phone Number Input */}
                  <div className="flex-1 relative">
                    <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="98765 43210"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-gray-900 placeholder-gray-400"
                    />
                  </div>
                </div>
                {detectingCountry && (
                  <p className="text-xs text-gray-500 mt-1">Detecting your country...</p>
                )}
              </div>

              {/* Profession */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profession / Designation <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <WorkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleChange}
                    required
                    placeholder="e.g., CEO, Software Engineer, Designer"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Note (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you want to join the Founders Circle? <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="relative">
                  <NoteIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Tell us a bit about yourself and why you're interested..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} style={{ color: 'white' }} />
                    <span className="ml-2">Submitting...</span>
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Benefits Popup Modal */}
      {showBenefitsPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowBenefitsPopup(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowBenefitsPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <CloseIcon className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-white text-xl">&#9733;</span>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Founder&apos;s Club Benefits</h2>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Lifetime subscription to Linkist Pro App</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Linkist Digital Profile</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">AI Credits worth $50</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Premium Metal Card</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Exclusive Black colour variants</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">&quot;Founding Member&quot; tag on the card</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">No expiry on AI credits</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Customisable Card</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Up to 3 Referral invites into Founding Club</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Access to Linkist Exclusive Partner Privileges</span>
              </li>
            </ul>

            <button
              onClick={() => setShowBenefitsPopup(false)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-amber-700 transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
