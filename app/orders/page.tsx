'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PaymentIcon from '@mui/icons-material/Payment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const Package = Inventory2Icon;
const Truck = LocalShippingIcon;
const CheckCircle = CheckCircleIcon;
const Clock = AccessTimeIcon;
const Info = InfoIcon;

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  email: string;
  cardConfig: any;
  shipping: any;
  pricing: {
    total: number;
    subtotal: number;
    shipping: number;
    tax: number;
  };
  estimatedDelivery?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  createdAt: number;
  updatedAt: number;
  payment?: {
    paymentMethod?: string;
    status?: string;
    amount?: number;
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      // Check authentication
      const authResponse = await fetch('/api/auth/me');

      if (!authResponse.ok || authResponse.status === 401) {
        router.push('/login?returnUrl=/orders');
        return;
      }

      const authData = await authResponse.json();

      if (!authData.isAuthenticated || !authData.user?.email) {
        router.push('/login?returnUrl=/orders');
        return;
      }

      const email = authData.user.email;
      setUserEmail(email);

      // Load orders from API
      const response = await fetch(`/api/account?email=${encodeURIComponent(email)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load orders');
      }

      setOrders(data.data.orders || []);

    } catch (error) {
      console.error('Error loading orders:', error);
      setError('Failed to load orders');

      // Try to show localStorage orders as fallback
      const currentOrder = localStorage.getItem('currentOrder');
      if (currentOrder) {
        try {
          const order = JSON.parse(currentOrder);
          setOrders([{
            ...order,
            id: 'local-' + Date.now(),
            status: 'confirmed',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }]);
          setError(null);
        } catch (parseError) {
          console.error('Error parsing localStorage order:', parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getPlanName = (order: Order): string => {
    const planType = order.cardConfig?.planType;
    const planMap: Record<string, string> = {
      'signature': 'Signature',
      'pro': 'Pro',
      'next': 'Next',
      'founders-club': "Founder's Circle",
      'founders-circle': "Founder's Circle",
      'digital-only': 'Digital Only',
      'digital-profile-app': 'Digital Profile + App',
      'starter': 'Starter',
      'physical-digital': 'NFC Card + Digital',
    };
    if (planType && planMap[planType]) return planMap[planType];
    // Fallback: derive from order number prefix
    const orderNum = order.orderNumber || '';
    if (orderNum.includes('-FC-')) return "Founder's Circle";
    if (orderNum.includes('-SIG-')) return 'Signature';
    if (orderNum.includes('-PRO-')) return 'Pro';
    if (orderNum.includes('-NXT-')) return 'Next';
    if (orderNum.includes('-DO-')) return 'Digital Only';
    if (orderNum.includes('-DPLA-')) return 'Digital Profile + App';
    if (orderNum.includes('-CDPLA-')) return 'NFC Card + Digital';
    return order.cardConfig?.cardType || 'Standard';
  };

  const getPaymentMethodLabel = (method?: string): string => {
    if (!method) return 'N/A';
    const methodMap: Record<string, string> = {
      'card': 'Credit/Debit Card',
      'apple_pay': 'Apple Pay',
      'google_pay': 'Google Pay',
      'link': 'Link',
    };
    return methodMap[method.toLowerCase()] || method.charAt(0).toUpperCase() + method.slice(1);
  };

  const getShippingStatusLabel = (order: Order): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Order Placed',
      'confirmed': 'Order Confirmed',
      'production': 'In Production',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };
    return statusMap[order.status?.toLowerCase()] || order.status || 'Unknown';
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; icon: any; text: string } } = {
      confirmed: { color: 'green', icon: CheckCircle, text: 'Confirmed' },
      processing: { color: 'blue', icon: Clock, text: 'Processing' },
      shipped: { color: 'purple', icon: Truck, text: 'Shipped' },
      delivered: { color: 'green', icon: CheckCircle, text: 'Delivered' },
      pending: { color: 'yellow', icon: Clock, text: 'Pending' },
    };

    const config = statusConfig[status.toLowerCase()] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh] mt-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
              <p className="text-sm text-gray-600 mt-0.5">Track your NFC card orders and delivery status</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/profile-dashboard"
                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowBackIcon fontSize="small" />
              </Link>
              <Link
                href="/product-selection"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
              >
                Order
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Orders</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-block bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
            >
              Return Home
            </Link>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Orders Yet</h2>
            <p className="text-gray-600 mb-6">You haven&apos;t placed any orders yet. Get started with your first NFC card!</p>
            <Link
              href="/product-selection"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Order Your First Card
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Orders Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    You have {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Orders List */}
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Clickable Order Summary */}
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => toggleOrderExpand(order.id)}
                  >
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-red-50 rounded-lg">
                          <Package className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        {isExpanded ? (
                          <ExpandLessIcon className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ExpandMoreIcon className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Quick summary row */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-medium text-gray-900">${order.pricing.total.toFixed(2)}</span>
                      <span className="text-gray-300">|</span>
                      <span>{getPlanName(order)}</span>
                      <span className="text-gray-300">|</span>
                      <span>{getShippingStatusLabel(order)}</span>
                    </div>
                  </div>

                  {/* Expanded Order Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-100">
                      {/* Order Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {/* Order ID */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <ReceiptLongIcon className="w-4 h-4 text-gray-500" />
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Order ID</p>
                          </div>
                          <p className="text-sm font-mono font-semibold text-gray-900 break-all">{order.orderNumber}</p>
                        </div>

                        {/* Date of Purchase */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date of Purchase</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        {/* Amount Paid */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <PaymentIcon className="w-4 h-4 text-gray-500" />
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount Paid</p>
                          </div>
                          <p className="text-xl font-bold text-gray-900">${order.pricing.total.toFixed(2)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Subtotal: ${order.pricing.subtotal.toFixed(2)} + Shipping: ${order.pricing.shipping.toFixed(2)}
                          </p>
                        </div>

                        {/* Mode of Payment */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <PaymentIcon className="w-4 h-4 text-gray-500" />
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Mode of Payment</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {getPaymentMethodLabel(order.payment?.paymentMethod)}
                          </p>
                          {order.payment?.status && (
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              order.payment.status === 'succeeded'
                                ? 'bg-green-100 text-green-700'
                                : order.payment.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {order.payment.status === 'succeeded' ? 'Paid' : order.payment.status.charAt(0).toUpperCase() + order.payment.status.slice(1)}
                            </span>
                          )}
                        </div>

                        {/* Shipping Status */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Truck className="w-4 h-4 text-gray-500" />
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Shipping Status</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{getShippingStatusLabel(order)}</p>
                          {order.trackingNumber && (
                            <p className="text-xs text-gray-500 mt-0.5 font-mono">
                              Tracking: {order.trackingNumber}
                            </p>
                          )}
                          {order.estimatedDelivery && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Est. delivery: {order.estimatedDelivery}
                            </p>
                          )}
                        </div>

                        {/* Plan Name */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Info className="w-4 h-4 text-gray-500" />
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan Name</p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{getPlanName(order)}</p>
                          {order.cardConfig?.baseMaterial && order.cardConfig.baseMaterial !== 'digital' && (
                            <p className="text-xs text-gray-500 mt-0.5 capitalize">
                              Material: {order.cardConfig.baseMaterial}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Shipping Address */}
                      {order.shipping && (order.shipping.fullName || order.shipping.addressLine1) && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Shipping Address</p>
                          <p className="text-sm text-gray-900 font-medium">{order.shipping.fullName || order.customerName}</p>
                          {order.shipping.addressLine1 && (
                            <p className="text-sm text-gray-600">{order.shipping.addressLine1}</p>
                          )}
                          {order.shipping.addressLine2 && (
                            <p className="text-sm text-gray-600">{order.shipping.addressLine2}</p>
                          )}
                          <p className="text-sm text-gray-600">
                            {[order.shipping.city, order.shipping.state, order.shipping.postalCode].filter(Boolean).join(', ')}
                          </p>
                          {order.shipping.country && (
                            <p className="text-sm text-gray-600">{order.shipping.country}</p>
                          )}
                        </div>
                      )}

                      {/* Tracking Link */}
                      {order.trackingUrl && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Truck className="w-4 h-4" />
                            <span>Track your shipment</span>
                          </div>
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:text-red-700 font-medium text-sm"
                          >
                            Track Order →
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
