import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  BookOpen, Video, FileText, CheckCircle2, Award, Calendar, ExternalLink,
  ShieldCheck, UploadCloud, FolderGit2, AlertTriangle, PlayCircle, Eye,
  Archive, Presentation, Clock, Lock, RefreshCw, ChevronRight,
  Users, UserPlus, Check, X, Shield, Edit3, Monitor, ShieldAlert, Target,
  Globe, Building2, Layers, PanelLeftOpen, PanelLeftClose,
  Printer, Download, Search, Copy, Sparkles, GraduationCap, Bell, Camera, Ban,
  FileCheck
} from 'lucide-react';
import { DashboardSidebar } from '../components/common/DashboardSidebar';
import { LiveSessionsTab } from '../components/common/LiveSessionsTab';
import FileUploadInput from '../components/common/FileUploadInput';

export const StudentDashboard = ({
  onOpenExam,
  onSelectCourse,
  onViewExamResult,
  activeTab: controlledTab,
  onSelectTab: controlledOnSelectTab
}) => {
  const { user } = useAuth();
  const [internalTab, setInternalTab] = useState('assignments');
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setActiveTab = controlledOnSelectTab || setInternalTab;
  const [studyLibraryFilter, setStudyLibraryFilter] = useState('ALL'); // 'ALL' | 'GLOBAL' | 'INSTITUTION'
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [examStatuses, setExamStatuses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [assignmentsWithSub, setAssignmentsWithSub] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [courseTrainersMap, setCourseTrainersMap] = useState({});
  const [vigilanceHistory, setVigilanceHistory] = useState([]);
  const [selectedEvidenceModal, setSelectedEvidenceModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingResultExamId, setLoadingResultExamId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('bridgeai_student_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const handleViewExamScorecard = async (ex) => {
    try {
      setLoadingResultExamId(ex.examId);
      let res;
      if (ex.attemptId) {
        res = await api.get(`/exams/attempts/${ex.attemptId}/result`);
      } else {
        res = await api.get(`/exams/${ex.examId}/latest-result`);
      }
      if (onViewExamResult) {
        onViewExamResult(res.data);
      }
    } catch (err) {
      alert('Could not load detailed scorecard: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingResultExamId(null);
    }
  };

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('bridgeai_student_sidebar_open', String(next));
      return next;
    });
  };

  // Collaborative Teams, Invites & Notifications State
  const [receivedInvites, setReceivedInvites] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [myTeamByTopic, setMyTeamByTopic] = useState({});
  const [showInviteModal, setShowInviteModal] = useState(null); // topicId
  const [peersList, setPeersList] = useState([]);
  const [showRenameModal, setShowRenameModal] = useState(null); // { topicId, currentName }
  const [renameTeamInput, setRenameTeamInput] = useState('');
  const [showSharedUploadModal, setShowSharedUploadModal] = useState(null); // team

  // Modals
  const [submitAssignmentModal, setSubmitAssignmentModal] = useState(null);
  const [submitProjectModal, setSubmitProjectModal] = useState(null);
  const [watchingRecordingModal, setWatchingRecordingModal] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [certSearchQuery, setCertSearchQuery] = useState('');
  const [copiedCertCode, setCopiedCertCode] = useState(null);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifCount(0);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleMarkNotificationRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.warn(e);
    }
  };

  // Delete/dismiss notification permanently (Cross / X option)
  const handleDeleteNotification = async (e, id) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== id);
        setUnreadNotifCount(updated.filter(n => !n.read).length);
        return updated;
      });
    } catch (err) {
      console.warn('Failed to delete notification:', err);
    }
  };

  // Clear all notifications permanently
  const handleClearAllNotifications = async () => {
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadNotifCount(0);
    } catch (err) {
      console.warn('Failed to clear notifications:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const [notifRes, invitesRes] = await Promise.allSettled([
        api.get('/notifications'),
        api.get('/projects/invites/received')
      ]);
      if (notifRes.status === 'fulfilled') {
        const notifs = notifRes.value.data || [];
        setNotifications(notifs);
        setUnreadNotifCount(notifs.filter(n => !n.read).length);
      }
      if (invitesRes.status === 'fulfilled') {
        setReceivedInvites(invitesRes.value.data || []);
      }
    } catch (err) {}
  };

  const handleCopyCertCode = (code) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(code);
      }
    } catch (e) {}
    setCopiedCertCode(code);
    setTimeout(() => setCopiedCertCode(null), 2500);
  };

  const handlePrintCertificate = (cert) => {
    setSelectedCertificate(cert);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleDownloadCertificateHtml = (cert) => {
    if (!cert) return;
    const issueDate = new Date(cert.issueDate || cert.createdAt).toLocaleDateString();
    const instName = user?.institutionName || 'BRIDGEAI NATIONAL INSTITUTE OF COMPUTING';
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${cert.studentName} - ${cert.courseTitle}</title>
  <style>
    body { font-family: 'Georgia', serif; background: #f8fafc; margin: 0; padding: 40px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .cert-card { background: #ffffff; width: 800px; padding: 50px 40px; border: 4px double #d97706; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; position: relative; }
    .inner-border { position: absolute; inset: 12px; border: 1px solid #fde68a; border-radius: 12px; pointer-events: none; }
    .inst-name { font-family: sans-serif; font-size: 13px; font-weight: 800; letter-spacing: 3px; color: #78350f; text-transform: uppercase; margin: 15px 0 4px; }
    .sub-inst { font-family: sans-serif; font-size: 10px; letter-spacing: 2px; color: #94a3b8; text-transform: uppercase; margin: 0 0 24px; }
    .title { font-size: 32px; font-weight: 900; color: #0f172a; letter-spacing: 2px; margin: 0 0 10px; }
    .awarded-to { font-size: 13px; font-style: italic; color: #64748b; margin: 0 0 16px; }
    .recipient { font-family: sans-serif; font-size: 30px; font-weight: 800; color: #1d4ed8; text-decoration: underline; text-decoration-color: #f59e0b; margin: 0 0 20px; }
    .statement { font-family: sans-serif; font-size: 13px; color: #475569; max-width: 550px; margin: 0 auto 12px; line-height: 1.6; }
    .course { font-family: sans-serif; font-size: 18px; font-weight: bold; color: #0f172a; padding: 10px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: inline-block; margin: 0 0 20px; }
    .badge { font-family: sans-serif; font-size: 12px; font-weight: bold; color: #78350f; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 20px; padding: 6px 16px; display: inline-block; margin: 0 0 35px; }
    .footer-grid { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .sig-col { text-align: center; width: 200px; font-family: sans-serif; }
    .sig-line { border-bottom: 1px solid #94a3b8; padding-bottom: 6px; font-size: 12px; font-style: italic; color: #334155; }
    .sig-label { font-size: 10px; text-transform: uppercase; color: #94a3b8; margin-top: 4px; font-weight: 600; }
    .seal { width: 64px; height: 64px; border: 2px dashed #d97706; border-radius: 50%; background: #fffbeb; margin: 0 auto; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 9px; font-weight: bold; color: #b45309; }
    .meta { font-family: monospace; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; margin-top: 25px; padding-top: 10px; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="cert-card">
    <div class="inner-border"></div>
    <div class="inst-name">${instName}</div>
    <div class="sub-inst">Accredited Technical & Examination Council</div>
    <div class="title">CERTIFICATE OF ACHIEVEMENT</div>
    <div class="awarded-to">This official credential is proudly awarded to</div>
    <div class="recipient">${cert.studentName}</div>
    <div class="statement">for demonstrating technical mastery and successfully passing the formal proctored academic examination for:</div>
    <div class="course">${cert.courseTitle}</div>
    <br/>
    <div class="badge">Grade Awarded: ${cert.gradePercentage}% (${cert.gradePercentage >= 75 ? 'First Class Distinction' : 'Passed'})</div>
    <div class="footer-grid">
      <div class="sig-col">
        <div class="sig-line">Dean of Academic Studies</div>
        <div class="sig-label">Academic Dean</div>
      </div>
      <div class="seal">
        <span>VERIFIED</span>
        <span style="font-size: 7px;">SEAL</span>
      </div>
      <div class="sig-col">
        <div class="sig-line">${cert.certificateCode}</div>
        <div class="sig-label">Controller of Examinations</div>
      </div>
    </div>
    <div class="meta">
      <span>Issue Date: ${issueDate}</span>
      <span>Verification ID: ${cert.certificateCode}</span>
      <span>Registry: BridgeAI Cryptographic Ledger</span>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificate_${cert.certificateCode}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedCertificate(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Forms
  const [assignForm, setAssignForm] = useState({
    pdfSubmissionUrl: '',
    submissionContent: ''
  });

  const [projectDeliverables, setProjectDeliverables] = useState({
    zipFileUrl: '',
    pptFileUrl: '',
    pdfReportUrl: '',
    githubRepoUrl: '',
    liveDemoUrl: '',
    studentComments: ''
  });

  // Mobile / Tablet lockdown restriction
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const ua = navigator.userAgent || navigator.vendor || window.opera || '';
      const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile|tablet/i.test(ua);
      const isTouchSmallScreen = (navigator.maxTouchPoints > 1 || 'ontouchstart' in window) && window.innerWidth < 1024;
      const isSmallViewport = window.innerWidth < 1024;
      setIsMobileOrTablet(isMobileUA || isTouchSmallScreen || isSmallViewport);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    fetchStudentData();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 7000);
    return () => clearInterval(interval);
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [coursesRes, sessRes, examStatusRes, certRes, assignRes, myProjRes, topicsRes, invitesRes, vigilanceRes] = await Promise.allSettled([
        api.get('/courses'),
        api.get('/sessions'),
        api.get('/exams/student-status'),
        api.get('/certificates/my'),
        api.get('/assignments/student'),
        api.get('/projects/my-projects'),
        api.get('/projects/topics'),
        api.get('/projects/invites/received'),
        api.get('/vigilance/student-history')
      ]);

      if (coursesRes.status === 'fulfilled') {
        const cList = coursesRes.value.data || [];
        setCourses(cList);
        // Fetch assigned faculty specialists and specializations for each subject
        try {
          const tMap = {};
          await Promise.all(cList.map(async (c) => {
            try {
              const trRes = await api.get(`/courses/${c.id}/trainers`);
              tMap[c.id] = trRes.data || [];
            } catch (e) {
              tMap[c.id] = [];
            }
          }));
          setCourseTrainersMap(tMap);
        } catch (e) {}
      }
      if (sessRes.status === 'fulfilled') setSessions(sessRes.value.data || []);
      if (examStatusRes.status === 'fulfilled') setExamStatuses(examStatusRes.value.data || []);
      if (certRes.status === 'fulfilled') setCertificates(certRes.value.data || []);
      if (assignRes.status === 'fulfilled') setAssignmentsWithSub(assignRes.value.data || []);
      if (myProjRes.status === 'fulfilled') setMyProjects(myProjRes.value.data || []);
      if (invitesRes.status === 'fulfilled') setReceivedInvites(invitesRes.value.data || []);
      if (vigilanceRes.status === 'fulfilled') setVigilanceHistory(vigilanceRes.value.data || []);

      if (topicsRes.status === 'fulfilled') {
        const topics = topicsRes.value.data || [];
        setAvailableTopics(topics);

        // Fetch team details for each topic
        const teamsMap = {};
        for (const t of topics) {
          try {
            const teamRes = await api.get(`/projects/my-team?topicId=${t.id}`);
            if (teamRes.data && teamRes.data.team) {
              teamsMap[t.id] = teamRes.data;
            }
          } catch (err) {}
        }
        setMyTeamByTopic(teamsMap);
      }

      // Fetch student in-app notifications
      try {
        const notifRes = await api.get('/notifications');
        const notifs = notifRes.data || [];
        setNotifications(notifs);
        setUnreadNotifCount(notifs.filter(n => !n.read).length);
      } catch (e) {}
    } catch (err) {
      console.warn('Student dashboard load notice:', err);
    } finally {
      setLoading(false);
    }
  };

  // Submit / Edit Assignment
  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!submitAssignmentModal) return;

    try {
      await api.post('/assignments/submit', {
        assignmentId: submitAssignmentModal.assignment.id,
        submissionType: 'PDF',
        pdfSubmissionUrl: assignForm.pdfSubmissionUrl.trim(),
        submissionContent: assignForm.submissionContent.trim()
      });
      alert('Assignment deliverable submitted successfully! Status updated to SUBMITTED.');
      setSubmitAssignmentModal(null);
      setAssignForm({ pdfSubmissionUrl: '', submissionContent: '' });
      fetchStudentData();
    } catch (err) {
      alert('Submission failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle Topic Selection & Team Init
  const handleSelectTopic = async (topicId) => {
    try {
      await api.post('/projects/select', { topicId });
      alert('Project topic selected! Your collaborative team workspace has been initialized.');
      fetchStudentData();
    } catch (err) {
      alert('Failed to select topic: ' + (err.response?.data?.message || err.message));
    }
  };

  // Open Peer Discovery Modal
  const handleOpenInviteModal = async (topicId) => {
    try {
      setShowInviteModal(topicId);
      const res = await api.get(`/projects/topics/${topicId}/peers`);
      setPeersList(res.data || []);
    } catch (err) {
      alert('Failed to load eligible peers: ' + err.message);
    }
  };

  // Send Team Invite to Peer
  const handleSendInvite = async (teamId, recipientStudentId) => {
    try {
      await api.post('/projects/invites/send', { teamId, recipientStudentId });
      alert('Team invitation dispatched! The student can now accept to join your team.');
      if (showInviteModal) {
        const res = await api.get(`/projects/topics/${showInviteModal}/peers`);
        setPeersList(res.data || []);
      }
      fetchStudentData();
    } catch (err) {
      alert('Invitation notice: ' + (err.response?.data?.message || err.message));
    }
  };

  // Respond to Received Invite (Accept/Decline)
  const handleRespondInvite = async (inviteId, accept) => {
    try {
      await api.post(`/projects/invites/${inviteId}/respond`, { inviteId, accept });
      alert(accept ? 'Invitation accepted! You have joined the collaborative team.' : 'Invitation declined.');
      fetchStudentData();
      fetchNotifications();
    } catch (err) {
      alert('Action notice: ' + (err.response?.data?.message || err.message));
    }
  };

  // Join Existing Open Team
  const handleJoinTeam = async (teamId) => {
    try {
      await api.post(`/projects/teams/${teamId}/join`);
      alert('Successfully joined the team! Your collaborative project workspace is now active.');
      setShowInviteModal(null);
      fetchStudentData();
      fetchNotifications();
    } catch (err) {
      alert('Failed to join team: ' + (err.response?.data?.message || err.message));
    }
  };

  // Cancel Sent Invite
  const handleCancelInvite = async (inviteId) => {
    if (!window.confirm('Are you sure you want to cancel this pending invitation?')) return;
    try {
      await api.post(`/projects/invites/${inviteId}/cancel`);
      alert('Invitation cancelled successfully.');
      fetchStudentData();
    } catch (err) {
      alert('Cancellation notice: ' + (err.response?.data?.message || err.message));
    }
  };

  // Rename Team
  const handleRenameTeam = async (e) => {
    e.preventDefault();
    if (!showRenameModal || !renameTeamInput.trim()) return;
    try {
      await api.post('/projects/teams', {
        topicId: showRenameModal.topicId,
        teamName: renameTeamInput.trim()
      });
      alert('Team name updated successfully!');
      setShowRenameModal(null);
      setRenameTeamInput('');
      fetchStudentData();
    } catch (err) {
      alert('Failed to rename team: ' + (err.response?.data?.message || err.message));
    }
  };

  // Submit Shared Team Deliverables (Any Teammate can submit)
  const handleSubmitSharedDeliverables = async (e) => {
    e.preventDefault();
    if (!showSharedUploadModal) return;
    try {
      await api.post(`/projects/teams/${showSharedUploadModal.id}/submit`, {
        teamId: showSharedUploadModal.id,
        ...projectDeliverables
      });
      alert('Shared team deliverables uploaded successfully! All teammates and your trainer can now view these deliverables.');
      setShowSharedUploadModal(null);
      setProjectDeliverables({
        zipFileUrl: '',
        pptFileUrl: '',
        pdfReportUrl: '',
        githubRepoUrl: '',
        liveDemoUrl: '',
        studentComments: ''
      });
      fetchStudentData();
    } catch (err) {
      alert('Submission failed: ' + (err.response?.data?.message || err.message));
    }
  };

  // Select Project Topic (legacy alias)
  const handleSelectProject = async (topicId) => {
    try {
      await api.post('/projects/select', { projectId: topicId });
      alert('Project topic successfully selected and added to your active projects!');
      fetchStudentData();
    } catch (err) {
      alert('Failed to select project: ' + err.message);
    }
  };

  // Submit Project Deliverables
  const handleSubmitProject = async (e) => {
    e.preventDefault();
    if (!submitProjectModal) return;

    try {
      await api.post('/projects/submit', {
        projectId: submitProjectModal.id,
        ...projectDeliverables
      });
      alert('Project deliverables submitted successfully! Trainer will review and evaluate.');
      setSubmitProjectModal(null);
      setProjectDeliverables({
        zipFileUrl: '',
        pptFileUrl: '',
        pdfReportUrl: '',
        githubRepoUrl: '',
        liveDemoUrl: '',
        studentComments: ''
      });
      fetchStudentData();
    } catch (err) {
      alert('Failed to submit deliverables: ' + err.message);
    }
  };

  const primaryCourse = courses[0];

  const studentEssentials = [
    { id: 'assignments', label: 'My Coursework & Assignments', icon: FileText, count: assignmentsWithSub.length },
    {
      id: 'projects',
      label: 'Project Hub',
      icon: FolderGit2,
      count: receivedInvites.length > 0 ? `${receivedInvites.length} Invites!` : `${myProjects.length} Active`,
      badge: receivedInvites.length > 0 ? `${receivedInvites.length} Pending` : null,
      badgeColor: 'rose'
    },
    { id: 'exams', label: 'Proctored Exams', icon: ShieldCheck, count: examStatuses.length },
    { id: 'live-sessions', label: 'Live Sessions (Meet/Zoom)', icon: Video },
    { id: 'recordings', label: 'Recorded Lectures', icon: Video, count: sessions.filter(s => s.recordingVideoUrl).length },
    { id: 'materials', label: 'Study Materials', icon: BookOpen, count: `${courses.length} Subjects`, badge: 'Modular', badgeColor: 'emerald' },
    { id: 'certificates', label: 'Earned Certificates', icon: Award, count: certificates.length, badge: certificates.length > 0 ? `${certificates.length} Verified` : null, badgeColor: 'amber' },
    {
      id: 'vigilance-history',
      label: 'Vigilance & Termination History',
      icon: ShieldAlert,
      count: vigilanceHistory.length > 0 ? `${vigilanceHistory.length} Logged` : 'Clean Record',
      badge: vigilanceHistory.some(v => v.status === 'TERMINATED_BY_VIOLATION' || v.actionType === 'TERMINATE_EXAM') ? 'Incident' : null,
      badgeColor: 'rose'
    }
  ];

  return (
    <>
      {/* Mobile Top Navigation Quick Bar (Only on mobile/tablet) */}
      <div className="lg:hidden mb-4 flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <button
          type="button"
          onClick={handleToggleSidebar}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-900/60 cursor-pointer shadow-2xs"
        >
          <PanelLeftOpen className="w-4 h-4" />
          <span>Student Essentials Menu</span>
        </button>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 capitalize bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
          Tab: {activeTab.replace('-', ' ')}
        </span>
      </div>

      <div className={sidebarOpen ? "flex flex-col lg:flex-row gap-6 items-start" : "space-y-6"}>
      {sidebarOpen && (
        <DashboardSidebar
          isOpen={sidebarOpen}
          onToggle={handleToggleSidebar}
          title="Student Essentials"
          user={user}
          items={studentEssentials}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          roleTheme="blue"
          statsSummary={{ label: "Active Subjects", value: `${courses.length} Enrolled` }}
        />
      )}

      <div className={sidebarOpen ? "w-full lg:flex-1 min-w-0 space-y-6" : "space-y-6"}>
        {/* Student Welcome Banner */}
        <div className="bg-[#0F172A] text-white rounded-2xl p-4 sm:p-6 shadow-md border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                <h1 className="text-xl sm:text-2xl font-bold">Student Academic &amp; Learning Portal</h1>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/40">
                  ENROLLED STUDENT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Candidate: <strong className="text-white">{user?.fullName || 'Rahul Verma'}</strong> • Institution: <strong className="text-slate-300">{user?.institutionName || 'Indian Institute of Technology (IIT)'}</strong>.
                Access lecture recordings, modular sequential study materials, submit PDF coursework, execute projects, and take proctored examinations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Bell Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  className="relative p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition-colors"
                  title="Notifications & Invitations"
                >
                  <Bell className="w-4 h-4 text-amber-400" />
                  {(unreadNotifCount > 0 || receivedInvites.length > 0) && (
                    <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 bg-rose-600 text-white font-bold text-[10px] rounded-full ring-2 ring-slate-900 animate-pulse">
                      {unreadNotifCount || receivedInvites.length}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-4 z-50 text-slate-900 dark:text-white">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Bell className="w-4 h-4 text-amber-500" />
                        <span>Notifications</span>
                        {(unreadNotifCount > 0 || receivedInvites.length > 0) && (
                          <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 rounded-full">
                            {unreadNotifCount || receivedInvites.length} New
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadNotifCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                          >
                            Mark all read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearAllNotifications}
                            className="text-[11px] text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:underline font-semibold"
                            title="Clear all notifications"
                          >
                            Clear all
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowNotifDropdown(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 mt-2 space-y-2">
                      {receivedInvites.length > 0 && (
                        <div className="space-y-2 pb-2">
                          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>Pending Project Invites ({receivedInvites.length})</span>
                          </div>
                          {receivedInvites.map(inv => (
                            <div key={inv.id} className="p-2.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50 space-y-2">
                              <div className="text-xs text-slate-800 dark:text-slate-200">
                                <strong className="text-slate-900 dark:text-white">{inv.senderName}</strong> invited you to join <span className="font-bold text-blue-600 dark:text-blue-400">"{inv.teamName}"</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => { handleRespondInvite(inv.id, true); setShowNotifDropdown(false); }}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                                >
                                  <Check className="w-3 h-3" /> Accept
                                </button>
                                <button
                                  onClick={() => { handleRespondInvite(inv.id, false); setShowNotifDropdown(false); }}
                                  className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" /> Decline
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {notifications.length === 0 && receivedInvites.length === 0 ? (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            className={`group relative p-2.5 rounded-lg text-xs space-y-1 transition-all ${
                              !notif.read
                                ? 'bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 cursor-pointer'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
                            }`}
                            onClick={() => !notif.read && handleMarkNotificationRead(notif.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {!notif.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0" />
                                )}
                                <span className="font-bold text-slate-900 dark:text-white truncate">{notif.title}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteNotification(e, notif.id)}
                                  className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                  title="Delete notification (will not appear again)"
                                  aria-label="Delete notification"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed pr-1">
                              {notif.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {primaryCourse && (
                <button
                  onClick={() => onSelectCourse && onSelectCourse(primaryCourse.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Open Study Materials Reader
                </button>
              )}
              <button
                onClick={handleToggleSidebar}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
                  sidebarOpen
                    ? 'bg-blue-950/60 hover:bg-blue-900/80 text-blue-300 border-blue-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title={sidebarOpen ? "Switch to Attached Tabs" : "Switch to Full Left Sidebar"}
              >
                {sidebarOpen ? (
                  <>
                    <PanelLeftClose className="w-3.5 h-3.5 text-blue-400" />
                    <span>Attached Tabs</span>
                  </>
                ) : (
                  <>
                    <PanelLeftOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>Sidebar View</span>
                  </>
                )}
              </button>
              <button
                onClick={fetchStudentData}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Global Active Peer Invites Banner Across ALL Tabs */}
        {receivedInvites.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-600/60 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-lg shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-600 text-white">
                    Project Collaboration Invitation
                  </span>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                    {receivedInvites.length} Pending
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold mt-1 text-slate-900 dark:text-white">
                  <strong className="text-amber-800 dark:text-amber-300 font-bold">{receivedInvites[0].senderName}</strong> has invited you to join project team <span className="underline decoration-amber-500 font-bold">"{receivedInvites[0].teamName}"</span>!
                </p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Accepting merges your workspace with your teammate.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleRespondInvite(receivedInvites[0].id, true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" /> Accept & Join Team
              </button>
              <button
                type="button"
                onClick={() => handleRespondInvite(receivedInvites[0].id, false)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-300 dark:border-slate-700"
              >
                <X className="w-3.5 h-3.5" /> Decline
              </button>
              {receivedInvites.length > 1 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('projects')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  View All ({receivedInvites.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Assigned Coursework"
            value={assignmentsWithSub.length}
            subtitle="Subject assignments"
            icon={FileText}
            color="blue"
            onClick={() => setActiveTab('assignments')}
          />
          <MetricCard
            title="Active Projects"
            value={myProjects.length}
            subtitle="Project Hub topics"
            icon={FolderGit2}
            color="emerald"
            onClick={() => setActiveTab('projects')}
          />
          <MetricCard
            title="Proctored Assessments"
            value={examStatuses.length}
            subtitle="Certification exams"
            icon={ShieldCheck}
            color="purple"
            onClick={() => setActiveTab('exams')}
          />
          <MetricCard
            title="Earned Certificates"
            value={certificates.length}
            subtitle="Accredited credentials"
            icon={Award}
            color="amber"
            onClick={() => setActiveTab('certificates')}
          />
        </div>

        {/* Tabs Bar: ONLY SHOWN IF !sidebarOpen (Keep any one at once: either sidebar or attached tabs) */}
        {!sidebarOpen && (
          <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <button
                onClick={() => setActiveTab('assignments')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'assignments'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <span>My Coursework & Assignments</span>
                <span className="text-xs px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded border border-slate-200 dark:border-slate-700">
                  {assignmentsWithSub.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'projects'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <span>Project Hub ({myProjects.length} Active)</span>
              </button>

              <button
                onClick={() => setActiveTab('exams')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'exams'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <span>Proctored Exams ({examStatuses.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('recordings')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'recordings'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <span>Recorded Lectures ({sessions.filter(s => s.recordingVideoUrl).length})</span>
              </button>

              <button
                onClick={() => setActiveTab('materials')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'materials'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
                title="Browse Subject-wise Modular Study Materials"
              >
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Study Materials ({courses.length} Subjects)</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold rounded border border-emerald-200 dark:border-emerald-800">
                  Modular
                </span>
              </button>

              <button
                onClick={() => setActiveTab('certificates')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'certificates'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border-amber-600 dark:border-amber-500 border-x border-t border-slate-200 dark:border-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
                title="View and download your earned examination and completion certificates"
              >
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Earned Certificates ({certificates.length})</span>
                {certificates.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold rounded border border-amber-200 dark:border-amber-800">
                    Verified
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('vigilance-history')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'vigilance-history'
                    ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border-rose-600 dark:border-rose-500 border-x border-t border-slate-200 dark:border-slate-800 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
                title="View integrity audit records, termination reasons, and photo evidence"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Vigilance & Termination History</span>
                {vigilanceHistory.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold rounded border border-rose-200 dark:border-rose-800">
                    {vigilanceHistory.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={handleToggleSidebar}
              className="flex items-center gap-2 px-3 py-1.5 mb-1 text-xs font-semibold rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white shadow-2xs transition-all"
              title="Switch to full left sidebar"
            >
              <PanelLeftOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Switch to Sidebar</span>
            </button>
          </div>
        )}

        {/* TAB: LIVE SESSIONS (GOOGLE MEET, ZOOM, MS TEAMS) */}
        {activeTab === 'live-sessions' && (
          <LiveSessionsTab
            user={user}
            role="ROLE_STUDENT"
            courses={courses}
            themeColor="blue"
          />
        )}

        {/* TAB 1: ASSIGNMENTS */}
      {activeTab === 'assignments' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Institutional Subject Assignments</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submit your coursework in <strong>PDF format</strong>. Status automatically updates: <em>Submitted &rarr; Under Review &rarr; Checked</em> with marks.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60">
                  <th className="p-3">Assignment Title & Subject</th>
                  <th className="p-3">Trainer Instructions</th>
                  <th className="p-3">Deadline</th>
                  <th className="p-3">My Submission</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Marks & Grade</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {assignmentsWithSub.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-4 text-center text-slate-500 dark:text-slate-400">
                      No assignments assigned for your enrolled subjects.
                    </td>
                  </tr>
                ) : (
                  assignmentsWithSub.map((item) => {
                    const a = item.assignment;
                    const sub = item.mySubmission;
                    const status = sub ? sub.status : 'PENDING';
                    const canEdit = sub ? (sub.canEdit || a.allowResubmission) : true;

                    return (
                      <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-900 dark:text-white">{a.title}</div>
                          <span className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold">{a.subjectName}</span>
                          {a.pdfAttachmentUrl && (
                            <a
                              href={a.pdfAttachmentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline block mt-0.5"
                            >
                              Download Problem PDF
                            </a>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{a.description}</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                          {a.dueDateTime ? new Date(a.dueDateTime).toLocaleString() : 'Open'}
                        </td>
                        <td className="p-3">
                          {sub ? (
                            <a
                              href={sub.pdfSubmissionUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 font-mono"
                            >
                              <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>View Submitted PDF</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 italic">Not submitted</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                            status === 'CHECKED'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : status === 'UNDER_REVIEW'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : status === 'SUBMITTED'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {sub && sub.status === 'CHECKED' ? (
                            <div>
                              <span>{sub.score} / 100</span>
                              <span className="ml-1 text-emerald-700 dark:text-emerald-400">({sub.grade || 'A'})</span>
                              {sub.feedback && (
                                <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{sub.feedback}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 font-normal">Pending check</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {!sub ? (
                            <button
                              onClick={() => {
                                setSubmitAssignmentModal(item);
                                setAssignForm({ pdfSubmissionUrl: '', submissionContent: '' });
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                            >
                              Submit PDF
                            </button>
                          ) : (
                            <button
                              disabled={!canEdit}
                              onClick={() => {
                                setSubmitAssignmentModal(item);
                                setAssignForm({
                                  pdfSubmissionUrl: sub.pdfSubmissionUrl || '',
                                  submissionContent: sub.submissionContent || ''
                                });
                              }}
                              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                                canEdit
                                  ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                                  : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
                              }`}
                              title={canEdit ? 'Edit submission' : 'Trainer permission required to edit'}
                            >
                              {canEdit ? 'Edit Submission' : 'Locked by Trainer'}
                            </button>
                          )}
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

      {/* TAB 2: PROJECT HUB & COLLABORATIVE TEAM DELIVERABLES */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Incoming Invites Alert Banner */}
          {receivedInvites.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                <Users className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                <span>Pending Team Collaboration Invitations ({receivedInvites.length})</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                You have received invitations from peers who are working on the same project topic. Accept to merge into their team space.
              </p>
              <div className="space-y-2 pt-1">
                {receivedInvites.map((inv) => (
                  <div key={inv.id} className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="text-xs text-slate-800 dark:text-slate-200">
                        <strong className="font-bold text-slate-900 dark:text-white">{inv.senderName}</strong> invited you to join{' '}
                        <span className="font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          {inv.teamName}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                        Received on {new Date(inv.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRespondInvite(inv.id, true)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept & Join Team
                      </button>
                      <button
                        onClick={() => handleRespondInvite(inv.id, false)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-300 dark:border-slate-700"
                      >
                        <X className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Collaborative Teams for Selected Topics */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">My Collaborative Project Teams</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Form teams with students who picked the same project. Any teammate can upload or update deliverables; submissions are synchronized in real time for everyone.
                </p>
              </div>
            </div>

            {Object.keys(myTeamByTopic).length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs space-y-2">
                <Users className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">No Active Project Teams</p>
                <p>Select a project topic below to start or join a collaborative student team.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(myTeamByTopic).map(([topicId, teamData]) => {
                  const topic = teamData.topic;
                  const team = teamData.team;
                  const members = teamData.members || [];
                  const minSize = topic?.minTeamSize || 2;
                  const maxSize = topic?.maxTeamSize || 4;
                  const isLeader = teamData.isLeader;
                  const hasMinMet = members.length >= minSize;

                  return (
                    <div key={topicId} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900 space-y-0">
                      {/* Topic Bar */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                              {topic?.subjectName || 'Computer Science & AI'}
                            </span>
                            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                              Team Size Rule: Min {minSize} - Max {maxSize} Members
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                              team.status === 'EVALUATED'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : team.status === 'SUBMITTED'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            }`}>
                              {team.status}
                            </span>
                          </div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">{topic?.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{topic?.description}</p>
                        </div>
                        <div className="text-right text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-mono">Deadline: {topic?.deadline || 'Open'}</span>
                          <div className="text-slate-700 dark:text-slate-300 font-bold mt-1">
                            Instructor: {topic?.trainerName || 'Faculty'}
                          </div>
                        </div>
                      </div>

                      {/* Team Space Body */}
                      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Team Roster & Invitations (5 cols) */}
                        <div className="lg:col-span-5 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 lg:pr-6 pb-4 lg:pb-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h5 className="text-sm font-bold text-slate-900 dark:text-white">{team.teamName}</h5>
                                {isLeader && (
                                  <button
                                    onClick={() => {
                                      setShowRenameModal({ topicId, currentName: team.teamName });
                                      setRenameTeamInput(team.teamName);
                                    }}
                                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                                    title="Rename Team"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Team Leader: <span className="font-semibold text-slate-700 dark:text-slate-300">{team.leaderName}</span>
                              </p>
                            </div>

                            <button
                              disabled={members.length >= maxSize}
                              onClick={() => handleOpenInviteModal(topicId)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors ${
                                members.length >= maxSize
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                              }`}
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>{members.length >= maxSize ? 'Team Full' : 'Invite Teammates'}</span>
                            </button>
                          </div>

                          {/* Member Size Progress Meter */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                            <div className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                              <span>Capacity: {members.length} / {maxSize} Members</span>
                              <span className={`flex items-center gap-1 ${hasMinMet ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-amber-700 dark:text-amber-400 font-bold'}`}>
                                {hasMinMet && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                                <span>{hasMinMet ? 'Min Size Satisfied' : `Min Required: ${minSize}`}</span>
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  members.length >= minSize ? 'bg-emerald-600' : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, (members.length / maxSize) * 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Teammates List & Available Slots */}
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                              Confirmed Teammates ({members.length} / {maxSize}):
                            </span>
                            <div className="space-y-1.5">
                              {members.map((m) => (
                                <div key={m.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 flex items-center justify-between text-xs">
                                <div>
                                    <div className="font-bold text-slate-900 dark:text-white">{m.studentName}</div>
                                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{m.studentEmail}</div>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    m.role === 'LEADER'
                                      ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-500'
                                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                                  }`}>
                                    {m.role}
                                  </span>
                                </div>
                              ))}

                              {/* Open Capacity Slots */}
                              {Array.from({ length: Math.max(0, maxSize - members.length) }).map((_, idx) => (
                                <div key={`open-slot-${idx}`} className="p-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                  <span className="italic text-[11px]">Open Place {members.length + idx + 1} of {maxSize} (Available)</span>
                                  <button
                                    onClick={() => handleOpenInviteModal(topicId)}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-[11px] underline"
                                  >
                                    + Invite Peer
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Sent Pending Invites */}
                          {teamData.pendingSentInvites && teamData.pendingSentInvites.length > 0 && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Sent Invites Awaiting Acceptance:</span>
                              <div className="space-y-1">
                                {teamData.pendingSentInvites.map(inv => (
                                  <div key={inv.id} className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between p-1.5 bg-amber-50/50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-900/60">
                                    <span>To: <strong className="text-slate-800 dark:text-slate-100">{inv.recipientName}</strong></span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">PENDING</span>
                                      {teamData.isLeader && (
                                        <button
                                          onClick={() => handleCancelInvite(inv.id)}
                                          className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline transition-colors"
                                          title="Cancel this invitation"
                                        >
                                          Cancel
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Shared Deliverables Console (7 cols) */}
                        <div className="lg:col-span-7 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                            <div>
                              <h5 className="text-sm font-bold text-slate-900 dark:text-white">Shared Team Deliverables</h5>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Synchronized for all teammates. Any member can upload or update files.
                              </p>
                            </div>

                            <button
                              onClick={() => {
                                setShowSharedUploadModal(team);
                                setProjectDeliverables({
                                  zipFileUrl: team.zipFileUrl || '',
                                  pptFileUrl: team.pptFileUrl || '',
                                  pdfReportUrl: team.pdfReportUrl || '',
                                  githubRepoUrl: team.githubRepoUrl || '',
                                  liveDemoUrl: team.liveDemoUrl || '',
                                  studentComments: team.studentComments || ''
                                });
                              }}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs w-fit"
                            >
                              <UploadCloud className="w-4 h-4 text-white" />
                              <span>{team.zipFileUrl ? 'Update Deliverables' : 'Upload Deliverables'}</span>
                            </button>
                          </div>

                          {/* Deliverables Links Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {/* ZIP Archive */}
                            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                                <Archive className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                <span>Source Code ZIP</span>
                              </div>
                              {team.zipFileUrl ? (
                                <a href={team.zipFileUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline break-all block">
                                  Download ZIP Archive &rarr;
                                </a>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 italic">Not uploaded yet</span>
                              )}
                            </div>

                            {/* PPT Presentation */}
                            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                                <Presentation className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                <span>Presentation Deck (PPT)</span>
                              </div>
                              {team.pptFileUrl ? (
                                <a href={team.pptFileUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline break-all block">
                                  View Presentation &rarr;
                                </a>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 italic">Not uploaded yet</span>
                              )}
                            </div>

                            {/* PDF Report */}
                            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Technical Documentation (PDF)</span>
                              </div>
                              {team.pdfReportUrl ? (
                                <a href={team.pdfReportUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline break-all block">
                                  Open PDF Report &rarr;
                                </a>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 italic">Not uploaded yet</span>
                              )}
                            </div>

                            {/* GitHub Repo */}
                            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-bold">
                                <FolderGit2 className="w-4 h-4 text-slate-900 dark:text-slate-100" />
                                <span>GitHub Repository</span>
                              </div>
                              {team.githubRepoUrl ? (
                                <a href={team.githubRepoUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline break-all block">
                                  Explore Repository &rarr;
                                </a>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 italic">Not uploaded yet</span>
                              )}
                            </div>
                          </div>

                          {/* Live Demo URL if present */}
                          {team.liveDemoUrl && (
                            <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/40 text-xs flex items-center justify-between">
                              <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                                <ExternalLink className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Live Deployment:
                              </span>
                              <a href={team.liveDemoUrl} target="_blank" rel="noreferrer" className="text-emerald-800 dark:text-emerald-300 font-mono font-bold hover:underline">
                                {team.liveDemoUrl}
                              </a>
                            </div>
                          )}

                          {/* Last updated by banner */}
                          {team.lastUpdatedByName && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-700">
                              Last updated by: <strong className="text-slate-700 dark:text-slate-200 font-bold">{team.lastUpdatedByName}</strong>
                              {team.lastUpdatedAt && ` on ${new Date(team.lastUpdatedAt).toLocaleString()}`}
                            </div>
                          )}

                          {/* Trainer Evaluation Result */}
                          {team.score != null && (
                            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-4 space-y-2 text-xs text-emerald-950 dark:text-emerald-100">
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-sm uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                                  <span>Trainer Evaluation Result</span>
                                </span>
                                <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                                  Score: {team.score} / 100
                                </span>
                              </div>
                              {team.feedback && (
                                <p className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                  <strong>Faculty Feedback:</strong> {team.feedback}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Topics from Faculty Trainers */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Available Project Topics from Faculty Trainers</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multiple students can select the same topic. Once chosen, invite peers who chose that same topic to collaborate.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableTopics.map((topic) => {
                const isSelected = !!myTeamByTopic[topic.id];
                return (
                  <div key={topic.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 bg-white dark:bg-slate-900 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 justify-between">
                        <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                          {topic.subjectName || 'Core Engineering'}
                        </span>
                        <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                          Team: {topic.minTeamSize || 2} to {topic.maxTeamSize || 4} Members
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">{topic.title}</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{topic.description}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Instructor: <span className="font-semibold text-slate-700 dark:text-slate-300">{topic.trainerName || 'Faculty'}</span>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-mono">Deadline: {topic.deadline || 'Open'}</span>
                      {isSelected ? (
                        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Selected (Active Team Above)</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSelectTopic(topic.id)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                        >
                          Select Project Topic
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROCTORED EXAMS (TRAINER-ASSIGNED ASSESSMENTS) */}
      {activeTab === 'exams' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Trainer-Assigned Assessments (Institutional Proctored Exams)</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span>{user?.institutionName || 'Enrolled Institution'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Formal subject examinations assigned by your institution&apos;s faculty. Enforces safe-browsing lockdown and a strict single-attempt policy. (For continuous self-evaluation and unlimited practice attempts, explore module self-assessments under <strong>Study Materials</strong>).
              </p>
            </div>
          </div>

          {/* Mobile / Tablet Lockdown Advisory */}
          {isMobileOrTablet && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 rounded-xl p-4 text-xs flex items-start gap-3 shadow-xs animate-fadeIn">
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-sm font-bold text-rose-950 dark:text-rose-200 block">Device Security Lockdown: Desktop or Laptop Required</strong>
                <p className="text-rose-800 dark:text-rose-300 mt-1 leading-relaxed">
                  Proctored assessments cannot be conducted on mobile phones or tablets due to hardware facial surveillance, physical keyboard requirements, and full-screen proctoring constraints. Please log in from a PC or laptop to attempt examinations.
                </p>
              </div>
            </div>
          )}

          {(() => {
            const trainerAssignedExams = [...examStatuses]
              .filter((ex) => ex.assessmentType !== 'SELF_ASSESSMENT')
              .sort((a, b) => {
                // 1. In-progress / actively triggered assessments take topmost priority
                const aInProgress = (a.displayStatus === 'IN_PROGRESS' || a.attemptStatus === 'IN_PROGRESS') ? 1 : 0;
                const bInProgress = (b.displayStatus === 'IN_PROGRESS' || b.attemptStatus === 'IN_PROGRESS') ? 1 : 0;
                if (aInProgress !== bInProgress) return bInProgress - aInProgress;

                // 2. Actionable assessments (can start or re-attempt permitted) take precedence over locked/missed
                const aActionable = (a.canReattempt || (a.displayStatus !== 'DONE' && a.displayStatus !== 'SUBMITTED' && a.displayStatus !== 'MISSED')) ? 1 : 0;
                const bActionable = (b.canReattempt || (b.displayStatus !== 'DONE' && b.displayStatus !== 'SUBMITTED' && b.displayStatus !== 'MISSED')) ? 1 : 0;
                if (aActionable !== bActionable) return bActionable - aActionable;

                // 3. Most recently triggered / started / created time (newest first)
                const timeA = new Date(a.startedAt || a.createdAt || a.scheduledStartTime || 0).getTime();
                const timeB = new Date(b.startedAt || b.createdAt || b.scheduledStartTime || 0).getTime();
                if (timeB !== timeA) return timeB - timeA;

                // 4. Fallback to examId descending (newest exam first)
                return (b.examId || 0) - (a.examId || 0);
              });

            if (trainerAssignedExams.length === 0) {
              return (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30 space-y-2">
                  <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">No trainer-assigned assessments currently scheduled</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    When your institution faculty schedules a formal examination, it will appear here for you to attempt under proctored lockdown.
                  </p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trainerAssignedExams.map((ex, idx) => {
                  const termRecord = vigilanceHistory.find(v =>
                    (v.examId === ex.examId || (v.attemptId && v.attemptId === ex.attemptId)) &&
                    (v.status === 'TERMINATED_BY_VIOLATION' || v.actionType === 'TERMINATE_EXAM')
                  );
                  const isTerminated = (ex.displayStatus === 'TERMINATED' || ex.attemptStatus === 'TERMINATED_BY_VIOLATION' || !!termRecord);
                  const displayStatus = isTerminated ? 'TERMINATED' : (ex.displayStatus || 'AVAILABLE');
                  const isDone = (displayStatus === 'DONE' || displayStatus === 'SUBMITTED') && !isTerminated;
                  const isMissed = displayStatus === 'MISSED' && !isTerminated;
                  const canStart = (!isDone && !isMissed && !isTerminated) || ex.canReattempt;
                  const isRecentlyTriggered = !isTerminated && (displayStatus === 'IN_PROGRESS' || (ex.canReattempt && isDone) || (idx === 0 && canStart));

                  return (
                    <div
                      key={ex.examId}
                      className={`border rounded-xl p-5 space-y-3 transition-colors ${
                        isTerminated
                          ? 'border-rose-300 dark:border-rose-900/80 bg-rose-50/30 dark:bg-rose-950/20 shadow-xs'
                          : displayStatus === 'IN_PROGRESS'
                          ? 'border-blue-400 dark:border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 shadow-sm ring-1 ring-blue-300 dark:ring-blue-700'
                          : isRecentlyTriggered
                          ? 'border-amber-300 dark:border-amber-700/80 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              {ex.durationMinutes} Min Duration • {ex.totalMarks} Total Marks
                            </span>
                            <span className="text-[10px] font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span>{ex.institutionName || user?.institutionName || 'Institutional Faculty'}</span>
                            </span>
                            {isRecentlyTriggered && (
                              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                <span>Recently Triggered</span>
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{ex.title}</h4>
                        </div>
                        <span className={`px-2.5 py-1 rounded text-xs font-bold border shrink-0 ${
                          isTerminated
                            ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                            : isDone
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : isMissed
                            ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                            : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                        }`}>
                          {displayStatus}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ex.description}</p>

                      {isTerminated && (
                        <div className="p-3 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between text-rose-900 dark:text-rose-300 font-bold">
                            <span className="flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Enforcement: Session Terminated</span>
                            </span>
                            {termRecord?.officerStaffId && (
                              <span className="text-[10px] bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-300 px-1.5 py-0.5 rounded font-mono">
                                {termRecord.officerStaffId}
                              </span>
                            )}
                          </div>
                          <p className="text-rose-800 dark:text-rose-200 text-[11px] leading-relaxed">
                            <strong>Reason:</strong> {termRecord?.reason || 'Integrity violation limit breached during proctoring.'}
                          </p>
                          {termRecord?.evidenceSnapshot && (
                            <div className="pt-1 flex items-center gap-1.5 text-[10px] text-rose-700 dark:text-rose-400 font-semibold">
                              <Eye className="w-3 h-3 text-rose-600" />
                              <span>Photo evidence attached to official case record.</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div>
                          {isTerminated ? (
                            (ex.canReattempt || termRecord?.canReattempt) ? (
                              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Re-attempt Permitted by Faculty</span>
                              </span>
                            ) : (
                              <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Audit Record Archived • Single Session Locked</span>
                              </span>
                            )
                          ) : isDone ? (
                            <span className="font-bold text-slate-900 dark:text-white">
                              Score: {ex.score} / {ex.totalMarks} ({ex.percentage}%) • {ex.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          ) : isMissed ? (
                            <span className="font-bold text-rose-700 dark:text-rose-400">
                              Deadline Expired: 0 Marks Awarded
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              Faculty: {ex.trainerName || 'Assigned Instructor'} • Passing: {ex.passingPercentage || 60}%
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {/* 1. If Attempt Record Exists, provide View Scorecard & Performance button */}
                          {(isDone || isTerminated || ex.attemptId) && (
                            <button
                              type="button"
                              onClick={() => handleViewExamScorecard(ex)}
                              disabled={loadingResultExamId === ex.examId}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <FileCheck className="w-4 h-4" />
                              <span>{loadingResultExamId === ex.examId ? 'Loading Scorecard...' : 'View Scorecard & Results'}</span>
                            </button>
                          )}

                          {isTerminated ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (termRecord && termRecord.evidenceSnapshot) {
                                    setSelectedEvidenceModal(termRecord);
                                  } else {
                                    setActiveTab('vigilance-history');
                                  }
                                }}
                                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                              >
                                <ShieldAlert className="w-4 h-4 text-rose-400" />
                                <span>View Reason & Evidence</span>
                              </button>

                              {(ex.canReattempt || termRecord?.canReattempt) && (
                                isMobileOrTablet ? (
                                  <button
                                    disabled
                                    className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed flex items-center gap-1.5 border border-slate-300 dark:border-slate-700"
                                    title="Desktop or Laptop required for Proctored Assessment"
                                  >
                                    <Monitor className="w-4 h-4 text-slate-400" />
                                    <span>Desktop Required</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onOpenExam && onOpenExam(ex.examId)}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Re-attempt Assessment</span>
                                  </button>
                                )
                              )}
                            </>
                          ) : isMobileOrTablet ? (
                            <button
                              disabled
                              className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-bold cursor-not-allowed flex items-center gap-1.5 border border-slate-300 dark:border-slate-700"
                              title="Desktop or Laptop required for Proctored Assessment"
                            >
                              <Monitor className="w-4 h-4 text-slate-400" />
                              <span>Desktop / Laptop Required</span>
                            </button>
                          ) : canStart ? (
                            <button
                              onClick={() => onOpenExam && onOpenExam(ex.examId)}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <ShieldCheck className="w-4 h-4" />
                              {displayStatus === 'IN_PROGRESS'
                                ? 'Resume Proctored Assessment'
                                : (ex.canReattempt && isDone)
                                ? 'Re-attempt Permitted • Start Exam'
                                : 'Start Proctored Assessment'}
                            </button>
                          ) : !isDone && isMissed ? (
                            <button
                              disabled
                              className="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed flex items-center gap-1 border border-slate-300 dark:border-slate-700"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              Exam Closed (Missed)
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 4: RECORDED LECTURES */}
      {activeTab === 'recordings' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recorded Lecture Streamings</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Watch recorded video classes and review faculty instructor notes on demand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.filter(s => s.recordingVideoUrl).map((sess) => (
              <div key={sess.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      {sess.subjectName || 'Computer Science'}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{sess.title}</h4>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {new Date(sess.scheduledAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">{sess.recordingNotes || 'Lecture notes provided by instructor.'}</p>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setWatchingRecordingModal(sess)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Watch Lecture Video
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SUBJECT-WISE MODULAR STUDY MATERIALS */}
      {activeTab === 'materials' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Subject-Wise Modular Study Materials</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Browse official course materials, syllabus modules, code snippets, and system architectures across Global and Institution libraries.
              </p>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Unified Library: Segregated into Global and Institution-private study materials.</span>
            </div>
          </div>

          {/* DUAL LIBRARY FILTER TABS */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setStudyLibraryFilter('ALL')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                studyLibraryFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Academic Subjects ({courses.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setStudyLibraryFilter('GLOBAL')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                studyLibraryFilter === 'GLOBAL'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Global Study-Material Library</span>
            </button>

            <button
              type="button"
              onClick={() => setStudyLibraryFilter('INSTITUTION')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                studyLibraryFilter === 'INSTITUTION'
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>My Institution Library ({user?.institutionName || 'Enrolled Institute'})</span>
            </button>
          </div>

          {(() => {
            const displayedCourses = courses;

            if (displayedCourses.length === 0) {
              return (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/30 space-y-2">
                  <Globe className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">No subjects currently assigned to your curriculum</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Contact your institution administrator for subject enrollment.</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between bg-white dark:bg-slate-900 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {course.category || 'Core Subject'}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                          {course.enrolledCount || 0} Enrolled
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {course.title}
                      </h4>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                        {course.description || 'Structured academic study materials and progressive modules.'}
                      </p>

                      {/* CURRICULUM SCOPE & SPECIFICATION STRIP (Zero trainer details for student privacy) */}
                      <div className="p-3 bg-slate-50/90 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            Library Scope:
                          </span>
                          {studyLibraryFilter === 'GLOBAL' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
                              <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              Global Portal Library
                            </span>
                          ) : studyLibraryFilter === 'INSTITUTION' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full">
                              <Building2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              {course.institutionName || user?.institutionName || 'Institution'} Private
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                              <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Unified (Global &amp; Institution)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 pt-0.5">
                          <p className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Modular sequential syllabus & code patterns</span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Module self-assessments (Unlimited practice retakes for self-evaluation)</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        Progress: {course.progressPercentage || 0}%
                      </span>
                      <button
                        onClick={() => {
                          try {
                            localStorage.setItem('bridgeai_study_filter', studyLibraryFilter);
                          } catch (e) {}
                          if (onSelectCourse) onSelectCourse(course.id);
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>
                          {studyLibraryFilter === 'GLOBAL' ? 'Open Global Study Materials' : studyLibraryFilter === 'INSTITUTION' ? 'Open Institution Materials' : 'Open Study Materials'}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* 6. TAB 6: EARNED CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-6 animate-fadeIn">

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={certSearchQuery}
                onChange={(e) => setCertSearchQuery(e.target.value)}
                placeholder="Search by subject, examination title, or credential code..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Showing <strong>{
                certificates.filter(c => {
                  if (!certSearchQuery.trim()) return true;
                  const q = certSearchQuery.toLowerCase();
                  return (
                    (c.courseTitle && c.courseTitle.toLowerCase().includes(q)) ||
                    (c.certificateCode && c.certificateCode.toLowerCase().includes(q)) ||
                    (c.studentName && c.studentName.toLowerCase().includes(q))
                  );
                }).length
              }</strong> of <strong>{certificates.length}</strong> credentials</span>
              {certSearchQuery && (
                <button
                  type="button"
                  onClick={() => setCertSearchQuery('')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {/* Certificates Grid / Empty State */}
          {(() => {
            const filteredCerts = certificates.filter(c => {
              if (!certSearchQuery.trim()) return true;
              const q = certSearchQuery.toLowerCase();
              return (
                (c.courseTitle && c.courseTitle.toLowerCase().includes(q)) ||
                (c.certificateCode && c.certificateCode.toLowerCase().includes(q)) ||
                (c.studentName && c.studentName.toLowerCase().includes(q))
              );
            });

            if (certificates.length === 0) {
              return (
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center space-y-4 shadow-2xs">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <Award className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">No Certificates Earned Yet</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                      Certificates are automatically awarded when you achieve 60% or higher in formal Proctored Subject Examinations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('exams')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>View Scheduled Proctored Exams</span>
                  </button>
                </div>
              );
            }

            if (filteredCerts.length === 0) {
              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                  <p>No certificates match &quot;{certSearchQuery}&quot;.</p>
                  <button
                    type="button"
                    onClick={() => setCertSearchQuery('')}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                  >
                    Reset search filter
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCerts.map((c) => {
                  const isDistinction = (c.gradePercentage || 0) >= 75;
                  const dateStr = new Date(c.issueDate || c.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <div
                      key={c.id || c.certificateCode}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group relative overflow-hidden"
                    >
                      {/* Top Accent Stripe */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />

                      <div className="space-y-3 pt-1">
                        {/* Card Header Badge & Type */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                              <Award className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                                {isDistinction ? 'Merit & Distinction' : 'Verified Passing'}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-mono">
                                Exam #{c.examId || c.id}
                              </span>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            VERIFIED
                          </span>
                        </div>

                        {/* Title & Recipient */}
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                            {c.courseTitle}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Conferred to: <strong className="text-slate-800 dark:text-slate-200">{c.studentName}</strong>
                          </p>
                        </div>

                        {/* Credential ID Code with 1-click copy */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 block">Credential ID</span>
                            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                              {c.certificateCode}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyCertCode(c.certificateCode)}
                            className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1 shrink-0"
                            title="Copy Credential ID"
                          >
                            <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            <span>{copiedCertCode === c.certificateCode ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        {/* Metadata row: Grade & Date */}
                        <div className="grid grid-cols-2 gap-2 pt-1 text-xs border-t border-slate-100 dark:border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Score Achieved</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <strong className={`font-bold ${isDistinction ? 'text-emerald-700 dark:text-emerald-400' : 'text-blue-700 dark:text-blue-400'}`}>
                                {c.gradePercentage}%
                              </strong>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                ({isDistinction ? 'Distinction' : 'Passed'})
                              </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Date of Issue</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300 block mt-0.5">
                              {dateStr}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCertificate(c)}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-300" />
                          <span>View Certificate</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintCertificate(c)}
                          className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                          title="Print or Save as PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                          <span>Print</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 8: VIGILANCE & TERMINATION HISTORY (IMMUTABLE INTEGRITY AUDIT TRAIL) */}
      {activeTab === 'vigilance-history' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <span>Vigilance & Examination Termination History</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-500" />
                    <span>{user?.institutionName || 'Institutional Examination Authority'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Official immutable audit records of proctoring enforcement actions, academic integrity observations, violation warnings, and examination termination events with attached photographic evidence.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchStudentData}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Sync Records</span>
                </button>
              </div>
            </div>

            {/* Metrics Overview Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Integrity Standing</span>
                <div className="flex items-center gap-1.5 mt-1">
                  {vigilanceHistory.some(v => v.status === 'TERMINATED_BY_VIOLATION' || v.actionType === 'TERMINATE_EXAM') ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                      <span className="text-sm font-bold text-rose-700 dark:text-rose-400">Infraction Logged</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Good Standing</span>
                    </>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Terminated Sessions</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400 block mt-0.5">
                  {vigilanceHistory.filter(v => v.status === 'TERMINATED_BY_VIOLATION' || v.actionType === 'TERMINATE_EXAM').length}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Formal Warnings</span>
                <span className="text-lg font-black text-amber-600 dark:text-amber-400 block mt-0.5">
                  {vigilanceHistory.filter(v => v.actionType === 'ISSUE_WARNING' || v.actionType === 'WARNING').length}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Evidence Files Attached</span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400 block mt-0.5">
                  {vigilanceHistory.filter(v => v.evidenceSnapshot).length}
                </span>
              </div>
            </div>
          </div>

          {/* Incidents List / Clean Record State */}
          {vigilanceHistory.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-10 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Clean Proctoring Record</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  No vigilance interventions, warning strikes, or exam termination records have been registered for your account. All proctored examinations have been completed under academic honor principles.
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Clean Candidate Standing</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {vigilanceHistory.map((incident, idx) => {
                const isTermination = incident.status === 'TERMINATED_BY_VIOLATION' || incident.actionType === 'TERMINATE_EXAM';
                const dateStr = incident.terminatedAt || incident.timestamp || incident.completedAt;
                const formattedDate = dateStr ? new Date(dateStr).toLocaleString() : 'Recent Session';

                return (
                  <div
                    key={incident.attemptId || incident.id || idx}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs space-y-4 transition-all ${
                      isTermination
                        ? 'border-rose-300 dark:border-rose-900/80 ring-1 ring-rose-200 dark:ring-rose-900/40'
                        : 'border-amber-300 dark:border-amber-900/80 ring-1 ring-amber-200 dark:ring-amber-900/40'
                    }`}
                  >
                    {/* Incident Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                            isTermination
                              ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
                              : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                          }`}>
                            <ShieldAlert className="w-3 h-3" />
                            <span>{isTermination ? 'Examination Session Terminated' : 'Official Warning Issued'}</span>
                          </span>

                          <span className="text-xs font-mono font-semibold text-slate-500">
                            Attempt #{incident.attemptId || 'N/A'}
                          </span>

                          {incident.evidenceId && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              Ref: {incident.evidenceId}
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {incident.examTitle || 'Proctored Examination'}
                        </h4>
                      </div>

                      <div className="text-left sm:text-right text-xs text-slate-500">
                        <div className="flex items-center sm:justify-end gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          Enforcement Level: <strong>{incident.severity || 'CRITICAL'}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Main Incident Details & Attached Photo Evidence */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Left: Reason, Officer & Remarks (7 Cols) */}
                      <div className="lg:col-span-7 space-y-3.5">
                        {/* Stated Reason */}
                        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs space-y-1">
                          <span className="text-[10px] uppercase font-bold text-rose-800 dark:text-rose-400 tracking-wider block">
                            Official Stated Reason for Termination / Action
                          </span>
                          <p className="font-bold text-rose-950 dark:text-rose-200 text-sm leading-relaxed">
                            {incident.reason || 'Terminated due to multiple security violations logged during assessment.'}
                          </p>
                        </div>

                        {/* Officer & Observations */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                            <span className="text-slate-500">Enforcing Authority:</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {incident.officerName || 'Institutional Sentinel'} ({incident.officerStaffId || 'VO-SEC'})
                            </span>
                          </div>

                          {incident.officerNotes && (
                            <div>
                              <span className="text-[11px] text-slate-500 block mb-0.5 font-medium">Officer Remarks & Notes:</span>
                              <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                                &quot;{incident.officerNotes}&quot;
                              </p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 text-[11px]">
                            <span className="text-slate-500">Security Violation Count:</span>
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              {incident.violationCount || 0} strike(s) recorded
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Re-attempt Status:</span>
                            <span className={`font-bold ${incident.canReattempt ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                              {incident.canReattempt ? 'Re-attempt Approved by Faculty' : 'Locked (Institutional Authorization Required)'}
                            </span>
                          </div>

                          {incident.canReattempt && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                              {isMobileOrTablet ? (
                                <button
                                  disabled
                                  className="w-full py-2 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700"
                                  title="Desktop or Laptop required for Proctored Assessment"
                                >
                                  <Monitor className="w-4 h-4 text-slate-400" />
                                  <span>Desktop / Laptop Required to Re-attempt</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => onOpenExam && onOpenExam(incident.examId)}
                                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                                >
                                  <ShieldCheck className="w-4 h-4" />
                                  <span>Re-attempt Assessment Now (Faculty Approved)</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Timeline of interventions during attempt if any */}
                        {incident.interventions && incident.interventions.length > 1 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block">
                              Prior Interventions During This Session ({incident.interventions.length}):
                            </span>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                              {incident.interventions.map((inv, i) => (
                                <div key={i} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] flex items-center justify-between">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    {inv.actionType}: {inv.reason || inv.chatMessage}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {inv.timestamp ? new Date(inv.timestamp).toLocaleTimeString() : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Attached Photographic Evidence (5 Cols) */}
                      <div className="lg:col-span-5 flex flex-col">
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 h-full flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <Camera className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                                <span>Attached Photographic Evidence</span>
                              </span>
                              {incident.evidenceSnapshot && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  Photo on File
                                </span>
                              )}
                            </div>

                            {incident.evidenceSnapshot ? (
                              <div
                                className="relative group rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-black cursor-pointer shadow-xs"
                                onClick={() => setSelectedEvidenceModal(incident)}
                              >
                                <img
                                  src={incident.evidenceSnapshot}
                                  alt="Attached Evidence Snapshot"
                                  className="w-full h-44 object-cover transition-transform group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                                  <Eye className="w-4 h-4 text-white" />
                                  <span>Zoom / Inspect Evidence</span>
                                </div>
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono">
                                  Archived Forensic Snapshot
                                </div>
                              </div>
                            ) : (
                              <div className="h-44 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-1.5 bg-white dark:bg-slate-900">
                                <Camera className="w-6 h-6 text-slate-300" />
                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">No Photographic Snapshot Attached</span>
                                <p className="text-[10px] text-slate-400 max-w-xs">
                                  This incident was recorded as a direct telemetry strike without an attached camera or screen snapshot.
                                </p>
                              </div>
                            )}
                          </div>

                          {incident.evidenceSnapshot && (
                            <button
                              type="button"
                              onClick={() => setSelectedEvidenceModal(incident)}
                              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-rose-400" />
                              <span>Inspect Full Resolution Evidence</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
        </div>
      </div>

      {/* MODAL 1: Submit Assignment (PDF) */}
      {submitAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Submit Assignment Deliverable</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{submitAssignmentModal.assignment.title}</p>
              </div>
              <button onClick={() => setSubmitAssignmentModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-3.5">
              <div>
                <FileUploadInput
                  label="PDF Deliverable Document"
                  value={assignForm.pdfSubmissionUrl}
                  onChange={(url) => setAssignForm({ ...assignForm, pdfSubmissionUrl: url })}
                  accept=".pdf"
                  category="ASSIGNMENT_SUBMISSION"
                  required
                  helperText="Upload your PDF deliverable directly from your computer. It will be saved into the Aiven MySQL database."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Student Comments / Problem Explanation
                </label>
                <textarea
                  rows="4"
                  value={assignForm.submissionContent}
                  onChange={(e) => setAssignForm({ ...assignForm, submissionContent: e.target.value })}
                  placeholder="Summarize your implementation, key findings, and architectural decisions..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubmitAssignmentModal(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                >
                  Confirm PDF Submission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2A: Peer Discovery & Team Invitations */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Invite Teammates to Project</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing peers who have chosen this exact same project topic
                </p>
              </div>
              <button onClick={() => setShowInviteModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {peersList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                  No other students have chosen this project topic yet. As more students select it, they will appear here for invitations.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                  {peersList.map((peer) => {
                    const activeTeam = myTeamByTopic[showInviteModal]?.team;
                    const myMembers = myTeamByTopic[showInviteModal]?.members || [];
                    const isSolo = myMembers.length <= 1;

                    return (
                      <div key={peer.studentId} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{peer.studentName}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{peer.studentEmail}</div>
                          {peer.hasTeam && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              In Team: <strong className="text-slate-800 dark:text-slate-200">{peer.teamName || 'Another Team'}</strong>
                              {peer.teamMemberCount > 0 && ` (${peer.teamMemberCount}/${peer.teamCapacity} Members)`}
                            </span>
                          )}
                        </div>

                        <div>
                          {/* Option 1: Peer's team has space and current user is solo -> Can join their team! */}
                          {peer.hasTeam && peer.teamHasSpace && isSolo ? (
                            <button
                              onClick={() => handleJoinTeam(peer.teamId)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-xs"
                            >
                              Join Team
                            </button>
                          ) : peer.isCommittedMultiMember && !peer.teamHasSpace ? (
                            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              Team Full
                            </span>
                          ) : peer.isCommittedMultiMember && !isSolo ? (
                            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              In Another Team
                            </span>
                          ) : peer.alreadyInvited ? (
                            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Invite Sent
                            </span>
                          ) : (
                            <button
                              disabled={!activeTeam}
                              onClick={() => handleSendInvite(activeTeam.id, peer.studentId)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors shadow-xs"
                            >
                              + Send Invite
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowInviteModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2B: Rename Team */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Rename Team</h3>
              <button onClick={() => setShowRenameModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRenameTeam} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Team Name *</label>
                <input
                  type="text"
                  required
                  value={renameTeamInput}
                  onChange={(e) => setRenameTeamInput(e.target.value)}
                  placeholder="e.g. Distributed Core Team"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors shadow-xs"
                >
                  Save Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2C: Shared Deliverables Upload (Available to ANY teammate) */}
      {showSharedUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload Shared Team Deliverables</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Team: <strong>{showSharedUploadModal.teamName}</strong> • Visible to all teammates
                </p>
              </div>
              <button onClick={() => setShowSharedUploadModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSharedDeliverables} className="space-y-3.5">
              <div>
                <FileUploadInput
                  label="Source Code ZIP Archive"
                  value={projectDeliverables.zipFileUrl}
                  onChange={(url) => setProjectDeliverables({ ...projectDeliverables, zipFileUrl: url })}
                  accept=".zip,.rar,.tar,.gz,.7z"
                  category="PROJECT_ZIP"
                  required
                  helperText="Upload source code ZIP archive from computer directly to Aiven MySQL."
                />
              </div>

              <div>
                <FileUploadInput
                  label="Presentation Slides (PPT / PPTX / PDF)"
                  value={projectDeliverables.pptFileUrl}
                  onChange={(url) => setProjectDeliverables({ ...projectDeliverables, pptFileUrl: url })}
                  accept=".ppt,.pptx,.pdf"
                  category="PROJECT_PPT"
                  required
                  helperText="Upload presentation slide deck from computer to Aiven MySQL."
                />
              </div>

              <div>
                <FileUploadInput
                  label="Technical Architecture Report (PDF)"
                  value={projectDeliverables.pdfReportUrl}
                  onChange={(url) => setProjectDeliverables({ ...projectDeliverables, pdfReportUrl: url })}
                  accept=".pdf"
                  category="PROJECT_PDF"
                  required
                  helperText="Upload technical architecture report PDF from computer to Aiven MySQL."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Public GitHub / GitLab Repository URL *</label>
                <input
                  type="url"
                  required
                  value={projectDeliverables.githubRepoUrl}
                  onChange={(e) => setProjectDeliverables({ ...projectDeliverables, githubRepoUrl: e.target.value })}
                  placeholder="https://github.com/team-alpha/microservices"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Live Deployment / Cloud URL (Optional)</label>
                <input
                  type="url"
                  value={projectDeliverables.liveDemoUrl}
                  onChange={(e) => setProjectDeliverables({ ...projectDeliverables, liveDemoUrl: e.target.value })}
                  placeholder="https://demo-app.bridgeai.edu"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Team Comments / Architecture Notes</label>
                <textarea
                  rows="2"
                  value={projectDeliverables.studentComments}
                  onChange={(e) => setProjectDeliverables({ ...projectDeliverables, studentComments: e.target.value })}
                  placeholder="Brief note explaining architecture, deployment steps, or teammate contribution notes..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSharedUploadModal(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-xs"
                >
                  Submit for Entire Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Submit Project Deliverables */}
      {submitProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Submit Project Deliverables</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{submitProjectModal.title}</p>
              </div>
              <button onClick={() => setSubmitProjectModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitProject} className="space-y-3.5">
              <div>
                <FileUploadInput
                  label="ZIP Archive (Source Code)"
                  value={projectDeliverables.zipFileUrl}
                  onChange={(url) => setProjectDeliverables({ ...projectDeliverables, zipFileUrl: url })}
                  accept=".zip,.rar,.tar,.gz,.7z"
                  category="PROJECT_ZIP"
                  helperText="Upload source code archive directly from your computer to Aiven MySQL."
                />
              </div>

              <div>
                <FileUploadInput
                  label="PPT Presentation Slides"
                  value={projectDeliverables.pptFileUrl}
                  onChange={(url) => setProjectDeliverables({ ...projectDeliverables, pptFileUrl: url })}
                  accept=".ppt,.pptx,.pdf"
                  category="PROJECT_PPT"
                  helperText="Upload slide deck from your computer directly into Aiven MySQL."
                />
              </div>

              <div>
                <FileUploadInput
                  label="PDF Technical Report"
                  value={projectDeliverables.pdfReportUrl}
                  onChange={(url) => setProjectDeliverables({ ...projectDeliverables, pdfReportUrl: url })}
                  accept=".pdf"
                  category="PROJECT_PDF"
                  helperText="Upload technical project documentation PDF directly to Aiven MySQL."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Public GitHub Repository</label>
                <input
                  type="url"
                  value={projectDeliverables.githubRepoUrl}
                  onChange={(e) => setProjectDeliverables({ ...projectDeliverables, githubRepoUrl: e.target.value })}
                  placeholder="https://github.com/my-username/project-repo"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubmitProjectModal(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors shadow-xs"
                >
                  Submit Deliverables
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Video Streaming Player */}
      {watchingRecordingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="bg-slate-900 border-b border-slate-800 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">{watchingRecordingModal.title}</h3>
                <p className="text-[11px] text-slate-400">Streamed Recording</p>
              </div>
              <button onClick={() => setWatchingRecordingModal(null)} className="text-slate-400 hover:text-white p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-video w-full bg-black">
              <iframe
                src={watchingRecordingModal.recordingVideoUrl}
                title={watchingRecordingModal.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">Instructor Session Notes:</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">{watchingRecordingModal.recordingNotes || 'No notes attached.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Full View & Printable Certificate */}
      {selectedCertificate && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm p-4 sm:p-6 animate-fadeIn"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCertificate(null);
          }}
        >
          {/* Top-right Floating Close Button (Always visible on viewport) */}
          <button
            type="button"
            onClick={() => setSelectedCertificate(null)}
            className="no-print fixed top-4 right-4 sm:top-6 sm:right-6 z-50 px-3.5 py-1.5 bg-slate-900/90 hover:bg-rose-600 text-white border border-slate-700 hover:border-rose-500 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xl transition-all"
            title="Close Certificate (Esc)"
          >
            <X className="w-4 h-4" />
            <span>Close (Esc)</span>
          </button>

          <div className="min-h-full flex flex-col items-center justify-start sm:justify-center py-6">
            <div className="w-full max-w-3xl space-y-3 relative" onClick={(e) => e.stopPropagation()}>
              {/* Modal Top Control Bar (Hidden on Print) */}
              <div className="no-print bg-slate-900 text-white px-4 py-3 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-lg border border-slate-700">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">Official Institutional Credential</h4>
                    <p className="text-[10px] text-slate-400">Verifiable tamper-evident certification document</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadCertificateHtml(selectedCertificate)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                    title="Download standalone offline certificate file"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Print or Save as PDF"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save as PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCertificate(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-rose-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-700 hover:border-rose-500 shadow-sm"
                    title="Close Certificate"
                  >
                    <X className="w-4 h-4" />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              {/* Certificate Canvas (Optimized for High Quality Print & Screen Viewing) */}
              <div className="printable-certificate bg-white text-slate-900 rounded-2xl p-8 sm:p-12 border-4 border-double border-amber-600 shadow-2xl relative overflow-hidden text-center space-y-6">
                {/* Close 'X' Button on Card Corner */}
                <button
                  type="button"
                  onClick={() => setSelectedCertificate(null)}
                  className="no-print absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 transition-colors border border-slate-200 dark:border-slate-700 z-10 shadow-2xs"
                  title="Close Certificate"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Inner Decorative Border */}
                <div className="absolute inset-3 border border-amber-300/80 rounded-xl pointer-events-none" />

                {/* Institution Seal & Watermark Header */}
                <div className="space-y-1 pt-2">
                  <div className="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-500 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
                    <Award className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="text-xs uppercase tracking-[0.3em] font-extrabold text-amber-900 mt-2">
                    {user?.institutionName || 'BRIDGEAI NATIONAL INSTITUTE OF COMPUTING'}
                  </h3>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                    ACCREDITED TECHNICAL &amp; EXAMINATION COUNCIL
                  </p>
                </div>

                {/* Main Diploma Typography */}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-wide">
                    CERTIFICATE OF ACHIEVEMENT
                  </h1>
                  <p className="text-xs italic text-slate-500 font-serif">
                    This official credential is proudly awarded to
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-800 underline decoration-amber-400 decoration-2 underline-offset-8 py-1">
                    {selectedCertificate.studentName}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed pt-2">
                    for demonstrating technical mastery and successfully passing the formal proctored academic examination for:
                  </p>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 max-w-xl mx-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl mt-1">
                    {selectedCertificate.courseTitle}
                  </h3>
                </div>

                {/* Distinction & Grade Badge */}
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 border border-amber-300 rounded-full text-xs font-bold text-amber-950 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    <span>Grade Awarded: {selectedCertificate.gradePercentage}% ({selectedCertificate.gradePercentage >= 75 ? 'First Class Distinction' : 'Passed'})</span>
                  </div>
                </div>

                {/* Authority Signatures & Official Stamp */}
                <div className="grid grid-cols-3 items-end gap-4 pt-6 border-t border-slate-200 text-center">
                  <div>
                    <div className="h-10 border-b border-slate-400 flex items-end justify-center font-serif italic text-xs text-slate-700 pb-1">
                      Academic Dean
                    </div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-1">
                      Dean of Academic Studies
                    </span>
                  </div>

                  <div>
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-600 bg-amber-50/70 text-amber-800 flex flex-col items-center justify-center mx-auto shadow-inner">
                      <ShieldCheck className="w-5 h-5 text-amber-600" />
                      <span className="text-[7px] font-bold uppercase tracking-tighter">VERIFIED</span>
                    </div>
                    <span className="block text-[10px] uppercase tracking-wider text-amber-800 font-bold mt-1">
                      Institutional Seal
                    </span>
                  </div>

                  <div>
                    <div className="h-10 border-b border-slate-400 flex items-end justify-center font-mono font-bold text-xs text-slate-800 pb-1">
                      {selectedCertificate.certificateCode}
                    </div>
                    <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-1">
                      Controller of Examinations
                    </span>
                  </div>
                </div>

                {/* Bottom Verification Footer */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
                  <span>Issue Date: {new Date(selectedCertificate.issueDate || selectedCertificate.createdAt).toLocaleDateString()}</span>
                  <span>Verification ID: {selectedCertificate.certificateCode}</span>
                  <span>Registry: BridgeAI Cryptographic Ledger</span>
                </div>

                {/* Bottom Action Buttons (Hidden on Print) */}
                <div className="no-print pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => handleCopyCertCode(selectedCertificate.certificateCode)}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700"
                    title="Copy Certificate ID"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>{copiedCertCode === selectedCertificate.certificateCode ? 'Code Copied!' : 'Copy Credential ID'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadCertificateHtml(selectedCertificate)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                      title="Download offline HTML certificate"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Save as PDF or Print"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print / PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCertificate(null)}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Close Certificate modal"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Close Certificate</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 7: Photographic Evidence Inspector Modal */}
      {selectedEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-rose-600/80 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] text-white">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-950 text-rose-500 border border-rose-800 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                      Official Forensic Evidence
                    </span>
                    {selectedEvidenceModal.evidenceId && (
                      <span className="text-xs font-mono text-slate-400">
                        {selectedEvidenceModal.evidenceId}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {selectedEvidenceModal.examTitle || 'Proctored Assessment Session'}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEvidenceModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Image & Details */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Evidence Photo Frame */}
              {selectedEvidenceModal.evidenceSnapshot ? (
                <div className="relative rounded-2xl overflow-hidden border-2 border-slate-700 bg-black shadow-inner flex items-center justify-center">
                  <img
                    src={selectedEvidenceModal.evidenceSnapshot}
                    alt="Photographic Evidence"
                    className="w-full max-h-[50vh] object-contain"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur-xs text-[11px] font-mono text-rose-300 border border-rose-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span>TAMPER-EVIDENT ARCHIVE</span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-700 rounded-2xl">
                  <Camera className="w-10 h-10 mx-auto text-slate-500 mb-2" />
                  <p className="text-sm font-semibold">No photographic snapshot file was attached with this record.</p>
                </div>
              )}

              {/* Case Details Card */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                      Enforcing Authority
                    </span>
                    <span className="font-semibold text-white mt-0.5 block">
                      {selectedEvidenceModal.officerName || 'Institutional Sentinel'} ({selectedEvidenceModal.officerStaffId || 'VO-SEC'})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                      Incident Timestamp
                    </span>
                    <span className="font-mono text-slate-300 mt-0.5 block">
                      {selectedEvidenceModal.terminatedAt || selectedEvidenceModal.timestamp ? new Date(selectedEvidenceModal.terminatedAt || selectedEvidenceModal.timestamp).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-rose-400 uppercase tracking-wider font-bold block">
                    Official Stated Reason
                  </span>
                  <p className="font-bold text-white text-sm mt-0.5 leading-relaxed">
                    {selectedEvidenceModal.reason || 'Terminated due to multiple security violations logged during assessment.'}
                  </p>
                </div>

                {selectedEvidenceModal.officerNotes && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">
                      Officer Detailed Observations
                    </span>
                    <p className="text-slate-300 italic mt-0.5 leading-relaxed">
                      &quot;{selectedEvidenceModal.officerNotes}&quot;
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-mono">
                Cryptographic integrity hash verified by Institutional Vigilance Bureau
              </span>

              <div className="flex items-center gap-2">
                {selectedEvidenceModal.evidenceSnapshot && (
                  <a
                    href={selectedEvidenceModal.evidenceSnapshot}
                    download={`evidence_record_${selectedEvidenceModal.attemptId || 'case'}.jpg`}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Evidence Image</span>
                  </a>
                )}
                {selectedEvidenceModal.canReattempt && (
                  isMobileOrTablet ? (
                    <button
                      disabled
                      className="px-3.5 py-2 bg-slate-800 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed flex items-center gap-1.5 border border-slate-700"
                      title="Desktop or Laptop required for Proctored Assessment"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Desktop Required</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const exId = selectedEvidenceModal.examId;
                        setSelectedEvidenceModal(null);
                        if (onOpenExam && exId) onOpenExam(exId);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Re-attempt Assessment</span>
                    </button>
                  )
                )}
                <button
                  type="button"
                  onClick={() => setSelectedEvidenceModal(null)}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
