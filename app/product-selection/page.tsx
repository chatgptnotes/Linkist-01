'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import StarsIcon from '@mui/icons-material/Stars';
import LockIcon from '@mui/icons-material/Lock';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import LanguageIcon from '@mui/icons-material/Language';
import Footer from '@/components/Footer';
import RequestAccessModal from '@/components/RequestAccessModal';
import EnterCodeModal from '@/components/EnterCodeModal';
import SignupOverlay from '@/components/SignupOverlay';
import { getTaxRate } from '@/lib/country-utils';
import { useToast } from '@/components/ToastProvider';

const Crown = StarsIcon;
const Lock = LockIcon;
const Key = VpnKeyIcon;
const Globe = LanguageIcon;

interface PlanData {
  id: string;
  name: string;
  type: string;
  price: number;
  monthly_price: number | null;
  yearly_price: number | null;
  yearly_discount_percent: number | null;
  has_card_customization: boolean;
  description: string;
  features: string[];
  popular: boolean;
  display_order: number;
}

// Fallback plans if API fails
const FALLBACK_PLANS: PlanData[] = [
  {
    id: 'starter', name: 'Starter', type: 'starter', price: 0,
    monthly_price: 0, yearly_price: 0, yearly_discount_percent: null,
    has_card_customization: false,
    description: 'A simple digital identity to get you started.',
    features: ['Linkist Digital Profile', 'Personalised Linkist ID', 'Easy sharing via link & QR', 'Basic analytics'],
    popular: false, display_order: 1,
  },
  {
    id: 'next', name: 'Next', type: 'next', price: 6.9,
    monthly_price: 6.9, yearly_price: 69, yearly_discount_percent: 17,
    has_card_customization: false,
    description: 'Take your digital identity to the next level.',
    features: ['Everything in Starter', 'Custom profile themes', 'Advanced analytics', 'Priority link placement', 'Email signature integration'],
    popular: false, display_order: 2,
  },
  {
    id: 'pro', name: 'Pro', type: 'pro', price: 9.9,
    monthly_price: 9.9, yearly_price: 99, yearly_discount_percent: 17,
    has_card_customization: true,
    description: 'Professional networking with NFC card customization.',
    features: ['Everything in Next', 'NFC Card Customization', 'Custom card designs', 'Lead capture forms', 'CRM integrations', 'Branded QR codes'],
    popular: true, display_order: 3,
  },
  {
    id: 'signature', name: 'Signature', type: 'signature', price: 12.9,
    monthly_price: 12.9, yearly_price: 129, yearly_discount_percent: 17,
    has_card_customization: true,
    description: 'Premium features for the serious professional.',
    features: ['Everything in Pro', 'Premium Metal NFC Card', 'Founding Member tag', 'AI Credits worth $50', 'Priority 24/7 Support', 'Exclusive card materials', 'Early access to features'],
    popular: false, display_order: 4,
  },
  {
    id: 'founders-circle', name: "Founder's Circle", type: 'founders-circle', price: 14.9,
    monthly_price: 14.9, yearly_price: 149, yearly_discount_percent: 17,
    has_card_customization: true,
    description: 'The ultimate Linkist experience for visionaries.',
    features: ['Everything in Signature', "Exclusive Founder's Circle badge", 'Up to 5 referral invites', 'Access to partner privileges', 'Lifetime premium benefits', 'Exclusive community access', 'Personal account manager'],
    popular: false, display_order: 5,
  },
];

const PREMIUM_TYPES: string[] = [];
const ALLOWED_PHYSICAL_CARD_COUNTRIES = ['India', 'UAE', 'USA', 'UK'];

