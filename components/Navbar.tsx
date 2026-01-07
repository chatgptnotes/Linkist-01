'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Logo from './Logo';
import { toast } from 'sonner';

export default function Navbar() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isJoinLoading, setIsJoinLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store'
        }).catch(() => null); // Suppress fetch errors in console

        if (!response) {
          setIsLoggedIn(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(data.isAuthenticated);
          if (data.isAuthenticated && data.user) {
            setUserData({
              email: data.user.email,
              firstName: data.user.first_name,
              lastName: data.user.last_name,
            });
          }
        } else {
          // 401 is expected when not logged in
          setIsLoggedIn(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };

    checkAuth();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsDropdownOpen(false);

    try {
      // Clear localStorage
      localStorage.removeItem('userOnboarded');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('session');
      localStorage.removeItem('claimedUsername');
      localStorage.removeItem('profileUrl');

      // Call logout API
      await fetch('/api/auth/logout', { method: 'POST' });

      // Update state
      setIsLoggedIn(false);
      setUserData(null);

      // Show success message
      toast.success('Logged out successfully!');

      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-[#1A1A1A]/90 backdrop-blur-sm border-b border-white/10 z-50 h-16 w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between">
        {/* Logo - Responsive sizing */}
        <div className="flex items-center">
          <div className="hidden md:block">
            <Logo width={140} height={45} variant="dark" />
          </div>
          <div className="block md:hidden">
            <Logo width={110} height={36} variant="dark" />
          </div>
        </div>

        {/* Desktop Auth Buttons - Hidden on mobile */}
        {!isLoggedIn && (
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => {
                setIsLoginLoading(true);
                router.push('/login');
              }}
              disabled={isLoginLoading}
              className="text-white/90 hover:text-white font-medium text-base transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoginLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              )}
              Login
            </button>
            <button
              onClick={() => {
                setIsJoinLoading(true);
                router.push('/choose-plan');
              }}
              disabled={isJoinLoading}
              className="bg-[#C84C4C] hover:bg-[#B43E3E] text-white font-medium text-base px-7 py-2.5 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isJoinLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              )}
              Join Now
            </button>
          </div>
        )}

        {/* Mobile Hamburger Button */}
        {!isLoggedIn && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-white/90 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        )}

        {/* User Dropdown - Only show if user is logged in */}
        {isLoggedIn && userData && (
          <div className="relative" ref={dropdownRef}>
            {/* User Avatar Button */}
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-[#C84C4C] flex items-center justify-center text-white text-sm font-semibold">
                {userData.firstName
                  ? `${userData.firstName[0]}`.toUpperCase()
                  : userData.email?.[0].toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-white/90 font-medium">
                {userData.firstName
                  ? userData.firstName.toLowerCase()
                  : userData.email?.split('@')[0] || 'user'}
              </span>
              {/* Dropdown Arrow */}
              <svg
                className={`w-4 h-4 text-white/60 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-sm font-semibold">
                      {userData.firstName && userData.lastName
                        ? `${userData.firstName[0]}`.toUpperCase()
                        : userData.email?.[0].toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {userData.firstName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {userData.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  {/* Profile Builder */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push('/profiles/builder');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile Builder
                  </button>

                  {/* Dashboard */}
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      router.push('/profile-dashboard');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </button>

                  {/* Divider */}
                  <div className="my-1 border-t border-gray-100"></div>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoggingOut ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        <span>Logging out...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && !isLoggedIn && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-[#1A1A1A]/95 backdrop-blur-sm border-b border-white/10 px-4 py-4 space-y-3">
          <button
            onClick={() => {
              setIsLoginLoading(true);
              setIsMobileMenuOpen(false);
              router.push('/login');
            }}
            disabled={isLoginLoading}
            className="w-full text-center py-3 text-white/90 hover:text-white font-medium text-base transition-colors border border-white/20 rounded-full hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoginLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            )}
            Login
          </button>
          <button
            onClick={() => {
              setIsJoinLoading(true);
              setIsMobileMenuOpen(false);
              router.push('/choose-plan');
            }}
            disabled={isJoinLoading}
            className="w-full text-center py-3 bg-[#C84C4C] hover:bg-[#B43E3E] text-white font-medium text-base rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isJoinLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
            )}
            Join Now
          </button>
        </div>
      )}
    </nav>
  );
}
