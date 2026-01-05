'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CheckIcon from '@mui/icons-material/Check';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import PersonIcon from '@mui/icons-material/Person';
import LanguageIcon from '@mui/icons-material/Language';
import StarsIcon from '@mui/icons-material/Stars';
import LockIcon from '@mui/icons-material/Lock';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import Footer from '@/components/Footer';
import RequestAccessModal from '@/components/RequestAccessModal';
import EnterCodeModal from '@/components/EnterCodeModal';
import SignupOverlay from '@/components/SignupOverlay';
import { getTaxRate } from '@/lib/country-utils';
import Link from 'next/link';
import LoginIcon from '@mui/icons-material/Login';

const Check = CheckIcon;
const CreditCard = CreditCardIcon;
const Smartphone = SmartphoneIcon;
const User = PersonIcon;
const Globe = LanguageIcon;
const Crown = StarsIcon;
const Lock = LockIcon;
const Key = VpnKeyIcon;
import { useToast } from '@/components/ToastProvider';

interface ProductOption {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  priceLabel: string;
  icon: React.ReactNode;
  features: string[];
  popular?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
}

// List of countries that allow physical cards (can be fetched from admin panel)
const ALLOWED_PHYSICAL_CARD_COUNTRIES = ['India', 'UAE', 'USA', 'UK'];

