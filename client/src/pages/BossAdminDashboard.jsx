import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { UserProfileModal } from '../components/common/UserProfileModal';
import {
  ShieldAlert, UserCog, Activity, Database, Lock, Server,
  AlertTriangle, CheckCircle2, RefreshCw, KeyRound, Eye, Building2, Users,
  Trash2, CheckCircle, XCircle, Filter, Plus, ShieldCheck, UserPlus, Phone, Mail,
  MapPin, Globe, Calendar, Award, ChevronDown, ChevronRight, Layers, Sparkles,
  BookOpen, GraduationCap, Search, ExternalLink, Target, Clock, X,
  PanelLeftOpen, PanelLeftClose, Edit3, Video, FileText, Ban, Power
} from 'lucide-react';
import { DashboardSidebar } from '../components/common/DashboardSidebar';
import { LiveSessionsTab } from '../components/common/LiveSessionsTab';
import { ChangePasswordModal } from '../components/common/ChangePasswordModal';
import { BossCredentialsModal } from '../components/common/BossCredentialsModal';

export const BossAdminDashboard = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [hierarchyTree, setHierarchyTree] = useState([]);
  const [activeTab, setActiveTab] = useState('hierarchy'); // 'hierarchy' | 'enroll' | 'admins' | 'audit'
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('bridgeai_bossadmin_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('bridgeai_bossadmin_sidebar_open', String(next));
      return next;
    });
  };

  const [treeSearch, setTreeSearch] = useState('');
  const [expandedInstitutions, setExpandedInstitutions] = useState({});
  const [expandedAdmins, setExpandedAdmins] = useState({});

  // Profile modal state
  const [viewingProfileUserId, setViewingProfileUserId] = useState(null);
  const [viewingProfileInitial, setViewingProfileInitial] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showBossCredentialsModal, setShowBossCredentialsModal] = useState(false);

  // Enroll Institution Form State
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  const [enrollSuccess, setEnrollSuccess] = useState(null);
  const [enrollForm, setEnrollForm] = useState({
    name: '',
    code: '',
    category: 'Institute of National Importance',
    accreditation: 'NAAC A++ | NIRF Rank #1',
    campusAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    contactEmail: '',
    contactPhone: '',
    websiteUrl: '',
    establishedYear: 1965,
    maxStrikesAllowed: 3,
    description: '',
    // Initial Super Admin
    superAdminFullName: '',
    superAdminEmail: '',
    superAdminPhone: '',
    superAdminPassword: 'SuperAdmin@2026',
    superAdminDesignation: 'Lead Super Admin',
    // Running Curriculum Subjects
    initialSubjects: [
      {
        title: 'Artificial Intelligence & Machine Learning',
        category: 'Artificial Intelligence',
        description: 'Core AI curriculum including neural networks, deep learning, LLMs, and autonomous agentic workflows.'
      },
      {
        title: 'Cloud & Distributed Systems',
        category: 'Cloud Computing',
        description: 'Enterprise microservices, Kubernetes container orchestration, and cloud infrastructure.'
      },
      {
        title: 'Full Stack Modern Web Engineering',
        category: 'Enterprise Software',
        description: 'High-performance reactive frontend architectures and scalable distributed backend APIs.'
      }
    ]
  });

  const handleAddSubject = () => {
    setEnrollForm(prev => ({
      ...prev,
      initialSubjects: [
        ...(prev.initialSubjects || []),
        { title: '', category: 'Computer Science Core', description: '' }
      ]
    }));
  };

  const handleRemoveSubject = (idx) => {
    setEnrollForm(prev => ({
      ...prev,
      initialSubjects: (prev.initialSubjects || []).filter((_, i) => i !== idx)
    }));
  };

  const handleSubjectChange = (idx, field, value) => {
    setEnrollForm(prev => {
      const updated = [...(prev.initialSubjects || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, initialSubjects: updated };
    });
  };

  // Provision Super Admin Modal (standalone)
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminModalLoading, setAdminModalLoading] = useState(false);
  const [editingInst, setEditingInst] = useState(null);
  const [showEditInstModal, setShowEditInstModal] = useState(false);
  const [editingSuperAdmin, setEditingSuperAdmin] = useState(null);

  // Vigilance Officer Management State
  const [vigilanceOfficers, setVigilanceOfficers] = useState([]);
  const [vigilanceReports, setVigilanceReports] = useState([]);
  const [vigilanceWarnings, setVigilanceWarnings] = useState([]);
  const [vigilanceTerminations, setVigilanceTerminations] = useState([]);
  const [vigilanceActivities, setVigilanceActivities] = useState([]);
  const [vigilanceSubTab, setVigilanceSubTab] = useState('officers'); // 'officers' | 'warnings' | 'terminations' | 'activities'
  const [showAppointOfficerModal, setShowAppointOfficerModal] = useState(false);
  const [appointOfficerLoading, setAppointOfficerLoading] = useState(false);
  const [appointOfficerError, setAppointOfficerError] = useState(null);
  const [appointOfficerSuccess, setAppointOfficerSuccess] = useState(null);
  const [appointOfficerForm, setAppointOfficerForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    staffId: '',
    password: 'Password@123',
    accountStatus: 'ACTIVE'
  });
  const [showResetOfficerPasswordModal, setShowResetOfficerPasswordModal] = useState(false);
  const [selectedOfficerForReset, setSelectedOfficerForReset] = useState(null);
  const [resetOfficerPasswordVal, setResetOfficerPasswordVal] = useState('');
  const [resetOfficerLoading, setResetOfficerLoading] = useState(false);
  const [resetOfficerError, setResetOfficerError] = useState(null);
  const [resetOfficerSuccess, setResetOfficerSuccess] = useState(null);
  const [officerStatusToggleLoading, setOfficerStatusToggleLoading] = useState({});
  const [showEditSuperAdminModal, setShowEditSuperAdminModal] = useState(false);

  // Institution CRUD Handlers
  const handleDeleteInstitution = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete institution "${name}"? This will also remove associated super admins, trainers, and enrolled subjects.`)) return;
    try {
      await api.delete(`/institutions/${id}`);
      setInstitutions(prev => prev.filter(inst => inst.id !== id));
      setHierarchyTree(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      alert('Failed to delete institution: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenEditInstitution = (inst) => {
    setEditingInst({
      id: inst.id,
      name: inst.name || '',
      code: inst.code || '',
      campusAddress: inst.campusAddress || '',
      city: inst.city || '',
      state: inst.state || '',
      postalCode: inst.postalCode || '',
      country: inst.country || 'India',
      contactEmail: inst.contactEmail || '',
      contactPhone: inst.contactPhone || '',
      establishedYear: inst.establishedYear || 2026,
      maxStrikesAllowed: inst.maxStrikesAllowed || 3,
      accreditation: inst.accreditation || ''
    });
    setShowEditInstModal(true);
  };

  const handleSaveEditInstitution = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/institutions/${editingInst.id}`, editingInst);
      setInstitutions(prev => prev.map(inst => inst.id === editingInst.id ? { ...inst, ...res.data } : inst));
      setHierarchyTree(prev => prev.map(h => h.id === editingInst.id ? { ...h, ...res.data } : h));
      setShowEditInstModal(false);
      setEditingInst(null);
    } catch (err) {
      alert('Failed to update institution: ' + (err.response?.data?.message || err.message));
    }
  };

  // Super Admin CRUD Handlers
  const handleOpenEditSuperAdmin = (sa) => {
    setEditingSuperAdmin({
      id: sa.id,
      fullName: sa.fullName || '',
      email: sa.email || '',
      phone: sa.phone || '',
      institutionName: sa.institutionName || '',
      password: ''
    });
    setShowEditSuperAdminModal(true);
  };

  const handleSaveEditSuperAdmin = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: editingSuperAdmin.fullName,
        email: editingSuperAdmin.email,
        phone: editingSuperAdmin.phone,
        institutionName: editingSuperAdmin.institutionName,
        password: editingSuperAdmin.password ? editingSuperAdmin.password : undefined
      };
      const res = await api.put(`/admin/super-admins/${editingSuperAdmin.id}`, payload);
      setSuperAdmins(prev => prev.map(sa => sa.id === editingSuperAdmin.id ? { ...sa, ...res.data } : sa));
      setShowEditSuperAdminModal(false);
      setEditingSuperAdmin(null);
    } catch (err) {
      alert('Failed to update super admin: ' + (err.response?.data?.message || err.message));
    }
  };
  const [adminModalError, setAdminModalError] = useState(null);
  const [adminModalSuccess, setAdminModalSuccess] = useState(null);
  const [adminFormData, setAdminFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'SuperAdmin@2026',
    institutionName: ''
  });

  const [toggleLoading, setToggleLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState({});

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (activeTab === 'vigilance') {
      fetchVigilanceData();
    }
  }, [activeTab]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.allSettled([
        fetchInstitutions(),
        fetchHierarchy(),
        fetchSuperAdmins(),
        fetchAuditLogs(),
        fetchVigilanceData()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const res = await api.get('/institutions');
      setInstitutions(res.data || []);
    } catch (err) {
      console.warn('Institutions fetch error:', err);
    }
  };

  const fetchHierarchy = async () => {
    try {
      const res = await api.get('/institutions/hierarchy');
      const tree = res.data || [];
      setHierarchyTree(tree);
      // Keep all institutions closed initially by default
      setExpandedInstitutions({});
      const expAdm = {};
      tree.forEach(inst => {
        if (inst.superAdmins) {
          inst.superAdmins.forEach(sa => {
            expAdm[sa.id] = true;
          });
        }
      });
      setExpandedAdmins(expAdm);
    } catch (err) {
      console.warn('Hierarchy fetch error:', err);
    }
  };

  // Toggle single institution (accordion: opens that particular institute only)
  const handleToggleInstitution = (instId) => {
    setExpandedInstitutions(prev => {
      const isCurrentlyOpen = !!prev[instId];
      if (isCurrentlyOpen) {
        // If clicking on the open institution, close it
        return {};
      } else {
        // Open ONLY this particular institute
        return { [instId]: true };
      }
    });
  };

  const fetchSuperAdmins = async () => {
    try {
      const res = await api.get('/admin/super-admins');
      if (res.data) {
        setSuperAdmins(res.data.map(u => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          phone: u.phone,
          status: u.active ? 'ACTIVE' : 'SUSPENDED',
          institutionName: u.institutionName || 'Indian Institute of Technology (IIT)',
          role: u.role || 'ROLE_SUPER_ADMIN',
          createdAt: u.createdAt
        })));
      }
    } catch (err) {
      console.warn('Super admins fetch error:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/audit/logs');
      setAuditLogs(res.data || []);
    } catch (err) {
      console.warn('Audit logs notice:', err);
    }
  };

  // Handle Institution Enrollment
  const handleEnrollInstitution = async (e) => {
    e.preventDefault();
    setEnrollError(null);
    setEnrollSuccess(null);
    setEnrollLoading(true);

    try {
      const res = await api.post('/institutions/enroll', enrollForm);
      setEnrollSuccess(`Institution "${res.data.name}" successfully enrolled with location: ${res.data.city}, ${res.data.state}!`);
      fetchAllData();
      setTimeout(() => {
        setEnrollSuccess(null);
        setActiveTab('hierarchy');
      }, 1500);
    } catch (err) {
      setEnrollError(err.response?.data?.message || err.message || 'Failed to enroll institution');
    } finally {
      setEnrollLoading(false);
    }
  };

  // Handle Quick Super Admin Provisioning
  const handleCreateSuperAdmin = async (e) => {
    e.preventDefault();
    setAdminModalError(null);
    setAdminModalSuccess(null);
    setAdminModalLoading(true);

    try {
      const res = await api.post('/admin/super-admins', adminFormData);
      setAdminModalSuccess(`Super Admin "${res.data.fullName}" provisioned for "${adminFormData.institutionName}"!`);
      setTimeout(() => {
        setShowAddAdminModal(false);
        setAdminModalSuccess(null);
        setAdminFormData({
          fullName: '',
          email: '',
          phone: '',
          password: 'SuperAdmin@2026',
          institutionName: ''
        });
      }, 1200);
      fetchAllData();
    } catch (err) {
      setAdminModalError(err.response?.data?.message || err.message || 'Failed to provision Super Admin');
    } finally {
      setAdminModalLoading(false);
    }
  };

  const handleToggleStatus = async (adminId) => {
    try {
      setToggleLoading(prev => ({ ...prev, [adminId]: true }));
      const res = await api.put(`/admin/super-admins/${adminId}/toggle-status`);
      const updated = res.data;
      setSuperAdmins(prev => prev.map(a => a.id === adminId ? {
        ...a,
        status: updated.active ? 'ACTIVE' : 'SUSPENDED'
      } : a));
      fetchAllData();
    } catch (err) {
      alert('Failed to toggle Super Admin status: ' + (err.response?.data?.message || err.message));
    } finally {
      setToggleLoading(prev => ({ ...prev, [adminId]: false }));
    }
  };

  const handleDeleteSuperAdmin = async (adminId, adminName, instName) => {
    if (!window.confirm(`Are you sure you want to remove Super Admin "${adminName}" from institution "${instName}"?`)) {
      return;
    }
    try {
      setDeleteLoading(prev => ({ ...prev, [adminId]: true }));
      await api.delete(`/admin/super-admins/${adminId}`);
      setSuperAdmins(prev => prev.filter(a => a.id !== adminId));
      fetchAllData();
    } catch (err) {
      alert('Failed to delete Super Admin: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleteLoading(prev => ({ ...prev, [adminId]: false }));
    }
  };

  // Vigilance API Fetchers & Handlers
  const fetchVigilanceData = async () => {
    try {
      const [offRes, warnRes, termRes, actRes, repRes] = await Promise.allSettled([
        api.get('/boss/vigilance/officers'),
        api.get('/boss/vigilance/warnings'),
        api.get('/boss/vigilance/terminations'),
        api.get('/boss/vigilance/activity'),
        api.get('/boss/vigilance/reports')
      ]);

      if (offRes.status === 'fulfilled' && offRes.value.data) {
        setVigilanceOfficers(offRes.value.data);
      }
      if (warnRes.status === 'fulfilled' && warnRes.value.data) {
        setVigilanceWarnings(warnRes.value.data);
      }
      if (termRes.status === 'fulfilled' && termRes.value.data) {
        setVigilanceTerminations(termRes.value.data);
      }
      if (actRes.status === 'fulfilled' && actRes.value.data) {
        setVigilanceActivities(actRes.value.data);
      }
      if (repRes.status === 'fulfilled' && repRes.value.data) {
        setVigilanceReports(repRes.value.data);
      }
    } catch (err) {
      console.warn('Vigilance data fetch error:', err);
    }
  };

  const handleAppointOfficer = async (e) => {
    e.preventDefault();
    setAppointOfficerLoading(true);
    setAppointOfficerError(null);
    setAppointOfficerSuccess(null);
    try {
      const res = await api.post('/boss/vigilance/officers', appointOfficerForm);
      setVigilanceOfficers(prev => [res.data, ...prev]);
      setAppointOfficerSuccess(`Vigilance Officer ${res.data.fullName} (${res.data.staffId}) appointed successfully.`);
      setTimeout(() => {
        setShowAppointOfficerModal(false);
        setAppointOfficerSuccess(null);
        setAppointOfficerForm({
          fullName: '',
          email: '',
          mobileNumber: '',
          staffId: '',
          password: 'Password@123',
          accountStatus: 'ACTIVE'
        });
      }, 1500);
      fetchVigilanceData();
    } catch (err) {
      setAppointOfficerError(err.response?.data?.message || err.message || 'Failed to appoint officer');
    } finally {
      setAppointOfficerLoading(false);
    }
  };

  const handleToggleOfficerStatus = async (officerId, currentStatus) => {
    try {
      setOfficerStatusToggleLoading(prev => ({ ...prev, [officerId]: true }));
      const res = await api.put(`/boss/vigilance/officers/${officerId}/status`);
      setVigilanceOfficers(prev => prev.map(o => o.id === officerId ? { ...o, active: res.data.active } : o));
      fetchVigilanceData();
    } catch (err) {
      alert('Failed to toggle officer status: ' + (err.response?.data?.message || err.message));
    } finally {
      setOfficerStatusToggleLoading(prev => ({ ...prev, [officerId]: false }));
    }
  };

  const handleOpenResetOfficerPassword = (officer) => {
    setSelectedOfficerForReset(officer);
    setResetOfficerPasswordVal('Vigilance@2026');
    setResetOfficerError(null);
    setResetOfficerSuccess(null);
    setShowResetOfficerPasswordModal(true);
  };

  const handleSaveResetOfficerPassword = async (e) => {
    e.preventDefault();
    if (!resetOfficerPasswordVal || resetOfficerPasswordVal.length < 6) {
      setResetOfficerError('Password must be at least 6 characters.');
      return;
    }
    setResetOfficerLoading(true);
    setResetOfficerError(null);
    try {
      await api.put(`/boss/vigilance/officers/${selectedOfficerForReset.id}/reset-password`, {
        newPassword: resetOfficerPasswordVal
      });
      setResetOfficerSuccess(`Password for ${selectedOfficerForReset.fullName} has been reset successfully.`);
      setTimeout(() => {
        setShowResetOfficerPasswordModal(false);
        setResetOfficerSuccess(null);
        setSelectedOfficerForReset(null);
      }, 1500);
    } catch (err) {
      setResetOfficerError(err.response?.data?.message || err.message || 'Failed to reset password');
    } finally {
      setResetOfficerLoading(false);
    }
  };

  const openProfileModal = (userId, initialObj = null) => {
    setViewingProfileUserId(userId);
    setViewingProfileInitial(initialObj);
  };

  // Filter hierarchy tree by search term
  const filteredTree = hierarchyTree.filter(inst => {
    if (!treeSearch.trim()) return true;
    const query = treeSearch.toLowerCase();
    const instMatch = inst.name?.toLowerCase().includes(query) ||
                      inst.city?.toLowerCase().includes(query) ||
                      inst.state?.toLowerCase().includes(query) ||
                      inst.code?.toLowerCase().includes(query);
    const saMatch = inst.superAdmins?.some(sa =>
      sa.fullName?.toLowerCase().includes(query) ||
      sa.email?.toLowerCase().includes(query) ||
      sa.trainers?.some(tr => tr.fullName?.toLowerCase().includes(query) || tr.assignedSubject?.toLowerCase().includes(query))
    );
    return instMatch || saMatch;
  });

  const bossAdminEssentials = [
    { id: 'hierarchy', label: 'Institutions & Hierarchy', icon: Layers, count: hierarchyTree.length },
    { id: 'enroll', label: 'Enroll Institution', icon: Building2, badge: 'Onboarding', badgeColor: 'emerald' },
    { id: 'admins', label: 'Super Admins Directory', icon: UserCog, count: superAdmins.length },
    { id: 'vigilance', label: 'Vigilance Officers', icon: ShieldCheck, count: vigilanceOfficers.length, badge: 'Security', badgeColor: 'rose' },
    { id: 'live-sessions', label: 'Live Sessions (Meet/Zoom)', icon: Video },
    { id: 'audit', label: 'Security Audit Trails', icon: Activity, count: auditLogs.length }
  ];

  return (
    <>
      <div className={sidebarOpen ? "flex flex-col lg:flex-row gap-6 items-start" : "space-y-6"}>
      {sidebarOpen && (
        <DashboardSidebar
          isOpen={sidebarOpen}
          onToggle={handleToggleSidebar}
          title="Master Governance"
          user={{ fullName: user?.fullName || 'Boss Admin Master', role: 'ROLE_BOSS_ADMIN' }}
          items={bossAdminEssentials}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          roleTheme="purple"
          statsSummary={{ label: "Institutions", value: `${institutions.length} Enrolled` }}
          onChangePassword={() => setShowChangePasswordModal(true)}
          onManageCredentials={() => setShowBossCredentialsModal(true)}
        />
      )}

      <div className={sidebarOpen ? "w-full lg:flex-1 min-w-0 space-y-6" : "w-full space-y-6"}>
        {/* Mobile Quick Bar to open sidebar drawer if on small screen */}
        <div className="lg:hidden mb-4 flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white shadow-xs hover:bg-purple-700 transition-colors"
          >
            <PanelLeftOpen className="w-4 h-4" />
            <span>Master Governance Menu</span>
          </button>
          <span className="text-xs text-slate-500 font-medium capitalize truncate max-w-[150px]">
            {bossAdminEssentials.find(i => i.id === activeTab)?.label || activeTab}
          </span>
        </div>

        {/* Boss Admin Master Header */}
        <div className="bg-[#0F172A] text-white rounded-2xl p-4 sm:p-6 shadow-md border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-rose-500 shrink-0" />
                <h1 className="text-xl sm:text-2xl font-bold">Boss Admin Master Console</h1>
                <span className="bg-rose-500/20 text-rose-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-rose-500/40">
                  ENTERPRISE GOVERNANCE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Enroll institutions with complete campus location details, inspect the multi-tier organizational tree (Institutions → Super Admins → Faculty Specialists), and review universal profiles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowBossCredentialsModal(true)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors border border-purple-500/40"
                title="Manage Boss Login Email, Name & Password"
              >
                <KeyRound className="w-4 h-4" />
                <span>Manage Email & Credentials</span>
              </button>
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="px-3.5 py-2 bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors border border-amber-500/30"
                title="Change Boss Admin Password"
              >
                <Lock className="w-4 h-4" />
                <span>Change Password</span>
              </button>
              <button
                onClick={() => {
                  setAppointOfficerForm({
                    fullName: '',
                    email: '',
                    mobileNumber: '',
                    staffId: 'VO-' + String(vigilanceOfficers.length + 1).padStart(3, '0'),
                    password: 'Password@123',
                    accountStatus: 'ACTIVE'
                  });
                  setShowAppointOfficerModal(true);
                }}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>+ Appoint Vigilance Officer</span>
              </button>
              <button
                onClick={() => setActiveTab('enroll')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Enroll New Institution</span>
              </button>

              <button
                onClick={() => {
                  setAdminFormData({
                    fullName: '',
                    email: '',
                    phone: '',
                    password: 'SuperAdmin@2026',
                    institutionName: institutions[0]?.name || 'Indian Institute of Technology (IIT)'
                  });
                  setShowAddAdminModal(true);
                }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Provision Super Admin</span>
              </button>

              <button
                onClick={handleToggleSidebar}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors ${
                  sidebarOpen
                    ? 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border-purple-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title={sidebarOpen ? "Switch to Attached Tabs" : "Switch to Full Left Sidebar"}
              >
                {sidebarOpen ? (
                  <>
                    <PanelLeftClose className="w-4 h-4 text-purple-400" />
                    <span>Attached Tabs</span>
                  </>
                ) : (
                  <>
                    <PanelLeftOpen className="w-4 h-4 text-purple-400" />
                    <span>Sidebar View</span>
                  </>
                )}
              </button>

              <button
                onClick={fetchAllData}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Enrolled Institutions"
            value={institutions.length || 3}
            subtitle="Universities & Autonomous Units"
            icon={Building2}
            color="blue"
          />
          <MetricCard
            title="Super Admin Leaders"
            value={superAdmins.length || 3}
            subtitle="Multi-Admin per Institute"
            icon={UserCog}
            color="purple"
          />
          <MetricCard
            title="Active Faculty Specialists"
            value={hierarchyTree.reduce((acc, inst) => acc + (inst.totalTrainers || 0), 0) || 4}
            subtitle="Assigned Subject Trainers"
            icon={GraduationCap}
            color="amber"
          />
          <MetricCard
            title="System Audit Trails"
            value={auditLogs.length}
            subtitle="Immutable Governance Logs"
            icon={Activity}
            color="emerald"
          />
        </div>

        {/* Main Tabs Navigation: ONLY SHOWN IF !sidebarOpen (Keep any one at once: either sidebar or attached tabs) */}
        {!sidebarOpen && (
          <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <button
                onClick={() => setActiveTab('hierarchy')}
                className={`px-4 py-2.5 rounded-t-xl transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'hierarchy'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Institutions & Hierarchy ({hierarchyTree.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('enroll')}
                className={`px-4 py-2.5 rounded-t-xl transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'enroll'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500 border-x border-t border-slate-200 dark:border-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Enroll Institution Dashboard</span>
              </button>

              <button
                onClick={() => setActiveTab('admins')}
                className={`px-4 py-2.5 rounded-t-xl transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'admins'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-500 border-x border-t border-slate-200 dark:border-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <UserCog className="w-4 h-4" />
                <span>Super Admins Directory ({superAdmins.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('vigilance')}
                className={`px-4 py-2.5 rounded-t-xl transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'vigilance'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 border-rose-600 dark:border-rose-500 border-x border-t border-slate-200 dark:border-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Vigilance Officers ({vigilanceOfficers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2.5 rounded-t-xl transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'audit'
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-800 dark:border-slate-400 border-x border-t border-slate-200 dark:border-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Security Audit Trails ({auditLogs.length})</span>
              </button>
            </div>

            <button
              onClick={handleToggleSidebar}
              className="flex items-center gap-2 px-3 py-1.5 mb-1 text-xs font-semibold rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white shadow-2xs transition-all"
              title="Switch to full left sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Switch to Sidebar</span>
            </button>
          </div>
        )}

        {/* TAB: LIVE SESSIONS (GOOGLE MEET, ZOOM, MS TEAMS) */}
        {activeTab === 'live-sessions' && (
          <LiveSessionsTab
            user={user || { fullName: 'Boss Admin Master', role: 'ROLE_BOSS_ADMIN' }}
            role="ROLE_BOSS_ADMIN"
            themeColor="purple"
          />
        )}

        {/* TAB 1: HIERARCHY TREE VIEW */}
      {activeTab === 'hierarchy' && (
        <div className="space-y-4">
          {/* Search and Summary Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={treeSearch}
                onChange={(e) => setTreeSearch(e.target.value)}
                placeholder="Search by Institution, Location, Super Admin, or Faculty Specialist..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="hidden lg:inline">Hierarchy: Institution → Super Admins → Faculty Specialists → Subjects</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setExpandedInstitutions({})}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-transparent dark:border-slate-700"
                >
                  Collapse All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const exp = {};
                    filteredTree.forEach(i => { exp[i.id] = true; });
                    setExpandedInstitutions(exp);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors border border-transparent dark:border-slate-700"
                >
                  Expand All
                </button>
              </div>
            </div>
          </div>

          {/* Tree Nodes */}
          {filteredTree.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No institutions found matching your criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTree.map((inst) => {
                const isInstExpanded = !!expandedInstitutions[inst.id];

                return (
                  <div key={inst.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all">
                    {/* LEVEL 1: INSTITUTION HEADER CARD */}
                    <div className={`p-4 sm:p-5 bg-white dark:bg-slate-900 transition-all ${isInstExpanded ? 'border-b border-slate-200 dark:border-slate-800' : ''}`}>
                      {/* Top Tier: Identity, Status & Action Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div 
                          onClick={() => handleToggleInstitution(inst.id)}
                          className="flex items-center gap-3.5 cursor-pointer select-none group min-w-0 flex-1"
                        >
                          {/* Institution Brand Avatar Badge */}
                          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-md font-bold text-sm tracking-wider border border-slate-700">
                            {inst.code || 'INST'}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                {inst.name}
                              </h3>
                              {inst.code && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                                  {inst.code}
                                </span>
                              )}
                              {inst.accreditation && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                                  <Award className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>{inst.accreditation}</span>
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span>{inst.status || 'ACTIVE'}</span>
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {inst.campusAddress || 'Main Campus'}, {inst.city}, {inst.state} {inst.postalCode ? `(${inst.postalCode})` : ''}
                            </p>
                          </div>
                        </div>

                        {/* Top Tier Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminFormData({
                                fullName: '',
                                email: '',
                                phone: '',
                                password: 'SuperAdmin@2026',
                                institutionName: inst.name
                              });
                              setShowAddAdminModal(true);
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Admin</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditInstitution(inst)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-medium rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            title="Edit Institution Profile & Strike Quota"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span className="hidden md:inline">Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteInstitution(inst.id, inst.name)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 text-xs font-medium rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            title="Delete Institution"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span className="hidden md:inline">Delete</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleInstitution(inst.id)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer ml-1"
                            title={isInstExpanded ? "Collapse Details" : "Expand Details"}
                          >
                            {isInstExpanded ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Bottom Tier: Metrics & Metadata Bar */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                        {/* Contact Meta */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          {inst.contactEmail && (
                            <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{inst.contactEmail}</span>
                            </span>
                          )}
                          {inst.establishedYear && (
                            <span className="text-[11px] text-slate-400">
                              Est. {inst.establishedYear}
                            </span>
                          )}
                        </div>

                        {/* Statistical Metric Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold border border-purple-200/80 dark:border-purple-800/50 flex items-center gap-1.5">
                            <UserCog className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span>{inst.superAdmins?.length || 0} Admins</span>
                          </span>

                          <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold border border-blue-200/80 dark:border-blue-800/50 flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>{inst.totalTrainers || 0} Faculty</span>
                          </span>

                          <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-200/80 dark:border-emerald-800/50 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{inst.subjects?.length || 0} Subjects</span>
                          </span>

                          {/* Mandated Strike Limit Pill */}
                          <span
                            className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-900/80 flex items-center gap-1.5 shadow-2xs"
                            title="Proctoring Strikes Quota mandated by Super Boss Admin"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>Max {inst.maxStrikesAllowed || 3} Strikes</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* LEVEL 2 & 3: SUPER ADMINS AND THEIR FACULTY TRAINERS */}
                    {isInstExpanded && (
                      <div className="p-4 space-y-4 bg-slate-50/50 dark:bg-slate-800/40">
                        {/* RUNNING CURRICULUM SUBJECTS UNDER THIS INSTITUTION */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                                <BookOpen className="w-3.5 h-3.5" />
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                Curriculum Subjects Running Under {inst.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                                {inst.subjects?.length || 0} Subjects
                              </span>
                            </div>
                          </div>

                          {(!inst.subjects || inst.subjects.length === 0) ? (
                            <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-800/50 rounded-lg">
                              No active curriculum subjects configured for this institution yet.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {inst.subjects.map((sub) => (
                                <div
                                  key={sub.id}
                                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-2xs transition-all space-y-2 border-l-4"
                                  style={{ borderLeftColor: sub.badgeColor || '#059669' }}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <h5 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{sub.title}</h5>
                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200 shrink-0">
                                      {sub.category || 'Curriculum'}
                                    </span>
                                  </div>

                                  {sub.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                      {sub.description}
                                    </p>
                                  )}

                                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                                    {sub.assignedTrainers && sub.assignedTrainers.length > 0 ? (
                                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                                        <GraduationCap className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                                        <span>Faculty:</span>
                                        <span className="font-bold">{sub.assignedTrainers.join(', ')}</span>
                                      </span>
                                    ) : (
                                      <span className="text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                        <span>Awaiting Faculty Allocation</span>
                                      </span>
                                    )}

                                    <span className="text-slate-400 dark:text-slate-500 font-mono">
                                      {sub.enrolledCount || 0} Enrolled
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {(!inst.superAdmins || inst.superAdmins.length === 0) ? (
                          <div className="p-4 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400 dark:text-slate-500">
                            No Super Admins provisioned yet for this institution. Click &quot;Add Super Admin&quot; above.
                          </div>
                        ) : (
                          inst.superAdmins.map((sa) => {
                            const isSaExpanded = expandedAdmins[sa.id] !== false;

                            return (
                              <div key={sa.id} className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden">
                                {/* Super Admin Row */}
                                <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => setExpandedAdmins(prev => ({ ...prev, [sa.id]: !isSaExpanded }))}
                                      className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                    >
                                      {isSaExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </button>

                                    <div className="w-8 h-8 rounded-full bg-purple-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                      {sa.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'SA'}
                                    </div>

                                    <div>
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{sa.fullName}</h4>
                                        <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                          Super Admin
                                        </span>
                                        {sa.active ? (
                                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"></span> ACTIVE
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-rose-700 dark:text-rose-400 font-bold">SUSPENDED</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                        <span>{sa.email}</span>
                                        {sa.phone && <span>• {sa.phone}</span>}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                      {sa.trainers?.length || 0} Faculty under this Admin
                                    </span>
                                    <button
                                      onClick={() => openProfileModal(sa.id, sa)}
                                      className="px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                    >
                                      <Eye className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                      <span>View Profile</span>
                                    </button>
                                  </div>
                                </div>

                                {/* LEVEL 3: FACULTY TRAINERS UNDER THIS SUPER ADMIN */}
                                {isSaExpanded && (
                                  <div className="p-3 bg-white dark:bg-slate-900 space-y-2">
                                    {(!sa.trainers || sa.trainers.length === 0) ? (
                                      <div className="p-3 text-center text-[11px] text-slate-400 dark:text-slate-500 italic">
                                        No trainers assigned directly under this Super Admin.
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                        {sa.trainers.map((trainer) => (
                                          <div
                                            key={trainer.id}
                                            className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-2xs transition-all flex flex-col justify-between space-y-2"
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                  {trainer.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TR'}
                                                </div>
                                                <div>
                                                  <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">{trainer.fullName}</span>
                                                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{trainer.email}</span>
                                                </div>
                                              </div>

                                              <button
                                                onClick={() => openProfileModal(trainer.id, trainer)}
                                                className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors"
                                                title="View Full Trainer Profile"
                                              >
                                                <Eye className="w-3.5 h-3.5" />
                                              </button>
                                            </div>

                                            {/* Specialization Badge */}
                                            <div>
                                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-300/90 dark:border-amber-800/60 px-2 py-0.5 rounded-full">
                                                <Target className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                                                <span>Specialization: {trainer.domainSpecialization || trainer.assignedSubject || 'Computer Science & AI'}</span>
                                              </span>
                                            </div>

                                            {/* Courses List */}
                                            {trainer.courses && trainer.courses.length > 0 && (
                                              <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1">
                                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Subjects:</span>
                                                {trainer.courses.map((c, i) => (
                                                  <span key={i} className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                                    <BookOpen className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                                                    <span>{c.title}</span>
                                                  </span>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ENROLL INSTITUTION DASHBOARD */}
      {activeTab === 'enroll' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Enroll New Educational Institution</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Register an autonomous university, institute, or engineering college with full campus location details, accreditation credentials, and provision its initial Lead Super Admin.
            </p>
          </div>

          {enrollError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 font-medium flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <span>{enrollError}</span>
            </div>
          )}

          {enrollSuccess && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{enrollSuccess}</span>
            </div>
          )}

          <form onSubmit={handleEnrollInstitution} className="space-y-6">
            {/* SECTION 1: INSTITUTIONAL CORE IDENTITY */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-mono">1</span>
                <span>Institution Core Identity & Affiliation</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institution Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={enrollForm.name}
                    onChange={(e) => setEnrollForm({ ...enrollForm, name: e.target.value })}
                    placeholder="e.g. Vellore Institute of Technology (VIT)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Code / Acronym
                  </label>
                  <input
                    type="text"
                    value={enrollForm.code}
                    onChange={(e) => setEnrollForm({ ...enrollForm, code: e.target.value })}
                    placeholder="e.g. VIT-V"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institution Category
                  </label>
                  <select
                    value={enrollForm.category}
                    onChange={(e) => setEnrollForm({ ...enrollForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Institute of National Importance">Institute of National Importance</option>
                    <option value="Central University">Central University</option>
                    <option value="State University">State University</option>
                    <option value="Autonomous Engineering College">Autonomous Engineering College</option>
                    <option value="Deemed University / Institute of Eminence">Deemed University / Institute of Eminence</option>
                    <option value="Private University">Private University</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Accreditation & NIRF Ranking
                  </label>
                  <input
                    type="text"
                    value={enrollForm.accreditation}
                    onChange={(e) => setEnrollForm({ ...enrollForm, accreditation: e.target.value })}
                    placeholder="e.g. NAAC A++ | NIRF Rank #8"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Established Year
                  </label>
                  <input
                    type="number"
                    value={enrollForm.establishedYear}
                    onChange={(e) => setEnrollForm({ ...enrollForm, establishedYear: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-rose-700 dark:text-rose-400 mb-1 flex items-center justify-between">
                    <span>Max Allowed Strikes (Boss Admin Mandate) *</span>
                    <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">Auto-terminates at limit</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={enrollForm.maxStrikesAllowed}
                    onChange={(e) => setEnrollForm({ ...enrollForm, maxStrikesAllowed: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-3 py-2 text-xs border-2 border-rose-300 dark:border-rose-800 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none font-bold text-rose-900 dark:text-rose-200 bg-rose-50/50 dark:bg-rose-950/30"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: CAMPUS LOCATION DETAILS */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-mono">2</span>
                <span>Complete Campus Location & Address Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campus Street / Zone Address <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={enrollForm.campusAddress}
                    onChange={(e) => setEnrollForm({ ...enrollForm, campusAddress: e.target.value })}
                    placeholder="e.g. Katpadi, Thiruvalam Road, Outer Campus"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    City <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={enrollForm.city}
                    onChange={(e) => setEnrollForm({ ...enrollForm, city: e.target.value })}
                    placeholder="e.g. Vellore"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    State / Province <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={enrollForm.state}
                    onChange={(e) => setEnrollForm({ ...enrollForm, state: e.target.value })}
                    placeholder="e.g. Tamil Nadu"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    PIN / Postal Code
                  </label>
                  <input
                    type="text"
                    value={enrollForm.postalCode}
                    onChange={(e) => setEnrollForm({ ...enrollForm, postalCode: e.target.value })}
                    placeholder="e.g. 632014"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: OFFICIAL CONTACT & WEB */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-mono">3</span>
                <span>Administrative Contact & Website</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Central Email
                  </label>
                  <input
                    type="email"
                    value={enrollForm.contactEmail}
                    onChange={(e) => setEnrollForm({ ...enrollForm, contactEmail: e.target.value })}
                    placeholder="registrar@vit.ac.in"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campus Telephone
                  </label>
                  <input
                    type="text"
                    value={enrollForm.contactPhone}
                    onChange={(e) => setEnrollForm({ ...enrollForm, contactPhone: e.target.value })}
                    placeholder="+91-416-224-3091"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Portal / Website URL
                  </label>
                  <input
                    type="url"
                    value={enrollForm.websiteUrl}
                    onChange={(e) => setEnrollForm({ ...enrollForm, websiteUrl: e.target.value })}
                    placeholder="https://vit.ac.in"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: INITIAL LEAD SUPER ADMIN PROVISIONING */}
            <div className="space-y-3 p-4 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl">
              <h3 className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-mono">4</span>
                <span>Initial Lead Super Admin Provisioning (Instant Onboarding)</span>
              </h3>
              <p className="text-[11px] text-purple-800 dark:text-purple-300/80">
                You can assign the first Super Admin right now. Additional Super Admins can be added subsequently.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Super Admin Full Name
                  </label>
                  <input
                    type="text"
                    value={enrollForm.superAdminFullName}
                    onChange={(e) => setEnrollForm({ ...enrollForm, superAdminFullName: e.target.value })}
                    placeholder="e.g. Dr. K. Viswanathan"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Super Admin Official Email
                  </label>
                  <input
                    type="email"
                    value={enrollForm.superAdminEmail}
                    onChange={(e) => setEnrollForm({ ...enrollForm, superAdminEmail: e.target.value })}
                    placeholder="superadmin@vit.ac.in"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Access Password
                  </label>
                  <input
                    type="text"
                    value={enrollForm.superAdminPassword}
                    onChange={(e) => setEnrollForm({ ...enrollForm, superAdminPassword: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: CURRICULUM SUBJECTS RUNNING UNDER THIS INSTITUTION */}
            <div className="space-y-4 p-4 bg-blue-50/40 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200/80 dark:border-blue-800/60 pb-2.5">
                <div>
                  <h3 className="text-xs font-bold text-blue-950 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-mono">5</span>
                    <span>Curriculum Subjects Running Under This Institution</span>
                  </h3>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300/80 mt-0.5">
                    Specify the subjects and courses running under this institution upon enrollment. Each subject will be created with its initial syllabus module, and faculty specialists can be allocated subsequently.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-white dark:bg-slate-800 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg text-xs font-bold shadow-2xs whitespace-nowrap">
                    {enrollForm.initialSubjects?.length || 0} Subjects
                  </span>
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Subject Cards */}
              <div className="space-y-3">
                {enrollForm.initialSubjects?.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-white dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 rounded-xl shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Subject #{idx + 1}</span>
                      </span>
                      {enrollForm.initialSubjects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(idx)}
                          className="text-xs text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 flex items-center gap-1 p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded transition-colors"
                          title="Remove subject"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Subject Title <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={sub.title}
                          onChange={(e) => handleSubjectChange(idx, 'title', e.target.value)}
                          placeholder="e.g. Cyber Security & Cryptography"
                          className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Category / Specialization Domain
                        </label>
                        <select
                          value={sub.category}
                          onChange={(e) => handleSubjectChange(idx, 'category', e.target.value)}
                          className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                          <option value="Artificial Intelligence">Artificial Intelligence</option>
                          <option value="Computer Science Core">Computer Science Core</option>
                          <option value="Enterprise Software">Enterprise Software</option>
                          <option value="Cloud Computing">Cloud Computing</option>
                          <option value="Cyber Security">Cyber Security</option>
                          <option value="Data Science & Big Data">Data Science & Big Data</option>
                          <option value="Internet of Things (IoT)">Internet of Things (IoT)</option>
                          <option value="Robotics & Automation">Robotics & Automation</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Curriculum Syllabus Brief / Overview
                      </label>
                      <input
                        type="text"
                        value={sub.description}
                        onChange={(e) => handleSubjectChange(idx, 'description', e.target.value)}
                        placeholder="e.g. Core principles, practical laboratory projects, and industry benchmark assessments."
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Action Bar */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveTab('hierarchy')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={enrollLoading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {enrollLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                <span>Complete Institution Enrollment</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: SUPER ADMINS DIRECTORY TABLE */}
      {activeTab === 'admins' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Institutional Super Admins Master Directory</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Governance: Multiple Super Admins can be provisioned per institution as per requirements.
              </p>
            </div>
            <button
              onClick={() => {
                setAdminFormData({
                  fullName: '',
                  email: '',
                  phone: '',
                  password: 'SuperAdmin@2026',
                  institutionName: institutions[0]?.name || 'Indian Institute of Technology (IIT)'
                });
                setShowAddAdminModal(true);
              }}
              className="px-3.5 py-1.5 bg-[#0F172A] hover:bg-slate-800 dark:bg-purple-600 dark:hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Provision Super Admin</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 font-semibold">
                  <th className="p-3">Super Admin</th>
                  <th className="p-3">Assigned Institution</th>
                  <th className="p-3">Official Email</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {superAdmins.map((sa) => (
                  <tr key={sa.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {sa.fullName?.charAt(0) || 'S'}
                      </div>
                      <span>{sa.fullName}</span>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-semibold">{sa.institutionName}</td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{sa.email}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-300">{sa.phone || 'N/A'}</td>
                    <td className="p-3">
                      {sa.status === 'ACTIVE' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          SUSPENDED
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openProfileModal(sa.id, sa)}
                          className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => handleToggleStatus(sa.id)}
                          disabled={toggleLoading[sa.id]}
                          className="px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium"
                        >
                          {sa.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleOpenEditSuperAdmin(sa)}
                          className="px-2.5 py-1 text-xs border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg font-medium inline-flex items-center gap-1"
                          title="Edit Super Admin"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSuperAdmin(sa.id, sa.fullName, sa.institutionName)}
                          disabled={deleteLoading[sa.id]}
                          className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                          title="Delete Super Admin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: VIGILANCE OFFICERS MANAGEMENT */}
      {activeTab === 'vigilance' && (
        <div className="space-y-5">
          {/* Vigilance Summary Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Vigilance Officers Management</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Appoint, monitor, and regulate academic vigilance officers. Deactivate credentials instantly or reset passwords.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setAppointOfficerForm({
                  fullName: '',
                  email: '',
                  mobileNumber: '',
                  staffId: 'VO-' + String(vigilanceOfficers.length + 1).padStart(3, '0'),
                  password: 'Password@123',
                  accountStatus: 'ACTIVE'
                });
                setShowAppointOfficerModal(true);
              }}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Appoint Vigilance Officer</span>
            </button>
          </div>

          {/* Sub Navigation Strip */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            {[
              { id: 'officers', label: 'Appointed Officers', count: vigilanceOfficers.length, icon: Users },
              { id: 'warnings', label: 'Warnings Issued', count: vigilanceWarnings.length, icon: AlertTriangle },
              { id: 'terminations', label: 'Exam Terminations', count: vigilanceTerminations.length, icon: Ban },
              { id: 'activities', label: 'Officer Audit Trail', count: vigilanceActivities.length, icon: Activity }
            ].map(tab => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setVigilanceSubTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors ${
                    vigilanceSubTab === tab.id
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SUB-VIEW 1: OFFICERS DIRECTORY */}
          {vigilanceSubTab === 'officers' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Vigilance Officer Roster</h3>
                  <p className="text-xs text-slate-500">Each officer logs in via Unified Staff Login using Staff ID or Email.</p>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  Total Officers: {vigilanceOfficers.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                      <th className="p-3">Staff ID</th>
                      <th className="p-3">Officer Name</th>
                      <th className="p-3">Official Email</th>
                      <th className="p-3">Mobile Phone</th>
                      <th className="p-3">Assigned Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Governance Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {vigilanceOfficers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No Vigilance Officers appointed yet. Click "+ Appoint Vigilance Officer" above to create one.
                        </td>
                      </tr>
                    ) : (
                      vigilanceOfficers.map(officer => {
                        const isToggleLoading = officerStatusToggleLoading[officer.id];
                        return (
                          <tr key={officer.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                {officer.staffId || 'VO-000'}
                              </span>
                            </td>
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">
                              {officer.fullName}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">
                              {officer.email}
                            </td>
                            <td className="p-3 text-slate-600 dark:text-slate-400">
                              {officer.phone || officer.mobileNumber || '+91-9876500000'}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                                VIGILANCE_OFFICER
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                officer.active
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${officer.active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                {officer.active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleOfficerStatus(officer.id, officer.active)}
                                  disabled={isToggleLoading}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                                    officer.active
                                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                                  }`}
                                  title={officer.active ? 'Deactivate this account immediately' : 'Reactivate this account'}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  <span>{isToggleLoading ? 'Updating...' : officer.active ? 'Deactivate' : 'Activate'}</span>
                                </button>

                                <button
                                  onClick={() => handleOpenResetOfficerPassword(officer)}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors"
                                  title="Reset password for this officer"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Reset Password</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: REVIEW WARNINGS ISSUED */}
          {vigilanceSubTab === 'warnings' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Review Warnings Issued by Officers</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Live & archived warnings issued to exam candidates by vigilance staff.</p>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800/60">
                  Total Warnings: {vigilanceWarnings.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Vigilance Officer</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Attempt Ref</th>
                      <th className="p-3">Warning Reason</th>
                      <th className="p-3">Action Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {vigilanceWarnings.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                          No warnings recorded yet.
                        </td>
                      </tr>
                    ) : (
                      vigilanceWarnings.map(record => (
                        <tr key={record.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                            {new Date(record.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            {record.officerName || record.officerEmail || 'Rahul Sharma (VO-001)'}
                          </td>
                          <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">
                            {record.studentName || 'Student ID: ' + record.studentId}
                          </td>
                          <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                            #{record.attemptId}
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs">
                            {record.reason}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              WARNING_ISSUED
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 3: REVIEW STUDENT EXAM TERMINATION RECORDS */}
          {vigilanceSubTab === 'terminations' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Student Exam Termination Records</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Terminated examination sessions due to severe malpractice or multiple violations.</p>
                </div>
                <span className="text-xs font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 font-bold">
                  Total Terminations: {vigilanceTerminations.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                      <th className="p-3">Date & Time</th>
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Exam Paper</th>
                      <th className="p-3">Terminating Officer</th>
                      <th className="p-3">Termination Reason</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {vigilanceTerminations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                          No student exam terminations recorded.
                        </td>
                      </tr>
                    ) : (
                      vigilanceTerminations.map((term, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                            {term.terminatedAt ? new Date(term.terminatedAt).toLocaleString() : 'Recent'}
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-900 dark:text-white">{term.studentName || 'Student'}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{term.studentEmail}</div>
                          </td>
                          <td className="p-3 text-slate-800 dark:text-slate-200">
                            {term.examTitle || 'Midterm Assessment'}
                          </td>
                          <td className="p-3 font-medium text-slate-700 dark:text-slate-300">
                            {term.officerName || 'Rahul Sharma (VO-001)'}
                          </td>
                          <td className="p-3 text-rose-700 dark:text-rose-400 max-w-xs font-medium">
                            {term.reason || 'Multiple unauthorized tab switches and browser extensions detected.'}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                              TERMINATED
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW 4: OFFICER AUDIT TRAILS */}
          {vigilanceSubTab === 'activities' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Vigilance Officer Activity Log</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Actions taken specifically by accounts with ROLE_VIGILANCE_OFFICER.</p>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  Total Logged Events: {vigilanceActivities.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 font-semibold">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Officer Email</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Action Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {vigilanceActivities.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400 font-sans">
                          No officer activities logged yet.
                        </td>
                      </tr>
                    ) : (
                      vigilanceActivities.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-3 text-slate-500 dark:text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-3 text-slate-900 dark:text-white font-medium">{log.performedByEmail}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-sans">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300 max-w-md font-sans">{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Security & Operational Audit Trails</h3>
            <span className="text-xs text-slate-500 font-mono">Immutable Log Ledger</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 font-semibold">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-slate-500 dark:text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-slate-900 dark:text-white font-medium">{log.performedByEmail}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-sans">
                        {log.performedByRole}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-sans ${
                        log.action.includes('ENROLLED') || log.action.includes('CREATED')
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                          : log.action.includes('DELETED') || log.action.includes('VIOLATION')
                          ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                          : 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 max-w-md truncate">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </div>
      </div>

      {/* QUICK PROVISION SUPER ADMIN MODAL */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  <span>Provision Super Admin</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Boss Admin Privilege</p>
              </div>
              <button
                onClick={() => setShowAddAdminModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSuperAdmin} className="p-5 space-y-3.5">
              {adminModalError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 font-medium flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{adminModalError}</span>
                </div>
              )}

              {adminModalSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{adminModalSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Institution <span className="text-rose-600">*</span>
                </label>
                <select
                  value={adminFormData.institutionName}
                  onChange={(e) => setAdminFormData({ ...adminFormData, institutionName: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">-- Select Institution --</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.name}>
                      {inst.name} ({inst.city}, {inst.state})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Super Admin Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminFormData.fullName}
                  onChange={(e) => setAdminFormData({ ...adminFormData, fullName: e.target.value })}
                  placeholder="e.g. Dr. Sunita Rao"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  placeholder="sunita.superadmin@bridgeai.edu"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="text"
                    value={adminFormData.phone}
                    onChange={(e) => setAdminFormData({ ...adminFormData, phone: e.target.value })}
                    placeholder="+91-9876500099"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="text"
                    value={adminFormData.password}
                    onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminModalLoading}
                  className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  {adminModalLoading ? 'Provisioning...' : 'Provision Super Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPOINT VIGILANCE OFFICER */}
      {showAppointOfficerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-rose-500" />
                  <span>Appoint Vigilance Officer</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Boss Admin Exclusive Authority</p>
              </div>
              <button
                onClick={() => setShowAppointOfficerModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAppointOfficer} className="p-5 space-y-3.5">
              {appointOfficerError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 font-medium flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{appointOfficerError}</span>
                </div>
              )}

              {appointOfficerSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{appointOfficerSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Staff / User ID <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={appointOfficerForm.staffId}
                    onChange={(e) => setAppointOfficerForm({ ...appointOfficerForm, staffId: e.target.value })}
                    placeholder="e.g. VO-001"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Account Status <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={appointOfficerForm.accountStatus}
                    onChange={(e) => setAppointOfficerForm({ ...appointOfficerForm, accountStatus: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                  >
                    <option value="ACTIVE">ACTIVE (Can Login)</option>
                    <option value="INACTIVE">INACTIVE (Revoked Access)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={appointOfficerForm.fullName}
                  onChange={(e) => setAppointOfficerForm({ ...appointOfficerForm, fullName: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={appointOfficerForm.email}
                  onChange={(e) => setAppointOfficerForm({ ...appointOfficerForm, email: e.target.value })}
                  placeholder="e.g. rahul.sharma@bridgeai.edu"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={appointOfficerForm.mobileNumber}
                    onChange={(e) => setAppointOfficerForm({ ...appointOfficerForm, mobileNumber: e.target.value })}
                    placeholder="+91-9876543210"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Temporary Password <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={appointOfficerForm.password}
                    onChange={(e) => setAppointOfficerForm({ ...appointOfficerForm, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                <strong>Assigned Role:</strong> ROLE = <span className="font-mono font-bold">VIGILANCE_OFFICER</span>. Officers log in using the Staff Login tab with either their Official Email or Staff ID.
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAppointOfficerModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={appointOfficerLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  {appointOfficerLoading ? 'Appointing...' : 'Appoint Vigilance Officer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET OFFICER PASSWORD */}
      {showResetOfficerPasswordModal && selectedOfficerForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-blue-400" />
                  <span>Reset Officer Password</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{selectedOfficerForReset.fullName} ({selectedOfficerForReset.staffId})</p>
              </div>
              <button
                onClick={() => setShowResetOfficerPasswordModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResetOfficerPassword} className="p-5 space-y-3.5">
              {resetOfficerError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 font-medium flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{resetOfficerError}</span>
                </div>
              )}

              {resetOfficerSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{resetOfficerSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={resetOfficerPasswordVal}
                  onChange={(e) => setResetOfficerPasswordVal(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowResetOfficerPasswordModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetOfficerLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  {resetOfficerLoading ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Institution */}
      {showEditInstModal && editingInst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto text-slate-900 dark:text-white">
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  Edit Institution Details
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Update autonomous institution registration records</p>
              </div>
              <button onClick={() => setShowEditInstModal(false)} className="text-slate-400 hover:text-white p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditInstitution} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Institution Name</label>
                  <input
                    type="text"
                    required
                    value={editingInst.name}
                    onChange={(e) => setEditingInst({ ...editingInst, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Code / Abbr</label>
                  <input
                    type="text"
                    required
                    value={editingInst.code}
                    onChange={(e) => setEditingInst({ ...editingInst, code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Campus Address</label>
                <input
                  type="text"
                  value={editingInst.campusAddress}
                  onChange={(e) => setEditingInst({ ...editingInst, campusAddress: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">City</label>
                  <input
                    type="text"
                    value={editingInst.city}
                    onChange={(e) => setEditingInst({ ...editingInst, city: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">State</label>
                  <input
                    type="text"
                    value={editingInst.state}
                    onChange={(e) => setEditingInst({ ...editingInst, state: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Postal Code</label>
                  <input
                    type="text"
                    value={editingInst.postalCode}
                    onChange={(e) => setEditingInst({ ...editingInst, postalCode: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Official Contact Email</label>
                  <input
                    type="email"
                    value={editingInst.contactEmail}
                    onChange={(e) => setEditingInst({ ...editingInst, contactEmail: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contact Phone</label>
                  <input
                    type="tel"
                    value={editingInst.contactPhone}
                    onChange={(e) => setEditingInst({ ...editingInst, contactPhone: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Accreditation (NAAC / NIRF)</label>
                  <input
                    type="text"
                    value={editingInst.accreditation}
                    onChange={(e) => setEditingInst({ ...editingInst, accreditation: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. NAAC A++ | NIRF #1"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Established Year</label>
                  <input
                    type="number"
                    value={editingInst.establishedYear}
                    onChange={(e) => setEditingInst({ ...editingInst, establishedYear: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="p-3 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl space-y-1">
                <label className="block font-bold text-rose-900 dark:text-rose-300 flex items-center justify-between">
                  <span>Institutional Max Allowed Strikes (Boss Admin Quota)</span>
                  <span className="text-[10px] font-normal text-rose-700 dark:text-rose-400">Enforced on all exams under this institution</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={editingInst.maxStrikesAllowed || 3}
                    onChange={(e) => setEditingInst({ ...editingInst, maxStrikesAllowed: Math.max(1, Number(e.target.value)) })}
                    className="w-24 p-2 border-2 border-rose-300 dark:border-rose-800 rounded-lg bg-white dark:bg-slate-900 text-rose-900 dark:text-rose-200 font-bold text-center text-sm"
                  />
                  <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-tight">
                    Candidate assessments are automatically locked &amp; terminated when violations reach this count. Only Super Boss Admin can set or change this quota.
                  </p>
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditInstModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Super Admin */}
      {showEditSuperAdminModal && editingSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden text-slate-900 dark:text-white">
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-purple-400" />
                  Edit Super Admin Record
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{editingSuperAdmin.institutionName}</p>
              </div>
              <button onClick={() => setShowEditSuperAdminModal(false)} className="text-slate-400 hover:text-white p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditSuperAdmin} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingSuperAdmin.fullName}
                  onChange={(e) => setEditingSuperAdmin({ ...editingSuperAdmin, fullName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Official Email</label>
                <input
                  type="email"
                  required
                  value={editingSuperAdmin.email}
                  onChange={(e) => setEditingSuperAdmin({ ...editingSuperAdmin, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contact Phone</label>
                <input
                  type="tel"
                  value={editingSuperAdmin.phone}
                  onChange={(e) => setEditingSuperAdmin({ ...editingSuperAdmin, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Associated Institution</label>
                <input
                  type="text"
                  disabled
                  value={editingSuperAdmin.institutionName}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editingSuperAdmin.password}
                  onChange={(e) => setEditingSuperAdmin({ ...editingSuperAdmin, password: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="Leave empty to maintain current password"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditSuperAdminModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNIVERSAL USER PROFILE MODAL */}
      {viewingProfileUserId && (
        <UserProfileModal
          userId={viewingProfileUserId}
          initialData={viewingProfileInitial}
          onClose={() => {
            setViewingProfileUserId(null);
            setViewingProfileInitial(null);
          }}
        />
      )}

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userRole="ROLE_BOSS_ADMIN"
        userEmail={user?.email || 'bossadmin@bridgeai.edu'}
      />

      {/* BOSS CREDENTIALS & EMAIL MANAGEMENT MODAL */}
      <BossCredentialsModal
        isOpen={showBossCredentialsModal}
        onClose={() => setShowBossCredentialsModal(false)}
      />
    </>
  );
};
