import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Video, Calendar, Clock, Plus, Edit3, Trash2, ExternalLink,
  Copy, Check, Radio, Users, BookOpen, Sparkles, PlayCircle,
  X, Search, Filter, RefreshCw, ShieldCheck, AlertCircle, Link2, KeyRound,
  ShieldAlert, Building2, UserCog, GraduationCap, Download
} from 'lucide-react';

export const LiveSessionsTab = ({
  user,
  role = 'ROLE_STUDENT',
  courses = [],
  themeColor = 'blue'
}) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | LIVE | BOSS_ADMIN | SUPER_ADMIN | TRAINER | UPCOMING | COMPLETED

  // Scheduling / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Recording Modal State
  const [recordingModalSession, setRecordingModalSession] = useState(null);
  const [recordingForm, setRecordingForm] = useState({ videoUrl: '', notes: '' });
  const [recordingLoading, setRecordingLoading] = useState(false);

  // Watch Recording Modal State
  const [watchingSession, setWatchingSession] = useState(null);

  // Default target audience based on role
  const getDefaultAudience = () => {
    if (role === 'ROLE_BOSS_ADMIN') return 'Super Admins, Trainers & Students';
    if (role === 'ROLE_SUPER_ADMIN') return 'Trainers & Students';
    return 'Enrolled Students';
  };

  const initialFormData = {
    title: '',
    description: '',
    platform: 'GOOGLE_MEET',
    joinUrl: '',
    meetingPasscode: '',
    subjectName: courses[0]?.title || 'Computer Science & AI',
    courseId: courses[0]?.id || 1,
    scheduledAt: '',
    durationMinutes: 60,
    targetAudience: getDefaultAudience(),
    creatorRole: role
  };
  const [formData, setFormData] = useState(initialFormData);

  const canManage = role === 'ROLE_TRAINER' || role === 'ROLE_SUPER_ADMIN' || role === 'ROLE_BOSS_ADMIN';

  useEffect(() => {
    fetchSessions();
  }, [role]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (user?.institutionId) params.append('institutionId', user.institutionId);

      const res = await api.get(`/sessions?${params.toString()}`);
      setSessions(res.data || []);
    } catch (err) {
      console.warn('Failed to load live sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScheduleModal = () => {
    setEditingSession(null);
    setModalError('');
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setFormData({
      ...initialFormData,
      targetAudience: getDefaultAudience(),
      creatorRole: role,
      subjectName: courses[0]?.title || 'Computer Science & AI',
      courseId: courses[0]?.id || 1,
      scheduledAt: localIso
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sess) => {
    setEditingSession(sess);
    setModalError('');
    let formattedDate = '';
    if (sess.scheduledAt) {
      const d = new Date(sess.scheduledAt);
      formattedDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }
    setFormData({
      title: sess.title || '',
      description: sess.description || '',
      platform: sess.platform || 'GOOGLE_MEET',
      joinUrl: sess.joinUrl || '',
      meetingPasscode: sess.meetingPasscode || '',
      subjectName: sess.subjectName || (courses[0]?.title || 'Computer Science & AI'),
      courseId: sess.courseId || (courses[0]?.id || 1),
      scheduledAt: formattedDate,
      durationMinutes: sess.durationMinutes || 60,
      targetAudience: sess.targetAudience || getDefaultAudience(),
      creatorRole: sess.creatorRole || role
    });
    setIsModalOpen(true);
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setModalError('Please enter a session title.');
      return;
    }
    if (!formData.joinUrl.trim()) {
      setModalError('Please enter the meeting link (Google Meet, Zoom, etc.).');
      return;
    }
    if (!formData.scheduledAt) {
      setModalError('Please select the scheduled date and time.');
      return;
    }

    try {
      setModalLoading(true);
      setModalError('');
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        platform: formData.platform,
        joinUrl: formData.joinUrl.trim(),
        meetingPasscode: formData.meetingPasscode ? formData.meetingPasscode.trim() : null,
        subjectName: formData.subjectName,
        courseId: Number(formData.courseId) || 1,
        scheduledAt: formData.scheduledAt,
        durationMinutes: Number(formData.durationMinutes) || 60,
        targetAudience: formData.targetAudience || getDefaultAudience(),
        creatorRole: formData.creatorRole || role,
        trainerName: user?.fullName || (role === 'ROLE_BOSS_ADMIN' ? 'Boss Admin Master' : 'Assigned Faculty'),
        trainerEmail: user?.email || '',
        institutionName: user?.institutionName || 'BridgeAI Enterprise'
      };

      if (editingSession) {
        const res = await api.put(`/sessions/${editingSession.id}`, payload);
        setSessions(prev => prev.map(s => s.id === editingSession.id ? res.data : s));
      } else {
        const res = await api.post('/sessions', payload);
        setSessions(prev => [res.data, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to save live session.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteSession = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete live session "${title}"?`)) return;
    try {
      await api.delete(`/sessions/${id}`);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete live session: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleStatus = async (id, nextStatus) => {
    try {
      const res = await api.patch(`/sessions/${id}/status?status=${nextStatus}`);
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: res.data.status } : s));
    } catch (err) {
      alert('Failed to update session status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenRecordingModal = (sess) => {
    setRecordingModalSession(sess);
    setRecordingForm({
      videoUrl: sess.recordingVideoUrl || '',
      notes: sess.recordingNotes || ''
    });
  };

  const handleSaveRecording = async (e) => {
    e.preventDefault();
    if (!recordingForm.videoUrl.trim()) {
      alert('Please provide a recording video URL.');
      return;
    }
    try {
      setRecordingLoading(true);
      const res = await api.put(
        `/sessions/${recordingModalSession.id}/recording?recordingVideoUrl=${encodeURIComponent(recordingForm.videoUrl.trim())}&recordingNotes=${encodeURIComponent(recordingForm.notes.trim())}`
      );
      setSessions(prev => prev.map(s => s.id === recordingModalSession.id ? res.data : s));
      setRecordingModalSession(null);
    } catch (err) {
      alert('Failed to save recording: ' + (err.response?.data?.message || err.message));
    } finally {
      setRecordingLoading(false);
    }
  };

  const handleCopyLink = (sess) => {
    const textToCopy = sess.meetingPasscode 
      ? `Meeting Link: ${sess.joinUrl}\nPasscode: ${sess.meetingPasscode}`
      : sess.joinUrl;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(sess.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filtered sessions based on search & hierarchy/status
  const filteredSessions = sessions.filter(sess => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      sess.title?.toLowerCase().includes(q) ||
      sess.subjectName?.toLowerCase().includes(q) ||
      sess.trainerName?.toLowerCase().includes(q) ||
      sess.platform?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === 'LIVE') return sess.status === 'LIVE';
    if (statusFilter === 'UPCOMING') return sess.status === 'UPCOMING';
    if (statusFilter === 'COMPLETED') return sess.status === 'COMPLETED' || sess.status === 'RECORDED';
    if (statusFilter === 'BOSS_ADMIN') return sess.creatorRole === 'ROLE_BOSS_ADMIN';
    if (statusFilter === 'SUPER_ADMIN') return sess.creatorRole === 'ROLE_SUPER_ADMIN';
    if (statusFilter === 'TRAINER') return sess.creatorRole === 'ROLE_TRAINER' || !sess.creatorRole;

    return true;
  });

  const getPlatformBadge = (platform) => {
    switch (platform) {
      case 'GOOGLE_MEET':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-[11px] font-bold rounded-lg">
            <Video className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            Google Meet
          </span>
        );
      case 'ZOOM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-bold rounded-lg">
            <Video className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Zoom Video
          </span>
        );
      case 'MS_TEAMS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[11px] font-bold rounded-lg">
            <Video className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            Microsoft Teams
          </span>
        );
      case 'WEBEX':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold rounded-lg">
            <Video className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Cisco Webex
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-[11px] font-bold rounded-lg">
            <Link2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            Custom Platform
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'LIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[11px] font-extrabold rounded-full shadow-2xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
          </span>
          LIVE NOW
        </span>
      );
    }
    if (status === 'COMPLETED' || status === 'RECORDED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold rounded-md">
          <Check className="w-3 h-3 text-slate-500" />
          Completed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold rounded-full">
        <Clock className="w-3 h-3 text-blue-500" />
        Upcoming
      </span>
    );
  };

  // Helper for creator hierarchy pill
  const getCreatorHierarchyBadge = (creatorRole) => {
    switch (creatorRole) {
      case 'ROLE_BOSS_ADMIN':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-[11px] font-bold shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>Boss Admin Session</span>
            <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 border-l border-purple-200 dark:border-purple-800 pl-1.5">
              Super Admin + Trainer + Student
            </span>
          </div>
        );
      case 'ROLE_SUPER_ADMIN':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-bold shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Super Admin Session</span>
            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 border-l border-amber-200 dark:border-amber-800 pl-1.5">
              Trainer + Student
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-bold shadow-2xs">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Faculty Trainer Session</span>
            <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 border-l border-blue-200 dark:border-blue-800 pl-1.5">
              Students Only
            </span>
          </div>
        );
    }
  };

  // Determine if the current user has permission to edit/delete/manage this specific session
  // Rule: ONLY the person who created the live session can edit or delete it
  const canUserManageSession = (sess) => {
    if (!sess) return false;

    const userEmail = (user?.email || '').toLowerCase().trim();
    const trainerEmail = (sess.trainerEmail || '').toLowerCase().trim();
    const userName = (user?.fullName || '').toLowerCase().trim();
    const trainerName = (sess.trainerName || '').toLowerCase().trim();
    const userRole = (user?.role || role || '').toUpperCase();
    const sessCreatorRole = (sess.creatorRole || '').toUpperCase();

    // 1. Match by user ID
    if (user?.id && sess.trainerId && Number(sess.trainerId) === Number(user.id)) {
      return true;
    }

    // 2. Match by user Email
    if (userEmail && trainerEmail && userEmail === trainerEmail) {
      return true;
    }

    // 3. Match by user Full Name or First Name / substring (e.g. "Bharat" matches "Bharat Sharma")
    if (userName && trainerName) {
      if (userName === trainerName) return true;
      if (userName.includes(trainerName) || trainerName.includes(userName)) return true;
      const userFirstName = userName.split(' ')[0];
      const trainerFirstName = trainerName.split(' ')[0];
      if (userFirstName && trainerFirstName && userFirstName === trainerFirstName) return true;
    }

    // 4. If current role is Boss Admin and the session was scheduled by Boss Admin
    if (userRole === 'ROLE_BOSS_ADMIN' && sessCreatorRole === 'ROLE_BOSS_ADMIN') {
      return true;
    }

    // 5. If current role is Super Admin and the session was scheduled by this Super Admin
    if (userRole === 'ROLE_SUPER_ADMIN' && sessCreatorRole === 'ROLE_SUPER_ADMIN') {
      if (!sess.trainerEmail && !sess.trainerId) return true;
    }

    return false;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold shadow-2xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Interactive Live Sessions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Join or schedule live classrooms on Google Meet, Zoom, and MS Teams with role-based attendance hierarchy.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Refresh Live Sessions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canManage && (
            <button
              onClick={handleOpenScheduleModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Live Session</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-Hierarchy Notice Banner */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold">Hierarchy Attendance:</span>
          <span className="text-slate-500 dark:text-slate-400">
            {role === 'ROLE_BOSS_ADMIN' && 'Sessions you schedule are accessible to Super Admins, Trainers, and Students.'}
            {role === 'ROLE_SUPER_ADMIN' && 'Sessions you schedule are accessible to Faculty Trainers and Students.'}
            {role === 'ROLE_TRAINER' && 'Sessions you schedule are accessible to Enrolled Students.'}
            {role === 'ROLE_STUDENT' && 'You can join sessions scheduled by Boss Admin, Super Admin, and your Faculty Trainers.'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            {role.replace('ROLE_', '').replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, subject, or host..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Sessions' },
            { id: 'LIVE', label: 'Live Now' },
            { id: 'BOSS_ADMIN', label: 'Boss Admin' },
            { id: 'SUPER_ADMIN', label: 'Super Admin' },
            { id: 'TRAINER', label: 'Trainer Faculty' },
            { id: 'COMPLETED', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Session Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 text-xs font-semibold">
          Loading live sessions...
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center font-bold">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Live Sessions Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No sessions match your search query. Try broadening your criteria.'
              : canManage
                ? 'No upcoming sessions scheduled yet. Click "Schedule Live Session" to create one.'
                : 'No live classes are currently scheduled for your cohort. Please check back later.'}
          </p>
          {canManage && !searchQuery && (
            <button
              onClick={handleOpenScheduleModal}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule First Session
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredSessions.map((sess) => {
            const isLive = sess.status === 'LIVE';
            const isCompleted = sess.status === 'COMPLETED' || sess.status === 'RECORDED';
            const isManageable = canUserManageSession(sess);

            return (
              <div
                key={sess.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between shadow-xs transition-all hover:shadow-md ${
                  isLive
                    ? 'border-rose-300 dark:border-rose-900/80 ring-2 ring-rose-500/20'
                    : sess.creatorRole === 'ROLE_BOSS_ADMIN'
                    ? 'border-purple-200 dark:border-purple-900/40'
                    : sess.creatorRole === 'ROLE_SUPER_ADMIN'
                    ? 'border-amber-200 dark:border-amber-900/40'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Header: Platform & Status */}
                  <div className="flex items-center justify-between gap-2">
                    {getPlatformBadge(sess.platform)}
                    {getStatusBadge(sess.status)}
                  </div>

                  {/* Hierarchy Creator & Audience Strip */}
                  <div className="space-y-1.5">
                    {getCreatorHierarchyBadge(sess.creatorRole)}
                  </div>

                  {/* Subject and Target Audience Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold rounded border border-slate-200 dark:border-slate-700">
                      {sess.subjectName || 'General Engineering'}
                    </span>
                    {sess.targetAudience && (
                      <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 text-[10px] font-medium rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" />
                        Audience: {sess.targetAudience}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                      {sess.title}
                    </h3>
                    {sess.description && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {sess.description}
                      </p>
                    )}
                  </div>

                  {/* Schedule & Timing Info */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="font-semibold">
                        {sess.scheduledAt
                          ? new Date(sess.scheduledAt).toLocaleString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Date TBD'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Duration: {sess.durationMinutes || 60} mins</span>
                      </div>
                      <span className="font-medium truncate max-w-[150px]">
                        Host: {sess.trainerName || 'Faculty Host'}
                      </span>
                    </div>

                    {/* Passcode banner if present */}
                    {sess.meetingPasscode && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-amber-500" />
                          Passcode:
                        </span>
                        <code className="font-mono font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {sess.meetingPasscode}
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 space-y-2">
                  {/* Primary Join / Start Action */}
                  <div className="flex items-center gap-2">
                    <a
                      href={sess.joinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs ${
                        isLive
                          ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{isLive ? 'Join Live Now' : isManageable ? 'Start Meeting' : 'Join Meeting'}</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>

                    <button
                      onClick={() => handleCopyLink(sess)}
                      className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors shrink-0"
                      title="Copy Meeting Link"
                    >
                      {copiedId === sess.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Recording watch button if recording attached */}
                  {sess.recordingVideoUrl && (
                    <button
                      onClick={() => setWatchingSession(sess)}
                      className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Watch Session Recording</span>
                    </button>
                  )}

                  {/* Management Actions (Visible only to authorized creator/admins) */}
                  {isManageable && (
                    <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {!isLive && !isCompleted && (
                          <button
                            onClick={() => handleToggleStatus(sess.id, 'LIVE')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                            title="Set session to Live"
                          >
                            Go Live
                          </button>
                        )}
                        {isLive && (
                          <button
                            onClick={() => handleToggleStatus(sess.id, 'COMPLETED')}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                            title="Complete session"
                          >
                            End Session
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenRecordingModal(sess)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold transition-colors shadow-2xs"
                          title="Attach recording link"
                        >
                          Recording
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(sess)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/50 text-slate-700 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                          title="Edit Session Details"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSession(sess.id, sess.title)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                          title="Delete Live Session"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SCHEDULE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 space-y-4 my-8 transition-colors">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                  {editingSession ? <Edit3 className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingSession ? 'Edit Live Session' : 'Schedule New Live Session'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Meeting will be visible to designated roles according to hierarchy.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Role-Specific Guidance Callout */}
            <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs space-y-1">
              <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Attendance Scope Configuration:</span>
              </div>
              <p className="text-blue-800 dark:text-blue-300">
                {role === 'ROLE_BOSS_ADMIN' && 'As Boss Admin, this live session will be visible to Super Admins, Faculty Trainers, and Students.'}
                {role === 'ROLE_SUPER_ADMIN' && 'As Super Admin, this live session will be visible to Faculty Trainers and Students across your institution.'}
                {role === 'ROLE_TRAINER' && 'As Faculty Trainer, this live session will be visible to Enrolled Students.'}
              </p>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSaveSession} className="space-y-4">
              {/* Session Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Graph Algorithms & Dynamic Programming Doubt Clearing"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>

              {/* Platform Selector & Join URL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Platform *
                  </label>
                  <select
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="GOOGLE_MEET">Google Meet</option>
                    <option value="ZOOM">Zoom Video</option>
                    <option value="MS_TEAMS">Microsoft Teams</option>
                    <option value="WEBEX">Cisco Webex</option>
                    <option value="OTHER">Custom Link</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Meeting URL / Join Link *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    value={formData.joinUrl}
                    onChange={(e) => setFormData({ ...formData, joinUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Passcode & Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Meeting Passcode / ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 849204 or Pass@123"
                    value={formData.meetingPasscode}
                    onChange={(e) => setFormData({ ...formData, meetingPasscode: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Audience Scope
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    {role === 'ROLE_BOSS_ADMIN' && (
                      <option value="Super Admins, Trainers & Students">Super Admins, Trainers & Students (All)</option>
                    )}
                    {(role === 'ROLE_BOSS_ADMIN' || role === 'ROLE_SUPER_ADMIN') && (
                      <option value="Trainers & Students">Trainers & Students</option>
                    )}
                    <option value="Enrolled Students">Enrolled Students</option>
                  </select>
                </div>
              </div>

              {/* Subject & Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Subject / Course
                  </label>
                  {courses.length > 0 ? (
                    <select
                      value={formData.courseId}
                      onChange={(e) => {
                        const cId = Number(e.target.value);
                        const found = courses.find(c => c.id === cId);
                        setFormData({
                          ...formData,
                          courseId: cId,
                          subjectName: found ? found.title : formData.subjectName
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                    >
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Computer Science & AI"
                      value={formData.subjectName}
                      onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Duration
                  </label>
                  <select
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes (1 hr)</option>
                    <option value={90}>90 minutes (1.5 hrs)</option>
                    <option value={120}>120 minutes (2 hrs)</option>
                  </select>
                </div>
              </div>

              {/* Description / Agenda */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Session Agenda / Overview (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Outline key topics to be discussed, prerequisites, or preparation instructions for attendees..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
                >
                  {modalLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingSession ? 'Update Session' : 'Publish Live Session'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ATTACH RECORDING MODAL */}
      {recordingModalSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Attach Session Recording
                </h3>
              </div>
              <button
                onClick={() => setRecordingModalSession(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecording} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Video Recording URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/file/... or YouTube link"
                  value={recordingForm.videoUrl}
                  onChange={(e) => setRecordingForm({ ...recordingForm, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Lecture Notes / Highlights
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary of lecture highlights, discussed problems, or references..."
                  value={recordingForm.notes}
                  onChange={(e) => setRecordingForm({ ...recordingForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRecordingModalSession(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  {recordingLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Recording</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WATCH RECORDING MODAL */}
      {watchingSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {watchingSession.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Host: {watchingSession.trainerName || 'Faculty'} | Subject: {watchingSession.subjectName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setWatchingSession(null)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Recorded Stream Link:
                </span>
                <a
                  href={watchingSession.recordingVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <span>Open Video in New Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                {watchingSession.recordingVideoUrl}
              </p>
              {watchingSession.recordingNotes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Lecture Notes & Overview:
                  </h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-line">
                    {watchingSession.recordingNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setWatchingSession(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