export default function ProductSelectionPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [userCountry, setUserCountry] = useState<string>('India');
  const [loading, setLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  // Founders Club state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [foundersClubUnlocked, setFoundersClubUnlocked] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [foundersClubPrice, setFoundersClubPrice] = useState<number | null>(null);
  const [foundersClubOriginalPrice, setFoundersClubOriginalPrice] = useState<number>(999);
  const [foundersClubDescription, setFoundersClubDescription] = useState<string>('Exclusive membership with lifetime benefits');
  const [foundersClubFeatures, setFoundersClubFeatures] = useState<string[]>([
    'Founders Tag on NFC Card',
    'Exclusive Black Card Colors',
    'Lifetime 50% Discount',
    'Priority 24/7 Support',
    'Early Access to Features'
  ]);

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignupOverlay, setShowSignupOverlay] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setIsLoggedIn(true);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();

    // Get user's country from localStorage (set during onboarding)
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        setUserCountry(profile.country || 'India');
      } catch (error) {
        console.error('Error parsing user profile:', error);
      }
    }

    // Check if Founders Club is already unlocked
    const foundersValidated = localStorage.getItem('foundersClubValidated');
    if (foundersValidated === 'true') {
      setFoundersClubUnlocked(true);
    }

    // Fetch plans from API
    fetchPlans();

    // Fetch Founders Club pricing from API
    fetchFoundersPricing();
  }, []);

  const fetchFoundersPricing = async () => {
    try {
      const response = await fetch('/api/founders/pricing');
      const data = await response.json();

      if (data.success && data.founders_total_price) {
        setFoundersClubPrice(data.founders_total_price);
        // Calculate original price (approximately 3x the sale price for "Save $X" display)
        const originalPrice = Math.round(data.founders_total_price * 3);
        setFoundersClubOriginalPrice(originalPrice);

        // Update description and features from API if available
        if (data.plan?.description) {
          setFoundersClubDescription(data.plan.description);
        }
        if (data.plan?.features && Array.isArray(data.plan.features) && data.plan.features.length > 0) {
          setFoundersClubFeatures(data.plan.features);
        }
      }
    } catch (error) {
      console.error('Error fetching founders pricing:', error);
      // Don't set a fallback - let the UI show loading state
    }
  };

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await fetch('/api/plans/active');
      const data = await response.json();

      if (data.success && data.plans) {
        // Map database plans to ProductOption format
        // Filter out founders-club plans (they have a separate "Exclusive Access" card)
        // Define desired order: Free first, then Personal
        const planOrder: Record<string, number> = {
          'digital-only': 1,      // Free - First
          'physical-digital': 2,  // Personal - Second
          'digital-with-app': 3,  // Digital + App - Third (if exists)
        };

        const mappedPlans = data.plans
          .filter((plan: any) => plan.type !== 'founders-club')
          .sort((a: any, b: any) => (planOrder[a.type] || 99) - (planOrder[b.type] || 99))
          .map((plan: any) => {
          const isPhysicalCardAllowed = plan.allowed_countries?.includes(userCountry) ?? true;

          // Determine icon based on plan type
          let icon = <User className="w-6 h-6" />;
          if (plan.type === 'physical-digital') {
            icon = <CreditCard className="w-6 h-6" />;
          } else if (plan.type === 'digital-with-app') {
            icon = <Smartphone className="w-6 h-6" />;
          }

          // Determine price label
          let priceLabel = '';
          if (plan.popular) {
            priceLabel = 'Most Popular';
          } else if (plan.type === 'digital-with-app') {
            priceLabel = 'Best Value';
          }

          return {
            id: plan.type,
            title: plan.name,
            subtitle: plan.description,
            price: `$${plan.price}`,
            priceLabel: priceLabel,
            icon: icon,
            features: plan.features || [],
            popular: plan.popular || false,
            disabled: plan.type === 'physical-digital' && !isPhysicalCardAllowed,
            disabledMessage: `Physical cards are not available in ${userCountry}. Please choose a digital option.`
          };
        });

        setProductOptions(mappedPlans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Fallback to default plans if API fails
      setProductOptions(getDefaultPlans());
    } finally {
      setPlansLoading(false);
    }
  };

  const getDefaultPlans = (): ProductOption[] => {
    const isPhysicalCardAllowed = ALLOWED_PHYSICAL_CARD_COUNTRIES.includes(userCountry);

    // Order: Free first, then Personal
    return [
      {
        id: 'digital-only',
        title: 'Free',
        subtitle: 'Your professional identity - simple, shareable, sustainable.',
        price: '$0',
        priceLabel: '',
        icon: <User className="w-6 h-6" />,
        features: [
          'Digital profile',
          'Basic analytics',
          'Profile customization',
          'Standard support'
        ]
      },
      {
        id: 'physical-digital',
        title: 'Personal',
        subtitle: 'Premium NFC business card with digital profile',
        price: '$69',
        priceLabel: '',
        icon: <CreditCard className="w-6 h-6" />,
        features: [
          'Premium NFC card',
          'Unlimited profile updates',
          'Analytics dashboard',
          'Custom branding',
          'Priority support'
        ],
        popular: false,
        disabled: !isPhysicalCardAllowed,
        disabledMessage: `Physical cards are not available in ${userCountry}. Please choose a digital option.`
      }
    ];
  };

  const handleCardClick = (productId: string) => {
    const product = productOptions.find(p => p.id === productId);

    if (product?.disabled) {
      showToast(product.disabledMessage || 'This option is not available', 'error');
      return;
    }

    // Just select the card, don't navigate yet
    setSelectedProduct(productId);
  };

  // Handler for Founders Club code validation success
  const handleFoundersCodeSuccess = (data: { code: string; email: string }) => {
    setShowCodeModal(false);

    // Store all necessary data for the founders flow
    localStorage.setItem('foundersInviteCode', data.code);
    localStorage.setItem('foundersClubValidated', 'true');
    localStorage.setItem('productSelection', 'founders-club');
    localStorage.setItem('isFoundingMember', 'true');
    localStorage.setItem('foundingMemberPlan', 'lifetime');

    showToast('Welcome to the Founders Club! Redirecting...', 'success');

    // Auto-proceed to configure page - no need to select the card again
    setTimeout(() => {
      router.push('/nfc/configure?founders=true');
    }, 500);
  };

  const handleConfirmSelection = async () => {
    if (!selectedProduct) {
      showToast('Please select a plan first', 'error');
      return;
    }

    // Store the selection
    localStorage.setItem('productSelection', selectedProduct);

    // If user is not logged in, show signup overlay (for Cards 1-3)
    // Founders Club has its own flow via Enter Code modal
    if (!isLoggedIn && selectedProduct !== 'founders-club') {
      localStorage.setItem('pendingProductFlow', 'true');
      setShowSignupOverlay(true);
      return;
    }

    setLoading(true);

    // Route based on product type
    if (selectedProduct === 'digital-only') {
      // Digital Profile Only → Create order in database and redirect to success page
      const userProfile = localStorage.getItem('userProfile');
      let email = '';
      let firstName = 'User';
      let lastName = 'Name';
      let phoneNumber = '';
      let country = 'IN';

      if (userProfile) {
        try {
          const profile = JSON.parse(userProfile);
          email = profile.email || '';
          firstName = profile.firstName || 'User';
          lastName = profile.lastName || 'Name';
          phoneNumber = profile.mobile || '';
          country = profile.country || 'IN';
        } catch (error) {
          console.error('Error parsing user profile:', error);
        }
      }

      // Create order data for digital-only product (FREE - $0)
      const digitalOnlyPrice = 0;
      const taxAmount = 0;
      const totalAmount = 0;

      const cardConfig = {
        firstName,
        lastName,
        baseMaterial: 'digital',
        color: 'none',
        quantity: 1,
        isDigitalOnly: true,
        fullName: `${firstName} ${lastName}`
      };

      const checkoutData = {
        fullName: `${firstName} ${lastName}`,
        email,
        phoneNumber,
        country,
        addressLine1: 'N/A - Digital Product',
        addressLine2: '',
        city: 'N/A',
        state: 'N/A',
        postalCode: 'N/A'
      };

      try {
        // Call API to create order in database
        const response = await fetch('/api/process-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cardConfig,
            checkoutData,
            paymentData: null, // No payment needed for free tier
            pricing: {
              subtotal: digitalOnlyPrice,
              shipping: 0,
              tax: taxAmount,
              total: totalAmount
            }
          }),
        });

        const result = await response.json();

        if (result.success && result.order) {
          // Order created successfully in database
          const digitalOnlyOrder = {
            orderId: result.order.id,
            orderNumber: result.order.orderNumber,
            customerName: `${firstName} ${lastName}`,
            email,
            phoneNumber,
            cardConfig,
            shipping: {
              fullName: `${firstName} ${lastName}`,
              email,
              phone: phoneNumber,
              phoneNumber,
              country,
              addressLine1: 'N/A - Digital Product',
              city: 'N/A',
              postalCode: 'N/A',
              isFounderMember: false
            },
            pricing: {
              subtotal: digitalOnlyPrice,
              taxAmount: taxAmount,
              shippingCost: 0,
              total: totalAmount
            },
            isDigitalProduct: true,
            isDigitalOnly: true
          };

          // Store order confirmation for success page
          localStorage.setItem('orderConfirmation', JSON.stringify(digitalOnlyOrder));

          // Redirect to success page
          router.push('/nfc/success');
        } else {
          showToast(result.error || 'Failed to create order', 'error');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error creating order:', error);
        showToast('Failed to create order. Please try again.', 'error');
        setLoading(false);
      }
    } else if (selectedProduct === 'digital-with-app') {
      // Digital Profile + Linkist App → Payment page directly
      setTimeout(() => {
        const userProfile = localStorage.getItem('userProfile');
        let email = '';
        let firstName = 'User';
        let lastName = 'Name';
        let phoneNumber = '';
        let country = 'IN';

        if (userProfile) {
          try {
            const profile = JSON.parse(userProfile);
            email = profile.email || '';
            firstName = profile.firstName || 'User';
            lastName = profile.lastName || 'Name';
            phoneNumber = profile.mobile || '';
            country = profile.country || 'IN';
          } catch (error) {
            console.error('Error parsing user profile:', error);
          }
        }

        // Create minimal order for digital product (no physical shipping needed)
        const digitalProfilePrice = 59;
        const subscriptionPrice = 120;
        const taxableAmount = digitalProfilePrice; // Only tax on digital profile
        const taxInfo = getTaxRate(country);
        const taxAmount = taxableAmount * taxInfo.rate;
        const totalAmount = digitalProfilePrice + subscriptionPrice + taxAmount;

        const digitalOrder = {
          orderId: `digital-${Date.now()}`, // Temporary ID
          orderNumber: `DIG-${Date.now()}`,
          customerName: `${firstName} ${lastName}`,
          email,
          phoneNumber,
          productName: 'Digital Profile + Linkist App',
          cardConfig: {
            firstName,
            lastName,
            baseMaterial: 'digital',
            color: 'none',
            quantity: 1,
            isDigitalOnly: true,
            fullName: `${firstName} ${lastName}`
          },
          shipping: {
            country,
            addressLine1: 'N/A - Digital Product',
            city: 'N/A',
            postalCode: 'N/A'
          },
          pricing: {
            digitalProfilePrice: digitalProfilePrice,
            subscriptionPrice: subscriptionPrice,
            subtotal: digitalProfilePrice + subscriptionPrice,
            taxAmount: taxAmount,
            shippingCost: 0,
            total: totalAmount
          },
          isDigitalProduct: true
        };

        localStorage.setItem('pendingOrder', JSON.stringify(digitalOrder));
        router.push('/nfc/payment');
      }, 500);
    } else if (selectedProduct === 'physical-digital') {
      // Physical Card + Digital Profile → Configure page
      setTimeout(() => {
        router.push('/nfc/configure');
      }, 500);
    } else if (selectedProduct === 'founders-club') {
      // Founders Club → Store founders status and go to configure page
      localStorage.setItem('isFoundingMember', 'true');
      localStorage.setItem('foundingMemberPlan', 'lifetime');

      setTimeout(() => {
        router.push('/nfc/configure?founders=true');
      }, 500);
    } else {
      // Default fallback
      setTimeout(() => {
        router.push('/nfc/configure');
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">
      {/* Header with Login Button */}
      {!isLoggedIn && !checkingAuth && (
        <div className="w-full px-4 md:px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-end">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
            >
              <LoginIcon className="w-5 h-5" />
              Login
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 flex-grow">
        {/* Title Section */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 px-4">
            Choose Your Linkist Experience
          </h1>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Select the perfect plan for your professional networking needs
          </p>

          {!ALLOWED_PHYSICAL_CARD_COUNTRIES.includes(userCountry) && (
            <div className="mt-4 inline-flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-2 rounded-lg">
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium">
                Physical cards are currently not available in {userCountry}
              </span>
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-4 mb-6">
          {plansLoading ? (
            // Loading skeleton
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border-2 border-gray-200 p-4 animate-pulse w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-12px)] max-w-[350px]">
                <div className="w-10 h-10 bg-gray-200 rounded-full mb-3"></div>
                <div className="h-5 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
                <div className="h-6 bg-gray-200 rounded mb-2 w-1/3"></div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : (
            <>
              {/* Regular Product Options */}
              {productOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => !option.disabled && handleCardClick(option.id)}
                  className={`relative rounded-2xl border-2 transition-all w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-12px)] max-w-[350px] ${
                    selectedProduct === option.id
                      ? 'border-[#263252] shadow-lg scale-[1.02] ring-1 ring-[#263252] ring-offset-2 md:shadow-2xl md:scale-105 md:ring-2 md:ring-offset-4 cursor-pointer'
                      : option.disabled
                      ? 'border-gray-200 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-lg cursor-pointer'
                  }`}
                >
                  {/* Popular Badge */}
                  {option.popular && !option.disabled && (
                    <div className="absolute -top-4 md:-top-5 left-1/2 transform -translate-x-1/2 z-20">
                      <span className="bg-red-600 text-white px-3 py-1 md:px-4 rounded-full text-[10px] md:text-xs font-semibold shadow-lg whitespace-nowrap">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  {/* Disabled Overlay */}
                  {option.disabled && (
                    <div className="absolute inset-0 bg-white/80 rounded-2xl z-10 flex items-center justify-center p-6 pointer-events-none">
                      <div className="text-center">
                        <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">Not available in your region</p>
                        <p className="text-sm text-gray-500 mt-2">{option.disabledMessage}</p>
                      </div>
                    </div>
                  )}

                  <div className={`${option.popular && !option.disabled ? 'pt-6 px-5 pb-5 md:px-4 md:pb-4' : 'p-5 md:p-4'}`}>
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-14 h-14 md:w-12 md:h-12 rounded-full mb-4 bg-[#263252] text-white">
                      {option.icon}
                    </div>

                    {/* Title & Subtitle */}
                    <h3 className="text-lg md:text-base font-bold text-gray-900 mb-2 md:mb-1">
                      {option.title}
                    </h3>
                    <p className="text-sm md:text-xs text-gray-600 mb-4 md:mb-3">
                      {option.subtitle}
                    </p>

                    {/* Price */}
                    <div className="mb-4 md:mb-3">
                      <p className="text-2xl md:text-xl font-bold text-gray-900">
                        {option.price}
                      </p>
                      {option.priceLabel && (
                        <p className="text-sm md:text-xs text-gray-500 mt-1 md:mt-0.5">
                          {option.priceLabel}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 md:space-y-1.5">
                      {option.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="w-5 h-5 md:w-4 md:h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm md:text-xs text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}

              {/* 4th Card: Founders Club (Locked/Unlocked) */}
              <div
                className={`relative rounded-2xl border-2 transition-all overflow-hidden w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-12px)] max-w-[350px] ${
                  foundersClubUnlocked
                    ? selectedProduct === 'founders-club'
                      ? 'border-amber-500 shadow-lg scale-[1.02] ring-1 ring-amber-500 ring-offset-2 md:shadow-2xl md:scale-105 md:ring-2 md:ring-offset-4 cursor-pointer'
                      : 'border-amber-300 hover:border-amber-400 hover:shadow-lg cursor-pointer bg-gradient-to-b from-amber-50 to-white'
                    : 'border-gray-300 bg-gray-100 min-h-[320px]'
                }`}
                onClick={() => foundersClubUnlocked && handleCardClick('founders-club')}
              >
                {/* Locked Overlay */}
                {!foundersClubUnlocked && (
                  <div className="absolute inset-0 bg-white z-10 flex flex-col items-center justify-center p-6">
                    <Lock className="w-12 h-12 text-gray-400 mb-3" />
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <p className="text-gray-700 font-semibold text-center text-base">
                        Exclusive. Invite-Only Access.
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowBenefitsModal(true);
                        }}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <InfoOutlinedIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-gray-500 text-sm text-center mb-5">
                      Request access or enter your invite code
                    </p>
                    <div className="flex flex-col gap-3 w-full max-w-[200px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRequestModal(true);
                        }}
                        className="w-full py-2.5 px-4 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        Request Access
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCodeModal(true);
                        }}
                        className="w-full py-2.5 px-4 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Key className="w-4 h-4" />
                        Enter Code
                      </button>
                      <p className="text-gray-500 text-xs text-center mt-1">
                        Already have an invite code?
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-6 px-5 pb-5 md:px-4 md:pb-4">
                  {/* Icon */}
                  <div className="inline-flex items-center justify-center w-14 h-14 md:w-12 md:h-12 rounded-full mb-4 bg-gradient-to-br from-amber-400 to-amber-600 text-white">
                    <Crown className="w-7 h-7 md:w-6 md:h-6" />
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-lg md:text-base font-bold text-gray-900 mb-2 md:mb-1">
                    Founders Club
                  </h3>
                  <p className="text-sm md:text-xs text-gray-600 mb-4 md:mb-3">
                    {foundersClubDescription}
                  </p>

                  {/* Price */}
                  <div className="mb-4 md:mb-3">
                    <p className="text-2xl md:text-xl font-bold text-gray-900">
                      ${foundersClubPrice ?? '...'}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 md:space-y-1.5">
                    {foundersClubFeatures.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 md:w-4 md:h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm md:text-xs text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 min-h-[52px]">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors cursor-pointer text-center"
          >
            ← Go Back
          </button>

          <button
            onClick={handleConfirmSelection}
            disabled={loading || !selectedProduct}
            className={`w-full sm:w-auto px-8 py-3 rounded-xl font-semibold transition-all cursor-pointer disabled:cursor-not-allowed ${
              selectedProduct
                ? 'shadow-lg hover:shadow-xl opacity-100'
                : 'opacity-0 pointer-events-none'
            }`}
            style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              'Continue →'
            )}
          </button>
        </div>
      </div>

      <Footer />

      {/* Request Access Modal */}
      <RequestAccessModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => {
          // Optional: Do something on success
        }}
      />

      {/* Enter Code Modal */}
      <EnterCodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSuccess={handleFoundersCodeSuccess}
      />

      {/* Signup Overlay for Cards 1-3 */}
      <SignupOverlay
        isOpen={showSignupOverlay}
        onClose={() => setShowSignupOverlay(false)}
        selectedProduct={selectedProduct}
      />

      {/* Founders Club Benefits Modal */}
      {showBenefitsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBenefitsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <CloseIcon className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Founder&apos;s Club Benefits</h2>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Lifetime subscription to Linkist Pro App</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Linkist Digital Profile</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">AI Credits worth $50</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Premium Metal Card</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Exclusive Black colour variants</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">&quot;Founding Member&quot; tag on the card</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">No expiry on AI credits</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Customisable Card</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Up to 3 Referral invites into Founding Club</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Access to Linkist Exclusive Partner Privileges</span>
              </li>
            </ul>

            <button
              onClick={() => setShowBenefitsModal(false)}
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