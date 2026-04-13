import { useState, useEffect, useRef } from 'react';
import {
  AlertCircle, Plus, MessageSquare, X, Send, RefreshCw,
  CheckCircle, Clock, XCircle, ChevronDown, ChevronUp,
  ArrowLeft, ReceiptText, IndianRupee, Calendar, MapPin, Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import disputeService from '../../services/disputeService';
import bookingService from '../../services/bookingService';
import venueService from '../../services/venueService';

const STATUS_CONFIG = {
  open:     { label: 'Open',     icon: Clock,        bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400' },
  resolved: { label: 'Resolved', icon: CheckCircle,  bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500' },
  rejected: { label: 'Rejected', icon: XCircle,      bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500'   },
};

const ISSUE_TYPES = [
  'Refund Request',
  'Cancellation Issue',
  'Incorrect Charges',
  'Poor Facility Condition',
  'Safety Concern',
  'Other',
];

const normalizeStatus = (s = '') => {
  const u = s.toUpperCase();
  if (u === 'OPEN')     return 'open';
  if (u === 'APPROVED') return 'resolved';
  if (u === 'REJECTED') return 'rejected';
  return 'open';
};

const PlayerDisputes = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab]       = useState('all');
  const [disputes, setDisputes]         = useState([]);
  const [bookings, setBookings]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  // Chat panel
  const [chatDispute, setChatDispute]   = useState(null);
  const [messages, setMessages]         = useState([]);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const [newMsg, setNewMsg]             = useState('');
  const [sendingMsg, setSendingMsg]     = useState(false);
  const chatEndRef = useRef(null);

  // Raise dispute modal
  const [showRaise, setShowRaise]       = useState(false);
  const [form, setForm]                 = useState({ bookingId: '', issue: '', description: '', amount: '' });
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState('');

  // Detail expand
  const [expanded, setExpanded]         = useState(null);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchAll = async () => {
    setLoading(true); setError('');
    try {
      const [dRes, bRes] = await Promise.all([
        disputeService.getMyDisputes(user?.email),
        bookingService.getBookingsByPlayer(user?.email),
      ]);

      if (dRes.success) {
        const normalized = (Array.isArray(dRes.data) ? dRes.data : []).map(d => ({
          id:           d.id,
          bookingId:    d.bookingId || '',
          venue:        d.venueName || d.venue || 'Unknown Venue',
          issue:        d.issue || d.title || d.subject || d.reason || 'Dispute',
          description:  d.description || d.reason || '',
          amount:       d.amount ?? d.refundAmount ?? '',
          bookingDate:  d.bookingDate || d.createdAt?.split('T')[0] || '',
          raisedOn:     d.createdAt?.split('T')[0] || d.reportedDate || '',
          status:       normalizeStatus(d.status),
          resolution:   d.resolution || '',
          msgCount:     d.messageCount || 0,
        }));
        setDisputes(normalized);
      } else {
        console.error('Failed to load disputes:', dRes.message);
      }

      if (bRes.success) {
        const bookingsRaw = Array.isArray(bRes.data) ? bRes.data : [];

        // Resolve venue names (same approach as PlayerBookings)
        const uniqueVenueIds = [...new Set(bookingsRaw.map(b => b.venueId).filter(Boolean))];
        const venueResults = await Promise.all(uniqueVenueIds.map(id => venueService.getVenueById(id)));
        const venueMap = {};
        venueResults.forEach((r, i) => { if (r.success) venueMap[uniqueVenueIds[i]] = r.data; });
        const venueCache = JSON.parse(localStorage.getItem('venueCache') || '{}');

        const mapped = bookingsRaw.map(b => {
          const vd = venueMap[b.venueId] || {};
          const cached = venueCache[b.id] || {};
          const start = b.startTime?.substring(0, 5) || '';
          const end   = b.endTime?.substring(0, 5) || '';
          return {
            id:        b.id,
            venueId:   b.venueId || cached.venueId || '',
            venueName: b.venueName || cached.venueName || vd.name || 'Unknown Venue',
            date:      b.bookingDate || '',
            startTime: start,
            endTime:   end,
            slot:      start && end ? `${start} - ${end}` : start || '',
            status:    b.status || '',
          };
        });
        setBookings(mapped);
      }
    } catch (e) {
      console.error(e); setError('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  /* ─── Chat ─────────────────────────────────────────────────── */
  const openChat = async (dispute) => {
    setChatDispute(dispute); setMessages([]); setNewMsg('');
    setLoadingMsgs(true);
    try {
      const res = await disputeService.getMessages(dispute.id);
      if (res.success) setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
    finally { setLoadingMsgs(false); }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !chatDispute) return;
    setSendingMsg(true);
    try {
      const res = await disputeService.sendMessage(chatDispute.id, {
        sender:     user?.name || user?.email || 'Player',
        senderType: 'player',
        message:    newMsg.trim(),
        timestamp:  new Date().toISOString(),
      });
      if (res.success) {
        const msg = res.data || {
          id: Date.now(), sender: user?.name || 'You',
          senderType: 'player', message: newMsg.trim(),
          timestamp: new Date().toLocaleString(),
        };
        setMessages(prev => [...prev, msg]);
        setNewMsg('');
        setDisputes(prev => prev.map(d => d.id === chatDispute.id ? { ...d, msgCount: d.msgCount + 1 } : d));
      }
    } catch (e) { console.error(e); }
    finally { setSendingMsg(false); }
  };

  /* ─── Raise dispute ─────────────────────────────────────────── */
  const handleRaise = async () => {
    if (!form.bookingId) { setFormError('Please select a booking.'); return; }
    if (!form.issue)     { setFormError('Please select an issue type.'); return; }
    if (!form.description.trim()) { setFormError('Please describe your issue.'); return; }
    setFormError(''); setSubmitting(true);

    const selectedBooking = bookings.find(b => String(b.id) === String(form.bookingId));
    try {
      const res = await disputeService.createDispute({
        bookingId:    form.bookingId,
        raisedBy:     user?.email,
        raisedAgainst: selectedBooking?.venueOwnerEmail || '',
        reason:        form.issue,
        playerName:    user?.name || user?.email,
        venueName:     selectedBooking?.venueName || '',
        venueId:       selectedBooking?.venueId || '',
        issue:         form.issue,
        description:   form.description.trim(),
        amount:        form.amount ? parseFloat(form.amount) : undefined,
        bookingDate:   selectedBooking?.date || '',
        priority:      'MEDIUM',
      });
      if (res.success) {
        // Also store locally as fallback
        if (res.data?.id) {
          disputeService.storeDisputeId(user?.email, res.data.id);
        }
        setShowRaise(false);
        setForm({ bookingId: '', issue: '', description: '', amount: '' });
        await fetchAll();
      } else {
        setFormError(res.message || 'Failed to raise dispute');
      }
    } catch (e) { console.error(e); setFormError('Something went wrong'); }
    finally { setSubmitting(false); }
  };

  /* ─── Derived ───────────────────────────────────────────────── */
  const filtered = disputes.filter(d => activeTab === 'all' || d.status === activeTab);
  const counts = {
    all:      disputes.length,
    open:     disputes.filter(d => d.status === 'open').length,
    resolved: disputes.filter(d => d.status === 'resolved').length,
    rejected: disputes.filter(d => d.status === 'rejected').length,
  };

  const senderBubble = (msg) => {
    const t = (msg.senderType || msg.role || '').toLowerCase();
    if (t === 'player') return 'right';
    return 'left';
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">

      {/* ── Raise Dispute Modal ─────────────────────────────────── */}
      {showRaise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-linear-to-r from-primary-600 to-primary-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertCircle size={20} /> Raise a Dispute
              </h3>
              <button onClick={() => { setShowRaise(false); setFormError(''); }}
                className="text-white hover:bg-white/20 p-1.5 rounded-lg transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Booking selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Select Booking <span className="text-red-500">*</span>
                </label>
                <select value={form.bookingId} onChange={e => setForm(f => ({ ...f, bookingId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                  <option value="">-- Choose a booking --</option>
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.venueName} — {b.date}{b.slot ? `, ${b.slot}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Issue type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Issue Type <span className="text-red-500">*</span>
                </label>
                <select value={form.issue} onChange={e => setForm(f => ({ ...f, issue: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                  <option value="">-- Select issue --</option>
                  {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea rows={4} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your issue in detail..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none" />
              </div>

              {/* Refund amount (optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Refund Amount (₹) <span className="text-gray-400 font-normal">optional</span>
                </label>
                <div className="relative">
                  <IndianRupee size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" min="0" value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-3 justify-end">
              <button onClick={() => { setShowRaise(false); setFormError(''); }}
                className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={handleRaise} disabled={submitting}
                className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition disabled:opacity-60 flex items-center gap-2">
                {submitting ? <><RefreshCw size={14} className="animate-spin" /> Submitting…</> : 'Submit Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Chat Panel ──────────────────────────────────────────── */}
      {chatDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden" style={{ height: '90vh', maxHeight: 620 }}>
            {/* Header */}
            <div className="bg-linear-to-r from-primary-600 to-primary-700 px-5 py-4 flex items-center gap-3 shrink-0">
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{chatDispute.venue}</p>
                <p className="text-primary-200 text-xs truncate">{chatDispute.issue}</p>
              </div>
              <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                ${STATUS_CONFIG[chatDispute.status]?.bg} ${STATUS_CONFIG[chatDispute.status]?.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[chatDispute.status]?.dot}`} />
                {STATUS_CONFIG[chatDispute.status]?.label}
              </div>
              <button onClick={() => setChatDispute(null)}
                className="shrink-0 text-white hover:bg-white/20 p-1.5 rounded-lg transition">
                <X size={18} />
              </button>
            </div>

            {/* Info bar */}
            <div className="bg-primary-50 border-b border-primary-100 px-5 py-2 flex items-center gap-2 text-xs text-primary-700 shrink-0">
              <Info size={13} />
              <span>Messages are visible to the venue owner and admin. Keep communication professional.</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center py-10">
                  <RefreshCw size={24} className="animate-spin text-primary-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <MessageSquare size={40} className="text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm font-medium">No messages yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start the conversation with the admin or venue owner.</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const side = senderBubble(msg);
                  const isMe = side === 'right';
                  return (
                    <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm
                        ${isMe ? 'bg-primary-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                        {!isMe && (
                          <p className={`text-xs font-semibold mb-1 ${
                            (msg.senderType||'').toLowerCase() === 'admin' ? 'text-primary-600' : 'text-emerald-600'
                          }`}>
                            {(msg.senderType||'').toLowerCase() === 'admin' ? '🛡 Admin' : `🏟 ${msg.sender}`}
                          </p>
                        )}
                        <p className="text-sm leading-relaxed">{msg.message || msg.content}</p>
                        <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-gray-400'}`}>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-gray-200 shrink-0">
              {chatDispute.status !== 'open' ? (
                <p className="text-center text-sm text-gray-400 py-1">
                  This dispute is {chatDispute.status}. Chat is read-only.
                </p>
              ) : (
                <div className="flex gap-2">
                  <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type your message…"
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                  <button onClick={sendMessage} disabled={sendingMsg || !newMsg.trim()}
                    className="bg-primary-600 hover:bg-primary-700 text-white p-2.5 rounded-xl transition disabled:opacity-50 shrink-0">
                    {sendingMsg ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link to="/player/dashboard" className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition shadow-sm">
              <ArrowLeft size={18} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <AlertCircle size={26} className="text-primary-600" />
                My Disputes
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">Track and manage your venue disputes & refund requests</p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={fetchAll} disabled={loading}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition shadow-sm text-sm font-medium">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={() => setShowRaise(true)}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition shadow-sm text-sm font-semibold">
              <Plus size={15} /> Raise Dispute
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { key: 'all',      label: 'Total',    color: 'from-gray-500/20 to-gray-600/20',    textColor: 'text-gray-700'  },
            { key: 'open',     label: 'Open',     color: 'from-amber-500/20 to-amber-600/20',  textColor: 'text-amber-700' },
            { key: 'resolved', label: 'Resolved', color: 'from-green-500/20 to-green-600/20',  textColor: 'text-green-700' },
            { key: 'rejected', label: 'Rejected', color: 'from-red-500/20 to-red-600/20',      textColor: 'text-red-700'   },
          ].map(s => (
            <button key={s.key} onClick={() => setActiveTab(s.key)}
              className={`bg-linear-to-br ${s.color} rounded-xl p-4 text-left transition border-2
                ${activeTab === s.key ? 'border-primary-400 shadow-md' : 'border-transparent'}`}>
              <p className={`text-2xl font-bold ${s.textColor}`}>{counts[s.key]}</p>
              <p className="text-gray-600 text-sm font-medium">{s.label}</p>
            </button>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200 mb-6 w-fit">
          {['all', 'open', 'resolved', 'rejected'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition
                ${activeTab === tab ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              {tab} <span className={`ml-1 text-xs ${activeTab === tab ? 'text-primary-100' : 'text-gray-400'}`}>({counts[tab]})</span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw size={30} className="animate-spin text-primary-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <ReceiptText size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No disputes found</h3>
            <p className="text-gray-400 text-sm">
              {activeTab === 'all'
                ? "You haven't raised any disputes yet."
                : `No ${activeTab} disputes.`}
            </p>
            {activeTab === 'all' && (
              <button onClick={() => setShowRaise(true)}
                className="mt-4 flex items-center gap-2 bg-primary-600 text-white px-5 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-semibold">
                <Plus size={15} /> Raise Dispute
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(d => {
              const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.open;
              const StatusIcon = cfg.icon;
              const isOpen = expanded === d.id;
              return (
                <div key={d.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden
                  hover:border-gray-300 hover:shadow-md transition">
                  {/* Card header */}
                  <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Status badge */}
                    <div className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border
                      ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                      <StatusIcon size={12} />
                      {cfg.label}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{d.issue}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><MapPin size={11} /> {d.venue}</span>
                        {d.bookingId && <span className="flex items-center gap-1"><ReceiptText size={11} /> #{d.bookingId}</span>}
                        {d.raisedOn && <span className="flex items-center gap-1"><Calendar size={11} /> Raised {d.raisedOn}</span>}
                        {d.amount && <span className="flex items-center gap-1 font-medium text-primary-600"><IndianRupee size={11} />₹{d.amount}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => openChat(d)}
                        className="flex items-center gap-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-primary-200">
                        <MessageSquare size={13} />
                        Chat
                        {d.msgCount > 0 && (
                          <span className="bg-primary-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                            {d.msgCount}
                          </span>
                        )}
                      </button>
                      <button onClick={() => setExpanded(isOpen ? null : d.id)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition">
                        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable detail */}
                  {isOpen && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-gray-50 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{d.description || '—'}</p>
                      </div>
                      {d.resolution && (
                        <div className={`rounded-xl border px-4 py-3 ${cfg.bg} ${cfg.border}`}>
                          <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${cfg.text}`}>Admin Resolution</p>
                          <p className={`text-sm ${cfg.text}`}>{d.resolution}</p>
                        </div>
                      )}
                      {d.status === 'open' && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2.5 rounded-lg text-xs">
                          <Clock size={13} />
                          <span>Your dispute is under review. Use the chat to communicate with the admin or venue owner.</span>
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
};

export default PlayerDisputes;
