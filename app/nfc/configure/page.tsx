'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import PersonIcon from '@mui/icons-material/Person';
import PaletteIcon from '@mui/icons-material/Palette';
import BrushIcon from '@mui/icons-material/Brush';
import GridOnIcon from '@mui/icons-material/GridOn';
import WarningIcon from '@mui/icons-material/Warning';
import StarsIcon from '@mui/icons-material/Stars';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { calculateFoundersPricing, FoundersPricingBreakdown } from '@/lib/pricing-utils';
import { detectCountryFromIP } from '@/lib/country-utils';

// Lazy load CompanyLogoUpload for performance
const CompanyLogoUpload = dynamic(() => import('@/components/CompanyLogoUpload'), {
  ssr: false,
  loading: () => (
    <div className="h-24 bg-gray-50 rounded-lg flex items-center justify-center">
      <span className="text-sm text-gray-400">Loading...</span>
    </div>
  )
});

// Icon aliases
const Person = PersonIcon;
const Palette = PaletteIcon;
const Brush = BrushIcon;
const GridPattern = GridOnIcon;
const Warning = WarningIcon;
const Crown = StarsIcon;

// Define types for our configuration
type BaseMaterial = 'pvc' | 'wood' | 'metal';
type TextureOption = 'matte' | 'glossy' | 'brushed' | 'none';
type ColourOption = 'white' | 'black-pvc' | 'black-metal' | 'cherry' | 'birch' | 'silver' | 'rose-gold';

interface StepData {
  cardFirstName: string;
  cardLastName: string;
  baseMaterial: BaseMaterial | null;
  texture: TextureOption | null;
  colour: ColourOption | null;
  pattern: number | null;
}

