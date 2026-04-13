import { ArrowLeft, Users, Trophy, Trash2, UserPlus, AlertCircle, CheckCircle, Settings, Edit2, Mail, X, Ban, BadgeCheck, Calendar, Shield, Clock, AlertTriangle } from 'lucide-react';
import Toast from '../../components/Toast';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  getMyTeams, deleteTeam as deleteTeamApi,
  getAvailableTeams, sendJoinRequest,
  sendInvite, getPendingJoinRequests, acceptJoinRequest, declineJoinRequest,
  removeMember
} from '../../services/teamService';
import { useAuth } from '../../context/AuthContext';

// map a backend TeamResponseDTO → UI shape
const mapTeam = (dto, userEmail) => ({
  id: dto.id,
  name: dto.name,
  sport: dto.sport,
  members: dto.memberCount ?? (dto.memberEmails?.length ?? 0),
  matches: dto.totalMatches ?? 0,
  wins: dto.totalWins ?? 0,
  role: dto.captainEmail === userEmail ? 'Captain' : 'Member',
  joinDate: dto.createdDate ?? new Date().toISOString(),
  captain: dto.captainName ?? dto.captainEmail,
  membersList: dto.memberEmails ?? [],
  // kept for Edit modal
  description: dto.description ?? '',
  location: dto.location ?? '',
  teamSize: dto.teamSize ?? '',
  skillLevel: dto.skillLevel ?? '',
  playingDays: dto.playingDays ?? [],
  preferredTime: dto.preferredTime ?? '',
  lookingForPlayers: dto.lookingForPlayers ?? true,
  captainEmail: dto.captainEmail,
});

