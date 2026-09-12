import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { DashboardSidebar } from '../components/common/DashboardSidebar';
import {
  ShieldAlert, ShieldCheck, Activity, AlertTriangle, CheckCircle2, PanelLeftOpen, PanelLeftClose,
  XCircle, RefreshCw, Eye, Users, FileText, Search, Clock, Lock, KeyRound,
  Award, ChevronRight, X, AlertCircle, Ban, Send, Filter, CheckCircle,
  Video, Monitor, Mic, MicOff, Camera, MessageSquare, CameraOff,
  Building2, GraduationCap, ChevronDown, ChevronUp, Radio, AlertOctagon,
  Image as ImageIcon, Download, CheckSquare, Maximize2, Minimize2, Sparkles, UserCheck,
  Play, StopCircle, QrCode, Smartphone, Tablet, Copy
} from 'lucide-react';
import { ChangePasswordModal } from '../components/common/ChangePasswordModal';

export const VigilanceDashboard = () => {
  const { user } = useAuth();

  // Navigation: Primary is 'live' (Live Examination Surveillance)
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'warnings' | 'terminations' | 'evidence' | 'activity'
  const [loading, setLoading] = useState(false);
  const [feedRefreshing, setFeedRefreshing] = useState(false);

  // Surveillance Tree & Statistics
  const [surveillanceData, setSurveillanceData] = useState({
    activeInstitutions: 0,
    activeExams: 0,
    liveStudents: 0,
    warnings: 0,
    criticalAlerts: 0,
    disconnected: 0,
    institutions: []
  });

  // Secondary Registry States
  const [warnings, setWarnings] = useState([]);
  const [terminations, setTerminations] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Filter & Hierarchy UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL'); // 'ALL' | 'CRITICAL' | 'WARNING' | 'DISCONNECTED' | 'NORMAL'
  const [selectedInstituteFilter, setSelectedInstituteFilter] = useState('ALL'); // 'ALL' or specific institution name
  const [selectedExamFilter, setSelectedExamFilter] = useState('ALL'); // 'ALL' or specific examId/title
  const [expandedInstitutions, setExpandedInstitutions] = useState({});
  const [expandedExams, setExpandedExams] = useState({});

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('bridgeai_vigilance_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('bridgeai_vigilance_sidebar_open', String(next));
      return next;
    });
  };

  // Nav Items: Live Monitoring is prominent first tab
  const vigilanceNavItems = [
    { id: 'live', label: 'Live Examination Surveillance', icon: Radio, count: surveillanceData.liveStudents, badge: 'Live', badgeColor: 'rose' },
    { id: 'warnings', label: 'Warnings Registry', icon: AlertTriangle, count: warnings.length },
    { id: 'terminations', label: 'Terminations Registry', icon: Ban, count: terminations.length },
    { id: 'evidence', label: 'Evidence Repository', icon: ImageIcon, count: evidenceList.length },
    { id: 'activity', label: 'My Activity Log', icon: Activity, count: activityLogs.length }
  ];

  // Level 4: Individual Student Monitoring Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeSubModal, setActiveSubModal] = useState(null); // null | 'chat' | 'warning' | 'evidence' | 'timeline' | 'terminate'
  const [fullScreenStream, setFullScreenStream] = useState(null); // null | 'camera' | 'screen'
  const [liveFrames, setLiveFrames] = useState({}); // attemptId -> { cameraFrame, screenFrame, timestamp, ... }
  const [globalSurveillanceFeedMode, setGlobalSurveillanceFeedMode] = useState('camera'); // 'camera' | 'screen'
  const [cardStreamModes, setCardStreamModes] = useState({}); // attemptId -> 'camera' | 'screen'

  // Audio Control in monitoring view
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // Chat Drawer State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  // Formal Warning Form State
  const [warningReason, setWarningReason] = useState('UNAUTHORIZED_OBJECT');
  const [warningCustomReason, setWarningCustomReason] = useState('');
  const [warningSeverity, setWarningSeverity] = useState('HIGH');
  const [warningNotes, setWarningNotes] = useState('');
  const [warningSubmitting, setWarningSubmitting] = useState(false);
  const [warningSuccessMsg, setWarningSuccessMsg] = useState(null);
  const [warningErrorMsg, setWarningErrorMsg] = useState(null);

  // Evidence Capture State
  const [capturingEvidence, setCapturingEvidence] = useState(false);
  const [evidenceCapturedSuccess, setEvidenceCapturedSuccess] = useState(null);
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [previewEvidenceItem, setPreviewEvidenceItem] = useState(null);

  // Exam Termination State
  const [terminationReasonCode, setTerminationReasonCode] = useState('MULTIPLE_PERSONS');
  const [terminationExplanation, setTerminationExplanation] = useState('');
  const [attachEvidenceSnapshot, setAttachEvidenceSnapshot] = useState(true);
  const [confirmSingleStudentOnly, setConfirmSingleStudentOnly] = useState(false);
  const [terminateSubmitting, setTerminateSubmitting] = useState(false);
  const [terminateSuccessMsg, setTerminateSuccessMsg] = useState(null);
  const [terminateErrorMsg, setTerminateErrorMsg] = useState(null);

  // Fetch hierarchical surveillance feed & registries
  const fetchSurveillanceFeed = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setFeedRefreshing(true);
    try {
      const [treeRes, warnRes, termRes, evidRes, actRes] = await Promise.all([
        api.get('/vigilance/surveillance-tree'),
        api.get('/boss/vigilance/warnings').catch(() => ({ data: [] })),
        api.get('/boss/vigilance/terminations').catch(() => ({ data: [] })),
        api.get('/vigilance/evidence').catch(() => ({ data: [] })),
        api.get('/boss/vigilance/activity').catch(() => ({ data: [] }))
      ]);

      if (treeRes.data) {
        setSurveillanceData(treeRes.data);

        // Merge backend live frames into liveFrames state
        if (treeRes.data.institutions) {
          const backendFrames = {};
          for (const inst of treeRes.data.institutions) {
            for (const ex of inst.exams || []) {
              for (const st of ex.students || []) {
                if (st.cameraFrame || st.screenFrame) {
                  backendFrames[st.attemptId] = {
                    cameraFrame: st.cameraFrame,
                    screenFrame: st.screenFrame,
                    cameraConnected: st.cameraConnected,
                    screenConnected: st.screenConnected,
                    timestamp: Date.now()
                  };
                }
              }
            }
          }
          if (Object.keys(backendFrames).length > 0) {
            setLiveFrames(prev => ({ ...prev, ...backendFrames }));
          }
        }
      }

      setWarnings(warnRes.data || []);
      setTerminations(termRes.data || []);
      setEvidenceList(evidRes.data || []);
      setActivityLogs(actRes.data || []);
    } catch (err) {
      console.error('Error fetching vigilance surveillance feed:', err);
    } finally {
      if (!isBackground) setLoading(false);
      setFeedRefreshing(false);
    }
  };

  // Real-time broadcast channel listener for local candidate video/screen streams
  useEffect(() => {
    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('bridgeai_surveillance_feed');
        bc.onmessage = (e) => {
          if (e.data?.type === 'FRAME_UPDATE' && e.data.attemptId) {
            setLiveFrames(prev => ({
              ...prev,
              [e.data.attemptId]: {
                cameraFrame: e.data.cameraFrame,
                screenFrame: e.data.screenFrame,
                cameraConnected: e.data.cameraConnected,
                screenConnected: e.data.screenConnected,
                timestamp: e.data.timestamp
              }
            }));
          }
        };
      }
    } catch (err) {
      console.warn('BroadcastChannel not supported:', err);
    }
    return () => {
      if (bc) bc.close();
    };
  }, []);

  // Fast polling of live stream frame when active candidate is being monitored or viewed in fullscreen
  useEffect(() => {
    if (!selectedStudent?.attemptId) return;
    const pollCandidateStream = async () => {
      try {
        const res = await api.get(`/vigilance/feed/stream/${selectedStudent.attemptId}`);
        if (res.data && (res.data.cameraFrame || res.data.screenFrame)) {
          setLiveFrames(prev => ({
            ...prev,
            [selectedStudent.attemptId]: {
              cameraFrame: res.data.cameraFrame,
              screenFrame: res.data.screenFrame,
              cameraConnected: res.data.cameraConnected,
              screenConnected: res.data.screenConnected,
              timestamp: res.data.timestamp
            }
          }));
          setSelectedStudent(prev => prev ? {
            ...prev,
            cameraFrame: res.data.cameraFrame,
            screenFrame: res.data.screenFrame,
            cameraConnected: res.data.cameraConnected,
            screenConnected: res.data.screenConnected
          } : prev);
        }
      } catch (err) {
        // ignore
      }
    };

    pollCandidateStream();
    const streamInterval = setInterval(pollCandidateStream, 1000);
    return () => clearInterval(streamInterval);
  }, [selectedStudent?.attemptId, fullScreenStream]);

  useEffect(() => {
    fetchSurveillanceFeed(false);

    // Live background polling every 5 seconds for real-time surveillance
    const pollTimer = setInterval(() => {
      fetchSurveillanceFeed(true);
    }, 5000);

    return () => clearInterval(pollTimer);
  }, []);

  // When opening individual student monitoring modal, load their chats
  useEffect(() => {
    if (selectedStudent && selectedStudent.attemptId) {
      loadStudentChats(selectedStudent.attemptId);
    }
  }, [selectedStudent]);

  // Fullscreen Stream Handlers
  const handleEnterFullscreen = (mode = 'camera', student = null) => {
    if (student) {
      setSelectedStudent(student);
    }
    setFullScreenStream(mode);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {
      // Fallback to in-window fixed fullscreen overlay
    }
  };

  const handleExitFullscreen = () => {
    setFullScreenStream(null);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {
      // ignore
    }
  };

  // Handle Escape key & fullscreenchange to close fullscreen stream
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && fullScreenStream) {
        handleExitFullscreen();
      }
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && fullScreenStream) {
        handleExitFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [fullScreenStream]);

  const loadStudentChats = async (attemptId) => {
    try {
      const res = await api.get('/vigilance/chat/' + attemptId);
      setChatMessages(res.data || []);
    } catch (err) {
      console.warn('Failed to load chats for attempt:', err);
    }
  };

  // Toggle Institution Accordion
  const toggleInstitution = (instName) => {
    setExpandedInstitutions(prev => ({
      ...prev,
      [instName]: !prev[instName]
    }));
  };

  // Toggle Exam Accordion
  const toggleExam = (examId) => {
    setExpandedExams(prev => ({
      ...prev,
      [examId]: !prev[examId]
    }));
  };

  // Open Individual Student Monitoring Center
  const handleOpenStudentMonitoring = (student) => {
    setSelectedStudent(student);
    setActiveSubModal(null);
    setIsAudioMuted(false);
    setWarningReason('UNAUTHORIZED_ASSISTANCE');
    setWarningCustomReason('');
    setWarningNotes('');
    setTerminationReasonCode('UNAUTHORIZED_ASSISTANCE');
    setTerminationExplanation('');
    setConfirmSingleStudentOnly(false);
  };

  // Send Direct Chat to Candidate
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedStudent) return;
    setSendingChat(true);
    try {
      await api.post('/vigilance/chat/send', {
        attemptId: selectedStudent.attemptId,
        studentId: selectedStudent.studentId,
        studentName: selectedStudent.studentName,
        examId: selectedStudent.examId,
        message: chatInput.trim()
      });
      setChatInput('');
      loadStudentChats(selectedStudent.attemptId);
      fetchSurveillanceFeed(true);
    } catch (err) {
      alert('Failed to send chat message: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingChat(false);
    }
  };

  // Standardized Warning Reasons
  const STANDARDIZED_WARNING_REASONS = [
    { code: 'LOOKING_AWAY', label: 'Repeatedly looking away from the primary exam screen' },
    { code: 'MULTIPLE_PERSONS', label: 'Additional face or unauthorized person detected in camera feed' },
    { code: 'UNAUTHORIZED_ASSISTANCE', label: 'Unauthorized verbal communication or third-party assistance' },
    { code: 'TAB_SWITCH', label: 'Repeated tab switches / application focus lost' },
    { code: 'FULLSCREEN_EXIT', label: 'Attempting to breach or exit mandatory full-screen lockdown' },
    { code: 'SCREEN_SUSPICIOUS', label: 'Unauthorized secondary display, background browser, or remote tool' },
    { code: 'AUDIO_ANOMALY', label: 'Continuous anomalous speech or background conversation detected' },
    { code: 'OTHER', label: 'Other violation (Specify detailed justification below)' }
  ];

  // Submit Formal Candidate Warning
  const handleIssueFormalWarning = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;

    let finalReason = warningReason;
    if (warningReason === 'OTHER') {
      if (!warningCustomReason.trim()) {
        setWarningErrorMsg('Please specify the custom warning reason.');
        return;
      }
      finalReason = warningCustomReason.trim();
    } else {
      const match = STANDARDIZED_WARNING_REASONS.find(r => r.code === warningReason);
      finalReason = match ? match.label : warningReason;
    }

    setWarningSubmitting(true);
    setWarningErrorMsg(null);
    try {
      await api.post('/vigilance/action', {
        studentId: selectedStudent.studentId,
        studentName: selectedStudent.studentName,
        examId: selectedStudent.examId,
        examTitle: selectedStudent.examTitle,
        attemptId: selectedStudent.attemptId,
        actionType: 'ISSUE_WARNING',
        severity: warningSeverity,
        reason: finalReason,
        officerNotes: warningNotes.trim()
      });

      setWarningSuccessMsg('Formal warning dispatched! Immediate acknowledgement overlay pushed to student screen.');
      setTimeout(() => {
        setActiveSubModal(null);
        setWarningSuccessMsg(null);
        setWarningNotes('');
        setWarningCustomReason('');
      }, 1800);
      fetchSurveillanceFeed(true);
    } catch (err) {
      setWarningErrorMsg(err.response?.data?.message || err.message || 'Failed to issue warning.');
    } finally {
      setWarningSubmitting(false);
    }
  };

  // Capture Evidence Frame
  const handleCaptureEvidence = async () => {
    if (!selectedStudent) return;
    setCapturingEvidence(true);
    setEvidenceCapturedSuccess(null);

    try {
      // Generate a canvas frame with metadata stamp to simulate authentic live proctoring frame
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      // Draw dark background gradient
      const grad = ctx.createLinearGradient(0, 0, 640, 360);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 640, 360);

      // Draw simulated webcam / screen elements
      ctx.fillStyle = '#312e81';
      ctx.fillRect(40, 40, 560, 280);

      // Watermark Stamp
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('BRIDGEAI ANTI-FRAUD SURVEILLANCE EVIDENCE', 50, 70);

      ctx.fillStyle = '#a5b4fc';
      ctx.font = '12px monospace';
      ctx.fillText(`Candidate: ${selectedStudent.studentName} (#${selectedStudent.studentId})`, 50, 100);
      ctx.fillText(`Attempt: #${selectedStudent.attemptId} | Institution: ${selectedStudent.institutionName}`, 50, 120);
      ctx.fillText(`Exam: ${selectedStudent.examTitle}`, 50, 140);
      ctx.fillText(`Captured: ${new Date().toISOString()} | Officer: ${user?.staffId || 'VO-001'}`, 50, 160);

      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(50, 180, 540, 2);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px sans-serif';
      ctx.fillText(`Reason: ${evidenceNotes || 'Integrity audit frame recorded during live proctor surveillance.'}`, 50, 210);

      // Red recording indicator
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(580, 65, 8, 0, 2 * Math.PI);
      ctx.fill();

      const snapshotDataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const res = await api.post('/vigilance/evidence/capture', {
        attemptId: selectedStudent.attemptId,
        studentId: selectedStudent.studentId,
        studentName: selectedStudent.studentName,
        examId: selectedStudent.examId,
        examTitle: selectedStudent.examTitle,
        reason: evidenceNotes.trim() || 'Visual snapshot captured during real-time surveillance.',
        evidenceSnapshot: snapshotDataUrl,
        officerNotes: 'Recorded by ' + (user?.fullName || 'Vigilance Officer') + ' (' + (user?.staffId || 'VO-001') + ')'
      });

      setEvidenceCapturedSuccess(`Evidence recorded successfully! Evidence ID: ${res.data.evidenceId || 'EVD-SAVED'}`);
      setEvidenceNotes('');
      fetchSurveillanceFeed(true);
      setTimeout(() => {
        setActiveSubModal(null);
        setEvidenceCapturedSuccess(null);
      }, 2000);
    } catch (err) {
      alert('Failed to capture evidence snapshot: ' + (err.response?.data?.message || err.message));
    } finally {
      setCapturingEvidence(false);
    }
  };

  // Standardized Termination Justifications
  const STANDARDIZED_TERMINATION_REASONS = [
    { code: 'UNAUTHORIZED_ASSISTANCE', label: 'Third-Party Impersonation or Unauthorized In-Person Assistance' },
    { code: 'MULTIPLE_PERSONS', label: 'Continuous Multiple Persons Present in Candidate Test Zone' },
    { code: 'UNAUTHORIZED_DEVICE', label: 'Unauthorized Secondary Electronic Device (Mobile / Smartwatch / Tablet)' },
    { code: 'REPEATED_TAB_SWITCH', label: 'Excessive and Repeated Tab Switches Bypassing Proctoring Engine' },
    { code: 'REPEATED_FULLSCREEN_EXIT', label: 'Repeated Refusal to Maintain Required Fullscreen Lockdown' },
    { code: 'SCREEN_SHARE_STOPPED', label: 'Deliberately Disconnecting Screen Share / Camera Stream Feed' },
    { code: 'AUDIO_CONSPIRACY', label: 'Continuous Live Audio Dictation or External Collaboration Detected' },
    { code: 'OTHER_GRAVE_BREACH', label: 'Other Critical Breach of Academic Integrity Regulations' }
  ];

  // Execute Strict Single-Student Exam Termination
  const handleConfirmExamTermination = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!confirmSingleStudentOnly) {
      setTerminateErrorMsg('You must verify and confirm the single-student termination authorization checkbox.');
      return;
    }

    const match = STANDARDIZED_TERMINATION_REASONS.find(r => r.code === terminationReasonCode);
    const reasonTitle = match ? match.label : terminationReasonCode;
    const combinedReason = terminationExplanation.trim()
      ? `${reasonTitle}: ${terminationExplanation.trim()}`
      : reasonTitle;

    setTerminateSubmitting(true);
    setTerminateErrorMsg(null);
    try {
      await api.post('/vigilance/action', {
        studentId: selectedStudent.studentId,
        studentName: selectedStudent.studentName,
        examId: selectedStudent.examId,
        examTitle: selectedStudent.examTitle,
        attemptId: selectedStudent.attemptId,
        actionType: 'TERMINATE_EXAM',
        severity: 'CRITICAL',
        reason: combinedReason,
        officerNotes: `Exam terminated on ${new Date().toLocaleString()} by Vigilance Officer ${user?.fullName || 'Rahul Sharma'} (${user?.staffId || 'VO-001'}). Single student session locked.`
      });

      setTerminateSuccessMsg(`Candidate #${selectedStudent.studentId} (${selectedStudent.studentName}) exam attempt #${selectedStudent.attemptId} terminated successfully.`);
      setTimeout(() => {
        setSelectedStudent(null);
        setActiveSubModal(null);
        setTerminateSuccessMsg(null);
        setTerminationExplanation('');
        setConfirmSingleStudentOnly(false);
      }, 2000);
      fetchSurveillanceFeed(true);
    } catch (err) {
      setTerminateErrorMsg(err.response?.data?.message || err.message || 'Failed to terminate exam attempt.');
    } finally {
      setTerminateSubmitting(false);
    }
  };

  // Filter students based on searchTerm, severityFilter, selectedInstituteFilter, and selectedExamFilter
  const filterStudentItem = (student) => {
    if (severityFilter !== 'ALL' && student.alertLevel !== severityFilter) {
      return false;
    }
    if (selectedInstituteFilter !== 'ALL' && student.institutionName !== selectedInstituteFilter) {
      return false;
    }
    if (selectedExamFilter !== 'ALL' && String(student.examId) !== String(selectedExamFilter)) {
      return false;
    }
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (student.studentName && student.studentName.toLowerCase().includes(term)) ||
      String(student.studentId).includes(term) ||
      String(student.attemptId).includes(term) ||
      (student.examTitle && student.examTitle.toLowerCase().includes(term)) ||
      (student.institutionName && student.institutionName.toLowerCase().includes(term))
    );
  };

  return (
    <div className={sidebarOpen ? "flex gap-6 items-start" : "space-y-6"}>
      {sidebarOpen && (
        <DashboardSidebar
          isOpen={sidebarOpen}
          onToggle={handleToggleSidebar}
          title="Vigilance Bureau"
          user={user || { fullName: 'Rahul Sharma', role: 'ROLE_VIGILANCE_OFFICER', staffId: 'VO-001' }}
          items={vigilanceNavItems}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          roleTheme="indigo"
          statsSummary={{ label: "Live Candidates", value: `${surveillanceData.liveStudents || 0} Monitored` }}
          onChangePassword={() => setShowChangePasswordModal(true)}
        />
      )}

      <div className={sidebarOpen ? "flex-1 min-w-0 space-y-6" : "space-y-6"}>
        {/* OFFICER IDENTITY & VIGILANCE MISSION HEADER */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md relative">
                <ShieldAlert className="w-7 h-7" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    Staff ID: {user?.staffId || 'VO-001'}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-rose-600 animate-pulse" />
                    Live Surveillance Operational
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {user?.fullName || 'Rahul Sharma (Vigilance Officer)'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Centralized Academic Integrity & Anti-Fraud Bureau · Primary Duty: Real-Time Examination Surveillance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                title="Watch on Tablet / Phone via QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Watch on Tab / Phone</span>
              </button>

              <button
                onClick={() => setShowChangePasswordModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600/90 hover:bg-amber-600 text-white flex items-center gap-1.5 transition-colors border border-amber-500/30"
                title="Change Vigilance Officer Password"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>

              <button
                onClick={handleToggleSidebar}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors ${
                  sidebarOpen
                    ? 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
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
                onClick={() => fetchSurveillanceFeed(false)}
                disabled={feedRefreshing}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${feedRefreshing ? 'animate-spin' : ''}`} />
                <span>Sync Live Feed</span>
              </button>
            </div>
          </div>
        </div>

        {/* TOP REAL-TIME SURVEILLANCE SUMMARY CARDS (6 METRICS) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Institutions
              </span>
              <Building2 className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {surveillanceData.activeInstitutions || 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Enrolled Centers</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Exams
              </span>
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {surveillanceData.activeExams || 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Live Assessments</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-4 shadow-xs bg-emerald-50/20 dark:bg-emerald-950/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Live Students
              </span>
              <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {surveillanceData.liveStudents || 0}
            </div>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">Actively Monitored</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 shadow-xs bg-amber-50/20 dark:bg-amber-950/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Warnings
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {surveillanceData.warnings || 0}
            </div>
            <p className="text-[10px] text-amber-600/80 dark:text-amber-400/70 mt-0.5">Official Cautions</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 shadow-xs bg-rose-50/20 dark:bg-rose-950/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Critical Alerts
              </span>
              <AlertOctagon className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {surveillanceData.criticalAlerts || 0}
            </div>
            <p className="text-[10px] text-rose-600/80 dark:text-rose-400/70 mt-0.5">Requires Action</p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Disconnected
              </span>
              <CameraOff className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">
              {surveillanceData.disconnected || 0}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Media Dropouts</p>
          </div>
        </div>

        {/* TABS NAVIGATION (When !sidebarOpen) */}
        {!sidebarOpen && (
          <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'live', label: `Live Surveillance (${surveillanceData.liveStudents || 0})`, icon: Radio, badge: 'Live' },
                { key: 'warnings', label: `Warnings Registry (${warnings.length})`, icon: AlertTriangle },
                { key: 'terminations', label: `Terminations Registry (${terminations.length})`, icon: Ban },
                { key: 'evidence', label: `Evidence Repository (${evidenceList.length})`, icon: ImageIcon },
                { key: 'activity', label: `My Activity Log (${activityLogs.length})`, icon: Activity }
              ].map(({ key, label, icon: Icon, badge }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
                    activeTab === key
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-600 border-x border-t border-slate-200 dark:border-slate-800 shadow-2xs'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {badge && (
                    <span className="px-1.5 py-0.2 text-[9px] font-black uppercase rounded bg-rose-500 text-white animate-pulse">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleToggleSidebar}
              className="flex items-center gap-1.5 px-3 py-1.5 mb-1 text-xs font-semibold rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-all"
              title="Switch to full left sidebar"
            >
              <PanelLeftOpen className="w-3.5 h-3.5 text-indigo-500" />
              <span>Switch to Sidebar</span>
            </button>
          </div>
        )}

        {/* =========================================================================
            PRIMARY TAB 1: LIVE EXAMINATION SURVEILLANCE
            Strict 4-Level Information Hierarchy:
            1. All Active Institutions
            2. Active Examinations Under Selected Institution
            3. Live Students Grid (Prioritized by Critical -> Warning -> Disconnected -> Normal)
            4. Individual Student Monitoring Command Center
           ========================================================================= */}
        {activeTab === 'live' && (
          <div className="space-y-5">
            {/* Search and Severity Filter Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search candidate name, student ID, attempt, exam title, institution..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                  <span className="text-slate-400 text-[11px] mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" />
                    Filter Priority:
                  </span>
                  {[
                    { key: 'ALL', label: 'All Candidates' },
                    { key: 'CRITICAL', label: 'Critical Alert', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
                    { key: 'WARNING', label: 'Warning Active', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
                    { key: 'DISCONNECTED', label: 'Disconnected', color: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
                    { key: 'NORMAL', label: 'Normal Session', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' }
                  ].map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => setSeverityFilter(key)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        severityFilter === key
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : color || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Global Surveillance Stream Mode Switcher (Webcam vs Candidate Screen) */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700 ml-auto">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                    <span>View:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalSurveillanceFeedMode('camera');
                      setCardStreamModes({});
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      globalSurveillanceFeedMode === 'camera'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>All Cameras</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalSurveillanceFeedMode('screen');
                      setCardStreamModes({});
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      globalSurveillanceFeedMode === 'screen'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>All Screens</span>
                  </button>
                </div>
              </div>

              {/* Dedicated Institution & Exam Filtering Row */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Building2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Institution:</span>
                  <select
                    value={selectedInstituteFilter}
                    onChange={(e) => {
                      setSelectedInstituteFilter(e.target.value);
                      setSelectedExamFilter('ALL'); // Reset exam filter when institution changes
                    }}
                    className="w-full text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Institutions ({surveillanceData.institutions?.length || 0})</option>
                    {(surveillanceData.institutions || []).map((inst, i) => (
                      <option key={i} value={inst.institutionName}>
                        {inst.institutionName} ({inst.liveStudentsCount || 0} live)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-1">
                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">Exam:</span>
                  <select
                    value={selectedExamFilter}
                    onChange={(e) => setSelectedExamFilter(e.target.value)}
                    className="w-full text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Examinations</option>
                    {(surveillanceData.institutions || [])
                      .filter(inst => selectedInstituteFilter === 'ALL' || inst.institutionName === selectedInstituteFilter)
                      .flatMap(inst => inst.exams || [])
                      .map((ex, i) => (
                        <option key={i} value={String(ex.examId)}>
                          {ex.examTitle} (Exam #{ex.examId})
                        </option>
                      ))}
                  </select>
                </div>

                {(selectedInstituteFilter !== 'ALL' || selectedExamFilter !== 'ALL' || severityFilter !== 'ALL' || searchTerm.trim()) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInstituteFilter('ALL');
                      setSelectedExamFilter('ALL');
                      setSeverityFilter('ALL');
                      setSearchTerm('');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors whitespace-nowrap self-start sm:self-auto"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>
            </div>

            {/* LEVEL 1: ALL ACTIVE INSTITUTIONS CARDS */}
            {surveillanceData.institutions && surveillanceData.institutions.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">No Active Institutions</h3>
                <p className="text-xs text-slate-500">There are currently no active proctored examination sessions running.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {surveillanceData.institutions
                  .filter(inst => selectedInstituteFilter === 'ALL' || inst.institutionName === selectedInstituteFilter)
                  .map((inst, instIdx) => {
                  const isExpanded = Boolean(expandedInstitutions[inst.institutionName]); // closed by default
                  return (
                    <div
                      key={instIdx}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all"
                    >
                      {/* Institution Header Bar */}
                      <div className="p-5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                {inst.code}
                              </span>
                              <span className="text-xs font-semibold text-slate-500">
                                {inst.activeExamsCount} Active Exam{inst.activeExamsCount !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                              {inst.institutionName}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                            <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                            {inst.liveStudentsCount || 0} Live Candidates
                          </span>

                          {inst.criticalCount > 0 && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                              <AlertOctagon className="w-3 h-3 text-rose-600" />
                              {inst.criticalCount} Critical
                            </span>
                          )}

                          {inst.warningCount > 0 && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              {inst.warningCount} Warnings
                            </span>
                          )}

                          <button
                            onClick={() => toggleInstitution(inst.institutionName)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 ml-2"
                          >
                            <span>{isExpanded ? 'Collapse Feed' : 'View Live Students'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* LEVEL 2 & 3: ACTIVE EXAMS UNDER THIS INSTITUTION */}
                      {isExpanded && (
                        <div className="p-5 space-y-6">
                          {inst.exams && inst.exams
                            .filter(exam => selectedExamFilter === 'ALL' || String(exam.examId) === String(selectedExamFilter))
                            .map((exam, examIdx) => {
                            const isExamExpanded = expandedExams[exam.examId] !== false;
                            const visibleStudents = (exam.students || []).filter(filterStudentItem);

                            return (
                              <div
                                key={examIdx}
                                className="border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-900/40"
                              >
                                {/* Examination Sub-Header */}
                                <div className="p-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>{exam.examTitle}</span>
                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                          Exam #{exam.examId} · {exam.durationMinutes} Mins
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-500">
                                        Showing {visibleStudents.length} candidate{visibleStudents.length !== 1 ? 's' : ''} in live grid
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleExam(exam.examId)}
                                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                    >
                                      <span>{isExamExpanded ? 'Hide Grid' : 'Show Grid'}</span>
                                      {isExamExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>

                                {/* LEVEL 3: LIVE STUDENTS GRID */}
                                {isExamExpanded && (
                                  <div className="p-4">
                                    {visibleStudents.length === 0 ? (
                                      <div className="p-6 text-center text-xs text-slate-400">
                                        No candidates match the selected filters under this examination.
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {visibleStudents.map((st) => {
                                          const isCritical = st.alertLevel === 'CRITICAL';
                                          const isWarning = st.alertLevel === 'WARNING';
                                          const isDisconnected = st.alertLevel === 'DISCONNECTED';

                                          return (
                                            <div
                                              key={st.attemptId}
                                              className={`rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                                                isCritical
                                                  ? 'border-rose-500 ring-2 ring-rose-500/20'
                                                  : isWarning
                                                  ? 'border-amber-400'
                                                  : isDisconnected
                                                  ? 'border-slate-400 dark:border-slate-700'
                                                  : 'border-slate-200 dark:border-slate-800'
                                              }`}
                                            >
                                              {/* Live Video Preview Window */}
                                              <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                                                {/* Simulated Live Stream Frame */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 flex flex-col justify-between p-2.5 z-10 pointer-events-none">
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5">
                                                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                                                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded border border-rose-900/60">
                                                        LIVE 30FPS
                                                      </span>
                                                    </div>

                                                    {/* Alert Pill */}
                                                    <span
                                                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                                        isCritical
                                                          ? 'bg-rose-500 text-white border-rose-400 animate-pulse'
                                                          : isWarning
                                                          ? 'bg-amber-500 text-white border-amber-400'
                                                          : isDisconnected
                                                          ? 'bg-slate-700 text-white border-slate-600'
                                                          : 'bg-emerald-600 text-white border-emerald-500'
                                                      }`}
                                                    >
                                                      {st.alertLevel}
                                                    </span>
                                                  </div>

                                                   <div className="flex items-center justify-between text-[10px] text-slate-300">
                                                      <div className="flex items-center gap-1.5 pointer-events-auto">
                                                        <span className="font-mono bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded border border-slate-800">
                                                          Att #{st.attemptId}
                                                        </span>
                                                        {/* Interactive Stream Switcher: Cam vs Screen */}
                                                        <div className="flex items-center bg-black/80 backdrop-blur-xs p-0.5 rounded border border-slate-700">
                                                          <button
                                                            type="button"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setCardStreamModes(prev => ({ ...prev, [st.attemptId]: 'camera' }));
                                                            }}
                                                            title="View Candidate Camera Feed"
                                                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                                                              (cardStreamModes[st.attemptId] || globalSurveillanceFeedMode) === 'camera'
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'text-slate-400 hover:text-white'
                                                            }`}
                                                          >
                                                            <Video className="w-2.5 h-2.5" />
                                                            <span>Cam</span>
                                                          </button>
                                                          <button
                                                            type="button"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              setCardStreamModes(prev => ({ ...prev, [st.attemptId]: 'screen' }));
                                                            }}
                                                            title="View Candidate Screen Feed"
                                                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer flex items-center gap-0.5 ${
                                                              (cardStreamModes[st.attemptId] || globalSurveillanceFeedMode) === 'screen'
                                                                ? 'bg-blue-600 text-white'
                                                                : 'text-slate-400 hover:text-white'
                                                            }`}
                                                          >
                                                            <Monitor className="w-2.5 h-2.5" />
                                                            <span>Scr</span>
                                                          </button>
                                                        </div>
                                                      </div>
                                                      <span className="font-mono bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded border border-slate-800 text-amber-300">
                                                        {st.violationCount || 0}/3 strikes
                                                      </span>
                                                    </div>
                                                  </div>

                                                  {/* Candidate Stream Video Visual: Camera or Live Screen */}
                                                  {(() => {
                                                    const cardMode = cardStreamModes[st.attemptId] || globalSurveillanceFeedMode;
                                                    const camFrame = liveFrames[st.attemptId]?.cameraFrame || st.cameraFrame;
                                                    const scrFrame = liveFrames[st.attemptId]?.screenFrame || st.screenFrame;

                                                    if (cardMode === 'screen') {
                                                      if (scrFrame) {
                                                        return (
                                                          <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                                                            <img
                                                              src={scrFrame}
                                                              alt={`Live screen of ${st.studentName}`}
                                                              className="w-full h-full object-contain bg-black"
                                                            />
                                                            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-20"></div>
                                                            <div className="absolute top-2 right-2 bg-blue-950/90 text-blue-300 border border-blue-700 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold flex items-center gap-1 z-10">
                                                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                                                              <span>SCREEN LIVE</span>
                                                            </div>
                                                          </div>
                                                        );
                                                      }
                                                      return (
                                                        <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 p-4 text-center overflow-hidden">
                                                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-40"></div>
                                                          <div className="relative flex items-center justify-center">
                                                            <span className="absolute w-12 h-12 rounded-full bg-blue-500 opacity-25 animate-ping"></span>
                                                            <div className="w-11 h-11 rounded-xl bg-blue-950/90 border border-blue-500/60 flex items-center justify-center text-blue-400 shadow-md">
                                                              <Monitor className="w-5 h-5" />
                                                            </div>
                                                          </div>
                                                          <span className="text-[10px] font-mono text-slate-300 font-bold mt-2 z-0">
                                                            Screen Stream Connecting...
                                                          </span>
                                                          <span className="text-[9px] font-mono text-slate-500 z-0">
                                                            Exam #{st.examId} · Att #{st.attemptId}
                                                          </span>
                                                        </div>
                                                      );
                                                    }

                                                    if (camFrame) {
                                                      return (
                                                        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                                                          <img
                                                            src={camFrame}
                                                            alt={`Live stream of ${st.studentName}`}
                                                            className="w-full h-full object-cover"
                                                          />
                                                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-40"></div>
                                                        </div>
                                                      );
                                                    }

                                                    return (
                                                      <div className="relative w-full h-full flex flex-col items-center justify-center bg-radial from-slate-900 via-slate-950 to-black overflow-hidden">
                                                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-60"></div>
                                                        <div className="relative flex items-center justify-center">
                                                          <span className={`absolute w-16 h-16 rounded-full opacity-30 animate-ping ${isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : isDisconnected ? 'bg-slate-600' : 'bg-emerald-500'}`}></span>
                                                          <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center shadow-lg transition-colors z-0 ${
                                                            isCritical ? 'bg-rose-950/80 border-rose-500 text-rose-300' :
                                                            isWarning ? 'bg-amber-950/80 border-amber-500 text-amber-300' :
                                                            isDisconnected ? 'bg-slate-900 border-slate-700 text-slate-500' :
                                                            'bg-slate-900/90 border-indigo-500 text-indigo-300'
                                                          }`}>
                                                            {isDisconnected ? (
                                                              <CameraOff className="w-6 h-6 text-slate-500 animate-pulse" />
                                                            ) : (
                                                              <UserCheck className="w-7 h-7" />
                                                            )}
                                                          </div>
                                                        </div>
                                                        <div className="text-[10px] font-mono text-slate-400 mt-2 z-0 flex items-center gap-1.5 bg-black/50 px-2 py-0.5 rounded-full border border-slate-800/80">
                                                          <span className={`w-1.5 h-1.5 rounded-full ${isDisconnected ? 'bg-slate-500' : 'bg-emerald-400 animate-pulse'}`}></span>
                                                          <span>{isDisconnected ? 'Stream Offline' : 'Webcam Connecting...'}</span>
                                                        </div>
                                                      </div>
                                                    );
                                                  })()}
                                                  </div>

                                              {/* Candidate Details & Status Controls */}
                                              <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                                                <div>
                                                  <div className="flex items-start justify-between gap-1">
                                                    <h4 className="font-black text-slate-900 dark:text-white text-sm truncate">
                                                      {st.studentName}
                                                    </h4>
                                                  </div>
                                                  <div className="text-[11px] text-slate-400 font-mono">
                                                    ID: #{st.studentId} · Started: {st.startedAt ? new Date(st.startedAt).toLocaleTimeString() : 'N/A'}
                                                  </div>
                                                </div>

                                                {/* Peripheral Connection Badges */}
                                                <div className="grid grid-cols-4 gap-1 text-[10px] font-bold text-center">
                                                  <div className={`py-1 rounded border ${st.cameraConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                    Cam: {st.cameraConnected ? 'ON' : 'OFF'}
                                                  </div>
                                                  <div className={`py-1 rounded border ${st.screenConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                    Scr: {st.screenConnected ? 'ON' : 'OFF'}
                                                  </div>
                                                  <div className={`py-1 rounded border ${st.audioConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                    Mic: {st.audioConnected ? 'ON' : 'OFF'}
                                                  </div>
                                                  <div className={`py-1 rounded border ${st.networkConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                    Net: {st.networkConnected ? 'OK' : 'LOST'}
                                                  </div>
                                                </div>

                                                {/* Primary Surveillance Actions */}
                                                <div className="flex items-center gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleOpenStudentMonitoring(st)}
                                                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                                                  >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    <span>Open Monitoring</span>
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleEnterFullscreen('camera', st)}
                                                    title="Quick Fullscreen Video Stream"
                                                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                                                  >
                                                    <Maximize2 className="w-3.5 h-3.5 text-indigo-500" />
                                                    <span className="hidden sm:inline">Fullscreen</span>
                                                  </button>
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
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            SECONDARY TABS:
            - Warnings Registry
            - Terminations Registry
            - Evidence Repository
            - My Activity Log
           ========================================================================= */}

        {/* TAB 2: WARNINGS REGISTRY */}
        {activeTab === 'warnings' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Official Candidate Warnings Registry
                </h3>
                <p className="text-xs text-slate-500">Complete audit log of formal warnings issued to candidates across all exams.</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Total Warnings: {warnings.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Attempt ID</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Reason & Notes</th>
                    <th className="px-4 py-3">Candidate Acknowledged</th>
                    <th className="px-4 py-3">Issuing Officer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {warnings.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                        Zero candidate warnings recorded.
                      </td>
                    </tr>
                  ) : (
                    warnings.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {w.timestamp ? new Date(w.timestamp).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {w.studentName}
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold">
                          #{w.attemptId}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            {w.severity || 'HIGH'}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{w.reason}</div>
                          {w.officerNotes && (
                            <div className="text-[11px] text-slate-500 italic mt-0.5">{w.officerNotes}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {w.acknowledged ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
                              Acknowledged
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          <span className="font-bold">{w.officerName}</span> ({w.officerStaffId})
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TERMINATIONS REGISTRY */}
        {activeTab === 'terminations' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Student Exam Termination Records
                </h3>
                <p className="text-xs text-slate-500">Official log of candidate test sessions terminated due to critical integrity violations.</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Total Terminations: {terminations.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Attempt ID</th>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Strikes</th>
                    <th className="px-4 py-3">Termination Justification</th>
                    <th className="px-4 py-3">Terminated By</th>
                    <th className="px-4 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {terminations.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                        No student exam termination records found.
                      </td>
                    </tr>
                  ) : (
                    terminations.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                          #{t.attemptId}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {t.studentName || 'Candidate'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            {t.violationCount || 0} violations
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-sm">
                          <div className="font-semibold text-slate-900 dark:text-white">{t.reason}</div>
                          {t.officerNotes && (
                            <div className="text-[11px] text-slate-500 italic mt-0.5">{t.officerNotes}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          <span className="font-bold">{t.officerName}</span> ({t.officerStaffId})
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                          {t.terminatedAt ? new Date(t.terminatedAt).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: EVIDENCE REPOSITORY */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Institutional Evidence Repository
                </h3>
                <p className="text-xs text-slate-500">Immutable gallery of captured video/screen frames and visual fraud records.</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {evidenceList.length} Captured Items
              </span>
            </div>

            {evidenceList.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <ImageIcon className="w-12 h-12 text-slate-400 mx-auto" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">No Evidence Frames Captured</h3>
                <p className="text-xs text-slate-500">Use the "[ Capture Evidence ]" action inside any live student monitoring session to record evidentiary snapshots.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {evidenceList.map((evid) => (
                  <div
                    key={evid.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Evidence Preview Image */}
                    <div
                      onClick={() => setPreviewEvidenceItem(evid)}
                      className="aspect-video bg-black relative cursor-pointer group flex items-center justify-center"
                    >
                      {evid.evidenceSnapshot ? (
                        <img
                          src={evid.evidenceSnapshot}
                          alt="Evidence Frame"
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                      ) : (
                        <div className="text-slate-500 text-xs font-mono">Frame Snapshot Stored</div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>View Full Frame</span>
                        </span>
                      </div>
                      <div className="absolute top-2 left-2 bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                        {evid.evidenceId || `EVD-#${evid.id}`}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {evid.studentName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Att #{evid.attemptId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {evid.reason}
                      </p>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Captured by: {evid.officerName}</span>
                        <span>{evid.timestamp ? new Date(evid.timestamp).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: OFFICER ACTIVITY AUDIT */}
        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Vigilance Bureau Immutable Activity Logs
                </h3>
                <p className="text-xs text-slate-500">Cryptographically secure audit trail of all officer logins, warnings, evidence captures, and terminations.</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Total Log Entries: {activityLogs.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Officer</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activityLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                        No vigilance activity logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    activityLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {log.performedByEmail}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {log.entityName} #{log.entityId}
                        </td>
                        <td className="px-4 py-3 max-w-xs text-slate-600 dark:text-slate-300 truncate">
                          {log.details}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                          {log.ipAddress || '127.0.0.1'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            LEVEL 4: INDIVIDUAL STUDENT MONITORING COMMAND CENTER (MODAL)
           ========================================================================= */}
        {selectedStudent && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn overflow-y-auto">
            <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl max-w-6xl w-full text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
              {/* Modal Top Command Header */}
              <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700">
                        Live Surveillance Console
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Attempt #{selectedStudent.attemptId} · Student ID: #{selectedStudent.studentId}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white mt-0.5 flex items-center gap-2">
                      <span>{selectedStudent.studentName}</span>
                      <span className="text-xs font-normal text-slate-400">
                        ({selectedStudent.institutionName})
                      </span>
                    </h3>
                  </div>
                </div>

                {/* Status & Close Button */}
                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className="text-right hidden sm:block text-xs">
                    <div className="text-slate-400">Assessment:</div>
                    <div className="font-bold text-slate-200 truncate max-w-xs">{selectedStudent.examTitle}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setActiveSubModal(null);
                    }}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Main Split Screen Media Stage */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
                {/* 2-Column Split: Live Camera Stream (Left) + Live Student Screen (Right) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Panel 1: Live Candidate Camera Stream */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
                    <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4 text-emerald-400" />
                        <span>Live Candidate Camera Stream</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          Webcam Connected
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEnterFullscreen('camera')}
                          title="View Camera in Fullscreen"
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono px-2 cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3 text-indigo-400" />
                          <span className="hidden sm:inline">Fullscreen</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                      {/* Real Camera Feed Frame or Placeholder */}
                      {liveFrames[selectedStudent.attemptId]?.cameraFrame || selectedStudent.cameraFrame ? (
                        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                          <img
                            src={liveFrames[selectedStudent.attemptId]?.cameraFrame || selectedStudent.cameraFrame}
                            alt={`Live Camera Feed of ${selectedStudent.studentName}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-40"></div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-2 text-slate-500">
                          <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                            <UserCheck className="w-8 h-8 text-indigo-400" />
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            {selectedStudent.studentName} · Live Camera Feed Connecting...
                          </span>
                        </div>
                      )}

                      {/* Overlaid Candidate Watermark */}
                      <div className="absolute top-3 left-3 bg-black/70 px-2 py-1 rounded text-[10px] font-mono text-emerald-400 border border-emerald-900/60 flex items-center gap-1.5 z-10">
                        <Camera className="w-3 h-3" />
                        <span>FPS: 30 · 720p HD</span>
                      </div>

                      <div className="absolute bottom-3 left-3 bg-black/70 px-2 py-1 rounded text-[10px] font-mono text-slate-300 z-10">
                        Strikes: {selectedStudent.violationCount || 0} / 3
                      </div>
                    </div>
                  </div>

                  {/* Panel 2: Live Student Screen Stream */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col">
                    <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-blue-400" />
                        <span>Live Candidate Screen Feed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span>
                          Screen Sharing Active
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEnterFullscreen('screen')}
                          title="View Screen Feed in Fullscreen"
                          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-mono px-2 cursor-pointer"
                        >
                          <Maximize2 className="w-3 h-3 text-blue-400" />
                          <span className="hidden sm:inline">Fullscreen</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                      {/* Real Screen Frame or Workspace Telemetry */}
                      {liveFrames[selectedStudent.attemptId]?.screenFrame || selectedStudent.screenFrame ? (
                        <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
                          <img
                            src={liveFrames[selectedStudent.attemptId]?.screenFrame || selectedStudent.screenFrame}
                            alt={`Live Screen Feed of ${selectedStudent.studentName}`}
                            className="w-full h-full object-contain bg-black"
                          />
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-20"></div>
                        </div>
                      ) : (
                        <div className="w-full h-full p-4 bg-slate-900 flex flex-col justify-between text-xs text-slate-300">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <div className="font-mono text-[11px] text-indigo-400 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              <span>Safe Browser Lockdown · Mode: Fullscreen Active</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">1920x1080</span>
                          </div>

                          <div className="space-y-2 my-auto p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px]">
                            <div className="text-emerald-400">// Active Assessment Workspace Screen</div>
                            <div className="text-slate-400">Exam: {selectedStudent.examTitle}</div>
                            <div className="text-slate-500">Editor Focus: Active · Screen Stream Connecting...</div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                            <span>Keyboard Telemetry: Synchronized</span>
                            <span>Network Latency: 24ms</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audio Status & Mute/Unmute Strip */}
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isAudioMuted ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'}`}>
                      {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2 text-white">
                        <span>Candidate Microphone Stream</span>
                        <span className={`text-[10px] font-mono px-2 py-0.2 rounded ${isAudioMuted ? 'bg-amber-900/60 text-amber-300' : 'bg-emerald-900/60 text-emerald-300'}`}>
                          {isAudioMuted ? 'MUTED BY OFFICER' : 'LIVE LISTENING ACTIVE'}
                        </span>
                        {!isAudioMuted && (
                          <div className="flex items-center gap-0.5 ml-2">
                            <span className="w-1 h-3 bg-emerald-400 rounded-full animate-bounce"></span>
                            <span className="w-1 h-5 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]"></span>
                            <span className="w-1 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]"></span>
                            <span className="w-1 h-4 bg-emerald-400 rounded-full animate-bounce [animation-delay:450ms]"></span>
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Continuous acoustic ambient monitoring for background whispered answers or multi-voice speech.
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAudioMuted(!isAudioMuted)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
                      isAudioMuted
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    {isAudioMuted ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                    <span>{isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
                  </button>
                </div>

                {/* SURVEILLANCE ACTION TOOLBAR (5 BUTTONS) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveSubModal(activeSubModal === 'chat' ? null : 'chat')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                      activeSubModal === 'chat'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                    <span>Chat Message</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubModal(activeSubModal === 'warning' ? null : 'warning')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                      activeSubModal === 'warning'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <span>Issue Warning</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubModal(activeSubModal === 'evidence' ? null : 'evidence')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                      activeSubModal === 'evidence'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Camera className="w-5 h-5 text-blue-400" />
                    <span>Capture Evidence</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubModal(activeSubModal === 'timeline' ? null : 'timeline')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                      activeSubModal === 'timeline'
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Activity className="w-5 h-5 text-purple-400" />
                    <span>View Activity</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSubModal(activeSubModal === 'terminate' ? null : 'terminate')}
                    className={`p-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all col-span-2 sm:col-span-1 ${
                      activeSubModal === 'terminate'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-rose-950/40 text-rose-300 border-rose-800/80 hover:bg-rose-900/60'
                    }`}
                  >
                    <Ban className="w-5 h-5 text-rose-400" />
                    <span>Terminate Exam</span>
                  </button>
                </div>

                {/* ACTION SUB-VIEW 1: LIVE CHAT DRAWER */}
                {activeSubModal === 'chat' && (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/40 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="font-bold text-xs flex items-center gap-2 text-indigo-300">
                        <MessageSquare className="w-4 h-4" />
                        <span>Direct Communication with {selectedStudent.studentName}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        Messages appear immediately on student's active exam interface
                      </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-slate-900/80 rounded-xl">
                      {chatMessages.length === 0 ? (
                        <div className="text-center py-4 text-xs text-slate-500">
                          No messages exchanged yet. Send a direct reminder below.
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const isStudent = msg.officerStaffId === 'CANDIDATE' || msg.reason === 'STUDENT_REPLY';
                          return (
                            <div
                              key={msg.id}
                              className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                                isStudent
                                  ? 'bg-emerald-950/40 border-emerald-500/40 ml-4 text-emerald-100'
                                  : 'bg-slate-800 border-slate-700 mr-4'
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className={isStudent ? 'text-emerald-400 font-bold' : 'text-indigo-400'}>
                                  {isStudent ? `Candidate: ${msg.studentName || 'Student'}` : `Officer: ${msg.officerName} (${msg.officerStaffId})`}
                                </span>
                                <span className="text-slate-400">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : 'N/A'}</span>
                              </div>
                              <p className={isStudent ? 'text-emerald-100 font-medium' : 'text-white font-medium'}>{msg.chatMessage}</p>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendChatMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="e.g. Please look directly at your camera and close all background windows..."
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={sendingChat || !chatInput.trim()}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send</span>
                      </button>
                    </form>
                  </div>
                )}

                {/* ACTION SUB-VIEW 2: FORMAL WARNING DIALOG */}
                {activeSubModal === 'warning' && (
                  <form onSubmit={handleIssueFormalWarning} className="p-4 bg-slate-950 rounded-2xl border border-amber-500/40 space-y-3.5 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="font-bold text-xs flex items-center gap-2 text-amber-400">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Issue Formal Examination Warning</span>
                      </div>
                      <span className="text-[11px] text-amber-300">
                        Dispatches un-dismissible warning popup requiring student acknowledgement
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Standardized Warning Reason *
                        </label>
                        <select
                          value={warningReason}
                          onChange={(e) => setWarningReason(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                          {STANDARDIZED_WARNING_REASONS.map(r => (
                            <option key={r.code} value={r.code}>{r.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Warning Severity Level
                        </label>
                        <select
                          value={warningSeverity}
                          onChange={(e) => setWarningSeverity(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                        >
                          <option value="LOW">LOW - Observational Advisory</option>
                          <option value="MEDIUM">MEDIUM - Tab Switch / Focus Violation</option>
                          <option value="HIGH">HIGH - Suspicious Object / Multiple Faces</option>
                          <option value="CRITICAL">CRITICAL - Final Warning Before Immediate Termination</option>
                        </select>
                      </div>
                    </div>

                    {warningReason === 'OTHER' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Custom Reason Specification *
                        </label>
                        <input
                          type="text"
                          required
                          value={warningCustomReason}
                          onChange={(e) => setWarningCustomReason(e.target.value)}
                          placeholder="Specify the exact observed breach..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Officer Instructions for Candidate (Displayed on Student Screen)
                      </label>
                      <textarea
                        rows="2"
                        value={warningNotes}
                        onChange={(e) => setWarningNotes(e.target.value)}
                        placeholder="Direct instructions e.g. Put away your mobile device immediately and keep your gaze centered..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    {warningErrorMsg && (
                      <div className="p-2.5 rounded-lg bg-rose-950/60 text-rose-300 text-xs border border-rose-800">
                        {warningErrorMsg}
                      </div>
                    )}
                    {warningSuccessMsg && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-300 text-xs border border-emerald-800">
                        {warningSuccessMsg}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveSubModal(null)}
                        className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={warningSubmitting}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{warningSubmitting ? 'Dispatching...' : 'Dispatch Formal Warning'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* ACTION SUB-VIEW 3: CAPTURE EVIDENCE */}
                {activeSubModal === 'evidence' && (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-blue-500/40 space-y-3.5 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="font-bold text-xs flex items-center gap-2 text-blue-400">
                        <Camera className="w-4 h-4" />
                        <span>Capture Evidentiary Surveillance Snapshot</span>
                      </div>
                      <span className="text-[11px] text-blue-300">
                        Saves cryptographic watermarked evidence to institutional gallery
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Evidence Description / Breach Note
                      </label>
                      <input
                        type="text"
                        value={evidenceNotes}
                        onChange={(e) => setEvidenceNotes(e.target.value)}
                        placeholder="e.g. Unidentified secondary person visible in room background at 13:45"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {evidenceCapturedSuccess && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-300 text-xs border border-emerald-800">
                        {evidenceCapturedSuccess}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveSubModal(null)}
                        className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={capturingEvidence}
                        onClick={handleCaptureEvidence}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{capturingEvidence ? 'Capturing...' : 'Capture & Store Evidence Frame'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ACTION SUB-VIEW 4: COMPLETE CHRONOLOGICAL TIMELINE */}
                {activeSubModal === 'timeline' && (
                  <div className="p-4 bg-slate-950 rounded-2xl border border-purple-500/40 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="font-bold text-xs flex items-center gap-2 text-purple-400">
                        <Activity className="w-4 h-4" />
                        <span>Complete Candidate Vigilance Timeline</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Chronological Session Security Events
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                      {(!selectedStudent.timeline || selectedStudent.timeline.length === 0) ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          Zero security events recorded for this candidate attempt.
                        </div>
                      ) : (
                        selectedStudent.timeline.map((evt, idx) => (
                          <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-start gap-3 text-xs">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                              {evt.type === 'START' ? (
                                <Play className="w-3.5 h-3.5 text-emerald-400" />
                              ) : evt.type === 'VIOLATION' ? (
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              ) : evt.type === 'TERMINATE_EXAM' ? (
                                <Ban className="w-3.5 h-3.5 text-rose-500" />
                              ) : (
                                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white truncate">{evt.title}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'N/A'}
                                </span>
                              </div>
                              <p className="text-slate-400 text-[11px] mt-0.5">{evt.details}</p>
                              {evt.evidenceId && (
                                <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                                  Attached Evidence ID: {evt.evidenceId}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* ACTION SUB-VIEW 5: SERIOUS EXAM TERMINATION PROCESS */}
                {activeSubModal === 'terminate' && (
                  <form onSubmit={handleConfirmExamTermination} className="p-5 bg-rose-950/40 rounded-2xl border-2 border-rose-600 space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-3 border-b border-rose-800/80 pb-3 text-rose-300">
                      <div className="w-10 h-10 rounded-xl bg-rose-950 text-rose-500 border border-rose-700 flex items-center justify-center shrink-0">
                        <Ban className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                          Irrevocable Enforcement Action
                        </span>
                        <h4 className="font-black text-white text-base mt-0.5">
                          Terminate Candidate Examination Session
                        </h4>
                      </div>
                    </div>

                    <div className="p-3.5 bg-rose-950/60 rounded-xl border border-rose-800/60 text-xs text-rose-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-rose-300">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Scope: Single Candidate Isolation Enforcement</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        This action terminates <strong>ONLY candidate {selectedStudent.studentName} (ID: #{selectedStudent.studentId})</strong>. No other candidates or exams will be affected. The candidate's screen will immediately lock with the official reason.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Required Standardized Justification *
                      </label>
                      <select
                        value={terminationReasonCode}
                        onChange={(e) => setTerminationReasonCode(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-rose-500 outline-none"
                      >
                        {STANDARDIZED_TERMINATION_REASONS.map(r => (
                          <option key={r.code} value={r.code}>{r.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Detailed Officer Explanation & Observations
                      </label>
                      <textarea
                        rows="2"
                        value={terminationExplanation}
                        onChange={(e) => setTerminationExplanation(e.target.value)}
                        placeholder="Detail specific observations, strikes logged, or proctoring engine telemetry..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-rose-500"
                      />
                    </div>

                    <div className="space-y-2 pt-1 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={attachEvidenceSnapshot}
                          onChange={(e) => setAttachEvidenceSnapshot(e.target.checked)}
                          className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                        />
                        <span>Attach captured camera and screen evidence snapshot to official record</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-rose-300 font-bold">
                        <input
                          type="checkbox"
                          required
                          checked={confirmSingleStudentOnly}
                          onChange={(e) => setConfirmSingleStudentOnly(e.target.checked)}
                          className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                        />
                        <span>I confirm this termination affects ONLY this individual candidate #{selectedStudent.studentId}</span>
                      </label>
                    </div>

                    {terminateErrorMsg && (
                      <div className="p-2.5 rounded-lg bg-rose-950 text-rose-300 text-xs border border-rose-800">
                        {terminateErrorMsg}
                      </div>
                    )}
                    {terminateSuccessMsg && (
                      <div className="p-2.5 rounded-lg bg-emerald-950 text-emerald-300 text-xs border border-emerald-800">
                        {terminateSuccessMsg}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t border-rose-900/60">
                      <button
                        type="button"
                        onClick={() => setActiveSubModal(null)}
                        className="px-4 py-2 text-xs text-slate-400 hover:text-white font-semibold"
                      >
                        Abort
                      </button>
                      <button
                        type="submit"
                        disabled={terminateSubmitting || !confirmSingleStudentOnly}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-40 shadow-lg"
                      >
                        <Ban className="w-4 h-4" />
                        <span>{terminateSubmitting ? 'Terminating Session...' : 'Execute Exam Termination'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FULL EVIDENCE PREVIEW MODAL */}
        {previewEvidenceItem && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 space-y-4 text-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[10px] font-mono text-indigo-400 uppercase font-bold">
                    Official Evidence Snapshot · {previewEvidenceItem.evidenceId}
                  </div>
                  <h3 className="font-bold text-white text-base">
                    Candidate: {previewEvidenceItem.studentName} (Attempt #{previewEvidenceItem.attemptId})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewEvidenceItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {previewEvidenceItem.evidenceSnapshot ? (
                  <img
                    src={previewEvidenceItem.evidenceSnapshot}
                    alt="Evidence full view"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-slate-500 font-mono text-xs">No image preview available</div>
                )}
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div><strong>Reason:</strong> {previewEvidenceItem.reason}</div>
                <div><strong>Captured By:</strong> {previewEvidenceItem.officerName} ({previewEvidenceItem.officerStaffId})</div>
                <div><strong>Timestamp:</strong> {previewEvidenceItem.timestamp ? new Date(previewEvidenceItem.timestamp).toLocaleString() : 'N/A'}</div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setPreviewEvidenceItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TRUE FULL-SCREEN VIDEO STREAM VIEWER MODAL */}
        {fullScreenStream && selectedStudent && createPortal(
          <div 
            className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex flex-col p-3 sm:p-6 animate-fadeIn"
            style={{ zIndex: 99999 }}
          >
            {/* Fullscreen Overlay Header */}
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-3 rounded-2xl mb-3 text-white shadow-xl">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                  fullScreenStream === 'camera' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {fullScreenStream === 'camera' ? <Video className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      Fullscreen {fullScreenStream === 'camera' ? 'Webcam Feed' : 'Candidate Screen Feed'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Candidate: #{selectedStudent.studentId} · Attempt #{selectedStudent.attemptId}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-black text-white mt-0.5 flex items-center gap-2">
                    <span>{selectedStudent.studentName}</span>
                    <span className="text-xs font-normal text-slate-400">
                      ({selectedStudent.institutionName})
                    </span>
                  </h2>
                </div>
              </div>

              {/* Stream Switcher and Exit Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFullScreenStream(fullScreenStream === 'camera' ? 'screen' : 'camera')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {fullScreenStream === 'camera' ? (
                    <>
                      <Monitor className="w-3.5 h-3.5 text-blue-400" />
                      <span className="hidden sm:inline">Switch to Candidate Screen</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Switch to Candidate Webcam</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleExitFullscreen}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Exit Fullscreen (Esc)</span>
                </button>
              </div>
            </div>

            {/* Fullscreen Video Canvas */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 relative flex items-center justify-center">
              {fullScreenStream === 'camera' ? (
                <div className="w-full h-full flex flex-col items-center justify-center relative bg-black">
                  {/* Watermark Stamps */}
                  <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 flex items-center gap-2 z-10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>LIVE HD 720p @ 30 FPS · WEBCAM STREAM</span>
                  </div>

                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 z-10">
                    Exam: {selectedStudent.examTitle}
                  </div>

                  <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 space-y-0.5 z-10">
                    <div>Candidate: {selectedStudent.studentName} (ID: #{selectedStudent.studentId})</div>
                    <div className="text-amber-400">Recorded Strikes: {selectedStudent.violationCount || 0} / 3</div>
                  </div>

                  {liveFrames[selectedStudent.attemptId]?.cameraFrame || selectedStudent.cameraFrame ? (
                    <div className="w-full h-full flex items-center justify-center relative bg-black">
                      <img
                        src={liveFrames[selectedStudent.attemptId]?.cameraFrame || selectedStudent.cameraFrame}
                        alt={`Fullscreen camera stream of ${selectedStudent.studentName}`}
                        className="w-full h-full object-contain bg-black"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-30"></div>
                    </div>
                  ) : (
                    /* Animated Avatar Silhouette / Stream simulation */
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative flex items-center justify-center">
                        <span className="absolute w-36 h-36 rounded-full bg-emerald-500 opacity-20 animate-ping"></span>
                        <div className="w-28 h-28 rounded-3xl bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shadow-2xl text-indigo-400">
                          <UserCheck className="w-14 h-14" />
                        </div>
                      </div>
                      <div className="text-sm font-mono text-slate-300 font-bold">
                        {selectedStudent.studentName} · Connecting to Candidate Camera...
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col justify-between text-slate-200 font-mono relative bg-black">
                  {/* Top Bar of Student Screen */}
                  <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between bg-black/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs sm:text-sm">
                      <Lock className="w-4 h-4" />
                      <span className="font-bold">Candidate Active Workspace / Screen Feed</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>Resolution: 1920x1080 FHD</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Telemetry Sync: 100%
                      </span>
                    </div>
                  </div>

                  {liveFrames[selectedStudent.attemptId]?.screenFrame || selectedStudent.screenFrame ? (
                    <div className="w-full h-full flex items-center justify-center relative bg-black pt-16 pb-12">
                      <img
                        src={liveFrames[selectedStudent.attemptId]?.screenFrame || selectedStudent.screenFrame}
                        alt={`Fullscreen screen feed of ${selectedStudent.studentName}`}
                        className="w-full h-full object-contain bg-black shadow-2xl"
                      />
                    </div>
                  ) : (
                    /* Fallback Active Assessment Canvas */
                    <div className="my-auto p-6 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-4 max-w-4xl mx-auto w-full shadow-2xl mt-20">
                      <div className="text-emerald-400 text-sm font-bold flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Candidate Examination Active Workspace</span>
                      </div>
                      <div className="text-base text-white font-bold">{selectedStudent.examTitle}</div>
                      <div className="p-4 bg-black/60 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                        <div className="text-slate-400">// Code & Assessment Environment Telemetry</div>
                        <div>Status: Editor Focused · Focus Lost Triggers: 0 in last 5m</div>
                        <div>Active Question: Question in progress</div>
                        <div className="text-slate-500">Screen stream connecting to candidate client...</div>
                      </div>
                    </div>
                  )}

                  {/* Bottom Bar */}
                  <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between text-xs text-slate-400 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-800">
                    <span>Host Connection: Verified TLS 1.3 · Proctored Session</span>
                    <span>Monitoring Officer: {user?.fullName || 'Rahul Sharma'} ({user?.staffId || 'VO-001'})</span>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* CHANGE PASSWORD MODAL */}
        <ChangePasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          userRole="ROLE_VIGILANCE_OFFICER"
          userEmail={user?.email || 'rahul.sharma@bridgeai.edu'}
        />

        {/* MOBILE / TABLET VIGILANCE QR SYNC MODAL */}
        {showQrModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 border-2 border-indigo-500 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                    <Tablet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Watch on Tablet / Phone</h3>
                    <p className="text-[11px] text-slate-400">Live Vigilance Surveillance Stream</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* QR Image Display */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner border border-slate-700">
                <img
                  src="/vigilance_qr_code.png"
                  alt="Vigilance QR Code"
                  className="w-56 h-56 object-contain rounded-lg"
                />
                <span className="text-[11px] font-mono font-bold text-slate-800 mt-2">
                  Scan with Tablet or Phone Camera
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Direct Network URL:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('http://192.168.0.100:5173/?role=vigilance');
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-indigo-300 break-all bg-slate-900 p-2 rounded-lg border border-slate-800">
                  http://192.168.0.100:5173/?role=vigilance
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed text-center">
                Ensure your tablet or phone is connected to the same Wi-Fi network. Scanning automatically logs you in as <strong>Vigilance Officer (Rahul Sharma)</strong> so you can monitor live candidate video and telemetry on your handheld device while the student takes the exam.
              </p>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close QR Code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
