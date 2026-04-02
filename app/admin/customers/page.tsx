'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { type Order } from '@/lib/order-store';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import FilterListIcon from '@mui/icons-material/FilterList';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupIcon from '@mui/icons-material/Group';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const Search = SearchIcon;
const User = PersonIcon;
const Mail = EmailIcon;
const Phone = PhoneIcon;
const Calendar = CalendarTodayIcon;
const Package = Inventory2Icon;
const Filter = FilterListIcon;
const ChevronLeft = ChevronLeftIcon;
const UserPlus = PersonAddIcon;
const Group = GroupIcon;
const ArrowUp = ArrowUpwardIcon;
const ArrowDown = ArrowDownwardIcon;
const Refresh = RefreshIcon;
const Download = CloudDownloadIcon;
const Printer = PrintIcon;
const Eye = VisibilityIcon;
const Truck = LocalShippingIcon;
const Dollar = AttachMoneyIcon;

const getPlanBadgeStyle = (plan: string): string => {
  const p = plan?.toLowerCase() || '';
  if (p.includes('founder')) return 'bg-amber-100 text-amber-800';
  if (p.includes('signature')) return 'bg-purple-100 text-purple-800';
  if (p.includes('business') || p.includes('pro')) return 'bg-blue-100 text-blue-800';
  if (p.includes('next')) return 'bg-teal-100 text-teal-800';
  if (p.includes('starter')) return 'bg-gray-100 text-gray-800';
  if (p.includes('personal')) return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-800';
};

interface Referral {
  email: string;
  name: string;
  code: string;
  status: 'used' | 'pending' | 'expired';
  createdAt: string;
  usedAt: string | null;
}