export default function ProductSelectionPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // Plans state
  const [plans, setPlans] = useState<PlanData[]>(FALLBACK_PLANS);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [plansLoading, setPlansLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('pro');

  // User state
  const [userCountry, setUserCountry] = useState<string>('India');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Modals
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showSignupOverlay, setShowSignupOverlay] = useState(false);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [foundersClubUnlocked, setFoundersClubUnlocked] = useState(false);

  useEffect(() => {
    // Check auth
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setIsLoggedIn(true);
            const foundersValidated = localStorage.getItem('foundersClubValidated');
            if (foundersValidated === 'true') {
              setFoundersClubUnlocked(true);
            }
          } else {
            setFoundersClubUnlocked(false);
          }
        } else {
          setFoundersClubUnlocked(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setFoundersClubUnlocked(false);
      }
    };
    checkAuth();

    // Get user country
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      try {
        const profile = JSON.parse(userProfile);
        setUserCountry(profile.country || 'India');
      } catch (error) {
        console.error('Error parsing user profile:', error);
      }
    }

    // Fetch plans
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await fetch('/api/plans/active');
      const data = await response.json();
      if (data.plans && data.plans.length > 0) {
        const sorted = data.plans
          .filter((p: PlanData) => ['starter', 'next', 'pro', 'signature', 'founders-circle'].includes(p.type))
          .sort((a: PlanData, b: PlanData) => a.display_order - b.display_order);
        if (sorted.length > 0) {
          setPlans(sorted);
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setPlansLoading(false);
    }
  };

  // Founders Club code validation success
  const handleFoundersCodeSuccess = (data: { code: string; email: string }) => {
    setShowCodeModal(false);
    localStorage.setItem('foundersInviteCode', data.code);
    localStorage.setItem('foundersClubValidated', 'true');
    localStorage.setItem('productSelection', 'founders-club');
    localStorage.setItem('isFoundingMember', 'true');
    localStorage.setItem('foundingMemberPlan', 'lifetime');
    showToast('Welcome to the Founders Circle! Redirecting...', 'success');
    setTimeout(() => {
      router.push('/nfc/configure?founders=true');
    }, 500);
  };

  // Handle card click - just select it (move red border)
  const handleCardClick = (planId: string) => {
    setSelectedPlanId(planId);
  };

  // Handle Get Started button click
  const handleGetStarted = async () => {
    const plan = plans.find(p => p.id === selectedPlanId);
    if (!plan) return;
    await handlePlanAction(plan);
  };

  // Handle plan action (navigation/order logic)
  const handlePlanAction = async (plan: PlanData) => {
    const productId = plan.type;
    localStorage.setItem('productSelection', productId);
    localStorage.setItem('billingPeriod', billingPeriod);
    localStorage.setItem('selectedPlanName', plan.name);
    const planAmount = billingPeriod === 'yearly' ? (plan.yearly_price || 0) : (plan.monthly_price || 0);
    localStorage.setItem('selectedPlanAmount', String(planAmount));

    // If not logged in, show signup
    if (!isLoggedIn) {
      localStorage.setItem('pendingProductFlow', 'true');
      setShowSignupOverlay(true);
      return;
    }

    setLoading(true);

    if (productId === 'starter') {
      // Free tier - create digital-only order
      const userProfile = localStorage.getItem('userProfile');
      let email = '', firstName = 'User', lastName = 'Name', phoneNumber = '', country = 'IN';
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

      try {
        const response = await fetch('/api/process-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cardConfig: {
              firstName, lastName, baseMaterial: 'digital', color: 'none',
              quantity: 1, isDigitalOnly: true, fullName: `${firstName} ${lastName}`, planType: 'starter'
            },
            checkoutData: {
              fullName: `${firstName} ${lastName}`, email, phoneNumber, country,
              addressLine1: 'N/A - Digital Product', addressLine2: '', city: 'N/A', state: 'N/A', postalCode: 'N/A'
            },
            paymentData: null,
            pricing: { subtotal: 0, shipping: 0, tax: 0, total: 0 }
          }),
        });
        const result = await response.json();
        if (result.success && result.order) {
          const digitalOnlyOrder = {
            orderId: result.order.id, orderNumber: result.order.orderNumber,
            customerName: `${firstName} ${lastName}`, email, phoneNumber,
            cardConfig: { firstName, lastName, baseMaterial: 'digital', color: 'none', quantity: 1, isDigitalOnly: true, fullName: `${firstName} ${lastName}` },
            shipping: { fullName: `${firstName} ${lastName}`, email, phone: phoneNumber, phoneNumber, country, addressLine1: 'N/A - Digital Product', city: 'N/A', postalCode: 'N/A', isFounderMember: false },
            pricing: { subtotal: 0, taxAmount: 0, shippingCost: 0, total: 0 },
            isDigitalProduct: true, isDigitalOnly: true
          };
          localStorage.setItem('orderConfirmation', JSON.stringify(digitalOnlyOrder));
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
    } else if (productId === 'next') {
      // Next plan - no card customization, go directly to payment
      const userProfile = localStorage.getItem('userProfile');
      let nEmail = '', nFirstName = 'User', nLastName = 'Name', nPhone = '', nCountry = 'IN';
      if (userProfile) {
        try {
          const profile = JSON.parse(userProfile);
          nEmail = profile.email || '';
          nFirstName = profile.firstName || 'User';
          nLastName = profile.lastName || 'Name';
          nPhone = profile.mobile || '';
          nCountry = profile.country || 'IN';
        } catch (error) {
          console.error('Error parsing user profile:', error);
        }
      }
      const pendingOrder = {
        customerName: `${nFirstName} ${nLastName}`,
        email: nEmail,
        phoneNumber: nPhone,
        cardConfig: { firstName: nFirstName, lastName: nLastName, baseMaterial: 'digital', color: 'none', quantity: 1, isDigitalOnly: true, fullName: `${nFirstName} ${nLastName}`, planType: 'next' },
        shipping: { fullName: `${nFirstName} ${nLastName}`, email: nEmail, phone: nPhone, phoneNumber: nPhone, country: nCountry, addressLine1: 'N/A - Digital Product', city: 'N/A', postalCode: 'N/A', isFounderMember: false },
        pricing: { subtotal: planAmount, taxAmount: 0, shippingCost: 0, total: planAmount },
        isDigitalProduct: true,
        isDigitalOnly: true,
        planName: 'Next',
        billingPeriod,
      };
      localStorage.setItem('pendingOrder', JSON.stringify(pendingOrder));
      setTimeout(() => { router.push('/nfc/payment'); }, 500);
    } else if (productId === 'pro') {
      // Pro plan - has card customization, go to configure
      setTimeout(() => { router.push('/nfc/configure'); }, 500);
    } else if (productId === 'signature') {
      // Signature plan - premium card customization (not a founding member)
      setTimeout(() => { router.push('/nfc/configure'); }, 500);
    } else if (productId === 'founders-circle') {
      // Founders Circle - exclusive access
      localStorage.setItem('isFoundingMember', 'true');
      localStorage.setItem('foundingMemberPlan', 'lifetime');
      setTimeout(() => { router.push('/nfc/configure?founders=true'); }, 500);
    } else {
      setTimeout(() => { router.push('/nfc/configure'); }, 500);
    }
  };

  const getDisplayPrice = (plan: PlanData): string => {
    if (billingPeriod === 'yearly') {
      if (plan.yearly_price === 0 || plan.yearly_price === null) return '$0';
      return `$${plan.yearly_price}`;
    }
    if (plan.monthly_price === 0 || plan.monthly_price === null) return '$0';
    return `$${plan.monthly_price}`;
  };

  const getPriceLabel = (plan: PlanData): string => {
    return billingPeriod === 'yearly' ? '/Year' : '/month';
  };

  const isPremium = (plan: PlanData): boolean => {
    return PREMIUM_TYPES.includes(plan.type);
  };

  const toggleExpand = (planId: string) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header Section */}
      <section className="pt-24 pb-6 md:pt-32 md:pb-10 text-center px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl md:text-4xl lg:text-5xl font-semibold text-gray-900 mb-3 tracking-tight"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Choose Your Linkist Experience
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 text-sm md:text-base max-w-md mx-auto mb-6"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          Select the perfect plan for your professional networking needs
        </motion.p>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center rounded-full bg-gray-200 p-1"
        >
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              billingPeriod === 'yearly'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Yearly
          </button>
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              billingPeriod === 'monthly'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Monthly
          </button>
        </motion.div>

        {billingPeriod === 'yearly' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-600 text-xs mt-2 font-medium"
          >
            Save 2 months free with yearly billing
          </motion.p>
        )}
      </section>

      {/* Plans Section */}
      <section className="max-w-7xl mx-auto px-4 pb-8 md:pb-16 flex-grow">
        {plansLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Desktop: 5-column grid */}
            <div className="hidden lg:grid lg:grid-cols-5 gap-4">
              {plans.map((plan, idx) => (
                <DesktopPlanCard
                  key={plan.id}
                  plan={plan}
                  getDisplayPrice={getDisplayPrice}
                  getPriceLabel={getPriceLabel}
                  isPremium={isPremium(plan)}
                  isSelected={selectedPlanId === plan.id}
                  onCardClick={() => handleCardClick(plan.id)}
                  onRequestAccess={() => setShowRequestModal(true)}
                  onEnterCode={() => setShowCodeModal(true)}
                  onShowBenefits={() => setShowBenefitsModal(true)}
                  delay={idx * 0.05}
                />
              ))}
            </div>

            {/* Tablet: 3-column grid */}
            <div className="hidden md:grid md:grid-cols-3 lg:hidden gap-4">
              {plans.map((plan, idx) => (
                <DesktopPlanCard
                  key={plan.id}
                  plan={plan}
                  getDisplayPrice={getDisplayPrice}
                  getPriceLabel={getPriceLabel}
                  isPremium={isPremium(plan)}
                  isSelected={selectedPlanId === plan.id}
                  onCardClick={() => handleCardClick(plan.id)}
                  onRequestAccess={() => setShowRequestModal(true)}
                  onEnterCode={() => setShowCodeModal(true)}
                  onShowBenefits={() => setShowBenefitsModal(true)}
                  delay={idx * 0.05}
                />
              ))}
            </div>

            {/* Mobile: Stacked collapsible cards */}
            <div className="md:hidden space-y-3">
              {plans.map((plan, idx) => (
                <MobilePlanCard
                  key={plan.id}
                  plan={plan}
                  getDisplayPrice={getDisplayPrice}
                  getPriceLabel={getPriceLabel}
                  isPremium={isPremium(plan)}
                  isSelected={selectedPlanId === plan.id}
                  expanded={expandedPlan === plan.id}
                  onToggle={() => toggleExpand(plan.id)}
                  onCardClick={() => handleCardClick(plan.id)}
                  onRequestAccess={() => setShowRequestModal(true)}
                  onEnterCode={() => setShowCodeModal(true)}
                  onShowBenefits={() => setShowBenefitsModal(true)}
                  delay={idx * 0.05}
                />
              ))}
            </div>

            {/* Desktop/Tablet Get Started Button (inline) */}
            {selectedPlanId !== 'founders-circle' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-10 text-center hidden md:block"
              >
                <button
                  onClick={handleGetStarted}
                  disabled={loading}
                  className="bg-red-600 text-white px-12 py-4 rounded-full text-base font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {loading ? 'Processing...' : (
                    plans.find(p => p.id === selectedPlanId)?.type === 'starter'
                      ? 'Get Started Free'
                      : `Get Started with ${plans.find(p => p.id === selectedPlanId)?.name || 'Pro'}`
                  )}
                </button>
              </motion.div>
            )}

            {/* Spacer for mobile fixed button */}
            {selectedPlanId !== 'founders-circle' && (
              <div className="h-24 md:hidden" />
            )}
          </>
        )}
      </section>

      {/* Mobile Fixed Bottom Get Started Button */}
      {selectedPlanId !== 'founders-circle' && !plansLoading && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 px-4 py-3">
          <button
            onClick={handleGetStarted}
            disabled={loading}
            className="w-full bg-red-600 text-white py-4 rounded-full text-base font-semibold hover:bg-red-700 transition-all shadow-lg cursor-pointer disabled:opacity-50"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            {loading ? 'Processing...' : (
              plans.find(p => p.id === selectedPlanId)?.type === 'starter'
                ? 'Get Started Free'
                : `Get Started with ${plans.find(p => p.id === selectedPlanId)?.name || 'Pro'}`
            )}
          </button>
        </div>
      )}

      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Modals */}
      <RequestAccessModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => {}}
      />
      <EnterCodeModal
        isOpen={showCodeModal}
        onClose={() => setShowCodeModal(false)}
        onSuccess={handleFoundersCodeSuccess}
      />
      <SignupOverlay
        isOpen={showSignupOverlay}
        onClose={() => setShowSignupOverlay(false)}
        selectedProduct={''}
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
              <h2 className="text-xl font-bold text-gray-900">Founder's Circle Benefits</h2>
            </div>
            <ul className="space-y-3">
              {['Lifetime subscription to Linkist Pro App', 'Linkist Digital Profile', 'AI Credits worth $50', 'Premium Metal Card', 'Exclusive Black colour variants', '"Founding Member" tag on the card', 'No expiry on AI credits', 'Customisable Card', 'Up to 5 Referral invites', 'Access to Linkist Exclusive Partner Privileges'].map((benefit, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
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

// Desktop Plan Card
function DesktopPlanCard({
  plan, getDisplayPrice, getPriceLabel, isPremium, isSelected, onCardClick, onRequestAccess, onEnterCode, onShowBenefits, delay,
}: {
  plan: PlanData;
  getDisplayPrice: (plan: PlanData) => string;
  getPriceLabel: (plan: PlanData) => string;
  isPremium: boolean;
  isSelected: boolean;
  onCardClick: () => void;
  onRequestAccess: () => void;
  onEnterCode: () => void;
  onShowBenefits: () => void;
  delay: number;
}) {
  const isFoundersCircle = plan.type === 'founders-circle';

  if (isFoundersCircle) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="relative rounded-2xl p-6 flex flex-col h-full bg-white border-2 border-gray-800 text-gray-900"
      >
        {/* Info button */}
        <button
          onClick={onShowBenefits}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <InfoOutlinedIcon style={{ fontSize: 24 }} />
        </button>

        {/* Exclusive badge */}
        <div className="flex flex-col items-center text-center flex-grow">
          <span className="inline-block bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-4 mt-2">
            Exclusive
          </span>

          <LockIcon className="text-gray-800 mb-4" style={{ fontSize: 32 }} />

          <h3
            className="text-xl font-bold text-gray-900 mb-2"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Exclusive. Invite-Only Access.
          </h3>

          <p
            className="text-sm text-gray-500 mb-8"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Request access or enter your invite code
          </p>

          {/* Request Access button */}
          <button
            onClick={onRequestAccess}
            className="w-full py-3 rounded-full text-sm font-semibold text-center transition-all cursor-pointer bg-red-600 text-white hover:bg-red-700 mb-3"
          >
            Request Access
          </button>

          {/* Enter Code button */}
          <button
            onClick={onEnterCode}
            className="w-full py-3 rounded-full text-sm font-semibold text-center transition-all cursor-pointer bg-amber-500 text-white hover:bg-amber-600 flex items-center justify-center gap-2"
          >
            <VpnKeyIcon style={{ fontSize: 18 }} />
            Enter Code
          </button>

          <p className="text-xs text-gray-400 mt-3">
            Already have an invite code?
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onCardClick}
      className={`relative rounded-2xl p-6 flex flex-col h-full cursor-pointer transition-all duration-300 ${
        isPremium
          ? 'bg-gray-900 text-white'
          : 'bg-white border border-gray-200 text-gray-900'
      } ${isSelected ? 'ring-2 ring-red-500 scale-[1.02] shadow-lg' : 'hover:shadow-md'}`}
    >
      {isSelected && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
            Selected
          </span>
        </div>
      )}

      <h3
        className={`text-lg font-semibold mb-1 ${isPremium ? 'text-white' : 'text-gray-900'}`}
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {plan.name}
      </h3>

      <div className="mb-3">
        <span className="text-3xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
          {getDisplayPrice(plan)}
        </span>
        <span className={`text-sm ml-1 ${isPremium ? 'text-gray-400' : 'text-gray-500'}`}>
          {getPriceLabel(plan)}
        </span>
      </div>

      <p
        className={`text-sm mb-5 ${isPremium ? 'text-gray-400' : 'text-gray-500'}`}
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {plan.description}
      </p>

      <div className={`w-full h-px mb-5 ${isPremium ? 'bg-gray-700' : 'bg-gray-200'}`} />

      <div className="space-y-3 flex-grow">
        {plan.features.map((feature, fIdx) => (
          <div key={fIdx} className="flex items-start gap-2">
            <CheckCircleOutlineIcon
              className={isPremium ? 'text-gray-400' : 'text-gray-400'}
              style={{ fontSize: 18 }}
            />
            <span
              className={`text-sm ${isPremium ? 'text-gray-300' : 'text-gray-600'}`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {feature}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Mobile Plan Card (Collapsible)
function MobilePlanCard({
  plan, getDisplayPrice, getPriceLabel, isPremium, isSelected, expanded, onToggle, onCardClick, onRequestAccess, onEnterCode, onShowBenefits, delay,
}: {
  plan: PlanData;
  getDisplayPrice: (plan: PlanData) => string;
  getPriceLabel: (plan: PlanData) => string;
  isPremium: boolean;
  isSelected: boolean;
  expanded: boolean;
  onToggle: () => void;
  onCardClick: () => void;
  onRequestAccess: () => void;
  onEnterCode: () => void;
  onShowBenefits: () => void;
  delay: number;
}) {
  const isFoundersCircle = plan.type === 'founders-circle';

  if (isFoundersCircle) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="rounded-2xl overflow-hidden bg-white border-2 border-gray-800 text-gray-900"
      >
        <div className="relative p-5 flex flex-col items-center text-center">
          {/* Info button */}
          <button
            onClick={onShowBenefits}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <InfoOutlinedIcon style={{ fontSize: 22 }} />
          </button>

          <span className="inline-block bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-3">
            Exclusive
          </span>

          <LockIcon className="text-gray-800 mb-3" style={{ fontSize: 28 }} />

          <h3
            className="text-lg font-bold text-gray-900 mb-1"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Exclusive. Invite-Only Access.
          </h3>

          <p
            className="text-sm text-gray-500 mb-5"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Request access or enter your invite code
          </p>

          <button
            onClick={onRequestAccess}
            className="w-full py-3 rounded-full text-sm font-semibold text-center transition-all cursor-pointer bg-red-600 text-white hover:bg-red-700 mb-3"
          >
            Request Access
          </button>

          <button
            onClick={onEnterCode}
            className="w-full py-3 rounded-full text-sm font-semibold text-center transition-all cursor-pointer bg-amber-500 text-white hover:bg-amber-600 flex items-center justify-center gap-2"
          >
            <VpnKeyIcon style={{ fontSize: 18 }} />
            Enter Code
          </button>

          <p className="text-xs text-gray-400 mt-3">
            Already have an invite code?
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onCardClick}
      className={`rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 ${
        isPremium
          ? 'bg-gray-900 text-white'
          : 'bg-gray-100 text-gray-900'
      } ${isSelected ? 'ring-2 ring-red-500 shadow-lg' : ''}`}
    >
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3
              className={`text-xl font-semibold ${isPremium ? 'text-white' : 'text-gray-900'}`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {plan.name}
            </h3>
            {isSelected && (
              <span className="bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Selected
              </span>
            )}
          </div>
          <div className="text-right flex-shrink-0 ml-4">
            <span className="text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>
              {getDisplayPrice(plan)}
            </span>
            <span className={`text-xs ml-1 ${isPremium ? 'text-gray-400' : 'text-gray-500'}`}>
              {getPriceLabel(plan)}
            </span>
          </div>
        </div>
        <p
          className={`text-sm ${isPremium ? 'text-gray-400' : 'text-gray-500'}`}
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {plan.description}
        </p>
      </div>

      {/* Expand/Collapse Chevron */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`w-full flex justify-center py-2 transition-colors ${
          isPremium ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
        }`}
      >
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ExpandMoreIcon className={isPremium ? 'text-gray-400' : 'text-gray-500'} />
        </motion.div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <div className={`w-full h-px mb-4 ${isPremium ? 'bg-gray-700' : 'bg-gray-300'}`} />

              <div className="space-y-3">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-2">
                    <CheckCircleOutlineIcon
                      className={isPremium ? 'text-gray-400' : 'text-gray-400'}
                      style={{ fontSize: 18 }}
                    />
                    <span
                      className={`text-sm ${isPremium ? 'text-gray-300' : 'text-gray-600'}`}
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
