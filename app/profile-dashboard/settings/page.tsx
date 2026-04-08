'use client';

import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SecurityIcon from '@mui/icons-material/Security';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/profile-dashboard" className="hover:text-gray-900">Dashboard</Link>
          <span>›</span>
          <span className="text-gray-900 font-medium">Settings</span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-gray-600 mt-1">Manage your profile visibility and privacy</p>
          </div>
          <Link
            href="/profile-dashboard"
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <ArrowBackIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </Link>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <SecurityIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">Privacy & Visibility</h3>
              <p className="text-sm text-gray-600">
                You can control the visibility of individual fields (email, phone, social links, etc.) directly in the{' '}
                <Link href="/profiles/builder" className="text-red-500 hover:text-red-600 font-medium underline">
                  Profile Builder
                </Link>
                . Each field has its own visibility toggle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
