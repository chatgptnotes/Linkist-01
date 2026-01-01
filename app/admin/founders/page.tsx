'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import StarsIcon from '@mui/icons-material/Stars';
import CircularProgress from '@mui/material/CircularProgress';

// Icon aliases
const Search = SearchIcon;
const Filter = FilterListIcon;
const CheckCircle = CheckCircleIcon;
const Cancel = CancelIcon;
const Clock = AccessTimeIcon;
const RefreshCw = RefreshIcon;
const Send = SendIcon;
const Person = PersonIcon;
const Mail = EmailIcon;
const Phone = PhoneIcon;
const Work = WorkIcon;
const Business = BusinessIcon;
const Key = VpnKeyIcon;
const Copy = ContentCopyIcon;
const Close = CloseIcon;
const Crown = StarsIcon;

interface FoundersRequest {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;  // Legacy field
  company_name: string | null;
  email: string;
  phone: string;
  profession: string;
  note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
}

// Helper function to get display name from first_name/last_name or fall back to full_name
const getDisplayName = (req: FoundersRequest): string => {
  if (req.first_name || req.last_name) {
    return `${req.first_name || ''} ${req.last_name || ''}`.trim();
  }
  return req.full_name || 'N/A';
};

interface InviteCode {
  id: string;
  code: string;
  email: string;
  phone: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export default function AdminFoundersPage() {
  const [requests, setRequests] = useState<FoundersRequest[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'requests' | 'codes'>('requests');

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FoundersRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    activeInvites: 0,
    usedInvites: 0,
    expiredInvites: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch requests
      const requestsRes = await fetch('/api/admin/founders/requests');
      const requestsData = await requestsRes.json();
      if (requestsData.success) {
        setRequests(requestsData.requests);
      }

      // Fetch invite codes
      const codesRes = await fetch('/api/admin/founders/codes');
      const codesData = await codesRes.json();
      if (codesData.success) {
        setInviteCodes(codesData.codes);
      }

      // Fetch stats
      const statsRes = await fetch('/api/admin/founders/stats');
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error fetching founders data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      const response = await fetch('/api/admin/founders/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: selectedRequest.id })
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedCode(data.code);
        fetchData();
      } else {
        alert(data.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      const response = await fetch('/api/admin/founders/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          reason: rejectReason || 'Request not approved'
        })
      });

      const data = await response.json();
      if (data.success) {
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectReason('');
        fetchData();
      } else {
        alert(data.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('An error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Rejected</span>;
      default:
        return null;
    }
  };

  const getCodeStatusBadge = (code: InviteCode) => {
    if (code.used_at) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Used</span>;
    }
    if (new Date(code.expires_at) < new Date()) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Expired</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>;
  };

  const filteredRequests = requests.filter(req => {
    const displayName = getDisplayName(req).toLowerCase();
    const matchesSearch =
      displayName.includes(searchTerm.toLowerCase()) ||
      (req.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (req.phone || '').includes(searchTerm) ||
      (req.company_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCodes = inviteCodes.filter(code => {
    return code.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           code.code.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Founders Club</h1>
              <p className="text-sm text-gray-500">Manage access requests and invite codes</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4">
            <p className="text-sm text-gray-500">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
            <p className="text-sm text-yellow-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
            <p className="text-sm text-green-600">Approved</p>
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
          </div>
          <div className="bg-red-50 rounded-lg border border-red-200 p-4">
            <p className="text-sm text-red-600">Rejected</p>
            <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <p className="text-sm text-blue-600">Active Codes</p>
            <p className="text-2xl font-bold text-blue-700">{stats.activeInvites}</p>
          </div>
          <div className="bg-gray-50 rounded-lg border p-4">
            <p className="text-sm text-gray-500">Used Codes</p>
            <p className="text-2xl font-bold text-gray-700">{stats.usedInvites}</p>
          </div>
          <div className="bg-gray-50 rounded-lg border p-4">
            <p className="text-sm text-gray-500">Expired</p>
            <p className="text-2xl font-bold text-gray-700">{stats.expiredInvites}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'requests'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Access Requests
          </button>
          <button
            onClick={() => setActiveTab('codes')}
            className={`pb-3 px-1 font-medium transition-colors ${
              activeTab === 'codes'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Invite Codes
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={activeTab === 'requests' ? "Search by name, email, or phone..." : "Search by email or code..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          {activeTab === 'requests' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <CircularProgress />
          </div>
        ) : activeTab === 'requests' ? (
          /* Requests Table */
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profession</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{getDisplayName(request)}</div>
                        {request.note && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={request.note}>
                            "{request.note}"
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {request.company_name || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{request.email}</div>
                        <div className="text-sm text-gray-500">{request.phone}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {request.profession}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-4 py-4">
                        {request.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowApproveModal(true);
                                setGeneratedCode(null);
                              }}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors border border-green-700"
                              style={{ color: '#ffffff', backgroundColor: '#16a34a' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowRejectModal(true);
                              }}
                              className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors border border-red-700"
                              style={{ color: '#ffffff', backgroundColor: '#dc2626' }}
                            >
                              Reject
                            </button>
                          </div>
                        ) : request.status === 'rejected' && request.rejected_reason ? (
                          <div className="text-xs text-red-600" title={request.rejected_reason}>
                            Reason: {request.rejected_reason.substring(0, 30)}...
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Invite Codes Table */
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No invite codes found
                    </td>
                  </tr>
                ) : (
                  filteredCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-mono text-sm font-medium text-gray-900">{code.code}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {code.email}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {new Date(code.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {new Date(code.expires_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        {getCodeStatusBadge(code)}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy code"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                  setGeneratedCode(null);
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <Close className="w-6 h-6" />
              </button>

              {generatedCode ? (
                /* Success State */
                <div className="text-center py-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Request Approved!</h2>
                  <p className="text-gray-600 mb-4">
                    An invite code has been generated and sent to {selectedRequest.email}
                  </p>
                  <div className="bg-gray-100 rounded-lg p-4 mb-4">
                    <p className="text-sm text-gray-500 mb-1">Invite Code</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-mono text-2xl font-bold text-gray-900">{generatedCode}</span>
                      <button
                        onClick={() => copyToClipboard(generatedCode)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowApproveModal(false);
                      setSelectedRequest(null);
                      setGeneratedCode(null);
                    }}
                    className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Confirmation State */
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Approve Request</h2>
                  <p className="text-gray-600 mb-4">
                    This will generate a unique invite code and send it to the user's email.
                  </p>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Person className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{getDisplayName(selectedRequest)}</span>
                      </div>
                      {selectedRequest.company_name && (
                        <div className="flex items-center gap-2">
                          <Business className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{selectedRequest.company_name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{selectedRequest.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{selectedRequest.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Work className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{selectedRequest.profession}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowApproveModal(false);
                        setSelectedRequest(null);
                      }}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={processing}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processing ? (
                        <CircularProgress size={20} style={{ color: 'white' }} />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Approve & Send Code
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectReason('');
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <Close className="w-6 h-6" />
              </button>

              <h2 className="text-xl font-bold text-gray-900 mb-2">Reject Request</h2>
              <p className="text-gray-600 mb-4">
                Rejecting request from <strong>{getDisplayName(selectedRequest)}</strong>
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Provide a reason for rejection..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedRequest(null);
                    setRejectReason('');
                  }}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {processing ? (
                    <CircularProgress size={20} style={{ color: 'white' }} />
                  ) : (
                    'Reject Request'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
