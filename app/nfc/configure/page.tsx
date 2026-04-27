'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import PersonIcon from '@mui/icons-material/Person';
import PaletteIcon from '@mui/icons-material/Palette';
import BrushIcon from '@mui/icons-material/Brush';
import GridOnIcon from '@mui/icons-material/GridOn';
import WarningIcon from '@mui/icons-material/Warning';
import StarsIcon from '@mui/icons-material/Stars';
import { calculateFoundersPricing, FoundersPricingBreakdown } from '@/lib/pricing-utils';
import { detectCountryFromIP } from '@/lib/country-utils';
import { buildHierarchyKey } from '@/lib/supabase-card-customization-store';

import CompanyLogoUpload from '@/components/CompanyLogoUpload';
import { CardPatternOverlay, PatternThumbnail } from '@/components/CardPatternOverlay';

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
type ColourOption = 'white' | 'black' | 'cherry' | 'birch' | 'silver' | 'rose-gold';

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
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Founding Member exclusive states
  const [showLinkistLogo, setShowLinkistLogo] = useState(true);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [foundersTotalPrice, setFoundersTotalPrice] = useState<number | null>(null);
  const [foundersPricing, setFoundersPricing] = useState<FoundersPricingBreakdown | null>(null);

  // Card mockup images from admin
  const [mockupImages, setMockupImages] = useState<Record<string, string> | null>(null);
  const [mockupLoading, setMockupLoading] = useState(false);

  // Dynamic customization options from API
  const [customizationOptions, setCustomizationOptions] = useState<{
    materials: Array<{ option_key: string; label: string; description: string | null; price: number | null; is_enabled: boolean }>;
    textures: Array<{ option_key: string; label: string; description: string | null; applicable_materials: string[] | null; is_enabled: boolean }>;
    colours: Array<{ option_key: string; label: string; hex_color: string | null; gradient_class: string | null; applicable_materials: string[] | null; is_founders_only: boolean; is_enabled: boolean }>;
    patterns: Array<{ option_key: string; label: string; is_enabled: boolean; display_order: number }>;
    materialPrices: Record<string, number>;
    textureOptions: Record<string, string[]>;
    colourOptions: Record<string, string[]>;
    patternOptions?: Record<string, string[]>;
    defaults?: Record<string, { texture?: string; colour?: string; pattern?: string }>;
  } | null>(null);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [userPlanType, setUserPlanType] = useState<string | null>(null);
  const [planTypeChecked, setPlanTypeChecked] = useState(false);

  // Starter card price — fetched from `subscription_plans` (admin-managed via Subscription Plans tab)
  const [starterCardPrice, setStarterCardPrice] = useState<number | null>(null);

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

  // Fetch the Starter card price from `subscription_plans` (DB, admin-editable)
  useEffect(() => {
    if (userPlanType !== 'starter') return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/plans/active');
        if (!res.ok) return;
        const data = await res.json();
        const starter = (data.plans || []).find((p: { type: string; price: number }) => p.type === 'starter');
        if (!cancelled && starter && typeof starter.price === 'number') {
          setStarterCardPrice(starter.price);
          localStorage.setItem('selectedPlanAmount', String(starter.price));
          localStorage.setItem('selectedPlanName', 'Starter');
        }
      } catch (err) {
        console.error('Configure: Failed to fetch Starter card price:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [userPlanType]);

  // Clear any existing corrupted data on component mount
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);

    // Honor `?plan=` query param so direct links (e.g. /nfc/configure?plan=starter) seed productSelection
    // before plan-type detection runs.
    try {
      const urlPlan = new URLSearchParams(window.location.search).get('plan');
      const validUrlPlans = ['starter', 'pro', 'signature', 'founders-circle', 'founders-club', 'physical-digital'];
      if (urlPlan && validUrlPlans.includes(urlPlan)) {
        localStorage.setItem('productSelection', urlPlan);
        if (urlPlan === 'starter') {
          localStorage.setItem('selectedPlanName', 'Starter');
          // Default to $0 — overridden to $30 on Continue
          if (!localStorage.getItem('selectedPlanAmount')) {
            localStorage.setItem('selectedPlanAmount', '0');
          }
        }
      }
    } catch (e) {
      console.error('Configure: Error reading plan query param:', e);
    }

    // Clear old config data to prevent corruption
    localStorage.removeItem('nfcConfig');
    localStorage.removeItem('cardConfig');
    console.log('Configure: Cleared old localStorage data');

    // Parallel: IP detection + auth check run simultaneously (saves ~1-2s vs sequential)
    const initializeCountryAndData = async () => {
      // Fire both network calls in parallel — they are independent
      const [countryResult, authResponse] = await Promise.all([
        detectCountryFromIP().catch(() => ({ countryCode: 'IN', countryName: 'India', phoneCode: '+91' })),
        fetch('/api/auth/me', { credentials: 'include' }).catch(() => null),
      ]);

      // Process country result
      let detectedCountry = countryResult.countryName;
      // Fallback to localStorage if IP detection returned default
      if (detectedCountry === 'India') {
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile) {
          try {
            const profile = JSON.parse(userProfile);
            if (profile.country && profile.country !== 'India') {
              detectedCountry = profile.country;
            }
          } catch (e) {
            console.error('Error parsing user profile:', e);
          }
        }
      }

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

      // Process auth result (already fetched in parallel)
      await processAuthResult(authResponse, detectedCountry);

      // Pre-fill card names from userProfile (only if not already set from API)
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

    // Process the already-fetched auth response (no new network call)
    const processAuthResult = async (response: Response | null, country: string) => {
      try {
        if (response && response.ok) {
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

          // Detect plan type from localStorage (set during product selection)
          const selectedProduct = localStorage.getItem('productSelection');
          const validCardPlans = ['starter', 'pro', 'signature', 'founders-circle', 'founders-club', 'physical-digital'];

          let planType: string;
          if (selectedProduct && validCardPlans.includes(selectedProduct)) {
            planType = selectedProduct;
          } else if (foundingMemberStatus) {
            planType = 'founders-club';
          } else {
            planType = 'physical-digital';
          }

          // SECURITY: If plan type is founders-circle/founders-club but API says user is NOT a founding member,
          // downgrade to 'signature' to prevent unauthorized access to founders-exclusive features
          if ((planType === 'founders-circle' || planType === 'founders-club') && !foundingMemberStatus) {
            console.warn('Configure: User tried to access founders plan but is NOT a founding member. Downgrading to signature.');
            planType = 'signature';
            localStorage.setItem('productSelection', 'signature');
          }

          setUserPlanType(planType);
          setPlanTypeChecked(true);
          console.log('Configure: User plan type:', planType, '(from productSelection:', selectedProduct, ')');

          // Pre-select Metal + Matte + Black ONLY when the selected plan is Founder's Circle AND verified
          const isFoundersPlan = planType === 'founders-circle' || planType === 'founders-club';
          if (isFoundersPlan) {
            setFormData(prev => ({
              ...prev,
              baseMaterial: 'metal',
              texture: 'matte',
              colour: 'black'
            }));
            console.log('Configure: Pre-selected Metal card for Founders Circle plan');

            // Fetch founders pricing with the detected country
            await fetchFoundersPricing(country);
          }
        } else {
          // Not logged in - detect plan from localStorage or default
          const selectedProduct = localStorage.getItem('productSelection');
          const validCardPlans = ['starter', 'pro', 'signature', 'founders-circle', 'founders-club', 'physical-digital'];
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

  // Fetch card mockup images when material + colour + pattern selection changes
  useEffect(() => {
    const patternKey = patterns.find(p => p.id === formData.pattern)?.key || null;
    if (!formData.baseMaterial || !formData.colour || patternKey === null) {
      setMockupImages(null);
      return;
    }

    const fetchMockup = async () => {
      setMockupLoading(true);
      try {
        const params = new URLSearchParams({
          material: formData.baseMaterial!,
          colour: formData.colour!,
          pattern: (!patternKey || patternKey === 'none') ? 'blank' : patternKey,
        });
        const response = await fetch(`/api/card-mockups?${params}`);
        if (response.ok) {
          const data = await response.json();
          setMockupImages(data.hasMockups ? data.mockups : null);
        } else {
          setMockupImages(null);
        }
      } catch {
        setMockupImages(null);
      }
      setMockupLoading(false);
    };

    fetchMockup();
  }, [formData.baseMaterial, formData.colour, formData.pattern]);

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
    pvc: ['white', 'black'],
    wood: ['cherry', 'birch'],
    metal: ['black', 'silver', 'rose-gold']
  };

  // Use API options if available, otherwise use fallbacks
  const prices: Record<string, number> = customizationOptions?.materialPrices || fallbackPrices;
  const textureOptions: Record<string, string[]> = customizationOptions?.textureOptions || fallbackTextureOptions;
  // colourOptions may use hierarchy keys ("material|texture") or flat keys ("material")
  const colourOptions: Record<string, string[]> = customizationOptions?.colourOptions || fallbackColourOptions;

  // Founders Circle plan check: exclusive features only when plan is founders-circle/founders-club
  const isFoundersCirclePlan = userPlanType === 'founders-circle' || userPlanType === 'founders-club';

  // Starter plan: shows Continue (DB-priced card) and Skip (digital-only) CTAs
  const isStarterPlan = userPlanType === 'starter';

  // Price display helper
  const getDisplayPrice = (price: number): number => {
    return price;
  };

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
        { value: 'white', label: 'White', hex: '#FFFFFF', gradient: 'from-white to-gray-100' },
        { value: 'black', label: 'Black', hex: '#1A1A1A', gradient: 'from-gray-900 to-black', isFoundersOnly: true },
        { value: 'cherry', label: 'Cherry', hex: '#8E3A2D', gradient: 'from-red-950 to-red-900' },
        { value: 'birch', label: 'Birch', hex: '#E5C79F', gradient: 'from-amber-100 to-amber-200' },
        { value: 'silver', label: 'Silver', hex: '#C0C0C0', gradient: 'from-gray-300 to-gray-400' },
        { value: 'rose-gold', label: 'Rose Gold', hex: '#B76E79', gradient: 'from-rose-300 to-rose-400' }
      ];

  // Helper: build patterns list based on hierarchy (material + texture + colour)
  const buildPatternsForMaterial = (material: string | null) => {
    // Until material + texture + colour are all selected, show only the Blank placeholder.
    const hasFullPath = !!(material && formData.texture && formData.colour);
    if (!hasFullPath) {
      return [{ id: 0, name: 'Blank', key: 'none' }];
    }

    if (!customizationOptions?.patterns) {
      return [
        { id: 0, name: 'Blank', key: 'none' },
        { id: 1, name: 'Geometric', key: 'geometric' },
        { id: 2, name: 'Waves', key: 'waves' },
        { id: 3, name: 'Crystal', key: 'crystal' }
      ];
    }

    let allowed: string[] | undefined;
    let hierarchyKeyFound = false;
    if (customizationOptions.patternOptions) {
      // Try hierarchy key: "material|texture|colour"
      const hKey = buildHierarchyKey(material!, formData.texture!, formData.colour!);
      if (hKey in customizationOptions.patternOptions) {
        allowed = customizationOptions.patternOptions[hKey];
        hierarchyKeyFound = true;
      }
    }
    // Fall back to flat key: "material"
    if (!hierarchyKeyFound && customizationOptions.patternOptions) {
      if (material! in customizationOptions.patternOptions) {
        allowed = customizationOptions.patternOptions[material!];
        hierarchyKeyFound = true;
      }
    }

    // Full path selected but no admin key = admin disabled patterns for this combo → Blank only.
    const filtered = hierarchyKeyFound
      ? customizationOptions.patterns.filter(p => (allowed || []).includes(p.option_key))
      : [];

    return [
      { id: 0, name: 'Blank', key: 'none' },
      ...filtered.map((p, index) => ({
        id: index + 1,
        name: p.label,
        key: p.option_key
      }))
    ];
  };

  // Admin-configured patterns - filtered by selected material, always prepend "Blank"
  const patterns = buildPatternsForMaterial(formData.baseMaterial);

  // Look up the selected pattern's key for the card overlay
  const selectedPatternKey = patterns.find(p => p.id === formData.pattern)?.key || null;

  // Check if an option is available based on current base selection
  const isTextureAvailable = (texture: string): boolean => {
    if (!formData.baseMaterial) return false;
    const availableTextures = textureOptions[formData.baseMaterial];
    return availableTextures ? availableTextures.includes(texture) : false;
  };

  const isColourAvailable = (colour: string): boolean => {
    if (!formData.baseMaterial) return false;

    // Try hierarchy key first: "material|texture"
    let availableColours: string[] | undefined;
    let colourKeyFound = false;
    if (formData.texture) {
      const hKey = buildHierarchyKey(formData.baseMaterial, formData.texture);
      if (hKey in colourOptions) {
        availableColours = colourOptions[hKey];
        colourKeyFound = true;
      }
    }
    // Fall back to flat key: "material" only if no texture is selected yet
    // (if texture IS selected but key is absent, it means admin hasn't configured
    // colours for this texture — show nothing, don't fall back to material-level)
    if (!colourKeyFound && !formData.texture && formData.baseMaterial in colourOptions) {
      availableColours = colourOptions[formData.baseMaterial];
    }

    const isValidForSelection = (availableColours || []).includes(colour);
    if (!isValidForSelection) return false;

    // If we have plan-specific data from the API, the admin has already decided
    // which colours are available per plan — no need for a frontend founders-only check.
    // Only apply the founders-only restriction when using fallback (non-plan-specific) data.
    if (!customizationOptions) {
      const colourOption = allColours.find(c => c.value === colour);
      if (colourOption?.isFoundersOnly && !isFoundersCirclePlan) {
        return false;
      }
    }

    return true;
  };

  // Handle base material change
  const handleBaseMaterialChange = (material: BaseMaterial) => {
    const availableTextures = textureOptions[material] || [];
    const materialDefaults = customizationOptions?.defaults?.[material];

    // Determine the texture first (needed for colour hierarchy lookup)
    const newTexture: TextureOption | null = formData.texture && availableTextures.includes(formData.texture)
      ? formData.texture
      : (materialDefaults?.texture && availableTextures.includes(materialDefaults.texture)
        ? materialDefaults.texture as TextureOption
        : null);

    // Use hierarchy key ("material|texture") to look up available colours
    const colourHierarchyKey = newTexture ? buildHierarchyKey(material, newTexture) : null;
    const availableColours = (colourHierarchyKey && colourOptions[colourHierarchyKey]) || colourOptions[material] || [];

    // Determine colour
    const newColour: ColourOption | null = formData.colour && availableColours.includes(formData.colour)
      ? formData.colour
      : (materialDefaults?.colour && availableColours.includes(materialDefaults.colour)
        ? materialDefaults.colour as ColourOption
        : null);

    // Build the new patterns list for the target material using the shared helper
    const newMaterialPatterns = buildPatternsForMaterial(material);

    // Resolve the current pattern's key using the OLD material's pattern list
    const currentPatternKey = formData.pattern !== null
      ? patterns.find(p => p.id === formData.pattern)?.key
      : null;

    // Try to carry over the current pattern to the new material (match by key)
    let newPatternId: number | null = null;
    if (currentPatternKey) {
      const match = newMaterialPatterns.find(p => p.key === currentPatternKey);
      if (match) newPatternId = match.id;
    }

    // If current pattern isn't available, try the default for this material
    if (newPatternId === null && materialDefaults?.pattern) {
      const defaultMatch = newMaterialPatterns.find(p => p.key === materialDefaults.pattern);
      if (defaultMatch) newPatternId = defaultMatch.id;
    }

    // Fallback to Blank (id 0) if nothing else matches
    if (newPatternId === null) newPatternId = 0;

    const newFormData: StepData = {
      ...formData,
      baseMaterial: material,
      texture: newTexture,
      colour: newColour,
      pattern: newPatternId
    };
    setFormData(newFormData);
  };

  // Handle other selections — texture change resets colour & pattern (hierarchy)
  const handleTextureChange = (texture: TextureOption) => {
    if (isTextureAvailable(texture)) {
      // Check if current colour is still available with the new texture
      const hierarchyKey = formData.baseMaterial ? buildHierarchyKey(formData.baseMaterial, texture) : null;
      const availableColours = hierarchyKey && hierarchyKey in colourOptions ? colourOptions[hierarchyKey] : null;
      const currentColourStillValid = formData.colour && availableColours?.includes(formData.colour);

      // If current colour is not valid, try applying the default colour
      const materialDefaults = formData.baseMaterial ? customizationOptions?.defaults?.[formData.baseMaterial] : null;
      const defaultColour = materialDefaults?.colour && availableColours?.includes(materialDefaults.colour)
        ? materialDefaults.colour as ColourOption
        : null;

      const newColour = currentColourStillValid ? formData.colour : defaultColour;

      setFormData({
        ...formData,
        texture,
        colour: newColour,
        pattern: currentColourStillValid ? formData.pattern : null
      });
    }
  };

  const handleColourChange = (colour: ColourOption) => {
    if (isColourAvailable(colour)) {
      // Reset pattern when colour changes (different colours may have different patterns)
      setFormData({ ...formData, colour, pattern: null });
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
      const fileExt = file.name.split('.').pop();
      const fixedFilename = `logos/company-${Date.now()}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'company-logos');
      formData.append('filename', fixedFilename);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.url) {
        setLogoUploadError(result.error || 'Upload failed');
        return;
      }

      setCompanyLogoUrl(`${result.url}?t=${Date.now()}`);
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
    // Muted tones so the name reads as if engraved into the card surface
    // rather than overlaid on top of it.
    const darkBackgrounds = ['black', 'cherry', 'rose-gold'];
    if (formData.colour && darkBackgrounds.includes(formData.colour)) {
      return 'text-white/50';
    }
    return 'text-black/50';
  };

  const getEngravedShadow = (): string => {
    const darkBackgrounds = ['black', 'cherry', 'rose-gold'];
    const isDark = !!formData.colour && darkBackgrounds.includes(formData.colour);
    return isDark
      ? '0 1px 0 rgba(0,0,0,0.6), 0 -1px 0 rgba(255,255,255,0.08)'
      : '0 -1px 0 rgba(255,255,255,0.6), 0 1px 0 rgba(0,0,0,0.2)';
  };

  const handleContinue = () => {
    // Name is not required for Business plan
    if (userPlanType !== 'pro' && (!formData.cardFirstName.trim() || !formData.cardLastName.trim())) {
      alert('Please enter both first and last name for the card');
      return;
    }

    if (!formData.baseMaterial || !formData.texture || !formData.colour || formData.pattern === null) {
      alert('Please complete all configuration options');
      return;
    }

    // Starter must wait for the DB-managed card price before continuing,
    // otherwise checkout would fall back to selectedPlanAmount === '0' and the user gets a free card.
    if (isStarterPlan && starterCardPrice === null) {
      alert('Loading card price… please try again in a moment.');
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
      patternKey: selectedPattern?.key || 'none',
      // Plan type (for checkout/payment pricing)
      planType: userPlanType,
      // Founding member exclusive options (only for Founder's Circle plan)
      showLinkistLogo: isFoundersCirclePlan ? showLinkistLogo : true,
      companyLogoUrl: isFoundersCirclePlan ? companyLogoUrl : null,
      isFoundingMember: isFoundersCirclePlan,
      // Founders pricing (for checkout/payment)
      foundersTotalPrice: isFoundersCirclePlan ? foundersTotalPrice : null,
      foundersPricing: isFoundersCirclePlan ? foundersPricing : null,
      // Mockup images for checkout/cart preview
      mockupImages: mockupImages || null,
    };

    console.log('Configure: Saving card data to localStorage:', configData);

    // Save to localStorage and redirect to checkout
    localStorage.setItem('nfcConfig', JSON.stringify(configData));

    // Starter plan: lock in the DB-managed NFC card price for the checkout step
    if (isStarterPlan && starterCardPrice !== null) {
      localStorage.setItem('selectedPlanAmount', String(starterCardPrice));
    }

    // Verify the data was saved correctly
    const savedData = localStorage.getItem('nfcConfig');
    console.log('Configure: Verified saved data:', savedData);

    router.push('/nfc/checkout');
  };

  // Starter only: skip the physical card and create the free digital-only order (today's flow).
  const handleSkipStarterCard = async () => {
    setIsLoading(true);
    try {
      const userProfileStr = localStorage.getItem('userProfile');
      let email = '', firstName = 'User', lastName = 'Name', phoneNumber = '', country = 'IN';
      if (userProfileStr) {
        try {
          const profile = JSON.parse(userProfileStr);
          email = profile.email || '';
          firstName = profile.firstName || 'User';
          lastName = profile.lastName || 'Name';
          phoneNumber = profile.mobile || '';
          country = profile.country || 'IN';
        } catch (error) {
          console.error('Configure: Error parsing user profile for skip:', error);
        }
      }

      if (!email || !email.includes('@')) {
        alert('Please complete registration first. Email is required.');
        setIsLoading(false);
        router.push('/welcome-to-linkist');
        return;
      }

      const fullName = `${firstName} ${lastName}`;
      const response = await fetch('/api/process-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardConfig: {
            firstName, lastName, baseMaterial: 'digital', color: 'none',
            quantity: 1, isDigitalOnly: true, fullName, planType: 'starter',
          },
          checkoutData: {
            fullName, email, phoneNumber, country,
            addressLine1: 'N/A - Digital Product', addressLine2: '', city: 'N/A', state: 'N/A', postalCode: 'N/A',
          },
          paymentData: null,
          pricing: { subtotal: 0, shipping: 0, tax: 0, total: 0 },
        }),
      });
      const result = await response.json();

      if (result.success && result.order) {
        localStorage.setItem('selectedPlanAmount', '0');
        localStorage.setItem('orderConfirmation', JSON.stringify({
          orderId: result.order.id,
          orderNumber: result.order.orderNumber,
          customerName: fullName, email, phoneNumber,
          cardConfig: { firstName, lastName, baseMaterial: 'digital', color: 'none', quantity: 1, isDigitalOnly: true, fullName },
          shipping: {
            fullName, email, phone: phoneNumber, phoneNumber, country,
            addressLine1: 'N/A - Digital Product', city: 'N/A', postalCode: 'N/A', isFounderMember: false,
          },
          pricing: { subtotal: 0, taxAmount: 0, shippingCost: 0, total: 0 },
          isDigitalProduct: true, isDigitalOnly: true, planName: 'Starter',
        }));
        router.push('/nfc/success');
      } else {
        console.error('Configure: Failed to create digital-only Starter order:', result.error);
        alert(result.error || 'Failed to create order. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Configure: Error creating digital-only Starter order:', error);
      alert('Failed to create order. Please try again.');
      setIsLoading(false);
    }
  };

  // Show loading state while options are being fetched
  if (optionsLoading || !customizationOptions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="flex flex-col items-center justify-center min-h-[60vh] pt-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
          <p className="text-gray-500 text-lg">Loading card customization options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="pb-6">
          {/* Configuration Section - Full Width */}
          <div className="max-w-3xl mx-auto space-y-3">

            {/* Step 1: Personalize Name - Compact Modern Card (hidden for Business plan) */}
            {userPlanType !== 'pro' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Person className="mr-2 w-6 h-6 text-gray-600" /> Personalize Your Name
                </h2>
              </div>
              <div className="p-6">
                <p className="text-base text-gray-600 mb-4">
                  This name will appear on the card exactly as entered (independent from your profile name)
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Card First Name</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Card Last Name</label>
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
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Palette className="mr-2 w-6 h-6 text-gray-600" /> Base Material
                </h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  {baseMaterials.map((material) => (
                    <button
                      key={material.value}
                      onClick={() => handleBaseMaterialChange(material.value as BaseMaterial)}
                      className={`relative p-4 rounded-xl cursor-pointer transition-all ${
                        formData.baseMaterial === material.value
                          ? 'bg-red-100 shadow-lg'
                          : 'hover:shadow-sm'
                      }`}
                      style={{
                        border: formData.baseMaterial === material.value
                          ? '2px solid #CC0000'
                          : '2px solid #e5e7eb',
                        outline: 'none',
                      }}
                    >
                      <div className="text-center">
                        <h3 className={`font-bold text-base ${formData.baseMaterial === material.value ? 'text-red-600' : 'text-gray-900'}`}>{material.label}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{material.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Combined Texture & Colour in One Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Brush className="mr-2 w-6 h-6 text-gray-600" /> Texture & Colour
                </h2>
              </div>

              <div className="p-4 space-y-4">
                {/* Texture Section */}
                <div>
                  <h3 className="text-base font-bold text-gray-700 mb-2">Texture</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {allTextures.map((texture) => {
                      const isAvailable = isTextureAvailable(texture.value);
                      const isSelected = formData.texture === texture.value;

                      return (
                        <button
                          key={texture.value}
                          onClick={() => handleTextureChange(texture.value as TextureOption)}
                          disabled={!isAvailable}
                          className={`relative p-3 rounded-lg transition-all ${
                            !isAvailable
                              ? 'opacity-50 cursor-not-allowed bg-gray-100'
                              : isSelected
                                ? 'bg-red-100 shadow-lg'
                                : 'cursor-pointer'
                          }`}
                          style={{
                            border: !isAvailable
                              ? '2px solid #e5e7eb'
                              : isSelected
                                ? '2px solid #CC0000'
                                : '2px solid #e5e7eb',
                            outline: 'none',
                          }}
                        >
                          <div className="text-center">
                            <h4 className={`text-sm font-semibold ${!isAvailable ? 'text-gray-500' : isSelected ? 'text-red-600' : 'text-gray-900'}`}>
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
                  <h3 className="text-base font-bold text-gray-700 mb-2">Colour</h3>
                  <div className="flex flex-wrap gap-3">
                    {allColours
                      .filter((colour) => isColourAvailable(colour.value))
                      .map((colour) => {
                      const isSelected = formData.colour === colour.value;

                      return (
                        <button
                          key={colour.value}
                          onClick={() => handleColourChange(colour.value as ColourOption)}
                          className="relative group cursor-pointer"
                        >
                          <div
                            className={`w-14 h-14 rounded-xl transition-all ${
                              isSelected
                                ? 'scale-110 shadow-lg'
                                : 'hover:scale-105'
                            }`}
                            style={{
                              backgroundColor: colour.hex,
                              border: isSelected
                                ? '4px solid #CC0000'
                                : '4px solid #d1d5db',
                              outline: 'none',
                            }}
                          />
                          <span className={`text-sm mt-1 block text-center font-semibold ${
                            isSelected ? 'text-red-600' : 'text-gray-700'
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
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <GridPattern className="mr-2 w-6 h-6 text-gray-600" /> Pattern
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
                        className={`relative p-3 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-red-100 shadow-lg'
                            : 'hover:shadow-sm'
                        }`}
                        style={{
                          border: isSelected
                            ? '2px solid #CC0000'
                            : '2px solid #e5e7eb',
                          outline: 'none',
                        }}
                      >
                        <PatternThumbnail
                          patternKey={pattern.key}
                          isSelected={isSelected}
                          baseColor={allColours.find(c => c.value === formData.colour)?.hex || '#374151'}
                          colour={formData.colour || undefined}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Founders Circle Exclusive Options - Only visible when Founder's Circle plan is selected */}
            {isFoundersCirclePlan && (
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Crown className="mr-2 w-6 h-6 text-amber-500" /> Founders Circle Exclusive
                  </h2>
                </div>
                <div className="p-4 space-y-4">
                  {/* Linkist Logo Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-base font-bold text-gray-700">Linkist Logo</label>
                      <p className="text-sm text-gray-500 mt-1">Show Linkist branding on card back</p>
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

            {/* Live Preview - Tap to Flip. Only shown once user has chosen material + texture + colour. */}
            {(() => {
              const hasSelections = !!(formData.baseMaterial && formData.texture && formData.colour);
              return (
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden px-2 py-0">
              <h3 className="text-sm font-semibold text-gray-900 mb-0 py-0.5">Live Preview</h3>
              {hasSelections ? (
              <>
              <h4 className='text-sm text-gray-500 pb-2'>Logo preview is Indicative</h4>
              <div
                className="relative w-full cursor-pointer"
                style={{ perspective: '1000px' }}
                onClick={() => setIsCardFlipped(!isCardFlipped)}
              >
                <motion.div
                  className="relative w-full"
                  style={{ transformStyle: 'preserve-3d' }}
                  animate={{ rotateY: isCardFlipped ? 180 : 0 }}
                  transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                >
                  {/* Front Card */}
                  <div
                    className="w-full"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {mockupImages?.front ? (
                      /* Mockup-based front preview */
                      <div className="w-full flex justify-center overflow-hidden">
                        <div className="relative flex-shrink-0 w-[140%] sm:w-full aspect-[1.586/1] overflow-hidden">
                          <img
                            src={mockupImages.front}
                            alt="Card front"
                            className="w-full h-full object-cover block"
                            draggable={false}
                          />
                          {/* Name overlay — Signature & Founders only, bottom-left of card */}
                          {userPlanType !== 'pro' && (
                            <div className="absolute" style={{ bottom: '22%', left: '22%' }}>
                              {(() => {
                                const firstName = formData.cardFirstName?.trim() || '';
                                const lastName = formData.cardLastName?.trim() || '';
                                const isSingleCharOnly = firstName.length <= 1 && lastName.length <= 1;
                                if (isSingleCharOnly) {
                                  return (
                                    <div
                                      className={`${getTextColor()} text-xl sm:text-3xl font-semibold`}
                                      style={{ textShadow: getEngravedShadow() }}
                                    >
                                      {(firstName || 'J').toUpperCase()}{(lastName || 'D').toUpperCase()}
                                    </div>
                                  );
                                }
                                return (
                                  <div
                                    className={`${getTextColor()} text-sm sm:text-lg font-semibold tracking-wide`}
                                    style={{ textShadow: getEngravedShadow() }}
                                  >
                                    {firstName.toUpperCase()} {lastName.toUpperCase()}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                          {/* Company logo overlay — Founders only, center of card */}
                          {isFoundersCirclePlan && companyLogoUrl && (
                            <div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                              <img
                                src={companyLogoUrl}
                                alt="Company Logo"
                                className="h-8 sm:h-14 w-auto object-contain"
                                draggable={false}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-[1.6/1]" aria-hidden="true" />
                    )}
                  </div>

                  {/* Back Card */}
                  <div
                    className="absolute inset-0 w-full"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    {mockupImages?.back_with_logo || mockupImages?.back_without_logo ? (
                      /* Mockup-based back preview */
                      <div className="w-full flex justify-center overflow-hidden">
                        <div className="relative flex-shrink-0 w-[140%] sm:w-full aspect-[1.586/1] overflow-hidden">
                          <img
                            src={
                              isFoundersCirclePlan && !showLinkistLogo
                                ? (mockupImages.back_without_logo || mockupImages.back_with_logo!)
                                : (mockupImages.back_with_logo || mockupImages.back_without_logo!)
                            }
                            alt="Card back"
                            className="w-full h-full object-cover block"
                            draggable={false}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-[1.6/1]" aria-hidden="true" />
                    )}
                  </div>
                </motion.div>
              </div>
              <div className="text-center text-xs text-gray-500 mt-0.5">
                {isCardFlipped ? 'Back' : 'Front'} &bull; Click to see {isCardFlipped ? 'front' : 'back'} side
              </div>
              </>
              ) : (
                <div className="w-full aspect-[1.6/1] rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-center px-4 my-2">
                  <p className="text-xs text-gray-400">
                    Choose material, texture, and colour to see your card preview
                  </p>
                </div>
              )}
            </div>
              );
            })()}

            {/* CTA Section — Claude-principles design for Starter; original style for other plans */}
            {(() => {
              const missingItems: string[] = [];
              if (userPlanType !== 'pro' && (!formData.cardFirstName?.trim() || !formData.cardLastName?.trim())) {
                missingItems.push('Card Name');
              }
              if (!formData.baseMaterial) missingItems.push('Base Material');
              if (!formData.texture) missingItems.push('Texture');
              if (!formData.colour) missingItems.push('Colour');
              if (formData.pattern === null) missingItems.push('Pattern');

              const hasIncomplete = missingItems.length > 0;
              // Starter must wait for the DB price before Continue is clickable —
              // otherwise the user would check out at $0 (the seeded fallback).
              const isStarterPriceLoading = isStarterPlan && starterCardPrice === null;
              const isContinueDisabled = hasIncomplete || isLoading || isStarterPriceLoading;

              if (isStarterPlan) {
                return (
                  <div className="bg-[#FAF9F5] border border-[#E8E5DD] rounded-2xl shadow-[0_1px_2px_rgba(20,16,8,0.04)] p-6 sm:p-7">
                    {hasIncomplete && (
                      <div className="mb-5 flex items-start gap-2.5 bg-[#FBF1DC] border border-[#F0DFAE]/70 rounded-xl px-4 py-3">
                        <Warning className="w-4 h-4 mt-0.5 text-[#9A7D2E] flex-shrink-0" />
                        <p className="text-sm text-[#6B5719]">
                          Please select <span className="font-medium text-[#3D331C]">{missingItems.join(', ')}</span>
                        </p>
                      </div>
                    )}

                    {/* Primary: rich card-button */}
                    <button
                      onClick={handleContinue}
                      disabled={isContinueDisabled}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-[#E8E5DD] disabled:text-[#A8A095] disabled:hover:bg-[#E8E5DD] disabled:cursor-not-allowed cursor-pointer text-white rounded-xl px-6 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(220,38,38,0.18)] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/30 focus-visible:ring-offset-2"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center py-1">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                          <span className="font-semibold">Processing…</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div className="text-base font-semibold leading-tight text-left">
                            Get your NFC Card
                          </div>
                          <div className="text-2xl font-semibold tracking-tight">
                            {starterCardPrice !== null ? `$${starterCardPrice}` : '…'}
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Secondary: ghost Skip button */}
                    <button
                      type="button"
                      onClick={handleSkipStarterCard}
                      disabled={isLoading}
                      className="mt-4 w-full text-center py-2.5 px-4 rounded-lg text-sm font-medium text-[#5C5347] hover:text-[#1F1E1B] hover:bg-[#F0EDE4]/60 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F1E1B]/20 focus-visible:ring-offset-2"
                    >
                      Skip — continue with digital only
                    </button>
                    <p className="mt-1.5 text-center text-xs text-[#7A6F60]">
                      Activate your free Linkist ID and profile.
                    </p>
                  </div>
                );
              }

              // Non-Starter plans: keep the original CTA block (untouched)
              return (
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="p-3">
                    {hasIncomplete && (
                      <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-700 flex items-center">
                          <Warning className="mr-1.5 w-4 h-4 flex-shrink-0" /> Please select: <span className="font-semibold ml-1">{missingItems.join(', ')}</span>
                        </p>
                      </div>
                    )}
                    <button
                      onClick={handleContinue}
                      disabled={isContinueDisabled}
                      className={`w-full px-6 py-3 rounded-lg text-base font-semibold transition-all shadow-md ${
                        !isContinueDisabled
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
              );
            })()}

          </div>

        </div>
      </div>

    </div>
  );
}