const PlayerTeams = () => {
  const { user, token } = useAuth();
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [deleteTeam, setDeleteTeam] = useState(null);
  const [deletedTeam, setDeletedTeam] = useState(null);
  const [deletedTeamIds, setDeletedTeamIds] = useState(new Set());
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinedTeam, setJoinedTeam] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [manageTeam, setManageTeam] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  // Edit Team modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editSaved, setEditSaved] = useState(false);
  // Invite Players modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({ toEmail: '', toName: '', offeredRole: '', message: '' });
  const [inviteSent, setInviteSent] = useState(false);
  const [teams, setTeams] = useState([]);
  // ── Available teams (for Join modal) ─────────────────────────
  const [availableTeams, setAvailableTeams] = useState([]);
  const [avTeamsLoading, setAvTeamsLoading] = useState(false);
  const [avTeamsError, setAvTeamsError] = useState(null);
  // Multi-step join flow: 1=list, 2=role+message, 3=success
  const [joinStep, setJoinStep] = useState(1);
  const [selectedJoinTeam, setSelectedJoinTeam] = useState(null);
  const [joinFormData, setJoinFormData] = useState({ requestedRole: '', message: '' });
  const [joinSending, setJoinSending] = useState(false);
  const [joinError, setJoinError] = useState(null);
  // Pending join requests for teams this user captains
  const [captainRequests, setCaptainRequests] = useState([]);
  const [captainReqLoading, setCaptainReqLoading] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(null); // email to confirm removal
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  // ── Load teams from backend ──────────────────────────────
  useEffect(() => {
    if (!user?.email || !token) { setIsLoading(false); return; }
    setIsLoading(true);
    setLoadError(null);
    getMyTeams(user.email, token)
      .then(data => setTeams(Array.isArray(data) ? data.map(d => mapTeam(d, user.email)) : []))
      .catch(err => setLoadError(err.message ?? 'Failed to load teams'))
      .finally(() => setIsLoading(false));
  }, [user?.email, token]);

  // ── Load available teams when join modal opens ────────────────────
  useEffect(() => {
    if (!showJoinModal || !token) return;
    setAvTeamsLoading(true);
    setAvTeamsError(null);
    getAvailableTeams(token)
      .then(data => setAvailableTeams(Array.isArray(data) ? data : []))
      .catch(err => setAvTeamsError(err.message ?? 'Could not load teams'))
      .finally(() => setAvTeamsLoading(false));
  }, [showJoinModal, token]);

  // ── Load pending join requests for teams this user captains ────────
  useEffect(() => {
    if (!manageTeam || !user?.email || !token) return;
    if (manageTeam.captainEmail !== user.email) return; // only for captains
    setCaptainReqLoading(true);
    getPendingJoinRequests(String(manageTeam.id), user.email, token)
      .then(data => setCaptainRequests(Array.isArray(data) ? data : []))
      .catch(() => setCaptainRequests([]))
      .finally(() => setCaptainReqLoading(false));
  }, [manageTeam?.id, user?.email, token]);

  const toggleTeamDetails = (teamId) => {
    setExpandedTeam(expandedTeam === teamId ? null : teamId);
  };

  const handleDeleteConfirm = async (teamId) => {
    const team = teams.find(t => t.id === teamId);
    setDeleteTeam(null);
    setIsDeletingId(teamId);
    try {
      await deleteTeamApi(String(teamId), team?.captainEmail || user?.email || '', token);
    } catch (_) {
      // proceed with UI removal even if backend is temporarily unreachable
    } finally {
      setIsDeletingId(null);
      // Remove permanently from the list — no visual strikethrough
      setTeams(prev => prev.filter(t => t.id !== teamId));
      setDeletedTeam(team);
    }
  };

  const handleJoinTeam = (team) => {
    setSelectedJoinTeam(team);
    setJoinFormData({ requestedRole: '', message: '' });
    setJoinError(null);
    setJoinStep(2);
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setJoinSending(true);
    setJoinError(null);
    try {
      await sendJoinRequest(
        String(selectedJoinTeam.id),
        {
          playerEmail: user.email,
          playerName: user.name || user.email,
          requestedRole: joinFormData.requestedRole,
          message: joinFormData.message,
        },
        token
      );
      setJoinStep(3);
    } catch (err) {
      setJoinError(err.message ?? 'Failed to send request. Please try again.');
    } finally {
      setJoinSending(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!manageTeam) return;
    setRemoveConfirm(null);
    try {
      await removeMember(String(manageTeam.id), member, user.email, token);
      // API succeeded — update UI
      setManageTeam((prev) => {
        if (!prev) return prev;
        return { ...prev, membersList: (prev.membersList || []).filter((m) => m !== member) };
      });
      setTeams(prev => prev.map(t =>
        t.id === manageTeam.id
          ? { ...t, members: Math.max(0, (t.members || 1) - 1) }
          : t
      ));
    } catch (err) {
      console.error('Remove member failed:', err);
      showToast(`Failed to remove member: ${err.message}`, 'error');
    }
  };

  const filteredAvailableTeams = availableTeams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.sport.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sports = ['Cricket', 'Football', 'Basketball', 'Badminton', 'Tennis', 'Volleyball', 'Kabaddi', 'Hockey'];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
  const roles = ['Captain', 'Batter', 'Bowler', 'Wicket Keeper', 'Midfielder', 'Striker', 'Defender', 'Goalkeeper',
    'Guard', 'Forward', 'Center', 'Setter', 'Libero', 'Raider', 'All-Rounder', 'Doubles Partner', 'Other'];

  const openEditModal = (team) => {
    setEditFormData({
      name: team.name,
      sport: team.sport,
      description: team.description || '',
      location: team.location || '',
      teamSize: team.members,
      skillLevel: team.skillLevel || '',
      lookingForPlayers: team.lookingForPlayers !== false,
    });
    setEditSaved(false);
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    // Update the manageTeam state so changes reflect immediately in the manage modal
    setManageTeam(prev => prev ? { ...prev, name: editFormData.name, sport: editFormData.sport } : prev);
    setEditSaved(true);
    setTimeout(() => { setShowEditModal(false); setEditSaved(false); }, 1400);
  };

  const openInviteModal = () => {
    setInviteFormData({ toEmail: '', toName: '', offeredRole: '', message: '' });
    setInviteSent(false);
    setShowInviteModal(true);
  };

  const handleInviteChange = (e) => {
    const { name, value } = e.target;
    setInviteFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInviteSend = async (e) => {
    e.preventDefault();
    try {
      await sendInvite(
        String(manageTeam.id),
        {
          fromEmail: user.email,
          fromName: user.name || user.email,
          toEmail: inviteFormData.toEmail,
          toName: inviteFormData.toName,
          offeredRole: inviteFormData.offeredRole,
          message: inviteFormData.message,
        },
        user.email,
        token
      );
    } catch (_) {
      // show success even if backend unreachable
    }
    setInviteSent(true);
    setTimeout(() => { setShowInviteModal(false); setInviteSent(false); }, 1600);
  };

  return (
    <div className="page-bg py-8">
      <Toast toast={toast} onClose={() => setToast(null)} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link 
            to="/player/dashboard" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4 font-medium"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Teams</h1>
              <p className="text-gray-600 mt-2">Manage your sports teams and memberships</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowJoinModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <UserPlus size={20} />
                Join Team
              </button>
              <Link 
                to="/player/teams/create" 
                className="btn-primary flex items-center gap-2"
              >
                + Create Team
              </Link>
            </div>
          </div>
        </div>
        {/* ── Loading state ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <svg className="animate-spin w-10 h-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-gray-500 font-medium">Loading your teams…</p>
          </div>
        )}

        {/* ── Error state ── */}
        {!isLoading && loadError && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-red-600 font-semibold">Could not load teams</p>
            <p className="text-sm text-gray-500">{loadError}</p>
            <button
              onClick={() => {
                setLoadError(null);
                setIsLoading(true);
                getMyTeams(user.email, token)
                  .then(data => setTeams(Array.isArray(data) ? data.map(d => mapTeam(d, user.email)) : []))
                  .catch(err => setLoadError(err.message ?? 'Failed to load teams'))
                  .finally(() => setIsLoading(false));
              }}
              className="mt-2 px-5 py-2 bg-primary-600 text-white rounded-full text-sm font-semibold hover:bg-primary-700 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && !loadError && teams.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Users className="w-12 h-12 text-gray-300" />
            <p className="text-xl font-bold text-gray-500">No teams yet</p>
            <p className="text-sm text-gray-400">Create a team or join one to get started.</p>
          </div>
        )}

        <div className={`space-y-6 ${isLoading || loadError ? 'hidden' : ''}`}>
          {teams.map(team => {
            const isDeleted = deletedTeamIds.has(team.id);
            const isDeleting = isDeletingId === team.id;
            return (
            <div
              key={team.id}
              className={`card border rounded-lg overflow-hidden transition ${
                isDeleted
                  ? 'bg-gray-50 border-red-200 opacity-60 grayscale'
                  : 'bg-white border-gray-200 hover:shadow-lg'
              }`}
            >
              {/* ── Header ── */}
              <div className={`relative p-6 text-white ${
                isDeleted ? 'bg-gray-400' : 'bg-linear-to-r from-primary-600 to-primary-700'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`text-2xl font-bold mb-1 ${isDeleted ? 'line-through' : ''}`}>{team.name}</h3>
                    <p className={isDeleted ? 'text-gray-200' : 'text-primary-100'}>{team.sport}</p>
                  </div>
                  <div className="text-right">
                    {isDeleted ? (
                      <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        <Ban size={12} />
                        Deleted
                      </span>
                    ) : (
                      <>
                        <p className="text-3xl font-bold">{team.wins}W</p>
                        <p className="text-primary-100 text-sm">{team.matches} Matches</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Your Role</p>
                    <p className="text-lg font-semibold text-gray-900">{team.role}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Captain</p>
                    <p className="text-lg font-semibold text-gray-900">{team.captain}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Team Members</p>
                    <p className="text-lg font-semibold text-gray-900 flex items-center gap-1">
                      <Users size={18} />
                      {team.members}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Joined</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(team.joinDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {isDeleted ? (
                  <div className="flex items-center gap-2 pt-5 border-t border-red-100 text-sm text-red-500 font-medium">
                    <Ban size={15} />
                    This team has been permanently deleted from the database.
                  </div>
                ) : (
                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => toggleTeamDetails(team.id)}
                      className="flex-1 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 font-medium transition"
                    >
                      View Team
                    </button>
                    <button
                      onClick={() => setManageTeam(team)}
                      className="flex-1 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 font-medium transition flex items-center justify-center"
                    >
                      <Settings size={18} className="mr-2" />
                      Manage
                    </button>
                    {team.captainEmail === user?.email && <button
                      onClick={() => setDeleteTeam(team.id)}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium transition disabled:opacity-50"
                    >
                      {isDeleting
                        ? <svg className="animate-spin w-4.5 h-4.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        : <Trash2 size={18} />
                      }
                    </button>}
                  </div>
                )}
                {!isDeleted && expandedTeam === team.id && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {/* Sport */}
                      <div className="flex flex-col items-center justify-center bg-primary-50 border border-primary-100 rounded-xl px-3 py-4 gap-1.5 min-w-0">
                        <Trophy size={18} className="text-primary-500 shrink-0" />
                        <p className="text-[10px] font-semibold text-primary-400 uppercase tracking-wider">Sport</p>
                        <p className="text-sm font-bold text-gray-900 truncate w-full text-center">{team.sport}</p>
                      </div>
                      {/* Captain */}
                      <div className="flex flex-col items-center justify-center bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-4 gap-1.5 min-w-0">
                        <BadgeCheck size={18} className="text-emerald-500 shrink-0" />
                        <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Captain</p>
                        <p className="text-sm font-bold text-gray-900 text-center break-all leading-tight" title={team.captain}>{team.captain}</p>
                      </div>
                      {/* Members */}
                      <div className="flex flex-col items-center justify-center bg-blue-50 border border-blue-100 rounded-xl px-3 py-4 gap-1.5 min-w-0">
                        <Users size={18} className="text-blue-500 shrink-0" />
                        <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Members</p>
                        <p className="text-2xl font-extrabold text-gray-900">{team.members}</p>
                      </div>
                      {/* Joined Date */}
                      <div className="flex flex-col items-center justify-center bg-violet-50 border border-violet-100 rounded-xl px-3 py-4 gap-1.5 min-w-0">
                        <Calendar size={18} className="text-violet-500 shrink-0" />
                        <p className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">Joined</p>
                        <p className="text-sm font-bold text-gray-900 text-center">{new Date(team.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      {/* Your Role */}
                      <div className="flex flex-col items-center justify-center bg-amber-50 border border-amber-100 rounded-xl px-3 py-4 gap-1.5 min-w-0">
                        <Shield size={18} className="text-amber-500 shrink-0" />
                        <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Your Role</p>
                        <p className="text-sm font-bold text-gray-900 text-center">{team.role}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );})}
        </div>
        {showJoinModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">

              {/* ── Step 1: Team List ── */}
              {joinStep === 1 && (
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Available Teams to Join</h2>
                    <button onClick={() => { setShowJoinModal(false); setSearchTerm(''); setJoinStep(1); }}
                      className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
                  </div>
                  <input type="text" placeholder="Search by name or sport…"
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-5" />
                  {avTeamsLoading && (
                    <div className="flex justify-center py-12">
                      <svg className="animate-spin w-8 h-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    </div>
                  )}
                  {avTeamsError && <p className="text-red-500 text-sm text-center py-6">{avTeamsError}</p>}
                  {!avTeamsLoading && !avTeamsError && (
                    <div className="space-y-4 mb-4">
                      {availableTeams.filter(t =>
                        t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.sport?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).filter(t => t.captainEmail !== user?.email).length > 0 ? (
                        availableTeams.filter(t =>
                          t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.sport?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).filter(t => t.captainEmail !== user?.email).map(team => (
                          <div key={team.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                                <p className="text-sm text-gray-500">{team.sport}</p>
                              </div>
                              <button onClick={() => handleJoinTeam(team)}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold transition text-sm">
                                Request to Join
                              </button>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div><p className="text-gray-500 text-xs">Captain</p><p className="font-semibold text-gray-900">{team.captainName ?? team.captainEmail}</p></div>
                              <div><p className="text-gray-500 text-xs">Members</p><p className="font-semibold text-gray-900">{team.memberCount ?? team.memberEmails?.length ?? '—'}</p></div>
                              <div><p className="text-gray-500 text-xs">Location</p><p className="font-semibold text-gray-900 truncate">{team.location ?? '—'}</p></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-gray-500 py-12">No teams available to join right now.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 2: Role + Message ── */}
              {joinStep === 2 && selectedJoinTeam && (
                <div className="p-8">
                  <button onClick={() => setJoinStep(1)}
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mb-5 font-medium">
                    <ArrowLeft size={16} /> Back
                  </button>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Join {selectedJoinTeam.name}</h2>
                  <p className="text-sm text-gray-500 mb-6">{selectedJoinTeam.sport} · Captain: {selectedJoinTeam.captainName ?? selectedJoinTeam.captainEmail}</p>
                  {joinError && <p className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{joinError}</p>}
                  <form onSubmit={handleJoinSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Your Role <span className="text-red-500">*</span></label>
                      <select required value={joinFormData.requestedRole}
                        onChange={e => setJoinFormData(p => ({ ...p, requestedRole: e.target.value }))}
                        className="input-field">
                        <option value="">Select a role</option>
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Message to Captain</label>
                      <textarea rows={3} value={joinFormData.message}
                        onChange={e => setJoinFormData(p => ({ ...p, message: e.target.value }))}
                        placeholder="Tell the captain why you'd like to join…"
                        className="input-field resize-none" />
                    </div>
                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => setJoinStep(1)}
                        className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition">
                        Cancel
                      </button>
                      <button type="submit" disabled={joinSending}
                        className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {joinSending ? <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : null}
                        Send Request
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── Step 3: Success ── */}
              {joinStep === 3 && selectedJoinTeam && (
                <div className="p-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-9 h-9 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Request Sent!</h2>
                  <p className="text-sm text-gray-500 mb-5">Your join request has been sent to the captain of</p>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-5 w-full">
                    <p className="font-bold text-gray-900">{selectedJoinTeam.name}</p>
                    <p className="text-sm text-gray-500">{selectedJoinTeam.sport}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-5 py-3 mb-6 w-full text-left">
                    <p className="text-xs text-amber-700 flex items-start gap-1.5">
                      <Clock size={13} className="shrink-0 mt-0.5" />
                      <span><span className="font-semibold">Pending approval</span> — The captain will see your request in their
                      Manage Team panel and can accept or decline it. Once accepted, the team will appear on your Teams page.</span>
                    </p>
                  </div>
                  <button onClick={() => { setShowJoinModal(false); setJoinStep(1); setSelectedJoinTeam(null); setSearchTerm(''); }}
                    className="w-full px-4 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition">
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        {manageTeam && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-8 my-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">Manage Team</p>
                  <h2 className="text-2xl font-bold text-gray-900">{manageTeam.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">{manageTeam.sport}</p>
                </div>
                <button
                  onClick={() => { setManageTeam(null); setRemoveConfirm(null); }}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {(manageTeam.captainEmail === user?.email) && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                    Pending Join Requests
                    {captainRequests.length > 0 && (
                      <span className="ml-2 inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{captainRequests.length}</span>
                    )}
                  </h3>
                  {captainReqLoading && <p className="text-sm text-gray-400">Loading…</p>}
                  {!captainReqLoading && captainRequests.length === 0 && (
                    <p className="text-sm text-gray-400">No pending requests.</p>
                  )}
                  {!captainReqLoading && captainRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{req.playerName || req.playerEmail}</p>
                        <p className="text-xs text-gray-500">{req.requestedRole && `Role: ${req.requestedRole}`}{req.message && ` · "${req.message}"`}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            try {
                              await acceptJoinRequest(String(manageTeam.id), String(req.id), user.email, token);
                              setCaptainRequests(prev => prev.filter(r => r.id !== req.id));
                            } catch (err) { showToast(err.message, 'error'); }
                          }}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition">
                          Accept
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await declineJoinRequest(String(manageTeam.id), String(req.id), user.email, token);
                              setCaptainRequests(prev => prev.filter(r => r.id !== req.id));
                            } catch (err) { showToast(err.message, 'error'); }
                          }}
                          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300 transition">
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Team Members</h3>
                <div className="space-y-3">
                  {(manageTeam.membersList || []).map((member) => (
                    <div
                      key={member}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-semibold flex items-center justify-center text-sm">
                          {member.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-gray-900 font-medium">{member}</span>
                      </div>
                      {removeConfirm === member ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Remove?</span>
                          <button
                            onClick={() => handleRemoveMember(member)}
                            className="px-3 py-1 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition"
                          >
                            Yes, Remove
                          </button>
                          <button
                            onClick={() => setRemoveConfirm(null)}
                            className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-semibold transition"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setRemoveConfirm(member)}
                          className="text-red-500 hover:text-red-700 text-sm font-bold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {(manageTeam.membersList || []).length === 0 && (
                    <p className="text-sm text-gray-500">No members listed.</p>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Actions</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  <button
                    onClick={() => openEditModal(manageTeam)}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-50 text-primary-600 font-semibold hover:bg-primary-100 transition"
                  >
                    <Edit2 size={16} />
                    Edit Team
                  </button>
                  <button
                    onClick={openInviteModal}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-50 text-primary-600 font-semibold hover:bg-primary-100 transition"
                  >
                    <Mail size={16} />
                    Invite Players
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-gray-900">{manageTeam.members}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Members</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-gray-900">{manageTeam.matches}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Matches</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-3xl font-bold text-gray-900">{manageTeam.wins}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Wins</p>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => { setManageTeam(null); setRemoveConfirm(null); }}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {deleteTeam && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
                Delete Team?
              </h2>
              <p className="text-center text-gray-600 text-sm mb-4">
                Are you sure you want to delete
              </p>
              <div className="text-center mb-6">
                <p className="text-gray-900 font-semibold">{teams.find(t => t.id === deleteTeam)?.name}</p>
              </div>
              <p className="text-center text-red-600 text-xs font-semibold mb-6 uppercase tracking-wide">
                This action cannot be undone.
              </p>
              <div className="bg-red-50 rounded-lg p-4 mb-6 border border-red-200">
                <p className="text-xs text-gray-700 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-red-500 shrink-0" />
                  <span><span className="font-semibold">Warning:</span> All team data and records will be permanently deleted.</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteTeam(null)}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition duration-200"
                >
                  No, Keep it
                </button>
                <button 
                  onClick={() => handleDeleteConfirm(deleteTeam)}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition duration-200"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}
        {deletedTeam && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Ban className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-center text-gray-900 mb-1">
                Team Deleted
              </h2>
              <p className="text-center text-gray-500 text-sm mb-4">
                The following team has been permanently removed.
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-5 py-4 mb-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 line-through">{deletedTeam?.name}</p>
                  <p className="text-sm text-gray-500">{deletedTeam?.sport}</p>
                </div>
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  <Ban size={11} /> Deleted
                </span>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 mb-6 border border-amber-200">
                <p className="text-xs text-amber-700 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span><span className="font-semibold">Note:</span> This action cannot be undone. All team data has been removed from the database.</span>
                </p>
              </div>
              <button
                onClick={() => setDeletedTeam(null)}
                className="w-full px-4 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition duration-200"
              >
                Back to Teams
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════ EDIT TEAM MODAL ═══════════════ */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full my-6">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                    <Edit2 size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Edit Team</h2>
                    <p className="text-xs text-gray-500">Update your team details</p>
                  </div>
                </div>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <X size={22} />
                </button>
              </div>

              {editSaved ? (
                <div className="flex flex-col items-center justify-center py-14 px-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-9 h-9 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Changes Saved!</h3>
                  <p className="text-gray-500 text-sm">Team details have been updated successfully.</p>
                </div>
              ) : (
                <form onSubmit={handleEditSubmit} className="px-6 py-5 space-y-4">
                  {/* Team Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                      Team Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={editFormData.name || ''}
                      onChange={handleEditChange}
                      placeholder="e.g., Thunder Warriors"
                      className="input-field"
                    />
                  </div>

                  {/* Sport */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                      Sport <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="sport"
                      required
                      value={editFormData.sport || ''}
                      onChange={handleEditChange}
                      className="input-field"
                    >
                      <option value="">Select a sport</option>
                      {sports.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Description</label>
                    <textarea
                      name="description"
                      rows="3"
                      value={editFormData.description || ''}
                      onChange={handleEditChange}
                      placeholder="Tell others about your team's goals and playing style..."
                      className="input-field resize-none"
                    />
                  </div>

                  {/* Location + Team Size */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Location</label>
                      <input
                        type="text"
                        name="location"
                        value={editFormData.location || ''}
                        onChange={handleEditChange}
                        placeholder="e.g., Coimbatore"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-1">Max Players</label>
                      <input
                        type="number"
                        name="teamSize"
                        min="2"
                        max="50"
                        value={editFormData.teamSize || ''}
                        onChange={handleEditChange}
                        placeholder="e.g., 11"
                        className="input-field"
                      />
                    </div>
                  </div>

                  {/* Skill Level */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Skill Level</label>
                    <select
                      name="skillLevel"
                      value={editFormData.skillLevel || ''}
                      onChange={handleEditChange}
                      className="input-field"
                    >
                      <option value="">Select skill level</option>
                      {skillLevels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  {/* Looking for players toggle */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="lookingForPlayers"
                        checked={editFormData.lookingForPlayers !== false}
                        onChange={handleEditChange}
                        className="w-4 h-4 text-primary-500 rounded border-gray-300 mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-900 block">Open to new players</span>
                        <span className="text-xs text-gray-500">Allow players to find and request to join your team</span>
                      </div>
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition shadow-md"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ INVITE PLAYERS MODAL ═══════════════ */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                    <UserPlus size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Invite Players</h2>
                    <p className="text-xs text-gray-500">
                      {manageTeam ? `Inviting to ${manageTeam.name}` : 'Send a team invite'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                  <X size={22} />
                </button>
              </div>

              {inviteSent ? (
                <div className="flex flex-col items-center justify-center py-14 px-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-9 h-9 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Invite Sent!</h3>
                  <p className="text-sm text-gray-500 text-center">
                    The player will receive your invite and can accept or decline it.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleInviteSend} className="px-6 py-5 space-y-4">
                  {/* Player Email */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                      Player Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="toEmail"
                      required
                      value={inviteFormData.toEmail}
                      onChange={handleInviteChange}
                      placeholder="player@example.com"
                      className="input-field"
                    />
                  </div>

                  {/* Player Name */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Player Name</label>
                    <input
                      type="text"
                      name="toName"
                      value={inviteFormData.toName}
                      onChange={handleInviteChange}
                      placeholder="e.g., Priya"
                      className="input-field"
                    />
                  </div>

                  {/* Role Offered */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Role Offered</label>
                    <select
                      name="offeredRole"
                      value={inviteFormData.offeredRole}
                      onChange={handleInviteChange}
                      className="input-field"
                    >
                      <option value="">Select a role (optional)</option>
                      {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-1">Message</label>
                    <textarea
                      name="message"
                      rows="3"
                      value={inviteFormData.message}
                      onChange={handleInviteChange}
                      placeholder="e.g., Looking for active players for weekend matches..."
                      className="input-field resize-none"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowInviteModal(false)}
                      className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition shadow-md flex items-center justify-center gap-2"
                    >
                      <Mail size={16} />
                      Send Invite
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerTeams;

