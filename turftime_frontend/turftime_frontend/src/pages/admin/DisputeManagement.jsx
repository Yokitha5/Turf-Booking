import { useState, useEffect } from 'react';
import { MessageSquare, Eye, CheckCircle, AlertCircle, Clock, User, Download, Send, X, RefreshCw } from 'lucide-react';
import Tooltip from '../../components/Tooltip';
import Toast from '../../components/Toast';
import disputeService from '../../services/disputeService';
import { useAuth } from '../../context/AuthContext';

const normalizeStatus = (status = '') => {
  const s = status.toUpperCase();
  if (s === 'OPEN') return 'open';
  if (s === 'APPROVED') return 'resolved';
  if (s === 'REJECTED') return 'rejected';
  return 'open';
};

const DisputeManagement = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [showCommunications, setShowCommunications] = useState(false);
  const [selectedDisputeMessages, setSelectedDisputeMessages] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [currentDisputeId, setCurrentDisputeId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { fetchDisputes(); }, []);

  const normalizeDispute = (d) => ({
    id: d.id,
    user: d.playerName || d.userName || d.customerName || d.raisedBy || 'Unknown',
    userEmail: d.raisedBy || d.playerEmail || d.userEmail || '',
    venue: d.venueName || d.venue || d.facilityName || 'Unknown Venue',
    venueOwner: d.ownerName || d.raisedAgainst || d.ownerEmail || 'Unknown Owner',
    issue: d.issue || d.reason || d.title || d.subject || 'Dispute',
    description: d.description || d.reason || '',
    amount: d.amount ? `\u20b9${d.amount}` : 'N/A',
    bookingDate: d.bookingDate || d.createdAt?.split('T')[0] || 'N/A',
    reportDate: d.createdAt?.split('T')[0] || d.reportedDate || '',
    status: normalizeStatus(d.status),
    priority: d.priority?.toLowerCase() || 'medium',
    messages: d.messageCount || 0,
    resolution: d.resolution || '',
    resolutionDate: d.resolvedDate || d.updatedAt?.split('T')[0] || '',
  });

  const fetchDisputes = async () => {
    setLoading(true); setError('');
    try {
      const result = await disputeService.getAllDisputes();
      if (result.success) {
        const list = Array.isArray(result.data) ? result.data : [];
        setDisputes(list.map(normalizeDispute));
      } else { setError(result.message || 'Failed to load disputes'); }
    } catch (err) { setError('Error loading disputes'); console.error(err); }
    finally { setLoading(false); }
  };

  const filteredDisputes = disputes.filter(d => activeTab === 'all' || d.status === activeTab);
  const stats = {
    all: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    rejected: disputes.filter(d => d.status === 'rejected').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
  };

  const handleTakeAction = (disputeId, action) => {
    setCurrentDisputeId(disputeId); setCurrentAction(action); setShowActionModal(true);
  };

  const confirmAction = async () => {
    setActionLoading(true);
    try {
      if (currentAction === 'approve-refund') {
        const result = await disputeService.approveDispute(currentDisputeId);
        if (result.success) setDisputes(prev => prev.map(d => d.id === currentDisputeId ? { ...d, status: 'resolved' } : d));
        else showToast(result.message || 'Action failed', 'error');
      } else if (currentAction === 'reject') {
        const result = await disputeService.rejectDispute(currentDisputeId);
        if (result.success) setDisputes(prev => prev.map(d => d.id === currentDisputeId ? { ...d, status: 'rejected' } : d));
        else showToast(result.message || 'Action failed', 'error');
      }
    } catch (err) { console.error(err); showToast('Failed to perform action', 'error'); }
    finally { setActionLoading(false); setShowActionModal(false); setCurrentAction(null); setCurrentDisputeId(null); }
  };

  const cancelAction = () => { setShowActionModal(false); setCurrentAction(null); setCurrentDisputeId(null); };

  const handleViewCommunications = async (dispute) => {
    setSelectedDisputeMessages(dispute); setShowCommunications(true);
    setLoadingMessages(true); setMessages([]);
    try {
      const result = await disputeService.getMessages(dispute.id);
      if (result.success) {
        setMessages(Array.isArray(result.data) ? result.data : []);
        setDisputes(prev => prev.map(d => d.id === dispute.id ? { ...d, messages: result.data?.length || d.messages } : d));
      }
    } catch (err) { console.error(err); }
    finally { setLoadingMessages(false); }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedDisputeMessages) return;
    setSendingMessage(true);
    try {
      const result = await disputeService.sendMessage(selectedDisputeMessages.id, {
        sender: user?.name || user?.email || 'Admin',
        senderType: 'admin',
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
      });
      if (result.success) {
        const msg = result.data || { id: Date.now(), sender: user?.name || 'Admin', senderType: 'admin', message: newMessage.trim(), timestamp: new Date().toLocaleString() };
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
      } else showToast(result.message || 'Failed to send message', 'error');
    } catch (err) { console.error(err); }
    finally { setSendingMessage(false); }
  };

  const handleExportReport = () => {
    const headers = ['ID', 'Status', 'Priority', 'Customer', 'Email', 'Venue', 'Issue', 'Amount', 'Booking Date', 'Report Date'];
    const rows = filteredDisputes.map(d => [d.id, d.status.toUpperCase(), d.priority.toUpperCase(), d.user, d.userEmail, d.venue, d.issue, d.amount, d.bookingDate, d.reportDate]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `disputes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const getActionDetails = () => ({
    'approve-refund': { title: 'Approve Dispute?', message: 'This will approve the dispute and mark it as resolved.' },
    'reject': { title: 'Reject Claim?', message: 'This will reject the dispute claim. This action cannot be undone.' },
  }[currentAction]);

  const getMsgSenderType = (msg) => {
    const t = (msg.senderType || msg.role || '').toLowerCase();
    if (t === 'admin') return 'admin';
    if (t === 'owner') return 'owner';
    return 'customer';
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {showActionModal && currentAction && getActionDetails() && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-linear-to-r from-primary-600 to-primary-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">{getActionDetails().title}</h3>
              <button onClick={cancelAction} className="text-white hover:bg-white/20 p-1 rounded transition"><X size={20} /></button>
            </div>
            <div className="px-6 py-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  {currentAction === 'reject' ? <AlertCircle className="text-red-600" size={32} /> : <CheckCircle className="text-primary-600" size={32} />}
                </div>
              </div>
              <p className="text-center text-gray-700 mb-6 font-medium">{getActionDetails().message}</p>
              {currentAction === 'reject' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-700 font-semibold text-center">This action cannot be undone.</p>
                </div>
              )}
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-200">
              <button onClick={cancelAction} disabled={actionLoading} className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium">Cancel</button>
              <button onClick={confirmAction} disabled={actionLoading}
                className={`px-6 py-2 text-white rounded-lg transition font-medium ${currentAction === 'reject' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary-600 hover:bg-primary-700'} ${actionLoading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 pt-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="text-primary-600" size={32} />
              Dispute Management
            </h2>
            <p className="text-gray-600 mt-1">Manage and resolve customer disputes</p>
          </div>
          <div className="flex gap-3">
            <Tooltip text="Refresh disputes">
              <button onClick={fetchDisputes} disabled={loading}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </Tooltip>
            <Tooltip text="Download disputes report as CSV">
              <button onClick={handleExportReport}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition shadow-md">
                <Download size={18} /> Export Report
              </button>
            </Tooltip>
          </div>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border-l-4 border-gray-400">
            <div className="flex justify-between items-start">
              <div><p className="text-sm font-medium text-gray-600 mb-1">All Disputes</p><p className="text-3xl font-bold text-gray-900">{stats.all}</p></div>
              <AlertCircle className="text-gray-400" size={24} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border-l-4 border-red-500">
            <div className="flex justify-between items-start">
              <div><p className="text-sm font-medium text-gray-600 mb-1">Open</p><p className="text-3xl font-bold text-red-600">{stats.open}</p></div>
              <Clock className="text-red-500" size={24} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border-l-4 border-orange-400">
            <div className="flex justify-between items-start">
              <div><p className="text-sm font-medium text-gray-600 mb-1">Rejected</p><p className="text-3xl font-bold text-orange-600">{stats.rejected}</p></div>
              <AlertCircle className="text-orange-400" size={24} />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div><p className="text-sm font-medium text-gray-600 mb-1">Resolved</p><p className="text-3xl font-bold text-green-600">{stats.resolved}</p></div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-1 mb-8 flex gap-1">
          {[{ key: 'all', label: 'All', count: stats.all }, { key: 'open', label: 'Open', count: stats.open }, { key: 'rejected', label: 'Rejected', count: stats.rejected }, { key: 'resolved', label: 'Resolved', count: stats.resolved }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${activeTab === tab.key ? 'bg-primary-600 text-white shadow-md' : 'bg-transparent text-gray-700 hover:bg-gray-100'}`}>
              {tab.label}
              <span className={`ml-2 text-xs font-bold ${activeTab === tab.key ? 'text-primary-100' : 'text-gray-500'}`}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4 pb-8">
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <RefreshCw size={36} className="mx-auto text-primary-400 mb-3 animate-spin" />
              <p className="text-gray-500 font-medium">Loading disputes...</p>
            </div>
          ) : filteredDisputes.length > 0 ? (
            filteredDisputes.map(dispute => (
              <div key={dispute.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-200">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 font-bold text-xs shrink-0">
                          #{dispute.id.substring(0, 6)}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900">{dispute.issue}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          dispute.status === 'open' ? 'bg-red-100 text-red-800' :
                          dispute.status === 'rejected' ? 'bg-orange-100 text-orange-800' :
                          'bg-green-100 text-green-800'}`}>
                          {dispute.status.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${dispute.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {dispute.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{dispute.description}</p>
                    </div>
                    <Tooltip text={selectedDispute === dispute.id ? 'Hide details' : 'Expand and take action'}>
                      <button onClick={() => setSelectedDispute(selectedDispute === dispute.id ? null : dispute.id)}
                        className={`flex items-center gap-2 font-medium px-4 py-2 rounded-lg transition ${selectedDispute === dispute.id ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        <Eye size={18} />
                        {selectedDispute === dispute.id ? 'Hide' : 'View'} Details
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Customer</p>
                    <p className="text-sm font-medium text-gray-900">{dispute.user}</p>
                    <p className="text-xs text-gray-600">{dispute.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Venue</p>
                    <p className="text-sm font-medium text-gray-900">{dispute.venue}</p>
                    <p className="text-xs text-gray-600">Owner: {dispute.venueOwner}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Booking Date</p>
                    <p className="text-sm font-medium text-gray-900">{dispute.bookingDate ? new Date(dispute.bookingDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Amount</p>
                    <p className="text-sm font-bold text-primary-600">{dispute.amount}</p>
                  </div>
                </div>
                {selectedDispute === dispute.id && (
                  <div className="p-6 border-t border-gray-100">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <button onClick={() => handleViewCommunications(dispute)}
                        className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition cursor-pointer text-left">
                        <MessageSquare size={20} className="text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-600 font-semibold uppercase">Communications</p>
                          <p className="text-lg font-bold text-blue-900">{dispute.messages} messages</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg border border-gray-300">
                        <Clock size={20} className="text-gray-600" />
                        <div>
                          <p className="text-xs text-gray-600 font-semibold uppercase">Reported On</p>
                          <p className="text-lg font-bold text-gray-900">{dispute.reportDate ? new Date(dispute.reportDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    {dispute.status === 'resolved' && dispute.resolution && (
                      <div className="p-4 bg-green-50 border border-green-300 rounded-lg mb-6">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="text-green-600 mt-1" size={20} />
                          <div>
                            <p className="font-semibold text-green-900 mb-1">Resolution</p>
                            <p className="text-sm text-green-800">{dispute.resolution}</p>
                            {dispute.resolutionDate && <p className="text-xs text-green-700 mt-1">Resolved on {new Date(dispute.resolutionDate).toLocaleDateString()}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                    {dispute.status === 'open' && (
                      <div className="flex flex-wrap gap-3">
                        <Tooltip text="Approve this dispute">
                          <button onClick={() => handleTakeAction(dispute.id, 'approve-refund')}
                            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium shadow-sm">
                            <CheckCircle size={16} /> Approve
                          </button>
                        </Tooltip>
                        <Tooltip text="Reject the dispute claim">
                          <button onClick={() => handleTakeAction(dispute.id, 'reject')}
                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium shadow-sm">
                            <AlertCircle size={16} /> Reject Claim
                          </button>
                        </Tooltip>
                        <Tooltip text="Open communications thread">
                          <button onClick={() => handleViewCommunications(dispute)}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm">
                            <MessageSquare size={16} /> Message Parties
                          </button>
                        </Tooltip>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-500">No disputes found</p>
              <p className="text-sm text-gray-400 mt-1">{activeTab === 'all' ? 'No disputes have been filed yet.' : `No ${activeTab} disputes.`}</p>
            </div>
          )}
        </div>
      </div>

      {showCommunications && selectedDisputeMessages && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MessageSquare size={24} />
                  Communications — #{selectedDisputeMessages.id.substring(0, 8)}
                </h2>
                <p className="text-blue-100 text-sm mt-1">{selectedDisputeMessages.issue}</p>
              </div>
              <button onClick={() => setShowCommunications(false)} className="text-white hover:bg-white/20 rounded-lg p-2 transition"><X size={24} /></button>
            </div>
            <div className="bg-blue-50 px-6 py-3 border-b border-blue-100 grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-600 font-semibold">Customer:</span><span className="ml-2 text-gray-900">{selectedDisputeMessages.user}</span></div>
              <div><span className="text-gray-600 font-semibold">Venue:</span><span className="ml-2 text-gray-900">{selectedDisputeMessages.venue}</span></div>
              <div><span className="text-gray-600 font-semibold">Amount:</span><span className="ml-2 text-primary-600 font-bold">{selectedDisputeMessages.amount}</span></div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)] space-y-4">
              {loadingMessages ? (
                <div className="text-center py-8"><RefreshCw size={28} className="mx-auto text-blue-400 animate-spin mb-2" /><p className="text-gray-500 text-sm">Loading messages...</p></div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8"><MessageSquare size={36} className="mx-auto text-gray-300 mb-2" /><p className="text-gray-500 text-sm">No messages yet. Start the conversation.</p></div>
              ) : (
                messages.map((msg, idx) => {
                  const senderType = getMsgSenderType(msg);
                  return (
                    <div key={msg.id || idx} className={`flex ${senderType === 'admin' ? 'justify-center' : senderType === 'customer' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] ${senderType === 'admin' ? 'max-w-[85%]' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold ${senderType === 'admin' ? 'text-purple-600' : senderType === 'customer' ? 'text-blue-600' : 'text-green-600'}`}>{msg.sender}</span>
                          <span className="text-xs text-gray-500">{msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}</span>
                        </div>
                        <div className={`p-3 rounded-lg ${senderType === 'admin' ? 'bg-purple-100 border border-purple-300' : senderType === 'customer' ? 'bg-blue-50 border border-blue-200' : 'bg-green-50 border border-green-200'}`}>
                          <p className="text-sm text-gray-800">{msg.message || msg.content || msg.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex gap-3">
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type your message here..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={handleSendMessage} disabled={sendingMessage || !newMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  <Send size={18} />{sendingMessage ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end border-t border-gray-200">
              <button onClick={() => setShowCommunications(false)} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeManagement;