interface Customer {
  email: string;
  customerName: string;
  phoneNumber: string;
  firstOrderDate: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  lastPlan: string;
  orders: Order[];
  userId?: string | null;
  isFoundingMember?: boolean;
  referredBy?: { userId: string; email: string; name: string } | null;
  referrals?: Referral[];
  referralCount?: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent' | 'recent'>('recent');
  const [filterByPlan, setFilterByPlan] = useState<string>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingPrinter, setSendingPrinter] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => { loadCustomers(); }, []);
  useEffect(() => { filterAndSortCustomers(); }, [customers, searchQuery, sortBy, sortDirection, filterByPlan]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCustomers = () => {
    let filtered = customers;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.customerName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phoneNumber.toLowerCase().includes(q)
      );
    }
    if (filterByPlan !== 'all') {
      filtered = filtered.filter(c => c.lastPlan === filterByPlan);
    }
    const dir = sortDirection === 'asc' ? 1 : -1;
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name': return dir * a.customerName.localeCompare(b.customerName);
        case 'orders': return dir * (a.totalOrders - b.totalOrders);
        case 'spent': return dir * (a.totalSpent - b.totalSpent);
        case 'recent': default: return dir * (new Date(a.lastOrderDate).getTime() - new Date(b.lastOrderDate).getTime());
      }
    });
    setFilteredCustomers(filtered);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
      production: 'bg-purple-100 text-purple-800', shipped: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleHeaderSort = (column: 'orders' | 'spent') => {
    if (sortBy === column) setSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    else { setSortBy(column); setSortDirection('desc'); }
  };

  const SortIndicator = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowDown className="w-3 h-3 ml-1 text-gray-300" />;
    return sortDirection === 'desc' ? <ArrowDown className="w-3 h-3 ml-1 text-gray-700" /> : <ArrowUp className="w-3 h-3 ml-1 text-gray-700" />;
  };

  const handleSendToPrinter = async (customer: Customer) => {
    // Send the most recent pending order to printer
    const pendingOrder = customer.orders.find(o => o.status === 'pending' || o.status === 'confirmed');
    if (!pendingOrder) {
      setMessage({ type: 'error', text: `No pending orders for ${customer.customerName}` });
      return;
    }
    setSendingPrinter(customer.email);
    try {
      const res = await fetch(`/api/admin/orders/${pendingOrder.id}/resend-printer`, { method: 'POST' });
      if (res.ok) {
        setMessage({ type: 'success', text: `Order ${pendingOrder.orderNumber} sent to printer` });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to send to printer' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setSendingPrinter(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Plan', 'First Order', 'Last Order'];
    const rows = filteredCustomers.map(c => [
      c.customerName, c.email, c.phoneNumber, c.totalOrders,
      c.totalSpent.toFixed(2), c.lastPlan, c.firstOrderDate, c.lastOrderDate,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Get unique plans for filter dropdown
  const uniquePlans = Array.from(new Set(customers.map(c => c.lastPlan).filter(Boolean)));

  // --- Customer Detail View ---
  if (selectedCustomer) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedCustomer.customerName}</h1>
                <p className="text-gray-500">{selectedCustomer.email} &bull; {selectedCustomer.phoneNumber}</p>
              </div>
            </div>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPlanBadgeStyle(selectedCustomer.lastPlan)}`}>
              {selectedCustomer.lastPlan}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <Package className="w-6 h-6 text-blue-500" />
                <div><p className="text-xs text-gray-500">Orders</p><p className="text-xl font-bold">{selectedCustomer.totalOrders}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <Dollar className="w-6 h-6 text-green-500" />
                <div><p className="text-xs text-gray-500">Total Spent</p><p className="text-xl font-bold">{formatCurrency(selectedCustomer.totalSpent)}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-purple-500" />
                <div><p className="text-xs text-gray-500">First Order</p><p className="text-sm font-bold">{selectedCustomer.firstOrderDate}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3">
                <Truck className="w-6 h-6 text-orange-500" />
                <div><p className="text-xs text-gray-500">Last Order</p><p className="text-sm font-bold">{selectedCustomer.lastOrderDate}</p></div>
              </div>
            </div>
          </div>

          {/* Referrals */}
          {(selectedCustomer.referredBy || (selectedCustomer.referrals && selectedCustomer.referrals.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {selectedCustomer.referredBy && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <UserPlus className="w-4 h-4 text-amber-500 mr-2" /> Referred By
                  </h3>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{selectedCustomer.referredBy.name}</div>
                      <div className="text-xs text-gray-500">{selectedCustomer.referredBy.email}</div>
                    </div>
                  </div>
                </div>
              )}
              {selectedCustomer.referrals && selectedCustomer.referrals.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Group className="w-4 h-4 text-green-500 mr-2" /> People Referred ({selectedCustomer.referrals.length})
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedCustomer.referrals.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{r.name} <span className="text-gray-400">({r.email})</span></span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${r.status === 'used' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order History */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Order History</h2>
              <span className="text-sm text-gray-500">{selectedCustomer.orders.length} orders</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Printer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedCustomer.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm font-medium">{formatCurrency(order.pricing.total)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.cardConfig.quantity || 1} card{(order.cardConfig.quantity || 1) > 1 ? 's' : ''}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/admin/orders/${order.id}/resend-printer`, { method: 'POST' });
                              if (res.ok) setMessage({ type: 'success', text: `${order.orderNumber} sent to printer` });
                              else { const d = await res.json(); setMessage({ type: 'error', text: d.error || 'Failed' }); }
                            } catch { setMessage({ type: 'error', text: 'Network error' }); }
                            setTimeout(() => setMessage(null), 4000);
                          }}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                          title="Send to printer"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" /> Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Message Toast */}
          {message && (
            <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm font-medium z-50 ${message.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
              {message.text}
            </div>
          )}
        </div>
      </AdminLayout>
    );
  }

  // --- Customer List View ---
  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer relationships and orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xs text-gray-500">Total Customers</p><p className="text-xl font-bold">{customers.length}</p></div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><Package className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-xs text-gray-500">Total Orders</p><p className="text-xl font-bold">{customers.reduce((s, c) => s + c.totalOrders, 0)}</p></div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Dollar className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-xs text-gray-500">Total Revenue</p><p className="text-xl font-bold">{formatCurrency(customers.reduce((s, c) => s + c.totalSpent, 0))}</p></div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><Truck className="w-5 h-5 text-amber-600" /></div>
            <div><p className="text-xs text-gray-500">Avg. Order Value</p><p className="text-xl font-bold">{formatCurrency(customers.length > 0 ? customers.reduce((s, c) => s + c.totalSpent, 0) / Math.max(customers.reduce((s, c) => s + c.totalOrders, 0), 1) : 0)}</p></div>
          </div>
        </div>

        {/* Search, Filter, Actions Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <select value={filterByPlan} onChange={(e) => setFilterByPlan(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="all">All Plans</option>
                {uniquePlans.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="recent">Most Recent</option>
                <option value="name">Name</option>
                <option value="orders">Most Orders</option>
                <option value="spent">Highest Spend</option>
              </select>
              <button onClick={() => { setLoading(true); loadCustomers(); }} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50" title="Refresh">
                <Refresh className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={exportCSV} className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <Download className="w-4 h-4 mr-1.5 text-gray-600" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleHeaderSort('orders')}>
                    <div className="flex items-center">Orders<SortIndicator column="orders" /></div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none" onClick={() => handleHeaderSort('spent')}>
                    <div className="flex items-center">Spent<SortIndicator column="spent" /></div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Order</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mr-2"></div> Loading...</div>
                  </td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    {searchQuery ? 'No customers match your search.' : 'No customers yet.'}
                  </td></tr>
                ) : filteredCustomers.map((customer, index) => (
                  <tr key={customer.email} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-400">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{customer.customerName}</div>
                          <div className="text-xs text-gray-400">Since {customer.firstOrderDate}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{customer.email}</div>
                      <div className="text-xs text-gray-400">{customer.phoneNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">{customer.totalOrders}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${getPlanBadgeStyle(customer.lastPlan)}`}>
                        {customer.lastPlan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{customer.lastOrderDate}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSendToPrinter(customer)}
                          disabled={sendingPrinter === customer.email}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Send latest order to printer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filteredCustomers.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
              Showing {filteredCustomers.length} of {customers.length} customers
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