export default function ConfigureNewPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<StepData>({
    cardFirstName: '',
    cardLastName: '',
    baseMaterial: null,
    texture: null,
    colour: null,
    pattern: null
  });
  const [userCountry, setUserCountry] = useState<string>('India');
  const [isLoading, setIsLoading] = useState(false);
  const [isFoundingMember, setIsFoundingMember] = useState(false);

  // Founding Member exclusive states
  const [showLinkistLogo, setShowLinkistLogo] = useState(true);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [foundersTotalPrice, setFoundersTotalPrice] = useState<number | null>(null);
  const [foundersPricing, setFoundersPricing] = useState<FoundersPricingBreakdown | null>(null);

  // Dynamic customization options from API
  const [customizationOptions, setCustomizationOptions] = useState<{
    materials: Array<{ option_key: string; label: string; description: string | null; price: number | null; is_enabled: boolean }>;
    textures: Array<{ option_key: string; label: string; description: string | null; applicable_materials: string[] | null; is_enabled: boolean }>;
    colours: Array<{ option_key: string; label: string; hex_color: string | null; gradient_class: string | null; applicable_materials: string[] | null; is_founders_only: boolean; is_enabled: boolean }>;
    patterns: Array<{ option_key: string; label: string; is_enabled: boolean; display_order: number }>;
    materialPrices: Record<string, number>;
    textureOptions: Record<string, string[]>;
    colourOptions: Record<string, string[]>;
  } | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [userPlanType, setUserPlanType] = useState<string | null>(null);
  const [planTypeChecked, setPlanTypeChecked] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('yearly');

  // Fetch customization options from API based on user's plan type
  const fetchCustomizationOptions = async (planType: string) => {
    try {
      const url = `/api/card-customization?plan_type=${planType}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCustomizationOptions(data);
        console.log('Configure: Loaded customization options from API', { planType, data });
      } else {
        console.log('Configure: Using fallback options');
      }
    } catch (error) {
      console.error('Configure: Error fetching customization options:', error);
    } finally {
      setOptionsLoading(false);
    }
  };

  // Fetch options only AFTER plan type is determined (no initial fetch)
  useEffect(() => {
    if (planTypeChecked && userPlanType) {
      fetchCustomizationOptions(userPlanType);
    }
  }, [planTypeChecked, userPlanType]);

  // Clear any existing corrupted data on component mount
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);

    // Clear old config data to prevent corruption
    localStorage.removeItem('nfcConfig');
    localStorage.removeItem('cardConfig');
    console.log('Configure: Cleared old localStorage data');

    // Step 1: Detect country from IP first (single source of truth)
    const initializeCountryAndData = async () => {
      let detectedCountry = 'India'; // Default fallback

      try {
        // Try to get country from IP detection
        const ipData = await detectCountryFromIP();
        detectedCountry = ipData.countryName;
        console.log('Configure: Country detected from IP:', detectedCountry);
      } catch (error) {
        console.log('Configure: IP detection failed, checking localStorage');
        // Fallback to localStorage if IP detection fails
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile) {
          try {
            const profile = JSON.parse(userProfile);
            detectedCountry = profile.country || 'India';
          } catch (e) {
            console.error('Error parsing user profile:', e);
          }
        }
      }

      // Set the detected country
      setUserCountry(detectedCountry);
      console.log('Configure: Using country:', detectedCountry);

      // Update localStorage with detected country for consistency
      const existingProfile = localStorage.getItem('userProfile');
      if (existingProfile) {
        try {
          const profile = JSON.parse(existingProfile);
          profile.country = detectedCountry;
          localStorage.setItem('userProfile', JSON.stringify(profile));
        } catch (e) {
          console.error('Error updating profile:', e);
        }
      }

      // Step 2: Check founding member status and fetch pricing with detected country
      await checkFoundingMemberStatus(detectedCountry);

      // Step 3: Pre-fill card names from userProfile (only if not already set from API)
      setFormData(prev => {
        if (prev.cardFirstName || prev.cardLastName) {
          console.log('Configure: Card names already set from API, skipping localStorage fallback');
          return prev;
        }
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile) {
          try {
            const profile = JSON.parse(userProfile);
            console.log('Configure: Pre-filled card name from localStorage profile:', {
              firstName: profile.firstName,
              lastName: profile.lastName
            });
            return {
              ...prev,
              cardFirstName: (profile.firstName || '').toUpperCase(),
              cardLastName: (profile.lastName || '').toUpperCase()
            };
          } catch (error) {
            console.error('Error parsing user profile:', error);
          }
        }
        return prev;
      });
    };

    // Check founding member status from API and detect plan type
    const checkFoundingMemberStatus = async (country: string) => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          const foundingMemberStatus = data.user?.is_founding_member || false;
          setIsFoundingMember(foundingMemberStatus);
          console.log('Configure: Founding member status:', foundingMemberStatus);

          // Pre-fill card names from authenticated user data (DB is source of truth)
          if (data.user?.first_name || data.user?.last_name) {
            setFormData(prev => ({
              ...prev,
              cardFirstName: (data.user.first_name || '').toUpperCase(),
              cardLastName: (data.user.last_name || '').toUpperCase()
            }));
            console.log('Configure: Pre-filled card name from API:', {
              first_name: data.user.first_name,
              last_name: data.user.last_name
            });
          }

          // Read billing period from localStorage (set during product selection)
          const storedBilling = localStorage.getItem('billingPeriod') as 'monthly' | 'yearly';
          setBillingPeriod(storedBilling || 'yearly');

          // Detect plan type from localStorage (set during product selection)
          const selectedProduct = localStorage.getItem('productSelection');
          const validCardPlans = ['pro', 'signature', 'founders-circle', 'founders-club', 'physical-digital'];

          let planType: string;
          if (selectedProduct && validCardPlans.includes(selectedProduct)) {
            planType = selectedProduct;
          } else if (foundingMemberStatus) {
            planType = 'founders-club';
          } else {
            planType = 'physical-digital';
          }

          setUserPlanType(planType);
          setPlanTypeChecked(true);
          console.log('Configure: User plan type:', planType, '(from productSelection:', selectedProduct, ')');

          // Pre-select Metal + Matte + Black for founding members
          if (foundingMemberStatus) {
            setFormData(prev => ({
              ...prev,
              baseMaterial: 'metal',
              texture: 'matte',
              colour: 'black-metal'
            }));
            console.log('Configure: Pre-selected Metal card for founding member');

            // Fetch founders pricing with the detected country
            await fetchFoundersPricing(country);
          }
        } else {
          // Not logged in - detect plan from localStorage or default
          const selectedProduct = localStorage.getItem('productSelection');
          const validCardPlans = ['pro', 'signature', 'founders-circle', 'founders-club', 'physical-digital'];
          const fallbackPlan = (selectedProduct && validCardPlans.includes(selectedProduct)) ? selectedProduct : 'physical-digital';
          setUserPlanType(fallbackPlan);
          setPlanTypeChecked(true);
        }
      } catch (error) {
        console.log('Configure: Could not check founding member status');
        // Default - detect plan from localStorage or use physical-digital
        const selectedProduct = localStorage.getItem('productSelection');
        const validCardPlans = ['pro', 'signature', 'founders-circle', 'founders-club', 'physical-digital'];
        const fallbackPlan = (selectedProduct && validCardPlans.includes(selectedProduct)) ? selectedProduct : 'physical-digital';
        setUserPlanType(fallbackPlan);
        setPlanTypeChecked(true);
      }
    };

    // Fetch founders pricing from API with specific country
    const fetchFoundersPricing = async (country: string) => {
      try {
        const response = await fetch(`/api/founders/pricing?country=${encodeURIComponent(country)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.founders_total_price) {
            setFoundersTotalPrice(data.founders_total_price);
            setFoundersPricing(data.pricing);
            console.log('Configure: Founders pricing loaded for country:', country, data.pricing);
          }
        }
      } catch (error) {
        console.log('Configure: Could not fetch founders pricing');
      }
    };

    // Start initialization
    initializeCountryAndData();
  }, []);

  // Recalculate founders pricing when country changes
  useEffect(() => {
    if (isFoundingMember && foundersTotalPrice) {
      const pricing = calculateFoundersPricing(foundersTotalPrice, userCountry);
      setFoundersPricing(pricing);
      console.log('Configure: Recalculated founders pricing for country:', userCountry, pricing);
    }
  }, [userCountry, isFoundingMember, foundersTotalPrice]);

  // Fallback hardcoded options (used if API fails)
  const fallbackPrices: Record<BaseMaterial, number> = {
    pvc: 69,
    wood: 79,
    metal: 99
  };

  const fallbackTextureOptions: Record<BaseMaterial, TextureOption[]> = {
    pvc: ['matte', 'glossy'],
    wood: ['none'],
    metal: ['matte', 'brushed']
  };

  const fallbackColourOptions: Record<BaseMaterial, ColourOption[]> = {
    pvc: ['white', 'black-pvc'],
    wood: ['cherry', 'birch'],
    metal: ['black-metal', 'silver', 'rose-gold']
  };

  // Use API options if available, otherwise use fallbacks
  const prices: Record<string, number> = customizationOptions?.materialPrices || fallbackPrices;
  const textureOptions: Record<string, string[]> = customizationOptions?.textureOptions || fallbackTextureOptions;
  const colourOptions: Record<string, string[]> = customizationOptions?.colourOptions || fallbackColourOptions;

  // Price display helper: monthly = yearly / 10
  const getDisplayPrice = (yearlyPrice: number): number => {
    if (billingPeriod === 'monthly') return yearlyPrice / 10;
    return yearlyPrice;
  };
  const priceSuffix = billingPeriod === 'monthly' ? '/mo' : '';

  // Base materials with descriptions - from API or fallback
  const baseMaterials: Array<{ value: string; label: string; description: string }> = customizationOptions?.materials
    ? customizationOptions.materials.map(m => ({
        value: m.option_key,
        label: m.label,
        description: m.description || ''
      }))
    : [
        { value: 'pvc', label: 'PVC', description: 'Lightweight and affordable' },
        { value: 'wood', label: 'Wood', description: 'Natural and sustainable' },
        { value: 'metal', label: 'Metal', description: 'Premium and durable' }
      ];

  // All texture options for display - from API or fallback
  const allTextures: Array<{ value: string; label: string; description: string }> = customizationOptions?.textures
    ? customizationOptions.textures.map(t => ({
        value: t.option_key,
        label: t.label,
        description: t.description || ''
      }))
    : [
        { value: 'matte', label: 'Matte', description: 'Soft anti-reflective finish' },
        { value: 'glossy', label: 'Glossy', description: 'High-shine reflective surface' },
        { value: 'brushed', label: 'Brushed', description: 'Directional brushed pattern' },
        { value: 'none', label: 'Natural', description: 'Natural material texture' }
      ];

  // All colour options for display with exact hex codes - from API or fallback
  const allColours: Array<{ value: string; label: string; hex: string; gradient: string; isFoundersOnly?: boolean }> = customizationOptions?.colours
    ? customizationOptions.colours.map(c => ({
        value: c.option_key,
        label: c.label,
        hex: c.hex_color || '#CCCCCC',
        gradient: c.gradient_class || 'from-gray-300 to-gray-400',
        isFoundersOnly: c.is_founders_only
      }))
    : [
        // PVC colors
        { value: 'white', label: 'White', hex: '#FFFFFF', gradient: 'from-white to-gray-100' },
        { value: 'black-pvc', label: 'Black', hex: '#000000', gradient: 'from-gray-900 to-black', isFoundersOnly: true },
        // Wood colors
        { value: 'cherry', label: 'Cherry', hex: '#8E3A2D', gradient: 'from-red-950 to-red-900' },
        { value: 'birch', label: 'Birch', hex: '#E5C79F', gradient: 'from-amber-100 to-amber-200' },
        // Metal colors
        { value: 'black-metal', label: 'Black', hex: '#1A1A1A', gradient: 'from-gray-800 to-gray-900', isFoundersOnly: true },
        { value: 'silver', label: 'Silver', hex: '#C0C0C0', gradient: 'from-gray-300 to-gray-400' },
        { value: 'rose-gold', label: 'Rose Gold', hex: '#B76E79', gradient: 'from-rose-300 to-rose-400' }
      ];

  // Admin-configured patterns - from API or fallback
  const patterns = customizationOptions?.patterns
    ? customizationOptions.patterns.map((p, index) => ({
        id: index + 1,
        name: p.label
      }))
    : [
        { id: 1, name: 'Geometric' },
        { id: 2, name: 'Minimalist' },
        { id: 3, name: 'Abstract' }
      ];

  // Check if an option is available based on current base selection
  const isTextureAvailable = (texture: string): boolean => {
    if (!formData.baseMaterial) return false;
    const availableTextures = textureOptions[formData.baseMaterial];
    return availableTextures ? availableTextures.includes(texture) : false;
  };

  const isColourAvailable = (colour: string): boolean => {
    if (!formData.baseMaterial) return false;

    // Check if color is available for this material
    const availableColours = colourOptions[formData.baseMaterial];
    const isValidForMaterial = availableColours ? availableColours.includes(colour) : false;
    if (!isValidForMaterial) return false;

    // Check if this color is founders-only
    const colourOption = allColours.find(c => c.value === colour);
    if (colourOption?.isFoundersOnly && !isFoundingMember) {
      return false;
    }

    return true;
  };

  // Handle base material change
  const handleBaseMaterialChange = (material: BaseMaterial) => {
    const availableTextures = textureOptions[material] || [];
    const availableColours = colourOptions[material] || [];

    const newFormData: StepData = {
      ...formData,
      baseMaterial: material,
      // Clear texture if not valid for new base
      texture: formData.texture && availableTextures.includes(formData.texture)
        ? formData.texture
        : null,
      // Clear colour if not valid for new base
      colour: formData.colour && availableColours.includes(formData.colour)
        ? formData.colour
        : null
    };
    setFormData(newFormData);
    console.log('Base material changed:', newFormData);
  };

  // Handle other selections
  const handleTextureChange = (texture: TextureOption) => {
    if (isTextureAvailable(texture)) {
      setFormData({ ...formData, texture });
    }
  };

  const handleColourChange = (colour: ColourOption) => {
    if (isColourAvailable(colour)) {
      setFormData({ ...formData, colour });
    }
  };

  const handlePatternChange = (patternId: number) => {
    setFormData({ ...formData, pattern: patternId });
  };

  // Company logo upload handler (Founders only)
  const handleCompanyLogoUpload = useCallback(async (file: File) => {
    setIsUploadingLogo(true);
    setLogoUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'logos');
      formData.append('isPublic', 'true');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setLogoUploadError(result.error || 'Upload failed');
        return;
      }

      setCompanyLogoUrl(result.data?.publicUrl || result.publicUrl);
    } catch (error) {
      setLogoUploadError('Failed to upload logo');
      console.error('Logo upload error:', error);
    } finally {
      setIsUploadingLogo(false);
    }
  }, []);

  // Remove company logo handler
  const handleRemoveCompanyLogo = useCallback(() => {
    setCompanyLogoUrl(null);
    setLogoUploadError(null);
  }, []);

  const getCardGradient = () => {
    const selectedColor = allColours.find(c => c.value === formData.colour);
    return selectedColor?.gradient || 'from-gray-200 to-gray-300';
  };

  const getTextColor = () => {
    // Return white text for dark backgrounds, black for light backgrounds
    const darkBackgrounds = ['black-pvc', 'black-metal', 'cherry', 'rose-gold'];
    if (formData.colour && darkBackgrounds.includes(formData.colour)) {
      return 'text-white';
    }
    return 'text-gray-900';
  };

  const handleContinue = () => {
    // Name is not required for Pro plan
    if (userPlanType !== 'pro' && (!formData.cardFirstName.trim() || !formData.cardLastName.trim())) {
      alert('Please enter both first and last name for the card');
      return;
    }

    if (!formData.baseMaterial || !formData.texture || !formData.colour || !formData.pattern) {
      alert('Please complete all configuration options');
      return;
    }

    // Set loading state
    setIsLoading(true);

    // Create clean data object for storage
    // Get pattern name from the patterns array
    const selectedPattern = patterns.find(p => p.id === formData.pattern);
    const configData = {
      cardFirstName: formData.cardFirstName.trim(),
      cardLastName: formData.cardLastName.trim(),
      baseMaterial: formData.baseMaterial,
      texture: formData.texture,
      colour: formData.colour,
      pattern: selectedPattern?.name || `Pattern ${formData.pattern}`,
      // Billing period and plan type (for checkout/payment pricing)
      billingPeriod: billingPeriod,
      planType: userPlanType,
      // Founding member exclusive options
      showLinkistLogo: isFoundingMember ? showLinkistLogo : true,
      companyLogoUrl: isFoundingMember ? companyLogoUrl : null,
      isFoundingMember: isFoundingMember,
      // Founders pricing (for checkout/payment)
      foundersTotalPrice: isFoundingMember ? foundersTotalPrice : null,
      foundersPricing: isFoundingMember ? foundersPricing : null
    };

    console.log('Configure: Saving card data to localStorage:', configData);

    // Save to localStorage and redirect to checkout
    localStorage.setItem('nfcConfig', JSON.stringify(configData));

    // Verify the data was saved correctly
    const savedData = localStorage.getItem('nfcConfig');
    console.log('Configure: Verified saved data:', savedData);

    router.push('/nfc/checkout');
  };

  // Show loading state while options are being fetched
  if (optionsLoading || !customizationOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] pt-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-500 text-lg">Loading card customization options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-start">
          {/* Configuration Section - Left Side */}
          <div className="lg:col-span-7 space-y-4 order-2 lg:order-1">

            {/* Step 1: Personalize Name - Compact Modern Card (hidden for Pro plan) */}
            {userPlanType !== 'pro' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Person className="mr-2 w-5 h-5 text-gray-600" /> Personalize Your Name
                </h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  This name will appear on the card exactly as entered (independent from your profile name)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Card First Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. JOHN"
                        value={formData.cardFirstName}
                        onChange={(e) => {
                          const newFormData = {...formData, cardFirstName: e.target.value.toUpperCase()};
                          setFormData(newFormData);
                        }}
                        maxLength={15}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                      />
                      <span className="absolute right-2 top-2 text-xs text-gray-400">
                        {formData.cardFirstName.length}/15
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Card Last Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. DOE"
                        value={formData.cardLastName}
                        onChange={(e) => {
                          const newFormData = {...formData, cardLastName: e.target.value.toUpperCase()};
                          setFormData(newFormData);
                        }}
                        maxLength={15}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm"
                      />
                      <span className="absolute right-2 top-2 text-xs text-gray-400">
                        {formData.cardLastName.length}/15
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Step 2: Base Material - Modern Grid */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Palette className="mr-2 w-5 h-5 text-gray-600" /> Base Material
                </h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {baseMaterials.map((material) => (
                    <button
                      key={material.value}
                      onClick={() => handleBaseMaterialChange(material.value)}
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        formData.baseMaterial === material.value
                          ? 'border-red-500 bg-red-50 shadow-md ring-2 ring-red-200'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="text-center">
                        <h3 className={`font-semibold text-sm ${formData.baseMaterial === material.value ? 'text-red-600' : 'text-gray-900'}`}>{material.label}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{material.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Combined Texture & Colour in One Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Brush className="mr-2 w-5 h-5 text-gray-600" /> Texture & Colour
                </h2>
              </div>

              <div className="p-4 space-y-4">
                {/* Texture Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Texture</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {allTextures.map((texture) => {
                      const isAvailable = isTextureAvailable(texture.value);
                      const isSelected = formData.texture === texture.value;

                      return (
                        <button
                          key={texture.value}
                          onClick={() => handleTextureChange(texture.value)}
                          disabled={!isAvailable}
                          className={`relative p-3 border-2 rounded-lg transition-all ${
                            !isAvailable
                              ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-100'
                              : isSelected
                                ? 'border-red-500 bg-red-50 shadow-md ring-2 ring-red-200'
                                : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                          }`}
                        >
                          <div className="text-center">
                            <h4 className={`text-xs font-medium ${!isAvailable ? 'text-gray-500' : isSelected ? 'text-red-600' : 'text-gray-900'}`}>
                              {texture.label}
                            </h4>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Colour Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Colour</h3>
                  <div className="flex flex-wrap gap-3">
                    {allColours.map((colour) => {
                      const isAvailable = isColourAvailable(colour.value);
                      const isSelected = formData.colour === colour.value;

                      return (
                        <button
                          key={colour.value}
                          onClick={() => handleColourChange(colour.value)}
                          disabled={!isAvailable}
                          className={`relative group ${!isAvailable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div
                            className={`w-14 h-14 rounded-xl border-4 transition-all ${
                              isSelected && isAvailable
                                ? 'border-red-500 scale-110 shadow-lg ring-4 ring-red-200'
                                : !isAvailable
                                  ? 'border-gray-200 opacity-50'
                                  : 'border-gray-300 hover:scale-105'
                            }`}
                            style={{
                              backgroundColor: colour.hex,
                              opacity: !isAvailable ? 0.5 : 1
                            }}
                          />
                          <span className={`text-xs mt-1 block text-center font-medium ${
                            !isAvailable ? 'text-gray-500' : isSelected ? 'text-red-600' : 'text-gray-700'
                          }`}>
                            {colour.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!formData.baseMaterial && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-700 flex items-center">
                      <Warning className="mr-2 w-4 h-4" /> Select a base material to see available options
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Pattern - Modern Compact */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <GridPattern className="mr-2 w-5 h-5 text-gray-600" /> Pattern
                </h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {patterns.map((pattern) => {
                    const isSelected = formData.pattern === pattern.id;

                    return (
                      <button
                        key={pattern.id}
                        onClick={() => handlePatternChange(pattern.id)}
                        className={`relative p-3 border-2 rounded-xl transition-all ${
                          isSelected
                            ? 'border-red-500 bg-red-50 shadow-md ring-2 ring-red-200'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-2 flex items-center justify-center">
                          <span className={`text-xs font-medium ${isSelected ? 'text-red-600' : 'text-gray-600'}`}>{pattern.name}</span>
                        </div>
                        <span className={`text-xs font-medium ${isSelected ? 'text-red-600' : 'text-gray-700'}`}>{pattern.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Founders Circle Exclusive Options - Only visible to founding members */}
            {isFoundingMember && (
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Crown className="mr-2 w-5 h-5 text-amber-500" /> Founders Circle Exclusive
                  </h2>
                </div>
                <div className="p-4 space-y-4">
                  {/* Linkist Logo Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Linkist Logo</label>
                      <p className="text-xs text-gray-500 mt-1">Show Linkist branding on card back</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowLinkistLogo(!showLinkistLogo)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                        showLinkistLogo ? 'bg-amber-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          showLinkistLogo ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Company Logo Upload */}
                  <CompanyLogoUpload
                    companyLogoUrl={companyLogoUrl}
                    isUploading={isUploadingLogo}
                    error={logoUploadError}
                    onUpload={handleCompanyLogoUpload}
                    onRemove={handleRemoveCompanyLogo}
                  />

                  {/* Info message */}
                  <div className="p-2 bg-amber-100 border border-amber-300 rounded-lg">
                    <p className="text-xs text-amber-800">
                      {companyLogoUrl
                        ? 'Your company logo will replace the Linkist logo on the card back.'
                        : showLinkistLogo
                          ? 'The Linkist logo will appear on the card back.'
                          : 'No logo will appear on the card back.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Continue to Checkout Section */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-3">
                {/* Warning about incomplete selections - always visible */}
                {(() => {
                  const missingItems = [];
                  if (userPlanType !== 'pro' && (!formData.cardFirstName?.trim() || !formData.cardLastName?.trim())) {
                    missingItems.push('Card Name');
                  }
                  if (!formData.baseMaterial) {
                    missingItems.push('Base Material');
                  }
                  if (!formData.texture) {
                    missingItems.push('Texture');
                  }
                  if (!formData.colour) {
                    missingItems.push('Colour');
                  }
                  if (!formData.pattern) {
                    missingItems.push('Pattern');
                  }

                  if (missingItems.length > 0) {
                    return (
                      <div className="mb-3 p-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-700 flex items-center">
                          <Warning className="mr-1 w-4 h-4" /> Please select: <span className="font-semibold ml-1">{missingItems.join(', ')}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                <button
                  onClick={handleContinue}
                  disabled={!formData.baseMaterial || !formData.texture || !formData.colour || !formData.pattern || (userPlanType !== 'pro' && (!formData.cardFirstName?.trim() || !formData.cardLastName?.trim())) || isLoading}
                  className={`w-full px-6 py-3 rounded-lg font-semibold transition-all shadow-md ${
                    (formData.baseMaterial && formData.texture && formData.colour && formData.pattern && (userPlanType === 'pro' || (formData.cardFirstName?.trim() && formData.cardLastName?.trim())))
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Continue to Checkout →'
                  )}
                </button>
              </div>
            </div>

          </div>

          {/* Live Preview - Right Side */}
          <div className="lg:col-start-8 lg:col-span-5 order-1 lg:order-2">
            <div className="lg:sticky lg:top-32">
                {/* Card Preview - Compact Modern */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
                      <button
                      type="button"
                      className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                      title="AI Assistant"
                    >
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {/* Front Card */}
                  <div>
                    <div className={`w-full aspect-[1.6/1] bg-gradient-to-br ${getCardGradient()} rounded-xl relative overflow-hidden shadow-lg`}>
                      {/* AI Icon top right - Plain, no border/shadow */}
                      <div className="absolute top-4 right-4">
                        <img
                          src={formData.colour === 'white' ? '/ai2.png' : '/ai1.png'}
                          alt="AI Assistant"
                          className={`w-6 h-6 ${formData.colour === 'white' ? '' : 'invert'}`}
                        />
                      </div>

                      {/* User Initials or Name (hidden for Pro plan) */}
                      {userPlanType !== 'pro' && (
                      <div className="absolute bottom-6 left-6">
                        {(() => {
                          const firstName = formData.cardFirstName?.trim() || '';
                          const lastName = formData.cardLastName?.trim() || '';
                          const isSingleCharOnly = firstName.length <= 1 && lastName.length <= 1;

                          if (isSingleCharOnly) {
                            return (
                              <div className={`${getTextColor()} text-2xl font-light`}>
                                {(firstName || 'J').toUpperCase()}{(lastName || 'D').toUpperCase()}
                              </div>
                            );
                          } else {
                            return (
                              <div className={`${getTextColor()} text-base font-medium`}>
                                {firstName.toUpperCase()} {lastName.toUpperCase()}
                              </div>
                            );
                          }
                        })()}
                      </div>
                      )}
                    </div>
                    <div className="text-center text-sm text-gray-600">Front</div>
                  </div>

                  {/* Back Card */}
                  <div>
                    <div className={`w-full aspect-[1.6/1] bg-gradient-to-br ${getCardGradient()} rounded-xl relative overflow-hidden shadow-lg`}>
                      {/* Logo Section - Conditionally render based on founding member settings */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {isFoundingMember ? (
                          // Founding Member: Show company logo, Linkist logo (if enabled), or nothing
                          <>
                            {companyLogoUrl ? (
                              <img
                                src={companyLogoUrl}
                                alt="Company Logo"
                                className="h-16 w-auto mb-4 object-contain"
                              />
                            ) : showLinkistLogo ? (
                              <img
                                src="/logo_linkist.png"
                                alt="Linkist"
                                className="h-16 w-auto mb-4"
                              />
                            ) : null}
                            <div className={`${getTextColor()} text-sm font-medium tracking-wider`}>FOUNDING MEMBER</div>
                          </>
                        ) : (
                          // Regular user: Always show Linkist logo
                          <img
                            src="/logo_linkist.png"
                            alt="Linkist"
                            className="h-16 w-auto mb-4"
                          />
                        )}
                      </div>

                      {/* NFC Symbol - vertically centered on right side */}
                      <div className="absolute top-1/2 -translate-y-1/2 right-4">
                        <img src="/nfc2.png" alt="NFC" className="w-9 h-9" />
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-600 mt-2">Back</div>
                  </div>
                </div>
                </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}