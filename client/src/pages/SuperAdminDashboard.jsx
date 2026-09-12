import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Users, BookOpen, Trash2, ShieldCheck, FileBarChart, Plus, CheckCircle,
  Mail, Phone, Building2, GraduationCap, RefreshCw, AlertCircle,
  SlidersHorizontal, CheckSquare, Square, Layers, Edit3, ArrowRight,
  Award, Sparkles, CheckCircle2, UserCheck, MapPin, Globe, Eye,
  Zap, Target, Check, X, PanelLeftOpen, PanelLeftClose, Video, KeyRound
} from 'lucide-react';
import { UserProfileModal } from '../components/common/UserProfileModal';
import { DashboardSidebar } from '../components/common/DashboardSidebar';
import { LiveSessionsTab } from '../components/common/LiveSessionsTab';
import { ChangePasswordModal } from '../components/common/ChangePasswordModal';

export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseTrainersMap, setCourseTrainersMap] = useState({}); // courseId -> list of CourseTrainer
  const [coSuperAdmins, setCoSuperAdmins] = useState([]);
  const [institutionInfo, setInstitutionInfo] = useState(null);
  const [viewingProfileUserId, setViewingProfileUserId] = useState(null);
  const [viewingProfileInitial, setViewingProfileInitial] = useState(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [activeTab, setActiveTab] = useState('trainers'); // 'trainers' | 'matrix' | 'students'
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('bridgeai_superadmin_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('bridgeai_superadmin_sidebar_open', String(next));
      return next;
    });
  };

  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [showEditTrainerModal, setShowEditTrainerModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);

  // Trainer CRUD Handlers
  const handleOpenEditTrainer = (trainer) => {
    setEditingTrainer({
      id: trainer.id,
      fullName: trainer.fullName || '',
      email: trainer.email || '',
      phone: trainer.phone || '',
      assignedSubject: trainer.assignedSubject || '',
      password: ''
    });
    setShowEditTrainerModal(true);
  };

  const handleSaveEditTrainer = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: editingTrainer.fullName,
        email: editingTrainer.email,
        phone: editingTrainer.phone,
        assignedSubject: editingTrainer.assignedSubject,
        password: editingTrainer.password ? editingTrainer.password : undefined
      };
      const res = await api.put(`/admin/trainers/${editingTrainer.id}`, payload);
      setTrainers(prev => prev.map(t => t.id === editingTrainer.id ? { ...t, ...res.data } : t));
      setShowEditTrainerModal(false);
      setEditingTrainer(null);
    } catch (err) {
      alert('Failed to update trainer: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteTrainer = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove trainer "${name}"?`)) return;
    try {
      await api.delete(`/admin/trainers/${id}`);
      setTrainers(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('Failed to delete trainer: ' + (err.response?.data?.message || err.message));
    }
  };

  // Student CRUD Handlers
  const handleOpenEditStudent = (student) => {
    setEditingStudent({
      id: student.id,
      fullName: student.fullName || '',
      email: student.email || '',
      phone: student.phone || '',
      password: ''
    });
    setShowEditStudentModal(true);
  };

  const handleSaveEditStudent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        fullName: editingStudent.fullName,
        email: editingStudent.email,
        phone: editingStudent.phone,
        password: editingStudent.password ? editingStudent.password : undefined
      };
      const res = await api.put(`/admin/students/${editingStudent.id}`, payload);
      setStudents(prev => prev.map(s => s.id === editingStudent.id ? { ...s, ...res.data } : s));
      setShowEditStudentModal(false);
      setEditingStudent(null);
    } catch (err) {
      alert('Failed to update student: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteStudent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove student "${name}"?`)) return;
    try {
      await api.delete(`/admin/students/${id}`);
      setStudents(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Failed to delete student: ' + (err.response?.data?.message || err.message));
    }
  };
  const [addError, setAddError] = useState(null);
  const [addSuccess, setAddSuccess] = useState(null);

  // Matrix State
  const [matrixPerspective, setMatrixPerspective] = useState('subject'); // 'subject' | 'trainer'
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState(null);
  const [selectedTrainerIds, setSelectedTrainerIds] = useState([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [matrixSaving, setMatrixSaving] = useState(false);
  const [matrixSuccess, setMatrixSuccess] = useState(null);
  const [matrixError, setMatrixError] = useState(null);

  const [trainerForm, setTrainerForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: 'Trainer@2026',
    assignedSubject: 'Computer Science & AI'
  });

  const myInstitute = user?.institutionName || 'Indian Institute of Technology (IIT)';

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const fetchSuperAdminData = async () => {
    try {
      setLoading(true);
      const [coursesRes, trainersRes, studentsRes] = await Promise.allSettled([
        api.get('/courses'),
        api.get(`/admin/trainers?institutionName=${encodeURIComponent(myInstitute)}`),
        api.get(`/admin/students?institutionName=${encodeURIComponent(myInstitute)}`)
      ]);

      let cList = [];
      if (coursesRes.status === 'fulfilled') {
        cList = coursesRes.value.data || [];
        setCourses(cList);
      }

      let tList = [];
      if (trainersRes.status === 'fulfilled' && trainersRes.value.data) {
        tList = trainersRes.value.data;
        setTrainers(tList);
      }

      if (studentsRes.status === 'fulfilled' && studentsRes.value.data) {
        setStudents(studentsRes.value.data);
      }

      // Fetch co-super admins for this institution
      try {
        const saRes = await api.get(`/admin/super-admins?institutionName=${encodeURIComponent(myInstitute)}`);
        if (saRes.data) setCoSuperAdmins(saRes.data);
      } catch (e) {}

      // Fetch complete institution details (location, campus, accreditation)
      try {
        const instRes = await api.get('/institutions');
        if (instRes.data && instRes.data.length > 0) {
          const match = instRes.data.find(i =>
            i.name?.toLowerCase().includes(myInstitute.toLowerCase()) ||
            myInstitute.toLowerCase().includes(i.name?.toLowerCase())
          );
          if (match) setInstitutionInfo(match);
        }
      } catch (e) {}

      // Fetch trainer mappings with specialization for each course
      const ctMap = {};
      await Promise.all(cList.map(async (c) => {
        try {
          const res = await api.get(`/courses/${c.id}/trainers`);
          ctMap[c.id] = res.data || [];
        } catch (e) {
          ctMap[c.id] = [];
        }
      }));
      setCourseTrainersMap(ctMap);

      if (cList.length > 0 && !selectedCourseId) {
        const firstCId = cList[0].id;
        setSelectedCourseId(firstCId);
        syncSelectedTrainersForCourse(firstCId, ctMap, cList, tList);
      }

      if (tList.length > 0 && !selectedTrainerId) {
        const firstTId = tList[0].id;
        setSelectedTrainerId(firstTId);
        syncSelectedCoursesForTrainer(firstTId, ctMap, cList);
      }
    } catch (err) {
      console.warn('Super Admin load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: Get all assigned trainers for a subject (including primary)
  const getCourseAssignedTrainers = (cId) => {
    const list = [];
    const courseObj = courses.find(c => c.id === cId);
    const assignedFromMap = courseTrainersMap[cId] || [];

    for (const ct of assignedFromMap) {
      const trUser = trainers.find(t => t.id === ct.trainerId);
      list.push({
        id: ct.trainerId,
        fullName: ct.trainerName || trUser?.fullName || 'Faculty Member',
        email: ct.trainerEmail || trUser?.email || '',
        specialization: ct.trainerSpecialization || trUser?.assignedSubject || 'Subject Specialist',
        isPrimary: courseObj?.trainerId === ct.trainerId
      });
    }

    if (courseObj && courseObj.trainerId && !list.some(t => t.id === courseObj.trainerId)) {
      const primaryUser = trainers.find(t => t.id === courseObj.trainerId);
      list.unshift({
        id: courseObj.trainerId,
        fullName: courseObj.trainerName || primaryUser?.fullName || 'Primary Faculty Lead',
        email: primaryUser?.email || '',
        specialization: primaryUser?.assignedSubject || courseObj.category || 'Subject Specialist',
        isPrimary: true
      });
    }

    return list;
  };

  // Helper: Get all assigned subjects for a trainer
  const getTrainerAssignedCourses = (tId) => {
    const list = [];
    for (const c of courses) {
      if (c.trainerId === tId) {
        list.push(c);
        continue;
      }
      const tList = courseTrainersMap[c.id] || [];
      if (tList.some(item => item.trainerId === tId)) {
        list.push(c);
      }
    }
    return list;
  };

  const syncSelectedTrainersForCourse = (cId, currentMap, cList, tList) => {
    const assignedList = currentMap[cId] || [];
    const ids = assignedList.map(item => item.trainerId);
    const courseObj = (cList || courses).find(c => c.id === cId);
    if (courseObj && courseObj.trainerId && !ids.includes(courseObj.trainerId)) {
      ids.push(courseObj.trainerId);
    }
    setSelectedTrainerIds(ids);
  };

  const syncSelectedCoursesForTrainer = (tId, currentMap, cList) => {
    const list = cList || courses;
    const cIds = [];
    for (const c of list) {
      if (c.trainerId === tId) {
        cIds.push(c.id);
        continue;
      }
      const trainersOnCourse = currentMap[c.id] || [];
      if (trainersOnCourse.some(item => item.trainerId === tId)) {
        cIds.push(c.id);
      }
    }
    setSelectedCourseIds(cIds);
  };

  const handleSelectMatrixCourse = (cId) => {
    setSelectedCourseId(cId);
    setMatrixSuccess(null);
    setMatrixError(null);
    syncSelectedTrainersForCourse(cId, courseTrainersMap, courses, trainers);
  };

  const handleSelectMatrixTrainer = (tId) => {
    setSelectedTrainerId(tId);
    setMatrixSuccess(null);
    setMatrixError(null);
    syncSelectedCoursesForTrainer(tId, courseTrainersMap, courses);
  };

  const handleToggleTrainerForCourse = (tId) => {
    setSelectedTrainerIds(prev =>
      prev.includes(tId) ? prev.filter(id => id !== tId) : [...prev, tId]
    );
  };

  const handleToggleCourseForTrainer = (cId) => {
    setSelectedCourseIds(prev =>
      prev.includes(cId) ? prev.filter(id => id !== cId) : [...prev, cId]
    );
  };

  const handleSaveCourseTrainers = async () => {
    if (!selectedCourseId) return;
    setMatrixSaving(true);
    setMatrixSuccess(null);
    setMatrixError(null);
    try {
      await api.post(`/courses/${selectedCourseId}/assign-trainers`, {
        trainerIds: selectedTrainerIds
      });
      const c = courses.find(item => item.id === selectedCourseId);
      setMatrixSuccess(`Successfully updated faculty specialist allocations for "${c?.title || 'Subject'}"! (${selectedTrainerIds.length} trainers assigned)`);
      // Refresh map
      const res = await api.get(`/courses/${selectedCourseId}/trainers`);
      setCourseTrainersMap(prev => ({ ...prev, [selectedCourseId]: res.data || [] }));
    } catch (err) {
      setMatrixError(err.response?.data?.message || err.message || 'Failed to save trainer assignments');
    } finally {
      setMatrixSaving(false);
    }
  };

  const handleSaveTrainerCourses = async () => {
    if (!selectedTrainerId) return;
    setMatrixSaving(true);
    setMatrixSuccess(null);
    setMatrixError(null);
    try {
      await api.post(`/courses/trainer/${selectedTrainerId}/assign-courses`, {
        courseIds: selectedCourseIds
      });
      const t = trainers.find(item => item.id === selectedTrainerId);
      setMatrixSuccess(`Successfully updated subject assignments for "${t?.fullName || 'Trainer'}"! (${selectedCourseIds.length} subjects assigned)`);
      fetchSuperAdminData();
    } catch (err) {
      setMatrixError(err.response?.data?.message || err.message || 'Failed to save course assignments');
    } finally {
      setMatrixSaving(false);
    }
  };

  const handleAddTrainer = async (e) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);
    setAddLoading(true);

    try {
      const res = await api.post('/admin/trainers', {
        fullName: trainerForm.fullName.trim(),
        email: trainerForm.email.trim(),
        phone: trainerForm.phone.trim(),
        password: trainerForm.password.trim(),
        assignedSubject: trainerForm.assignedSubject.trim(),
        institutionName: myInstitute
      });

      setTrainers(prev => [...prev, res.data]);
      setAddSuccess(`Trainer ${res.data.fullName} provisioned with specialization "${trainerForm.assignedSubject}"!`);
      setTimeout(() => {
        setShowAddTrainer(false);
        setAddSuccess(null);
        setTrainerForm({
          fullName: '',
          email: '',
          phone: '',
          password: 'Trainer@2026',
          assignedSubject: 'Computer Science & AI'
        });
      }, 1200);
      fetchSuperAdminData();
    } catch (err) {
      setAddError(err.response?.data?.message || err.message || 'Failed to provision trainer');
    } finally {
      setAddLoading(false);
    }
  };

  const currentCourse = courses.find(c => c.id === selectedCourseId);
  const currentCourseTrainers = selectedCourseId ? getCourseAssignedTrainers(selectedCourseId) : [];
  const currentTrainer = trainers.find(t => t.id === selectedTrainerId);
  const currentTrainerCourses = selectedTrainerId ? getTrainerAssignedCourses(selectedTrainerId) : [];

  const superAdminEssentials = [
    { id: 'trainers', label: 'Faculty Specialists', icon: Users, count: trainers.length },
    { id: 'matrix', label: 'Subject & Faculty Matrix', icon: Zap, badge: 'Mapping', badgeColor: 'purple' },
    { id: 'students', label: 'Enrolled Students', icon: GraduationCap, count: students.length },
    { id: 'live-sessions', label: 'Live Sessions (Meet/Zoom)', icon: Video }
  ];

  return (
    <>
      <div className={sidebarOpen ? "flex flex-col lg:flex-row gap-6 items-start" : "space-y-6"}>
      {sidebarOpen && (
        <DashboardSidebar
          isOpen={sidebarOpen}
          onToggle={handleToggleSidebar}
          title="Administration"
          user={user}
          items={superAdminEssentials}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          roleTheme="indigo"
          statsSummary={{ label: "Campus Faculty", value: `${trainers.length} Trainers` }}
          onChangePassword={() => setShowChangePasswordModal(true)}
        />
      )}

      <div className={sidebarOpen ? "w-full lg:flex-1 min-w-0 space-y-6" : "w-full space-y-6"}>
        {/* Mobile Quick Bar to open sidebar drawer if on small screen */}
        <div className="lg:hidden mb-4 flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xs">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <PanelLeftOpen className="w-4 h-4" />
            <span>Administration Menu</span>
          </button>
          <span className="text-xs text-slate-500 font-medium capitalize truncate max-w-[150px]">
            {superAdminEssentials.find(i => i.id === activeTab)?.label || activeTab}
          </span>
        </div>

        {/* Super Admin Institute Header */}
        <div className="bg-[#0F172A] text-white rounded-xl p-4 sm:p-6 shadow-md border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-400 shrink-0" />
                <h1 className="text-xl sm:text-2xl font-bold">{myInstitute}</h1>
                <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-500/40">
                  INSTITUTE SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Designated Head: {user?.fullName || 'Dr. Arvind Roy'} • Institutional Authority over faculty trainers, subject specialization mapping, and multi-trainer curriculum allocation.
              </p>

              {/* Complete Campus Location & Accreditation Details */}
              {institutionInfo && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-300">
                  <span className="flex items-center gap-1 text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{institutionInfo.campusAddress}, {institutionInfo.city}, {institutionInfo.state} {institutionInfo.postalCode ? `(${institutionInfo.postalCode})` : ''}</span>
                  </span>
                  {institutionInfo.accreditation && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 inline-flex items-center gap-1">
                      <Award className="w-3 h-3 text-amber-400" />
                      <span>{institutionInfo.accreditation}</span>
                    </span>
                  )}
                  {institutionInfo.websiteUrl && (
                    <a href={institutionInfo.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      <span>{institutionInfo.websiteUrl.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Multi-Super Admin Representation for this Institution */}
              {coSuperAdmins.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 font-semibold">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Institutional Super Admins ({coSuperAdmins.length}):</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {coSuperAdmins.map((admin) => {
                      const isMe = admin.email?.toLowerCase() === user?.email?.toLowerCase() || admin.id === user?.id;
                      return (
                        <span
                          key={admin.id}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                            isMe
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-2xs'
                              : 'bg-slate-800/90 text-slate-300 border-slate-700'
                          }`}
                        >
                          <span>{admin.fullName}</span>
                          {isMe && <span className="text-[9px] text-amber-200 uppercase font-mono">(You)</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="px-3.5 py-2 bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors border border-amber-500/30"
                title="Change Super Admin Password"
              >
                <KeyRound className="w-4 h-4" />
                <span>Change Password</span>
              </button>
              <button
                onClick={() => { setActiveTab('matrix'); }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Faculty & Subject Matrix
              </button>
              <button
                onClick={() => { setShowAddTrainer(true); setAddError(null); }}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Provision Trainer
              </button>
              <button
                onClick={handleToggleSidebar}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
                  sidebarOpen
                    ? 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title={sidebarOpen ? "Switch to Attached Tabs" : "Switch to Full Left Sidebar"}
              >
                {sidebarOpen ? (
                  <>
                    <PanelLeftClose className="w-4 h-4 text-indigo-400" />
                    <span>Attached Tabs</span>
                  </>
                ) : (
                  <>
                    <PanelLeftOpen className="w-4 h-4 text-indigo-400" />
                    <span>Sidebar View</span>
                  </>
                )}
              </button>
              <button
                onClick={fetchSuperAdminData}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard title="Faculty Specialists" value={trainers.length || 2} subtitle="Subject domain specialists allocated" icon={Users} color="blue" />
          <MetricCard title="Enrolled Students" value={students.length || 1} subtitle="Enrolled in this institute" icon={GraduationCap} color="emerald" />
          <MetricCard title="Active Courses / Subjects" value={courses.length || 1} subtitle="Multi-faculty curriculum" icon={BookOpen} color="amber" />
        </div>

        {/* Tabs Bar: ONLY SHOWN IF !sidebarOpen (Keep any one at once: either sidebar or attached tabs) */}
        {!sidebarOpen && (
          <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <button
                onClick={() => setActiveTab('trainers')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 ${
                  activeTab === 'trainers'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                Faculty Specialists ({trainers.length})
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'matrix'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-500 border-x border-t border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Subject & Faculty Matrix</span>
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 ${
                  activeTab === 'students'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                Enrolled Students ({students.length})
              </button>
            </div>

            <button
              onClick={handleToggleSidebar}
              className="flex items-center gap-2 px-3 py-1.5 mb-1 text-xs font-semibold rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white shadow-2xs transition-all"
              title="Switch to full left sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Switch to Sidebar</span>
            </button>
          </div>
        )}

        {/* TAB: LIVE SESSIONS (GOOGLE MEET, ZOOM, MS TEAMS) */}
        {activeTab === 'live-sessions' && (
          <LiveSessionsTab
            user={user}
            role="ROLE_SUPER_ADMIN"
            courses={courses}
            themeColor="indigo"
          />
        )}

        {/* TAB 1: FACULTY TRAINERS */}
      {activeTab === 'trainers' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Institute Faculty Specialists</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Each trainer is provisioned for a particular subject domain specialization and can be assigned to multiple subjects.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setActiveTab('matrix'); }}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Manage Subject Allocations
              </button>
              <button
                onClick={() => { setShowAddTrainer(true); setAddError(null); }}
                className="px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                + Add Trainer
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60">
                  <th className="p-3">Faculty Trainer</th>
                  <th className="p-3">Core Domain Specialization</th>
                  <th className="p-3">Allocated Subjects (Many-to-Many)</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {trainers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-slate-500 dark:text-slate-400">
                      No trainers provisioned yet.
                    </td>
                  </tr>
                ) : (
                  trainers.map((t) => {
                    const assignedList = getTrainerAssignedCourses(t.id);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {(t.fullName || 'T')[0]}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{t.fullName}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {/* PROMINENT SPECIALIZATION BADGE */}
                          <span className="px-3 py-1 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-2xs inline-flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-amber-700" />
                            <span>{t.assignedSubject || 'Computer Science & AI'}</span>
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {assignedList.length === 0 ? (
                              <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">No subjects assigned yet</span>
                            ) : (
                              assignedList.map(c => (
                                <span key={c.id} className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  {c.title}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{t.email}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{t.phone || 'N/A'}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setViewingProfileUserId(t.id);
                                setViewingProfileInitial({ ...t, role: 'ROLE_TRAINER', institutionName: myInstitute });
                              }}
                              className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-300 dark:border-slate-700 shadow-2xs"
                              title="View Full Trainer Profile"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View Profile</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('matrix');
                                setMatrixPerspective('trainer');
                                handleSelectMatrixTrainer(t.id);
                              }}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                            >
                              <Edit3 className="w-3 h-3" />
                              Manage
                            </button>
                            <button
                              onClick={() => handleOpenEditTrainer(t)}
                              className="px-2 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-800"
                              title="Edit Trainer Details"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTrainer(t.id, t.fullName)}
                              className="px-2 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded text-xs font-semibold transition-colors flex items-center gap-1 border border-rose-200 dark:border-rose-800"
                              title="Delete Trainer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
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

      {/* TAB 2: FACULTY & SUBJECT ASSIGNMENT MATRIX */}
      {activeTab === 'matrix' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Faculty & Subject Assignment Matrix</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Select any subject to view <strong>all faculty trainers allocated for that subject with their specialization</strong>. Assign multiple trainers to one subject or multiple subjects to one trainer.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                onClick={() => setMatrixPerspective('subject')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  matrixPerspective === 'subject'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Assign by Subject
              </button>
              <button
                onClick={() => setMatrixPerspective('trainer')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  matrixPerspective === 'trainer'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Assign by Faculty Trainer
              </button>
            </div>
          </div>

          {/* Feedback Banners */}
          {matrixSuccess && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2 rounded-lg animate-fadeIn">
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{matrixSuccess}</span>
            </div>
          )}

          {matrixError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 font-medium flex items-center gap-2 rounded-lg animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{matrixError}</span>
            </div>
          )}

          {/* PERSPECTIVE 1: ASSIGN MULTIPLE TRAINERS TO A SUBJECT */}
          {matrixPerspective === 'subject' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Subject List */}
              <div className="md:col-span-4 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    1. Select Subject / Course
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{courses.length} Subjects</span>
                </div>

                <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                  {courses.map((c) => {
                    const isSelected = c.id === selectedCourseId;
                    const assignedTrainers = getCourseAssignedTrainers(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectMatrixCourse(c.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block leading-snug">{c.title}</span>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                            #{c.id}
                          </span>
                        </div>

                        {/* List of all trainers assigned to this subject */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                            Assigned Trainers ({assignedTrainers.length}):
                          </span>
                          {assignedTrainers.length === 0 ? (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 italic font-medium">No trainers assigned</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {assignedTrainers.map(tr => (
                                <span
                                  key={tr.id}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1"
                                  title={`Specialization: ${tr.specialization}`}
                                >
                                  <span>{tr.fullName.split(' ')[0]}</span>
                                  <span className="text-[9px] text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-900/60 px-1 rounded">
                                    {tr.specialization.split(' ')[0]}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Multi-Trainer Assignment Checkboxes & Assigned Team Panel */}
              <div className="md:col-span-8 space-y-5">
                {/* SECTION A: ALL TRAINERS CURRENTLY ASSIGNED FOR SELECTED SUBJECT */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-2xs">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          All Faculty Trainers for "{currentCourse?.title || 'Selected Subject'}"
                        </h4>
                        <p className="text-xs text-indigo-700 dark:text-indigo-400 font-semibold">
                          {currentCourseTrainers.length} Trainer(s) Currently Authorized for this Subject
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveCourseTrainers}
                      disabled={matrixSaving || !selectedCourseId}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      {matrixSaving ? 'Saving...' : 'Save Faculty Allocations'}
                    </button>
                  </div>

                  {currentCourseTrainers.length === 0 ? (
                    <div className="p-4 text-center bg-white/90 dark:bg-slate-800/60 rounded-lg border border-dashed border-amber-300 dark:border-amber-700/60 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto" />
                      <p className="font-bold">No Faculty Trainers Currently Assigned</p>
                      <p className="text-slate-500 dark:text-slate-400">
                        Check the specialized trainers in the roster below and click "Save Faculty Allocations" to assign them.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {currentCourseTrainers.map((tr) => (
                        <div key={tr.id} className="bg-white dark:bg-slate-800/80 border border-indigo-200 dark:border-slate-700 rounded-xl p-3.5 shadow-2xs flex items-start justify-between gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">{tr.fullName}</span>
                              {tr.isPrimary && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  Primary Lead
                                </span>
                              )}
                            </div>

                            {/* PROMINENT SPECIALIZATION BADGE */}
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-md font-bold text-[11px] shadow-2xs">
                              <Target className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                              <span>Specialization:</span>
                              <span className="text-amber-950 dark:text-amber-200 font-black">{tr.specialization}</span>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{tr.email}</p>
                          </div>

                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-[10px] font-bold shrink-0 inline-flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Assigned</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SECTION B: MULTI-SELECT CHECKLIST OF ALL AVAILABLE FACULTY */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        2. Faculty Roster (Toggle Checkboxes to Assign / Unassign)
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Review each trainer's core subject specialization and check the ones authorized for this subject.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {trainers.map((t) => {
                      const isChecked = selectedTrainerIds.includes(t.id);
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleToggleTrainerForCourse(t.id)}
                          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 shadow-xs ring-1 ring-indigo-300 dark:ring-indigo-700'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Handled by parent container click
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">{t.fullName}</span>
                                {/* PROMINENT SPECIALIZATION BADGE */}
                                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 inline-flex items-center gap-1.5">
                                  <Target className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                                  <span>Specialization:</span>
                                  <span className="font-black text-amber-950 dark:text-amber-200">{t.assignedSubject || 'General Domain'}</span>
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">
                                {t.email} • {t.phone || 'No phone'}
                              </span>
                            </div>
                          </div>

                          <span className={`text-xs font-bold px-3 py-1 rounded-md shrink-0 border inline-flex items-center gap-1.5 ${
                            isChecked
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {isChecked ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span>Assigned Specialist</span>
                              </>
                            ) : (
                              <span>Available for Allocation</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PERSPECTIVE 2: ASSIGN MULTIPLE SUBJECTS TO A TRAINER */}
          {matrixPerspective === 'trainer' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Trainer List */}
              <div className="md:col-span-4 border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    1. Select Faculty Trainer
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{trainers.length} Trainers</span>
                </div>

                <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                  {trainers.map((t) => {
                    const isSelected = t.id === selectedTrainerId;
                    const assignedSubjects = getTrainerAssignedCourses(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectMatrixTrainer(t.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-white dark:bg-slate-900 border-indigo-500 dark:border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block leading-snug">{t.fullName}</span>
                          <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0">
                            {assignedSubjects.length} Subject(s)
                          </span>
                        </div>

                        {/* Specialization Badge */}
                        <div className="mt-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 inline-flex items-center gap-1">
                            <Target className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                            <span>{t.assignedSubject || 'General'}</span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Multi-Subject Assignment Checkboxes */}
              <div className="md:col-span-8 space-y-5">
                {/* Selected Trainer Profile Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-2xs">
                        {(currentTrainer?.fullName || 'T')[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{currentTrainer?.fullName}</h4>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded text-[11px] font-bold mt-0.5">
                          <Target className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                          <span>Core Specialization:</span>
                          <span className="font-black text-amber-950 dark:text-amber-200">{currentTrainer?.assignedSubject || 'Computer Science & AI'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveTrainerCourses}
                      disabled={matrixSaving || !selectedTrainerId}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                    >
                      {matrixSaving ? 'Saving...' : 'Save Subject Allocations'}
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
                      Currently Assigned to Teach ({currentTrainerCourses.length} Subjects):
                    </span>
                    {currentTrainerCourses.length === 0 ? (
                      <span className="text-xs text-amber-700 dark:text-amber-400 italic">No subjects assigned yet. Select subjects below.</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {currentTrainerCourses.map(c => (
                          <span key={c.id} className="text-xs font-bold px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
                            {c.title}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject Checklist */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      2. Subject Curriculum (Toggle Checkboxes to Assign to this Trainer)
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {courses.map((c) => {
                      const isChecked = selectedCourseIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => handleToggleCourseForTrainer(c.id)}
                          className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-600 shadow-xs ring-1 ring-indigo-300 dark:ring-indigo-700'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Handled by parent click
                              className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-700 focus:ring-indigo-500 cursor-pointer"
                            />
                            <div>
                              <span className="font-bold text-xs text-slate-900 dark:text-white">{c.title}</span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">ID #{c.id} • Category: {c.category || 'Engineering'}</span>
                            </div>
                          </div>

                          <span className={`text-xs font-bold px-3 py-1 rounded-md shrink-0 border inline-flex items-center gap-1.5 ${
                            isChecked
                              ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {isChecked ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-white" />
                                <span>Assigned to Trainer</span>
                              </>
                            ) : (
                              <span>Not Assigned</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ENROLLED STUDENTS */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Enrolled Students at {myInstitute}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Students registered under this institution. Trainers assign subject-specific coursework and exams to these students.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60">
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Mobile Contact</th>
                  <th className="p-3">Institution</th>
                  <th className="p-3">Portal Access</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-slate-500 dark:text-slate-400">
                      No students enrolled under this institute yet.
                    </td>
                  </tr>
                ) : (
                  students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{s.fullName}</td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{s.email}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{s.phone || 'N/A'}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-200">{s.institutionName || myInstitute}</td>
                      <td className="p-3"><StatusBadge status="ACTIVE" /></td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setViewingProfileUserId(s.id);
                            setViewingProfileInitial({ ...s, role: 'ROLE_STUDENT', institutionName: myInstitute });
                          }}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1 border border-slate-300 dark:border-slate-700 shadow-2xs"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditStudent(s)}
                          className="px-2 py-1 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1 border border-blue-200 dark:border-blue-800"
                          title="Edit Student"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.fullName)}
                          className="px-2 py-1 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded text-xs font-semibold transition-colors inline-flex items-center gap-1 border border-rose-200 dark:border-rose-800"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </div>
      </div>

      {/* Provision Trainer Modal */}
      {showAddTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold">Provision Faculty Trainer</h3>
                <p className="text-xs text-slate-400 mt-0.5">{myInstitute}</p>
              </div>
              <button
                onClick={() => setShowAddTrainer(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddTrainer} className="p-5 space-y-3.5">
              {addError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-800 dark:text-rose-300 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {addSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{addSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trainer Full Name <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={trainerForm.fullName}
                  onChange={(e) => setTrainerForm({ ...trainerForm, fullName: e.target.value })}
                  placeholder="e.g. Dr. Rajesh Kulkarni"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Core Subject Specialization <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <select
                  value={trainerForm.assignedSubject}
                  onChange={(e) => setTrainerForm({ ...trainerForm, assignedSubject: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Computer Science & AI" className="dark:bg-slate-800">Computer Science & AI</option>
                  <option value="Advanced Python & Microservices" className="dark:bg-slate-800">Advanced Python & Microservices</option>
                  <option value="Cloud Computing & DevOps" className="dark:bg-slate-800">Cloud Computing & DevOps</option>
                  <option value="Java & Enterprise Systems" className="dark:bg-slate-800">Java & Enterprise Systems</option>
                  <option value="Data Engineering & Analytics" className="dark:bg-slate-800">Data Engineering & Analytics</option>
                  <option value="Cybersecurity & Cryptography" className="dark:bg-slate-800">Cybersecurity & Cryptography</option>
                  <option value="Fullstack Web Technologies" className="dark:bg-slate-800">Fullstack Web Technologies</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  This specialization will be prominently displayed on all subjects taught by this trainer.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={trainerForm.email}
                  onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                  placeholder="rajesh.trainer@bridgeai.edu"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Mobile Number
                </label>
                <input
                  type="tel"
                  value={trainerForm.phone}
                  onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                  placeholder="+91-9876543210"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Account Password <span className="text-rose-600 dark:text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={trainerForm.password}
                  onChange={(e) => setTrainerForm({ ...trainerForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTrainer(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-transparent dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addLoading ? 'Provisioning...' : 'Provision Trainer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: Edit Trainer */}
      {showEditTrainerModal && editingTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden text-slate-900 dark:text-white">
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  Edit Faculty Specialist
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{myInstitute}</p>
              </div>
              <button onClick={() => setShowEditTrainerModal(false)} className="text-slate-400 hover:text-white p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditTrainer} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingTrainer.fullName}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, fullName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Official Email</label>
                <input
                  type="email"
                  required
                  value={editingTrainer.email}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contact Phone</label>
                <input
                  type="tel"
                  value={editingTrainer.phone}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Subject Specialization</label>
                <input
                  type="text"
                  value={editingTrainer.assignedSubject}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, assignedSubject: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  placeholder="e.g. AI & Machine Learning"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editingTrainer.password}
                  onChange={(e) => setEditingTrainer({ ...editingTrainer, password: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="Leave empty to maintain current password"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditTrainerModal(false)}
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

      {/* MODAL: Edit Student */}
      {showEditStudentModal && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden text-slate-900 dark:text-white">
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  Edit Student Record
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{myInstitute}</p>
              </div>
              <button onClick={() => setShowEditStudentModal(false)} className="text-slate-400 hover:text-white p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditStudent} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStudent.fullName}
                  onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  value={editingStudent.email}
                  onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Contact Mobile</label>
                <input
                  type="tel"
                  value={editingStudent.phone}
                  onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={editingStudent.password}
                  onChange={(e) => setEditingStudent({ ...editingStudent, password: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  placeholder="Leave empty to maintain current password"
                />
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
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

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userRole="ROLE_SUPER_ADMIN"
        userEmail={user?.email || 'superadmin@bridgeai.edu'}
      />

      {/* UNIVERSAL PROFILE MODAL */}
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
    </>
  );
};
