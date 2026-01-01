'use client';

import { useCallback, useRef } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';

interface CompanyLogoUploadProps {
  companyLogoUrl: string | null;
  isUploading: boolean;
  error: string | null;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export default function CompanyLogoUpload({
  companyLogoUrl,
  isUploading,
  error,
  onUpload,
  onRemove
}: CompanyLogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 500KB)
    if (file.size > 500 * 1024) {
      alert('File size must be less than 500KB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only PNG, JPG, and SVG files are allowed');
      return;
    }

    onUpload(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onUpload]);

  return (
    <div>
      <label className="text-sm font-semibold text-gray-700 flex items-center mb-2">
        <BusinessIcon className="w-4 h-4 mr-2" />
        Company Logo
      </label>
      <p className="text-xs text-gray-500 mb-3">
        Upload your company logo to replace the Linkist logo on card back (max 500KB, PNG/JPG/SVG)
      </p>

      {!companyLogoUrl ? (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            onChange={handleFileSelect}
            className="hidden"
            id="company-logo-upload"
          />
          <label
            htmlFor="company-logo-upload"
            className={`flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isUploading
                ? 'border-gray-300 bg-gray-50'
                : 'border-gray-300 hover:border-amber-500 hover:bg-amber-50'
            }`}
          >
            {isUploading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-amber-500 mr-2"></div>
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            ) : (
              <div className="text-center">
                <CloudUploadIcon className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <span className="text-sm text-gray-600">Click to upload logo</span>
              </div>
            )}
          </label>
        </div>
      ) : (
        <div className="relative inline-block">
          <img
            src={companyLogoUrl}
            alt="Company Logo"
            className="h-20 w-auto object-contain rounded-lg border border-gray-200"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-2 -right-2 p-1 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100 transition-colors shadow-sm"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-2">{error}</p>
      )}
    </div>
  );
}
