import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  BookPlus, Video, CheckSquare, Users, Award, ShieldAlert, Plus,
  FileCheck, Calendar, ExternalLink, MessageSquare, AlertCircle,
  Clock, ShieldCheck, Trash2, HelpCircle, Sparkles, CheckCircle2,
  FileText, FolderGit2, FileCode, Presentation, Archive, UploadCloud, RefreshCw,
  Download, Upload, Check, Lock, Star, Target, X, Globe, Building2, Layers,
  PanelLeftOpen, PanelLeftClose, Code2, Terminal, Code, ListOrdered, History, KeyRound, Edit3
} from 'lucide-react';
import { DashboardSidebar } from '../components/common/DashboardSidebar';
import { LiveSessionsTab } from '../components/common/LiveSessionsTab';
import { ChangePasswordModal } from '../components/common/ChangePasswordModal';
import {
  exportAssessmentReport,
  exportAssignmentReport,
  exportProjectReport,
  exportMasterStudentReport
} from '../utils/exportUtils';
import FileUploadInput from '../components/common/FileUploadInput';

export const DEFAULT_STARTER_CODES = {
  python: `# Python 3 Solution\nimport sys\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    print("Result")\n\nif __name__ == "__main__":\n    solve()\n`,
  java: `import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        System.out.println("Result");\n    }\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    return 0;\n}\n`,
  csharp: `using System;\n\npublic class Solution {\n    public static void Main(string[] args) {\n        Console.WriteLine("Result");\n    }\n}\n`,
  kotlin: `import java.util.Scanner\n\nfun main() {\n    val scanner = Scanner(System.\`in\`)\n    println("Result")\n}\n`
};

export const sampleCodingProblems = [
  {
    questionType: 'CODING',
    problemTitle: 'Two Sum Target',
    marks: 20,
    problemDescription: 'Given an array of integers nums and an integer target, return the 0-indexed positions of the two numbers such that they add up to target. Print the two indices separated by a space (i j where i < j).',
    inputFormat: 'Line 1: N (array size)\nLine 2: N space-separated integers\nLine 3: target integer',
    outputFormat: 'Two space-separated integers: i j',
    constraints: '2 <= N <= 10^4\n-10^9 <= nums[i] <= 10^9',
    starterCodeJson: JSON.stringify(DEFAULT_STARTER_CODES),
    allowedLanguages: 'python,java,cpp,c,csharp,kotlin',
    timeLimitSeconds: 2,
    memoryLimitMb: 256,
    testCases: [
      { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', sample: true, explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
      { input: '3\n3 2 4\n6', expectedOutput: '1 2', sample: true, explanation: 'nums[1] + nums[2] = 2 + 4 = 6' },
      { input: '2\n3 3\n6', expectedOutput: '0 1', sample: false, explanation: 'Duplicate values sum' },
      { input: '5\n1 5 3 7 9\n12', expectedOutput: '1 3', sample: false, explanation: 'nums[1] + nums[3] = 5 + 7 = 12' }
    ]
  },
  {
    questionType: 'CODING',
    problemTitle: 'Reverse Integer Array',
    marks: 15,
    problemDescription: 'Given an array of N integers, print the elements in reverse order separated by spaces.',
    inputFormat: 'Line 1: N\nLine 2: N space-separated integers',
    outputFormat: 'N space-separated integers in reverse order',
    constraints: '1 <= N <= 10^5',
    starterCodeJson: JSON.stringify(DEFAULT_STARTER_CODES),
    allowedLanguages: 'python,java,cpp,c,csharp,kotlin',
    timeLimitSeconds: 2,
    memoryLimitMb: 256,
    testCases: [
      { input: '4\n1 2 3 4', expectedOutput: '4 3 2 1', sample: true, explanation: 'Reverse of [1, 2, 3, 4]' },
      { input: '5\n10 20 30 40 50', expectedOutput: '50 40 30 20 10', sample: true, explanation: 'Reverse of 5 elements' },
      { input: '1\n99', expectedOutput: '99', sample: false, explanation: 'Single element edge case' },
      { input: '6\n-5 0 8 -2 14 3', expectedOutput: '3 14 -2 8 0 -5', sample: false, explanation: 'Handling negative values' }
    ]
  },
  {
    questionType: 'CODING',
    problemTitle: 'Palindrome String Checker',
    marks: 15,
    problemDescription: 'Determine whether the given single-word string is a palindrome (reads same forward and backward, case-insensitive). Print YES if palindrome, otherwise print NO.',
    inputFormat: 'A single word string S',
    outputFormat: 'YES or NO',
    constraints: '1 <= length(S) <= 1000',
    starterCodeJson: JSON.stringify(DEFAULT_STARTER_CODES),
    allowedLanguages: 'python,java,cpp,c,csharp,kotlin',
    timeLimitSeconds: 2,
    memoryLimitMb: 256,
    testCases: [
      { input: 'racecar', expectedOutput: 'YES', sample: true, explanation: 'racecar reversed is racecar' },
      { input: 'hello', expectedOutput: 'NO', sample: true, explanation: 'hello reversed is olleh' },
      { input: 'Madam', expectedOutput: 'YES', sample: false, explanation: 'Case-insensitive test case' },
      { input: 'a', expectedOutput: 'YES', sample: false, explanation: 'Single character string' }
    ]
  }
];

export const TrainerDashboard = ({
  activeTab: controlledTab,
  onSelectTab: controlledOnSelectTab
}) => {
  const { user } = useAuth();
  const [internalTab, setInternalTab] = useState('published-assignments');
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setActiveTab = controlledOnSelectTab || setInternalTab;
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [allAttempts, setAllAttempts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [editingAssign, setEditingAssign] = useState(null);
  const [showEditAssignModal, setShowEditAssignModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [showEditExamModal, setShowEditExamModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditFilterAssignment, setAuditFilterAssignment] = useState('ALL');
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Data Export Handlers
  const handleExportAll = () => {
    exportMasterStudentReport({
      students,
      attempts: allAttempts,
      submissions,
      projects
    });
  };

  const handleExportAssessments = () => {
    exportAssessmentReport(allAttempts, exams);
  };

  const handleExportAssignments = () => {
    exportAssignmentReport(submissions, assignments);
  };

  const handleExportProjects = () => {
    exportProjectReport(projects);
  };

  // Assignment CRUD
  const handleDeleteAssignment = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete assignment "${title}"?`)) return;
    try {
      await api.delete(`/assignments/${id}`);
      setAssignments(prev => prev.filter(a => a.id !== id));
      setSubmissions(prev => prev.filter(s => s.assignmentId !== id));
    } catch (err) {
      alert('Failed to delete assignment: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenEditAssignment = (assign) => {
    setEditingAssign({
      id: assign.id,
      title: assign.title || '',
      description: assign.description || '',
      maxScore: assign.maxScore || 100,
      submissionType: assign.submissionType || 'PDF',
      assignedToAll: assign.assignedToAll !== false,
      assignedStudentIds: assign.assignedStudentIds || '',
      dueDateTime: assign.dueDateTime ? assign.dueDateTime.substring(0, 16) : '',
      pdfAttachmentUrl: assign.pdfAttachmentUrl || '',
      allowResubmission: !!assign.allowResubmission
    });
    setShowEditAssignModal(true);
  };

  const handleSaveEditAssignment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: editingAssign.title,
        description: editingAssign.description,
        maxScore: Number(editingAssign.maxScore),
        submissionType: editingAssign.submissionType,
        assignedToAll: editingAssign.assignedToAll,
        assignedStudentIds: editingAssign.assignedStudentIds,
        dueDateTime: editingAssign.dueDateTime ? new Date(editingAssign.dueDateTime).toISOString() : null,
        pdfAttachmentUrl: editingAssign.pdfAttachmentUrl,
        allowResubmission: editingAssign.allowResubmission
      };
      const res = await api.put(`/assignments/${editingAssign.id}`, payload);
      setAssignments(prev => prev.map(a => a.id === editingAssign.id ? { ...a, ...res.data } : a));
      setShowEditAssignModal(false);
      setEditingAssign(null);
    } catch (err) {
      alert('Failed to update assignment: ' + (err.response?.data?.message || err.message));
    }
  };

  // Project Topic CRUD
  const handleDeleteProject = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete project topic "${title}"?`)) return;
    try {
      await api.delete(`/projects/topics/${id}`);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Failed to delete project topic: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenEditProject = (topic) => {
    setEditingProject({
      id: topic.id,
      title: topic.title || '',
      description: topic.description || '',
      minTeamSize: topic.minTeamSize || 2,
      maxTeamSize: topic.maxTeamSize || 4,
      deadline: topic.deadline || '',
      status: topic.status || 'ACTIVE'
    });
    setShowEditProjectModal(true);
  };

  const handleSaveEditProject = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: editingProject.title,
        description: editingProject.description,
        minTeamSize: Number(editingProject.minTeamSize),
        maxTeamSize: Number(editingProject.maxTeamSize),
        deadline: editingProject.deadline,
        status: editingProject.status
      };
      const res = await api.put(`/projects/topics/${editingProject.id}`, payload);
      setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...res.data } : p));
      setShowEditProjectModal(false);
      setEditingProject(null);
    } catch (err) {
      alert('Failed to update project topic: ' + (err.response?.data?.message || err.message));
    }
  };

  // Exam CRUD
  const handleDeleteExam = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete exam "${title}"?`)) return;
    try {
      await api.delete(`/exams/${id}`);
      setExams(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert('Failed to delete exam: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenEditExam = (exam) => {
    setEditingExam({
      id: exam.id,
      title: exam.title || '',
      description: exam.description || '',
      durationMinutes: exam.durationMinutes || 60,
      totalMarks: exam.totalMarks || 100,
      passingMarks: exam.passingMarks || 40,
      assessmentType: exam.assessmentType || 'TRAINER_ASSIGNED',
      scheduledStartTime: exam.scheduledStartTime ? exam.scheduledStartTime.substring(0, 16) : '',
      scheduledEndTime: exam.scheduledEndTime ? exam.scheduledEndTime.substring(0, 16) : '',
      active: exam.active !== false
    });
    setShowEditExamModal(true);
  };

  const handleSaveEditExam = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: editingExam.title,
        description: editingExam.description,
        durationMinutes: Number(editingExam.durationMinutes),
        totalMarks: Number(editingExam.totalMarks),
        passingMarks: Number(editingExam.passingMarks),
        assessmentType: editingExam.assessmentType,
        scheduledStartTime: editingExam.scheduledStartTime ? new Date(editingExam.scheduledStartTime).toISOString() : null,
        scheduledEndTime: editingExam.scheduledEndTime ? new Date(editingExam.scheduledEndTime).toISOString() : null,
        active: editingExam.active
      };
      const res = await api.put(`/exams/${editingExam.id}`, payload);
      setExams(prev => prev.map(e => e.id === editingExam.id ? { ...e, ...res.data } : e));
      setShowEditExamModal(false);
      setEditingExam(null);
    } catch (err) {
      alert('Failed to update exam: ' + (err.response?.data?.message || err.message));
    }
  };
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('bridgeai_trainer_sidebar_open');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('bridgeai_trainer_sidebar_open', String(next));
      return next;
    });
  };

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showProjectGradeModal, setShowProjectGradeModal] = useState(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showCreateModuleModal, setShowCreateModuleModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(1);
  const [courseDetail, setCourseDetail] = useState(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', orderIndex: 1 });

  const fetchCourseDetail = async (cId) => {
    try {
      const cDetailRes = await api.get(`/courses/${cId}`);
      let detail = cDetailRes.data;
      if (!detail.assignedTrainers || detail.assignedTrainers.length === 0) {
        try {
          const trRes = await api.get(`/courses/${cId}/trainers`);
          if (trRes.data && trRes.data.length > 0) {
            detail = { ...detail, assignedTrainers: trRes.data };
          }
        } catch (e) {}
      }
      if (detail) setCourseDetail(detail);
    } catch (err) {
      console.error('Failed to load course details', err);
    }
  };

  // Assignment Form
  const [assignForm, setAssignForm] = useState({
    courseId: 1,
    title: '',
    description: '',
    subjectName: user?.assignedSubject || 'Computer Science & AI',
    dueDateTime: '2026-10-15T23:59',
    maxScore: 100,
    pdfAttachmentUrl: '',
    assignedToAll: true,
    assignedStudentIds: [],
    allowResubmission: true
  });

  // Project Form with Team Size constraints
  const [projectForm, setProjectForm] = useState({
    courseId: 1,
    title: '',
    description: '',
    requirements: '',
    subjectName: user?.assignedSubject || 'Computer Science & AI',
    deadline: '2026-11-01T23:59',
    maxScore: 100,
    minTeamSize: 2,
    maxTeamSize: 4
  });

  // Exam Form
  const [examForm, setExamForm] = useState({
    courseId: 1,
    title: '',
    description: '',
    instructions: 'Safe browsing mode, fullscreen lockdown, and proctoring surveillance are active.',
    scheduledStartTime: '2026-09-12T10:00',
    scheduledEndTime: '2026-09-30T23:59',
    durationMinutes: 45,
    passingPercentage: 60,
    maxViolations: 3,
    totalMarks: 30,
    questions: [
      {
        questionText: 'What is the primary benefit of deploying microservices behind a Least-Connection load balancer?',
        optionA: 'Distributes traffic to node with lowest active connections',
        optionB: 'Stores passwords in plaintext',
        optionC: 'Forces unencrypted UDP',
        optionD: 'Disables TLS handshakes',
        correctOption: 'A',
        marks: 10,
        explanation: 'Optimizes throughput under heterogeneous connection lengths.'
      },
      {
        questionText: 'Under SOLID principles, what does SRP stand for?',
        optionA: 'Single Responsibility Principle',
        optionB: 'System Replication Protocol',
        optionC: 'Server Resource Partition',
        optionD: 'Synchronous Remote Procedure',
        correctOption: 'A',
        marks: 10,
        explanation: 'A module should be responsible to one, and only one, actor.'
      },
      {
        questionText: 'Which HTTP method is idempotent according to RFC 7231?',
        optionA: 'POST',
        optionB: 'PUT',
        optionC: 'CONNECT',
        optionD: 'PATCH',
        correctOption: 'B',
        marks: 10,
        explanation: 'PUT guarantees repeated executions yield the same state.'
      }
    ]
  });

  // Recording Form
  const [recordingForm, setRecordingForm] = useState({
    sessionId: null,
    recordingVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    recordingNotes: 'Covered microservice patterns, container isolation, and rate-limiting queues.'
  });

  // Material Form
  const [materialForm, setMaterialForm] = useState({
    courseId: 1,
    moduleId: 1,
    title: '',
    resourceType: 'ARTICLE',
    urlOrPath: 'https://arxiv.org/pdf/1706.03762.pdf',
    videoEmbedUrl: '',
    richContent: '',
    description: '',
    orderIndex: 1,
    visibilityScope: 'GLOBAL',
    isGlobal: true,
    isInstitution: true,
    includeModuleTest: false,
    testTitle: '',
    testDescription: '',
    durationMinutes: 20,
    passingPercentage: 60
  });
  const [materialQuestions, setMaterialQuestions] = useState([]);

  // Grading Form
  const [gradeForm, setGradeForm] = useState({
    score: 95,
    grade: 'A+',
    feedback: 'Excellent work. Methodology, implementation, and documentation verified.'
  });

  // Project Grade Form
  const [projectGradeForm, setProjectGradeForm] = useState({
    score: 90,
    feedback: 'Comprehensive deliverable submission with working repository and documentation.'
  });

  // Edit deadline state
  const [newDeadline, setNewDeadline] = useState('');

  useEffect(() => {
    fetchTrainerData();
  }, []);

  const fetchTrainerData = async () => {
    try {
      setLoading(true);
      const [coursesRes, examsRes, attemptsRes, assignRes, projRes, sessRes, studRes] = await Promise.allSettled([
        api.get('/courses/my-assigned'),
        api.get('/exams/all'),
        api.get('/exams/all-attempts'),
        api.get('/assignments'),
        api.get('/projects'),
        api.get('/sessions'),
        api.get('/admin/students')
      ]);

      if (coursesRes.status === 'fulfilled') {
        const cList = coursesRes.value.data || [];
        setCourses(cList);
        const initId = cList[0]?.id || 1;
        setSelectedCourseId(initId);
        if (cList.length > 0) {
          fetchCourseDetail(initId);
          setAssignForm(prev => ({ ...prev, courseId: initId, subjectName: cList[0].title }));
          setProjectForm(prev => ({ ...prev, courseId: initId, subjectName: cList[0].title }));
          setExamForm(prev => ({ ...prev, courseId: initId }));
          setMaterialForm(prev => ({ ...prev, courseId: initId }));
        }
      }
      if (examsRes.status === 'fulfilled') setExams(examsRes.value.data || []);
      if (attemptsRes.status === 'fulfilled') setAllAttempts(attemptsRes.value.data || []);
      if (projRes.status === 'fulfilled') {
        const rawProjects = projRes.value.data || [];
        const enriched = await Promise.all(rawProjects.map(async (p) => {
          try {
            const teamsRes = await api.get(`/projects/topics/${p.id}/teams`);
            return { ...p, teams: teamsRes.data || [] };
          } catch (e) {
            return { ...p, teams: [] };
          }
        }));
        setProjects(enriched);
      }
      if (sessRes.status === 'fulfilled') setSessions(sessRes.value.data || []);
      if (studRes.status === 'fulfilled') setStudents(studRes.value.data || []);

      // Course detail loaded dynamically based on selected subject

      if (assignRes.status === 'fulfilled') {
        const assList = assignRes.value.data || [];
        setAssignments(assList);
        // Fetch all submissions for these assignments
        let allSubs = [];
        for (const a of assList) {
          try {
            const subRes = await api.get(`/assignments/${a.id}/submissions`);
            if (subRes.data && subRes.data.length > 0) {
              allSubs.push(...subRes.data.map(s => ({ ...s, assignmentTitle: a.title, subjectName: a.subjectName })));
            }
          } catch (e) {}
        }
        setSubmissions(allSubs);
      }

      // Fetch assignment audit logs
      try {
        const auditRes = await api.get('/assignments/audit-logs');
        setAuditLogs(auditRes.data || []);
      } catch (e) {
        console.warn('Failed to load assignment audit logs:', e);
      }
    } catch (err) {
      console.warn('Trainer data fetch notice:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Create Assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/assignments', {
        ...assignForm,
        assignedStudentIds: assignForm.assignedToAll ? '' : assignForm.assignedStudentIds.join(',')
      });
      alert('Assignment created and assigned to students successfully!');
      setShowAssignModal(false);
      fetchTrainerData();
    } catch (err) {
      alert('Failed to create assignment: ' + (err.response?.data?.message || err.message));
    }
  };

  // 2. Review Submission -> transitions to UNDER_REVIEW
  const handleReviewSubmission = async (sub) => {
    try {
      const res = await api.get(`/assignments/submissions/${sub.id}/review`);
      setShowReviewModal(res.data);
      fetchTrainerData();
    } catch (err) {
      alert('Failed to review submission: ' + err.message);
    }
  };

  // 3. Evaluate Submission -> transitions to CHECKED
  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!showGradingModal) return;
    try {
      await api.post(`/assignments/submissions/${showGradingModal.id}/evaluate`, gradeForm);
      alert('Submission evaluated and marked as CHECKED! Marks visible to student.');
      setShowGradingModal(null);
      fetchTrainerData();
    } catch (err) {
      alert('Failed to save grade: ' + (err.response?.data?.message || err.message));
    }
  };

  // Standalone fetch for real-time audit history
  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.get('/assignments/audit-logs');
      setAuditLogs(res.data || []);
    } catch (err) {
      console.warn('Failed to refresh audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // 4. Toggle Resubmission on Assignment
  const handleToggleResubmission = async (assignmentId, currentVal) => {
    try {
      await api.put(`/assignments/${assignmentId}/toggle-resubmission?allow=${!currentVal}`);
      fetchTrainerData();
      fetchAuditLogs();
    } catch (err) {
      alert('Failed to toggle resubmission permission: ' + err.message);
    }
  };

  // 5. Toggle Individual Student Edit
  const handleToggleStudentEdit = async (submissionId, currentVal) => {
    try {
      await api.put(`/assignments/submissions/${submissionId}/toggle-edit?allow=${!currentVal}`);
      fetchTrainerData();
      fetchAuditLogs();
    } catch (err) {
      alert('Failed to toggle student edit: ' + err.message);
    }
  };

  // 6. Update Assignment Deadline
  const handleUpdateDeadline = async (e) => {
    e.preventDefault();
    if (!showDeadlineModal || !newDeadline) return;
    try {
      await api.put(`/assignments/${showDeadlineModal.id}/deadline`, { dueDateTime: newDeadline });
      alert('Assignment deadline updated successfully!');
      setShowDeadlineModal(null);
      setNewDeadline('');
      fetchTrainerData();
    } catch (err) {
      alert('Failed to update deadline: ' + err.message);
    }
  };

  // 7. Toggle Exam Reattempt
  const handleToggleReattempt = async (attemptId, currentVal) => {
    try {
      await api.put(`/exams/attempts/${attemptId}/allow-reattempt?allow=${!currentVal}`);
      fetchTrainerData();
    } catch (err) {
      alert('Failed to toggle re-attempt: ' + err.message);
    }
  };

  // 8. Create Project Topic
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects/topics', projectForm);
      alert('Project topic published to Project Hub!');
      setShowProjectModal(false);
      fetchTrainerData();
    } catch (err) {
      alert('Failed to create project topic: ' + err.message);
    }
  };

  // 9. Grade Project Team Deliverables
  const handleGradeProject = async (e) => {
    e.preventDefault();
    if (!showProjectGradeModal) return;
    try {
      if (showProjectGradeModal.isTeam) {
        await api.post(`/projects/teams/${showProjectGradeModal.teamId}/evaluate`, {
          score: projectGradeForm.score,
          feedback: projectGradeForm.feedback,
          status: 'EVALUATED'
        });
        alert('Team deliverables evaluated! Marks & feedback are now synchronized to all team members.');
      } else {
        await api.post(`/projects/${showProjectGradeModal.id}/evaluate`, projectGradeForm);
        alert('Project evaluated successfully!');
      }
      setShowProjectGradeModal(null);
      fetchTrainerData();
    } catch (err) {
      alert('Failed to grade project: ' + (err.response?.data?.message || err.message));
    }
  };

  // Download Sample CSV for Exam Questions
  const handleDownloadSampleCsv = () => {
    const csvHeader = "question,optionA,optionB,optionC,optionD,correctOption,marks,explanation\n";
    const sampleRows = [
      '"What is the primary benefit of deploying microservices behind a Least-Connection load balancer?","Distributes traffic to node with lowest active connections","Stores passwords in plaintext","Forces unencrypted UDP","Disables TLS handshakes","A",10,"Optimizes throughput under heterogeneous connection lengths."',
      '"Under SOLID principles, what does SRP stand for?","Single Responsibility Principle","System Replication Protocol","Server Resource Partition","Synchronous Remote Procedure","A",10,"A module should be responsible to one, and only one, actor."',
      '"Which HTTP method is idempotent according to RFC 7231?","POST","PUT","CONNECT","PATCH","B",10,"PUT guarantees repeated executions yield the same state."',
      '"What does the Spring @Transactional annotation provide?","Atomic database transaction boundary","Encrypts all HTTP traffic","Disables garbage collection","Compiles code to WebAssembly","A",10,"Ensures all queries within the method execute in an atomic transaction."'
    ].join('\n');

    const blob = new Blob([csvHeader + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_exam_questions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust Normalizer for MCQ Correct Options (Maps "Option A", "1", option text, etc. to 'A', 'B', 'C', 'D')
  const normalizeCorrectOption = (raw, optA, optB, optC, optD) => {
    if (!raw) return 'A';
    const s = String(raw).trim();
    const u = s.toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(u)) return u;
    if (u.startsWith('OPTION') || u.startsWith('CHOICE') || u.startsWith('ANSWER')) {
      const stripped = u.replace(/^(OPTION|CHOICE|ANSWER)[:\-\s]*/i, '').trim();
      if (stripped.startsWith('A') || stripped === '1') return 'A';
      if (stripped.startsWith('B') || stripped === '2') return 'B';
      if (stripped.startsWith('C') || stripped === '3') return 'C';
      if (stripped.startsWith('D') || stripped === '4') return 'D';
    }
    if (s === '1') return 'A';
    if (s === '2') return 'B';
    if (s === '3') return 'C';
    if (s === '4') return 'D';
    if (/^\[?[A-D][).\:\-\s]/i.test(u)) {
      return u.replace(/^\[?([A-D]).*/, '$1');
    }
    if (optA && s.toLowerCase() === String(optA).trim().toLowerCase()) return 'A';
    if (optB && s.toLowerCase() === String(optB).trim().toLowerCase()) return 'B';
    if (optC && s.toLowerCase() === String(optC).trim().toLowerCase()) return 'C';
    if (optD && s.toLowerCase() === String(optD).trim().toLowerCase()) return 'D';
    if (u.startsWith('A')) return 'A';
    if (u.startsWith('B')) return 'B';
    if (u.startsWith('C')) return 'C';
    if (u.startsWith('D')) return 'D';
    return 'A';
  };

  // Parse CSV Line handling quoted fields
  const parseCsvLine = (text) => {
    const result = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(cell.trim().replace(/^["']|["']$/g, ''));
        cell = '';
      } else {
        cell += char;
      }
    }
    result.push(cell.trim().replace(/^["']|["']$/g, ''));
    return result;
  };

  // Handle CSV File Upload for Exam Questions
  const handleCsvFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          alert('CSV file appears empty or does not contain data rows.');
          return;
        }

        const dataRows = lines.slice(1);
        const parsed = [];

        for (let i = 0; i < dataRows.length; i++) {
          const cols = parseCsvLine(dataRows[i]);
          if (cols.length >= 6) {
            const qText = cols[0];
            const optA = cols[1] || '';
            const optB = cols[2] || '';
            const optC = cols[3] || '';
            const optD = cols[4] || '';
            const correct = normalizeCorrectOption(cols[5], optA, optB, optC, optD);
            const marks = cols[6] ? parseInt(cols[6], 10) || 10 : 10;
            const explanation = cols[7] || '';

            if (qText) {
              parsed.push({
                questionText: qText,
                optionA: optA,
                optionB: optB,
                optionC: optC,
                optionD: optD,
                correctOption: correct,
                marks: marks,
                explanation: explanation
              });
            }
          }
        }

        if (parsed.length === 0) {
          alert('Could not parse any valid questions from the CSV. Please ensure columns match: question, optionA, optionB, optionC, optionD, correctOption, marks, explanation');
          return;
        }

        setExamForm(prev => ({
          ...prev,
          questions: [...prev.questions, ...parsed]
        }));
        alert(`Successfully imported ${parsed.length} questions from CSV! Total questions now: ${examForm.questions.length + parsed.length}`);
      } catch (err) {
        alert('Error parsing CSV file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Add Question Manually
  const handleAddManualQuestion = () => {
    setExamForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionType: 'MCQ',
          questionText: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctOption: 'A',
          marks: 10,
          explanation: ''
        }
      ]
    }));
  };

  // Add Coding Problem
  const handleAddCodingQuestion = () => {
    setExamForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionType: 'CODING',
          problemTitle: 'New Coding Problem',
          problemDescription: '',
          inputFormat: '',
          outputFormat: '',
          constraints: '',
          starterCodeJson: JSON.stringify(DEFAULT_STARTER_CODES),
          allowedLanguages: 'python,java,cpp,c,csharp,kotlin',
          timeLimitSeconds: 2,
          memoryLimitMb: 256,
          marks: 20,
          testCases: [
            { input: '', expectedOutput: '', sample: true, explanation: 'Sample public test case' },
            { input: '', expectedOutput: '', sample: false, explanation: 'Hidden evaluation test case' }
          ]
        }
      ]
    }));
  };

  // Load Sample Coding Problems
  const handleLoadSampleCodingProblems = () => {
    setExamForm(prev => ({
      ...prev,
      questions: [...prev.questions, ...sampleCodingProblems]
    }));
  };

  // Load Sample MCQs
  const handleLoadSampleMcqs = () => {
    const sampleMcqList = [
      {
        questionType: 'MCQ',
        questionText: 'What is the primary benefit of deploying microservices behind a Least-Connection load balancer?',
        optionA: 'Distributes traffic to node with lowest active connections',
        optionB: 'Stores passwords in plaintext',
        optionC: 'Forces unencrypted UDP',
        optionD: 'Disables TLS handshakes',
        correctOption: 'A',
        marks: 10,
        explanation: 'Optimizes throughput under heterogeneous connection lengths.'
      },
      {
        questionType: 'MCQ',
        questionText: 'Under SOLID principles, what does SRP stand for?',
        optionA: 'Single Responsibility Principle',
        optionB: 'System Replication Protocol',
        optionC: 'Server Resource Partition',
        optionD: 'Synchronous Remote Procedure',
        correctOption: 'A',
        marks: 10,
        explanation: 'A module should be responsible to one, and only one, actor.'
      },
      {
        questionType: 'MCQ',
        questionText: 'Which HTTP method is idempotent according to RFC 7231?',
        optionA: 'POST',
        optionB: 'PUT',
        optionC: 'CONNECT',
        optionD: 'PATCH',
        correctOption: 'B',
        marks: 10,
        explanation: 'PUT guarantees repeated executions yield the same state.'
      }
    ];
    setExamForm(prev => ({
      ...prev,
      questions: [...prev.questions, ...sampleMcqList]
    }));
  };

  // Add Test Case to Coding Question
  const handleAddTestCase = (qIdx) => {
    setExamForm(prev => {
      const qList = [...prev.questions];
      const q = { ...qList[qIdx] };
      const tcs = q.testCases ? [...q.testCases] : [];
      tcs.push({ input: '', expectedOutput: '', sample: false, explanation: '' });
      q.testCases = tcs;
      qList[qIdx] = q;
      return { ...prev, questions: qList };
    });
  };

  // Remove Test Case from Coding Question
  const handleRemoveTestCase = (qIdx, tcIdx) => {
    setExamForm(prev => {
      const qList = [...prev.questions];
      const q = { ...qList[qIdx] };
      q.testCases = (q.testCases || []).filter((_, i) => i !== tcIdx);
      qList[qIdx] = q;
      return { ...prev, questions: qList };
    });
  };

  // Update Test Case Field
  const handleUpdateTestCase = (qIdx, tcIdx, field, value) => {
    setExamForm(prev => {
      const qList = [...prev.questions];
      const q = { ...qList[qIdx] };
      const tcs = [...(q.testCases || [])];
      tcs[tcIdx] = { ...tcs[tcIdx], [field]: value };
      q.testCases = tcs;
      qList[qIdx] = q;
      return { ...prev, questions: qList };
    });
  };

  // Remove Question
  const handleRemoveQuestion = (idx) => {
    setExamForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx)
    }));
  };

  // Update Question Field
  const handleQuestionFieldChange = (idx, field, value) => {
    setExamForm(prev => {
      const qList = [...prev.questions];
      qList[idx] = { ...qList[idx], [field]: value };
      return { ...prev, questions: qList };
    });
  };

  // Helper methods for structured problem constraints
  const handleAddConstraintItem = (qIdx) => {
    setExamForm(prev => {
      const qList = [...prev.questions];
      const q = { ...qList[qIdx] };
      const list = q.constraintsList !== undefined
        ? [...q.constraintsList]
        : (q.constraints ? q.constraints.split(/\r?\n/) : []);
      list.push('');
      q.constraintsList = list;
      q.constraints = list.join('\n');
      qList[qIdx] = q;
      return { ...prev, questions: qList };
    });
  };

  const handleUpdateConstraintItem = (qIdx, cIdx, val) => {
    setExamForm(prev => {
      const qList = [...prev.questions];
      const q = { ...qList[qIdx] };
      const list = q.constraintsList !== undefined
        ? [...q.constraintsList]
        : (q.constraints ? q.constraints.split(/\r?\n/) : []);
      while (list.length <= cIdx) list.push('');
      list[cIdx] = val;
      q.constraintsList = list;
      q.constraints = list.join('\n');
      qList[qIdx] = q;
      return { ...prev, questions: qList };
    });
  };

  const handleRemoveConstraintItem = (qIdx, cIdx) => {
    setExamForm(prev => {
      const qList = [...prev.questions];
      const q = { ...qList[qIdx] };
      const list = (q.constraintsList !== undefined
        ? [...q.constraintsList]
        : (q.constraints ? q.constraints.split(/\r?\n/) : [])
      ).filter((_, i) => i !== cIdx);
      q.constraintsList = list;
      q.constraints = list.join('\n');
      qList[qIdx] = q;
      return { ...prev, questions: qList };
    });
  };

  const handleQuickAddConstraint = (qIdx, snippet) => {
    setExamForm(prev => {
      const qList = [...prev.questions];
      const q = { ...qList[qIdx] };
      let list = q.constraintsList !== undefined
        ? [...q.constraintsList]
        : (q.constraints ? q.constraints.split(/\r?\n/) : []);
      if (list.length === 1 && list[0].trim() === '') {
        list = [snippet];
      } else if (!list.includes(snippet)) {
        list = list.filter(item => item.trim() !== '');
        list.push(snippet);
      }
      q.constraintsList = list;
      q.constraints = list.join('\n');
      qList[qIdx] = q;
      return { ...prev, questions: qList };
    });
  };

  const handleRawConstraintsChange = (qIdx, rawText) => {
    setExamForm(prev => {
      const qList = [...prev.questions];
      const q = { ...qList[qIdx] };
      q.constraints = rawText;
      q.constraintsList = rawText.split(/\r?\n/);
      qList[qIdx] = q;
      return { ...prev, questions: qList };
    });
  };

  const sampleKafkaQuestions = [
    {
      questionText: "In Kafka event streaming, what ensures messages with identical business keys are processed sequentially?",
      optionA: "Messages with identical keys are routed to the same partition and consumed in order",
      optionB: "Dead Letter Queue automatically reorders transactions",
      optionC: "Kafka broker performs global locking across all consumer groups",
      optionD: "Consumer offsets are reset to zero after each event",
      correctOption: "A",
      marks: 10,
      explanation: "Kafka guarantees strict ordering within a single partition; hashing the message key maps all related events to the exact same partition."
    },
    {
      questionText: "What is the primary role of a Dead Letter Queue (DLQ) in asynchronous event processing?",
      optionA: "To increase consumer thread pool capacity",
      optionB: "To isolate unparseable or poison-pill payloads without stalling the main consumer stream",
      optionC: "To cache duplicate REST requests for idempotency",
      optionD: "To compress high-throughput binary payloads",
      correctOption: "B",
      marks: 10,
      explanation: "DLQs receive failed messages after retry attempts are exhausted, allowing the main pipeline to continue processing healthy events."
    },
    {
      questionText: "How does a Kafka Consumer Group achieve horizontal scalability?",
      optionA: "By allowing multiple consumers in the group to share the partitions of a subscribed topic",
      optionB: "By duplicating every message to all consumers in the group",
      optionC: "By forcing all producers to write to a single leader partition",
      optionD: "By disabling consumer offset commits",
      correctOption: "A",
      marks: 10,
      explanation: "Partitions are distributed evenly across consumers within the consumer group, enabling parallel throughput without duplicate work."
    }
  ];

  const handleAddMaterialQuestion = () => {
    setMaterialQuestions(prev => [
      ...prev,
      {
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A',
        marks: 10,
        explanation: ''
      }
    ]);
    setMaterialForm(prev => ({ ...prev, includeModuleTest: true }));
  };

  const handleRemoveMaterialQuestion = (idx) => {
    setMaterialQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateMaterialQuestion = (idx, field, value) => {
    setMaterialQuestions(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handlePrefillMaterialQuestions = () => {
    setMaterialQuestions(sampleKafkaQuestions);
    setMaterialForm(prev => ({
      ...prev,
      includeModuleTest: true,
      testTitle: prev.title ? `${prev.title} - Module Assessment` : 'Kafka & Event-Driven Architecture Test'
    }));
  };

  const handleMaterialCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      const parsed = [];
      const startIdx = lines[0].toLowerCase().includes('question') ? 1 : 0;
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 6) {
          parsed.push({
            questionText: parts[0],
            optionA: parts[1],
            optionB: parts[2],
            optionC: parts[3],
            optionD: parts[4],
            correctOption: normalizeCorrectOption(parts[5], parts[1], parts[2], parts[3], parts[4]),
            marks: Number(parts[6]) || 10,
            explanation: parts[7] || ''
          });
        }
      }
      if (parsed.length > 0) {
        setMaterialQuestions(prev => [...prev, ...parsed]);
        setMaterialForm(prev => ({ ...prev, includeModuleTest: true }));
        alert(`Successfully imported ${parsed.length} questions from CSV!`);
      } else {
        alert('Could not parse any valid questions from CSV. Please check format: question,optionA,optionB,optionC,optionD,correctOption,marks,explanation');
      }
    };
    reader.readAsText(file);
  };

  // Load Example Study Material Template
  const handleLoadExampleMaterial = () => {
    const firstModId = courseDetail?.modules?.[0]?.module?.id || 1;
    setMaterialForm({
      courseId: selectedCourseId,
      moduleId: firstModId,
      title: "Microservice Event Choreography & Kafka Partitioning",
      resourceType: "ARTICLE",
      urlOrPath: "https://kafka.apache.org/documentation/",
      videoEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      description: "Architectural blueprint explaining event-driven microservices, offset commits, partition keys, and dead-letter queues.",
      orderIndex: 1,
      visibilityScope: 'BOTH',
      isGlobal: true,
      isInstitution: true,
      includeModuleTest: true,
      testTitle: "Event Choreography & Kafka Partitioning Knowledge Check",
      testDescription: "Assessment test covering event schemas, partition keys, offsets, and DLQs.",
      durationMinutes: 15,
      passingPercentage: 60,
      richContent: `### Event-Driven Microservices & Kafka Partitioning

In distributed cloud architectures, asynchronous decoupled event publishing ensures zero-loss transaction processing and high fault tolerance.

\`\`\`java
package com.bridgeai.portal.event;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class OrderEventPublisher {

    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;

    public OrderEventPublisher(KafkaTemplate<String, OrderEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishOrder(String orderId, OrderEvent event) {
        kafkaTemplate.send("orders-topic", orderId, event);
        System.out.println("Dispatched partitioned order event: " + orderId);
    }
}
\`\`\`

### Architectural Properties:
1. **Partition Ordering**: Events sharing the same key arrive strictly sequentially.
2. **Consumer Group Offsets**: Independent consumers track offsets in __consumer_offsets without impacting upstream producers.
3. **Dead Letter Queue (DLQ)**: Poison pill payloads are routed to isolated retry queues for safe inspection.`
    });
    setMaterialQuestions(sampleKafkaQuestions);
  };

  // 10. Schedule Trainer-Assigned Assessment
  const handleScheduleExam = async (e) => {
    e.preventDefault();
    if (!examForm.questions || examForm.questions.length === 0) {
      alert('Please provide at least one question (manually or via CSV upload) to schedule this assessment.');
      return;
    }
    const computedTotal = examForm.questions.reduce((sum, q) => sum + (Number(q.marks) || 10), 0);
    try {
      const cleanedQuestions = examForm.questions.map(q => {
        if (q.questionType === 'CODING') {
          const rawConstraints = q.constraintsList !== undefined
            ? q.constraintsList.map(s => s.trim()).filter(Boolean).join('\n')
            : (q.constraints ? q.constraints.split(/\r?\n/).map(s => s.trim()).filter(Boolean).join('\n') : '');
          return {
            ...q,
            constraints: rawConstraints
          };
        }
        return {
          ...q,
          correctOption: normalizeCorrectOption(q.correctOption, q.optionA, q.optionB, q.optionC, q.optionD)
        };
      });

      await api.post('/exams/schedule', {
        ...examForm,
        questions: cleanedQuestions,
        courseId: selectedCourseId,
        totalMarks: computedTotal,
        assessmentType: 'TRAINER_ASSIGNED',
        allowMultipleAttempts: false,
        institutionId: user?.institutionId,
        institutionName: user?.institutionName
      });
      alert('Trainer-Assigned Assessment scheduled successfully for ' + (user?.institutionName || 'institution students') + ' with ' + examForm.questions.length + ' automatically evaluated questions!');
      setShowExamModal(false);
      fetchTrainerData();
    } catch (err) {
      alert('Failed to schedule assessment: ' + (err.response?.data?.message || err.message));
    }
  };

  // 11. Add Recording
  const handleAddRecording = async (e) => {
    e.preventDefault();
    if (!recordingForm.sessionId) return;
    try {
      await api.put(`/sessions/${recordingForm.sessionId}/recording?recordingVideoUrl=${encodeURIComponent(recordingForm.recordingVideoUrl)}&recordingNotes=${encodeURIComponent(recordingForm.recordingNotes)}`);
      alert('Session recording published for student streaming!');
      setShowRecordingModal(false);
      fetchTrainerData();
    } catch (err) {
      alert('Failed to update recording: ' + err.message);
    }
  };

  const selectedCourse = courses.find(c => c.id === Number(selectedCourseId)) || courseDetail?.course;
  const isConcernedFaculty = Boolean(
    selectedCourse && (
      (user?.id && selectedCourse.trainerId === user.id) ||
      (user?.fullName && selectedCourse.trainerName && selectedCourse.trainerName.toLowerCase().includes(user.fullName.toLowerCase())) ||
      (user?.assignedSubject && selectedCourse.title && selectedCourse.title.toLowerCase().includes(user.assignedSubject.toLowerCase())) ||
      (courseDetail?.assignedTrainers && courseDetail.assignedTrainers.some(t => t.trainerId === user?.id || (t.trainerEmail && user?.email && t.trainerEmail.toLowerCase() === user.email.toLowerCase())))
    )
  );

  // 11B. Create Course Module
  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!isConcernedFaculty) {
      alert(`Unauthorized: Modules for subject '${selectedCourse?.title}' can only be created by the concerned faculty (${selectedCourse?.trainerName || 'Assigned Trainer'}).`);
      return;
    }
    try {
      await api.post(`/courses/${selectedCourseId}/modules`, moduleForm);
      alert('New course module created successfully!');
      setShowCreateModuleModal(false);
      setModuleForm({ title: '', description: '', orderIndex: 1 });
      fetchCourseDetail(selectedCourseId);
    } catch (err) {
      alert('Failed to create module: ' + (err.response?.data?.message || err.message));
    }
  };

  // 12. Add Study Material
  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!isConcernedFaculty) {
      alert(`Unauthorized: Study materials for subject '${selectedCourse?.title}' can only be uploaded by the concerned faculty (${selectedCourse?.trainerName || 'Assigned Trainer'}).`);
      return;
    }
    if (!materialForm.isGlobal && !materialForm.isInstitution) {
      alert('Please select at least one visibility scope: Global, Institution, or Both.');
      return;
    }

    let calculatedScope = 'GLOBAL';
    if (materialForm.isGlobal && materialForm.isInstitution) {
      calculatedScope = 'BOTH';
    } else if (materialForm.isInstitution) {
      calculatedScope = 'INSTITUTION';
    } else {
      calculatedScope = 'GLOBAL';
    }

    try {
      await api.post(`/courses/${selectedCourseId}/resources`, {
        ...materialForm,
        courseId: selectedCourseId,
        visibilityScope: calculatedScope,
        isGlobal: materialForm.isGlobal,
        isInstitution: materialForm.isInstitution,
        institutionId: user?.institutionId || selectedCourse?.institutionId || null,
        institutionName: user?.institutionName || selectedCourse?.institutionName || '',
        questions: materialForm.includeModuleTest
          ? materialQuestions.map(q => ({
              ...q,
              correctOption: normalizeCorrectOption(q.correctOption, q.optionA, q.optionB, q.optionC, q.optionD)
            }))
          : []
      });
      alert(materialForm.includeModuleTest
        ? `Study material and Module Assessment Test with ${materialQuestions.length} questions published successfully under [${calculatedScope}] library! Available for students after reading.`
        : `Study material published successfully under [${calculatedScope}] library!`);
      setShowMaterialModal(false);
      fetchCourseDetail(selectedCourseId);
    } catch (err) {
      alert('Failed to publish study material: ' + (err.response?.data?.message || err.message));
    }
  };

  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditFilterAssignment === 'ALL') return true;
    return String(log.assignmentId) === String(auditFilterAssignment);
  });

  const isAssignmentsArea = ['assignments', 'published-assignments', 'assignment-submissions', 'assignment-audit-trail'].includes(activeTab);

  const currentAssignmentSubTab =
    activeTab === 'assignment-submissions' ? 'submissions' :
    activeTab === 'assignment-audit-trail' ? 'audit' : 'published';

  const trainerEssentials = [
    { id: 'published-assignments', label: 'Published Assignments', icon: FileText, count: assignments.length },
    { id: 'assignment-submissions', label: 'Student Submissions & Lifecycle', icon: FileCheck, count: submissions.length },
    { id: 'assignment-audit-trail', label: 'Permission & Edit History Audit Trail', icon: History, count: filteredAuditLogs.length },
    { id: 'projects', label: 'Project Hub & Deliverables', icon: FolderGit2, count: projects.length },
    { id: 'scheduled-exams', label: 'Scheduled Exams', icon: Calendar, count: exams.length },
    { id: 'live-sessions', label: 'Live Sessions (Meet/Zoom)', icon: Video },
    { id: 'student-attempts', label: 'Student Attempts & Re-attempt', icon: ShieldCheck, count: allAttempts.length },
    { id: 'recordings', label: 'Recorded Lectures & Study Materials', icon: Video, count: sessions.length }
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
          <span>Faculty Essentials Menu</span>
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
          title="Faculty Essentials"
          user={user}
          items={trainerEssentials}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          roleTheme="blue"
          statsSummary={{ label: "Active Cohort", value: `${students.length} Students` }}
          onChangePassword={() => setShowChangePasswordModal(true)}
        />
      )}

      <div className={sidebarOpen ? "w-full lg:flex-1 min-w-0 space-y-6" : "space-y-6"}>
        {/* Top Banner */}
        <div className="bg-[#0F172A] text-white rounded-2xl p-4 sm:p-6 shadow-md border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <BookPlus className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                <h1 className="text-xl sm:text-2xl font-bold">Trainer Academic Console</h1>
                <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded-full font-bold border border-blue-500/40">
                  {user?.assignedSubject || 'Computer Science & AI'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Faculty Instructor: <strong className="text-white">{user?.fullName || 'Bharat Sharma'}</strong> • {user?.institutionName || 'Indian Institute of Technology (IIT)'}.
                Create rich assignments (PDF/manual text), evaluate submissions (Submitted &rarr; Under Review &rarr; Checked), schedule proctored exams, and manage projects.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(true)}
                className="px-3.5 py-2 bg-amber-600/90 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors border border-amber-500/30"
                title="Change Trainer Password"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </button>

              {/* Download Student Data Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Student Data</span>
                </button>
                {downloadMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5 space-y-1 animate-fadeIn text-slate-800 dark:text-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => { handleExportAll(); setDownloadMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <div>
                        <div>Master Student Report</div>
                        <div className="text-[10px] text-slate-400">Complete multi-category records</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleExportAssessments(); setDownloadMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <div>
                        <div>Assessments & Exams Marks</div>
                        <div className="text-[10px] text-slate-400">Scores, percentages, verdicts</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleExportAssignments(); setDownloadMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-600" />
                      <div>
                        <div>Assignment Submissions & Grades</div>
                        <div className="text-[10px] text-slate-400">Scores, links, feedback</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleExportProjects(); setDownloadMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5 text-purple-600" />
                      <div>
                        <div>Project Evaluations & Teams</div>
                        <div className="text-[10px] text-slate-400">Topic grades, member lists</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowAssignModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <FileCheck className="w-3.5 h-3.5" />
                + Create Assignment
              </button>
              <button
                onClick={() => setShowProjectModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                + Add Project Topic
              </button>
              <button
                onClick={() => setShowExamModal(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Schedule Exam
              </button>
              <button
                onClick={() => setShowMaterialModal(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-400" />
                + Publish Study Material
              </button>
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
            </div>
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Assignments Published" value={assignments.length} subtitle="Active course tasks" icon={FileText} color="blue" />
          <MetricCard title="Submissions to Check" value={submissions.filter(s => s.status !== 'CHECKED').length} subtitle="Under review / pending" icon={CheckSquare} color="amber" />
          <MetricCard title="Project Topics" value={projects.length} subtitle="Project Hub topics" icon={FolderGit2} color="emerald" />
          <MetricCard title="Exam Attempts Audited" value={allAttempts.length} subtitle="Proctored submissions" icon={ShieldAlert} color="rose" />
        </div>

        {/* Tabs Bar: ONLY SHOWN IF !sidebarOpen (Keep any one at once: either sidebar or attached tabs) */}
        {!sidebarOpen && (
          <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <button
                onClick={() => setActiveTab('published-assignments')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  currentAssignmentSubTab === 'published' && isAssignmentsArea
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <span>Published Assignments</span>
                <span className="text-xs px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded border border-slate-200 dark:border-slate-700">
                  {assignments.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('assignment-submissions')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  currentAssignmentSubTab === 'submissions' && isAssignmentsArea
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <span>Student Submissions & Lifecycle</span>
                <span className="text-xs px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded border border-slate-200 dark:border-slate-700">
                  {submissions.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('assignment-audit-trail')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  currentAssignmentSubTab === 'audit' && isAssignmentsArea
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <span>Permission & Edit History Audit Trail</span>
                <span className="text-xs px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded border border-slate-200 dark:border-slate-700">
                  {filteredAuditLogs.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('projects')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'projects'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <span>Project Hub & Deliverables</span>
                <span className="text-xs px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded border border-slate-200 dark:border-slate-700">
                  {projects.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('scheduled-exams')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'scheduled-exams'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <span>Scheduled Exams</span>
                <span className="text-xs px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded border border-slate-200 dark:border-slate-700">
                  {exams.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('student-attempts')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'student-attempts'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <span>Student Attempts</span>
                <span className="text-xs px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded border border-slate-200 dark:border-slate-700">
                  {allAttempts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('recordings')}
                className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'recordings'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-500 border-x border-t border-slate-200 dark:border-slate-800 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
                }`}
              >
                <span>Recorded Lectures & Study Materials</span>
                <span className="text-xs px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded border border-slate-200 dark:border-slate-700">
                  {sessions.length}
                </span>
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
          role="ROLE_TRAINER"
          courses={courses}
          themeColor="blue"
        />
      )}

      {/* TAB: ASSIGNMENTS / SUBMISSIONS / AUDIT TRAIL */}
      {isAssignmentsArea && (
        <div className="space-y-6">
          {/* Dedicated Sub-Tab Navigation Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('published-assignments')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  currentAssignmentSubTab === 'published'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Published Assignments</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  currentAssignmentSubTab === 'published'
                    ? 'bg-blue-700 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}>
                  {assignments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('assignment-submissions')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  currentAssignmentSubTab === 'submissions'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FileCheck className="w-4 h-4" />
                <span>Student Assignment Submissions & Lifecycle</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  currentAssignmentSubTab === 'submissions'
                    ? 'bg-blue-700 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}>
                  {submissions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('assignment-audit-trail')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  currentAssignmentSubTab === 'audit'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Student Permission & Edit History Audit Trail</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                  currentAssignmentSubTab === 'audit'
                    ? 'bg-blue-700 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}>
                  {filteredAuditLogs.length}
                </span>
              </button>
            </div>

            {currentAssignmentSubTab === 'published' && (
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-3.5 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                + New Assignment
              </button>
            )}
          </div>

          {/* TAB VIEW 1: Published Assignments */}
          {currentAssignmentSubTab === 'published' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Published Assignments</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage assignment deadlines, toggle student edit permissions, and track submissions.
                </p>
              </div>
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-3 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                + New Assignment
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60">
                    <th className="p-3">Title & Subject</th>
                    <th className="p-3">Submission Type</th>
                    <th className="p-3">Assignment Scope</th>
                    <th className="p-3">Deadline</th>
                    <th className="p-3">Allow Edit / Resubmission</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {assignments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{a.title}</div>
                        <span className="text-[11px] text-blue-700 font-semibold">{a.subjectName}</span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                          {a.submissionType || 'PDF'}
                        </span>
                        {a.pdfAttachmentUrl && (
                          <a href={a.pdfAttachmentUrl} target="_blank" rel="noreferrer" className="block text-[11px] text-blue-600 dark:text-blue-400 hover:underline mt-0.5">
                            View PDF Attachment
                          </a>
                        )}
                      </td>
                      <td className="p-3">
                        {a.assignedToAll ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            All Enrolled Students
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Selective Students ({a.assignedStudentIds ? a.assignedStudentIds.split(',').length : 0})
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                        {a.dueDateTime ? new Date(a.dueDateTime).toLocaleString() : 'Open'}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleToggleResubmission(a.id, a.allowResubmission)}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
                            a.allowResubmission
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {a.allowResubmission ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Allowed (Click to lock)</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <span>Locked (Click to allow)</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditAssignment(a)}
                          className="px-2 py-1 border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          title="Edit Assignment"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => { setShowDeadlineModal(a); setNewDeadline(a.dueDateTime ? a.dueDateTime.substring(0, 16) : ''); }}
                          className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium"
                        >
                          Deadline
                        </button>
                        <button
                          onClick={() => handleDeleteAssignment(a.id, a.title)}
                          className="px-2 py-1 border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          title="Delete Assignment"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* TAB VIEW 2: Student Submissions Table & Lifecycle */}
          {currentAssignmentSubTab === 'submissions' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Student Assignment Submissions & Lifecycle</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Workflow: <strong>Submitted</strong> &rarr; Click <em>Review</em> (&rarr; <strong>Under Review</strong>) &rarr; Click <em>Grade & Check</em> (&rarr; <strong>Checked</strong> with marks).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60">
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Assignment Title</th>
                    <th className="p-3">Submitted PDF Deliverable</th>
                    <th className="p-3">Submitted At</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Score & Grade</th>
                    <th className="p-3">Edit Permission</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-4 text-center text-slate-500 dark:text-slate-400">
                        No submissions received yet.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{sub.studentName}</td>
                        <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{sub.assignmentTitle}</td>
                        <td className="p-3">
                          {sub.pdfSubmissionUrl ? (
                            <a
                              href={sub.pdfSubmissionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono font-bold"
                            >
                              <FileText className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>View PDF Submission</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-300">{sub.submissionContent || 'Text/File Submission'}</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold border ${
                            sub.status === 'CHECKED'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : sub.status === 'UNDER_REVIEW'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {sub.status === 'CHECKED' ? (
                            <div className="font-bold text-slate-900 dark:text-white">
                              {sub.score} / 100 <span className="text-emerald-700 dark:text-emerald-400">({sub.grade || 'A'})</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not evaluated</span>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleStudentEdit(sub.id, sub.canEdit)}
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                              sub.canEdit
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            }`}
                          >
                            {sub.canEdit ? 'Edit Allowed' : 'Edit Locked'}
                          </button>
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleReviewSubmission(sub)}
                            className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded font-semibold text-xs transition-colors"
                          >
                            Review
                          </button>
                          <button
                            onClick={() => {
                              setShowGradingModal(sub);
                              setGradeForm({
                                score: sub.score || 90,
                                grade: sub.grade || 'A',
                                feedback: sub.feedback || 'Good submission verified.'
                              });
                            }}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-xs transition-colors"
                          >
                            Grade & Check
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

          {/* TAB VIEW 3: Student Permission & Edit History Audit Trail */}
          {currentAssignmentSubTab === 'audit' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Student Permission & Edit History Audit Trail</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {filteredAuditLogs.length} Records
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Chronological audit log tracking trainer permission grants/revocations and deliverables edited by students with precise timestamps.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={auditFilterAssignment}
                  onChange={(e) => setAuditFilterAssignment(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Assignments</option>
                  {assignments.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={fetchAuditLogs}
                  disabled={loadingAudit}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-300 dark:border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
                  <span>Refresh History</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60">
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Event / Action</th>
                    <th className="p-3">Assignment</th>
                    <th className="p-3">Student Name</th>
                    <th className="p-3">Permission Granted / Revoked</th>
                    <th className="p-3">What Was Edited / Deliverable Diff</th>
                    <th className="p-3">Authorized By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredAuditLogs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-slate-500 dark:text-slate-400">
                        No permission or edit history logged yet. When you toggle student edit access or students resubmit assignments, records will appear here with full timestamps.
                      </td>
                    </tr>
                  ) : (
                    filteredAuditLogs.map((log) => {
                      const isGranted = log.actionType === 'PERMISSION_GRANTED' || log.actionType === 'GLOBAL_PERMISSION_ENABLED';
                      const isRevoked = log.actionType === 'PERMISSION_REVOKED' || log.actionType === 'GLOBAL_PERMISSION_DISABLED';
                      const isStudentEdit = log.actionType === 'STUDENT_EDITED_SUBMISSION';

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {isGranted && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                {log.actionType === 'GLOBAL_PERMISSION_ENABLED' ? 'Global Edit Enabled' : 'Edit Permission Granted'}
                              </span>
                            )}
                            {isRevoked && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 inline-flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                {log.actionType === 'GLOBAL_PERMISSION_DISABLED' ? 'Global Edit Disabled' : 'Edit Permission Revoked'}
                              </span>
                            )}
                            {isStudentEdit && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800 inline-flex items-center gap-1">
                                <Edit3 className="w-3 h-3" />
                                Submission Edited
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-medium text-slate-900 dark:text-white">
                            {log.assignmentTitle || ('Assignment #' + log.assignmentId)}
                          </td>
                          <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                            {log.studentName || 'All Students'}
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            <div className="text-xs">{log.permissionDetails || 'Standard edit permission'}</div>
                          </td>
                          <td className="p-3">
                            <div className="max-w-md font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 p-2 rounded border border-slate-200 dark:border-slate-800 break-words whitespace-pre-wrap">
                              {log.editDetails || 'No deliverable change details'}
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {log.trainerName || (isStudentEdit ? 'Student Self-Submission' : 'Faculty Trainer')}
                            </span>
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
        </div>
      )}

      {/* TAB 2: PROJECT HUB & COLLABORATIVE DELIVERABLES */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Project Hub & Student Collaborative Teams</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Trainer sets team sizing rules. Students choose a topic, form teams via peer invites, and upload shared deliverables visible to all teammates.
                </p>
              </div>
              <button
                onClick={() => setShowProjectModal(true)}
                className="px-3.5 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 w-fit"
              >
                + Publish Project Topic
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-lg">
                No project topics published yet. Click "Publish Project Topic" to create one.
              </div>
            ) : (
              <div className="space-y-6">
                {projects.map((topic) => (
                  <div key={topic.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
                    {/* Topic Header */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            {topic.subjectName || 'Computer Science & AI'}
                          </span>
                          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                            Team Size: Min {topic.minTeamSize || 2} - Max {topic.maxTeamSize || 4} Students
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">{topic.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{topic.description}</p>
                      </div>
                      <div className="text-xs text-right flex flex-col items-end gap-1.5">
                        <span className="text-slate-500 dark:text-slate-400 font-mono">Deadline: {topic.deadline || 'Open'}</span>
                        <div className="text-slate-600 dark:text-slate-300 font-semibold">
                          Formed Teams: {topic.teams ? topic.teams.length : 0}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <button
                            onClick={() => handleOpenEditProject(topic)}
                            className="px-2 py-1 border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Topic</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProject(topic.id, topic.title)}
                            className="px-2 py-1 border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Formed Teams List */}
                    <div className="p-4 space-y-3">
                      <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Student Teams & Shared Deliverables
                      </h5>

                      {(!topic.teams || topic.teams.length === 0) ? (
                        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850 rounded-lg border border-slate-100 dark:border-slate-800">
                          No student teams formed yet for this project topic.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {topic.teams.map((teamDto) => {
                            const t = teamDto.team;
                            const members = teamDto.members || [];
                            return (
                              <div key={t.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-3 bg-slate-50/30 dark:bg-slate-800/30">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h6 className="text-sm font-bold text-slate-900 dark:text-white">{t.teamName}</h6>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                        t.status === 'EVALUATED'
                                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                          : t.status === 'SUBMITTED'
                                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                      }`}>
                                        {t.status}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                      Leader: <span className="font-semibold text-slate-800 dark:text-slate-200">{t.leaderName}</span>
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    {t.score != null ? (
                                      <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400">
                                        Score: {t.score} / 100
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setShowProjectGradeModal({ ...t, isTeam: true, teamId: t.id });
                                          setProjectGradeForm({
                                            score: t.score || 90,
                                            feedback: t.feedback || 'Deliverables verified.'
                                          });
                                        }}
                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
                                      >
                                        Grade Team
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Team Members Roster */}
                                <div>
                                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Teammates ({members.length}):</span>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {members.map((m) => (
                                      <span
                                        key={m.id}
                                        className="px-2 py-0.5 rounded text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 flex items-center gap-1"
                                      >
                                        <span className="font-semibold">{m.studentName}</span>
                                        {m.role === 'LEADER' && (
                                          <span className="text-[9px] font-bold px-1 bg-slate-900 text-white rounded">LEADER</span>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Shared Deliverables Links */}
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Shared Deliverables:</span>
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    {t.zipFileUrl && (
                                      <a href={t.zipFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline">
                                        <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> ZIP Code
                                      </a>
                                    )}
                                    {t.pptFileUrl && (
                                      <a href={t.pptFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline">
                                        <Presentation className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> PPT Slides
                                      </a>
                                    )}
                                    {t.pdfReportUrl && (
                                      <a href={t.pdfReportUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline">
                                        <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> PDF Report
                                      </a>
                                    )}
                                    {t.githubRepoUrl && (
                                      <a href={t.githubRepoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold hover:underline">
                                        <FolderGit2 className="w-3.5 h-3.5" /> GitHub Repo
                                      </a>
                                    )}
                                    {t.liveDemoUrl && (
                                      <a href={t.liveDemoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
                                        <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                                      </a>
                                    )}
                                    {!t.zipFileUrl && !t.pptFileUrl && !t.pdfReportUrl && !t.githubRepoUrl && !t.liveDemoUrl && (
                                      <span className="text-slate-400 italic text-[11px]">No deliverables uploaded yet</span>
                                    )}
                                  </div>
                                  {t.lastUpdatedByName && (
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                                      Last updated by: {t.lastUpdatedByName}
                                    </p>
                                  )}
                                  {t.feedback && (
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded text-[11px] text-emerald-900 dark:text-emerald-300 mt-1">
                                      <strong>Trainer Feedback:</strong> {t.feedback}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3a: SCHEDULED EXAMS */}
      {activeTab === 'scheduled-exams' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Scheduled Exams</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                All proctored assessments created for your institution — {exams.length} total
              </p>
            </div>
            <button
              onClick={() => setShowExamModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              + Schedule New Exam
            </button>
          </div>

          {exams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <Calendar className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No exams scheduled yet</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Click &quot;Schedule New Exam&quot; to create your first proctored assessment for students.
              </p>
              <button
                onClick={() => setShowExamModal(true)}
                className="mt-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
              >
                + Schedule New Exam
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60">
                    <th className="p-3 font-semibold">#</th>
                    <th className="p-3 font-semibold">Exam Title</th>
                    <th className="p-3 font-semibold">Type</th>
                    <th className="p-3 font-semibold">Total Marks</th>
                    <th className="p-3 font-semibold">Duration</th>
                    <th className="p-3 font-semibold">Start Window</th>
                    <th className="p-3 font-semibold">End / Deadline</th>
                    <th className="p-3 font-semibold">Created By</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {[...exams].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).map((exam, idx) => {
                    const now = new Date();
                    const start = exam.scheduledStartTime ? new Date(exam.scheduledStartTime) : null;
                    const end = exam.scheduledEndTime ? new Date(exam.scheduledEndTime) : null;
                    const isExpired = end && now > end;
                    const isUpcoming = start && now < start;
                    const isLive = start && end && now >= start && now <= end;
                    const statusLabel = !exam.active ? 'Inactive'
                      : isExpired ? 'Expired'
                      : isLive ? 'Live'
                      : isUpcoming ? 'Upcoming'
                      : 'Active';
                    const statusColor = !exam.active ? 'bg-slate-100 text-slate-500 border border-slate-200'
                      : isExpired ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : isLive ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : isUpcoming ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200';

                    return (
                      <tr key={exam.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900 dark:text-white">{exam.title}</p>
                          {exam.description && (
                            <p className="text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{exam.description}</p>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            exam.assessmentType === 'SELF_ASSESSMENT'
                              ? 'bg-violet-100 text-violet-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {exam.assessmentType === 'SELF_ASSESSMENT' ? 'Self-Practice' : 'Trainer Assigned'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{exam.totalMarks} marks</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{exam.durationMinutes} min</td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                          {start ? start.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                            : <span className="text-slate-400 italic">Anytime</span>}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                          {end ? end.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                            : <span className="text-slate-400 italic">No deadline</span>}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{exam.trainerName || 'System'}</td>
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => handleOpenEditExam(exam)}
                            className="px-2 py-1 border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            title="Edit Exam Schedule"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteExam(exam.id, exam.title)}
                            className="px-2 py-1 border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            title="Delete Exam"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3b: STUDENT ATTEMPTS & RE-ATTEMPT CONTROL */}
      {activeTab === 'student-attempts' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Student Attempts & Re-attempt Permissions</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Students can attend each exam only once. Re-take is permanently locked unless you activate the <em>Allow Re-attempt</em> toggle below.
            </p>
          </div>

          {allAttempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No attempts recorded yet</p>
              <p className="text-xs text-slate-400 max-w-xs">
                Once students take an exam, their attempts will appear here for review and re-attempt management.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60">
                    <th className="p-3 font-semibold">#</th>
                    <th className="p-3 font-semibold">Student Name</th>
                    <th className="p-3 font-semibold">Completed At</th>
                    <th className="p-3 font-semibold">Score & Percentage</th>
                    <th className="p-3 font-semibold">Violations</th>
                    <th className="p-3 font-semibold">Exam Status</th>
                    <th className="p-3 font-semibold">Result</th>
                    <th className="p-3 text-right font-semibold">Re-attempt Toggle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {[...allAttempts]
                    .sort((a, b) => {
                      // Re-activated attempts always float to top
                      if (b.canReattempt !== a.canReattempt) return b.canReattempt ? 1 : -1;
                      // Then sort by most recent completion / start date
                      const aDate = new Date(a.completedAt || a.startedAt || 0);
                      const bDate = new Date(b.completedAt || b.startedAt || 0);
                      return bDate - aDate;
                    })
                    .map((att, idx) => (
                    <tr key={att.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{att.studentName}</td>
                      <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                        {att.completedAt
                          ? new Date(att.completedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                          : new Date(att.startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {att.score} / {att.totalMarks}
                        <span className="ml-1.5 text-slate-500 dark:text-slate-400 font-normal">({att.percentage}%)</span>
                      </td>
                      <td className="p-3">
                        <span className={`font-bold ${att.violationCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {att.violationCount} {att.violationCount === 1 ? 'strike' : 'strikes'}
                        </span>
                      </td>
                      <td className="p-3">
                        {att.status === 'TERMINATED_BY_VIOLATION' ? (
                          <span className="px-2.5 py-1 rounded text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 w-fit">
                            <ShieldAlert className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            Terminated (Fraud)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            Done
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-bold">
                        {att.status === 'TERMINATED_BY_VIOLATION' ? (
                          <span className="text-rose-700 dark:text-rose-400 font-bold">ABORTED</span>
                        ) : att.passed ? (
                          <span className="text-emerald-700 dark:text-emerald-400">PASSED</span>
                        ) : (
                          <span className="text-rose-700 dark:text-rose-400">FAILED</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleReattempt(att.id, att.canReattempt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 ${
                            att.canReattempt
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {att.canReattempt ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              Re-attempt Permitted
                            </>
                          ) : (
                            'Allow Re-take'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RECORDED LECTURES & STUDY MATERIALS */}
      {activeTab === 'recordings' && (
        <div className="space-y-6">
          {/* Section 1: Modular Study Materials Curriculum */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-5 transition-colors">
            {/* Subject Selector & Concerned Faculty Authorization Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Subject:
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => {
                    const nextId = Number(e.target.value);
                    setSelectedCourseId(nextId);
                    fetchCourseDetail(nextId);
                  }}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-2xs outline-none max-w-md"
                >
                  {courses.map((c) => {
                    const isMine = (user?.id && c.trainerId === user.id) || (user?.fullName && c.trainerName && c.trainerName.toLowerCase().includes(user.fullName.toLowerCase()));
                    return (
                      <option key={c.id} value={c.id}>
                        {c.title} {isMine ? '[Assigned Faculty: You]' : `(Faculty: ${c.trainerName || 'Assigned Trainer'})`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Status Badge */}
              {isConcernedFaculty ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Concerned Faculty: Authorized to manage modules & upload study materials.</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-medium">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Restricted: Only concerned faculty ({selectedCourse?.trainerName || 'Assigned Trainer'}) can upload materials.</span>
                </div>
              )}
            </div>

            {/* Assigned Faculty Specialists for this Subject */}
            {(() => {
              const assignedTeam = (courseDetail?.assignedTrainers && courseDetail.assignedTrainers.length > 0)
                ? courseDetail.assignedTrainers
                : (selectedCourse?.trainerName ? [{
                    trainerId: selectedCourse.trainerId || 1,
                    trainerName: selectedCourse.trainerName,
                    trainerEmail: selectedCourse.trainerEmail || 'faculty@bridgeai.edu',
                    trainerSpecialization: 'Computer Science & AI',
                    isPrimary: true
                  }] : []);

              return (
                <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Faculty Specialists Assigned to &quot;{selectedCourse?.title || 'Selected Subject'}&quot;
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold">
                        {assignedTeam.length} {assignedTeam.length === 1 ? 'Faculty' : 'Faculty Specialists'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Super Admin multi-faculty deployment matrix
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                    {assignedTeam.map((tr) => {
                      const isMe = (user?.id && tr.trainerId === user.id) || (user?.email && tr.trainerEmail && user.email.toLowerCase() === tr.trainerEmail.toLowerCase());
                      return (
                        <div
                          key={tr.trainerId || tr.id}
                          className={`p-2.5 rounded-lg border text-xs transition-all ${
                            isMe
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 shadow-2xs'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {tr.trainerName}
                            </span>
                            {isMe ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-600 text-white shrink-0">
                                You
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                                Faculty
                              </span>
                            )}
                          </div>
                          <div className="mb-1">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-800 px-2 py-0.5 rounded-full">
                              <Target className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                              <span className="truncate">Specialization: {tr.trainerSpecialization || 'Domain Specialist'}</span>
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {tr.trainerEmail}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{selectedCourse?.title || 'Subject Curriculum'}</span>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-normal rounded border border-slate-200 dark:border-slate-700">
                    Faculty In-Charge: {selectedCourse?.trainerName || 'Trainer'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage syllabus modules and upload interactive learning articles, code implementations, and technical documentation.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={!isConcernedFaculty}
                  onClick={() => setShowCreateModuleModal(true)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
                    isConcernedFaculty
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                  }`}
                  title={isConcernedFaculty ? "Create new module for this subject" : "Only concerned faculty can create modules"}
                >
                  {!isConcernedFaculty && <ShieldAlert className="w-3.5 h-3.5" />}
                  <span>+ New Module</span>
                </button>
                <button
                  disabled={!isConcernedFaculty}
                  onClick={() => {
                    const firstModId = courseDetail?.modules?.[0]?.module?.id || 1;
                    setMaterialForm({
                      courseId: selectedCourseId,
                      moduleId: firstModId,
                      title: '',
                      description: '',
                      richContent: '',
                      urlOrPath: 'https://docs.oracle.com/en/java/',
                      videoEmbedUrl: '',
                      resourceType: 'ARTICLE',
                      orderIndex: 1
                    });
                    setShowMaterialModal(true);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    isConcernedFaculty
                      ? 'bg-[#0F172A] hover:bg-slate-800 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                  title={isConcernedFaculty ? "Publish study material for this subject" : "Only concerned faculty can upload study materials"}
                >
                  {!isConcernedFaculty ? <ShieldAlert className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Publish Study Material</span>
                </button>
              </div>
            </div>

            {/* Modules List */}
            {(!courseDetail?.modules || courseDetail.modules.length === 0) ? (
              <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-lg">
                No modules created yet. Click "+ New Module" to establish syllabus structure.
              </div>
            ) : (
              <div className="space-y-4">
                {courseDetail.modules.map((mItem, idx) => {
                  const mod = mItem.module;
                  const resources = mItem.resources || [];

                  return (
                    <div key={mod.id} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{mod.title}</h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">({resources.length} topics)</span>
                          {mItem.moduleExam && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                              <span>Module Test Active ({mItem.questionCount || 0} MCQs)</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setMaterialForm({
                                ...materialForm,
                                moduleId: mod.id,
                                title: '',
                                description: '',
                                richContent: '',
                                urlOrPath: '',
                                videoEmbedUrl: '',
                                includeModuleTest: true,
                                testTitle: `${mod.title} Knowledge Assessment`
                              });
                              setMaterialQuestions([]);
                              setShowMaterialModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors flex items-center gap-1"
                            title="Add topic with attached module test questions"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>+ Topic & Test</span>
                          </button>
                          <button
                            onClick={() => {
                              setMaterialForm({
                                ...materialForm,
                                moduleId: mod.id,
                                title: '',
                                description: '',
                                richContent: '',
                                urlOrPath: '',
                                videoEmbedUrl: '',
                                includeModuleTest: false
                              });
                              setMaterialQuestions([]);
                              setShowMaterialModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors"
                          >
                            + Add Topic
                          </button>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2 text-xs">
                        {resources.length === 0 ? (
                          <div className="p-3 text-center text-slate-400 dark:text-slate-500 italic">No topics published in this module yet.</div>
                        ) : (
                          resources.map((res) => (
                            <div key={res.id} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-lg">
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">{res.title}</span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">{res.description || 'Article with code examples'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                {res.visibilityScope === 'BOTH' ? (
                                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                    <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    Global & Institution
                                  </span>
                                ) : res.visibilityScope === 'INSTITUTION' ? (
                                  <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                                    <Building2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                    {res.institutionName || 'Institution'} Private
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                    <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                    Global Library
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold border border-slate-200 dark:border-slate-700">
                                  {res.resourceType || 'ARTICLE'}
                                </span>
                                {res.urlOrPath && (
                                  <a href={res.urlOrPath} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5">
                                    <span>Attachment</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* Live & Recorded Sessions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Recorded Lecture Sessions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload recorded session links (YouTube / Google Meet / Zoom / MP4) with key notes for students.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60">
                    <th className="p-3">Session Topic</th>
                    <th className="p-3">Date & Platform</th>
                    <th className="p-3">Recording Link</th>
                    <th className="p-3">Session Notes</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {sessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{sess.title}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 font-mono">
                        {new Date(sess.scheduledAt).toLocaleDateString()} ({sess.platform})
                      </td>
                      <td className="p-3">
                        {sess.recordingVideoUrl ? (
                          <a href={sess.recordingVideoUrl} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                            <Video className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            <span>Watch Recording</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">No recording uploaded</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{sess.recordingNotes || '—'}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setRecordingForm({
                              sessionId: sess.id,
                              recordingVideoUrl: sess.recordingVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                              recordingNotes: sess.recordingNotes || ''
                            });
                            setShowRecordingModal(true);
                          }}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                        >
                          {sess.recordingVideoUrl ? 'Update Video Link' : 'Upload Video Link'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>

      {/* MODAL 1: Create Assignment */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold">Create New Assignment</h3>
                <p className="text-xs text-slate-400">PDF upload or manual problem description</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={assignForm.title}
                  onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                  placeholder="e.g. Asynchronous Microservices & Docker Builds"
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Subject *</label>
                  <select
                    value={assignForm.courseId}
                    onChange={(e) => {
                      const cid = Number(e.target.value);
                      const sel = courses.find(c => c.id === cid);
                      setAssignForm({
                        ...assignForm,
                        courseId: cid,
                        subjectName: sel?.title || assignForm.subjectName
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {courses.length === 0 ? (
                      <option value="" disabled className="dark:bg-slate-800">No assigned subjects available</option>
                    ) : (
                      courses.map((c) => (
                        <option key={c.id} value={c.id} className="dark:bg-slate-800">{c.title}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Strict Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={assignForm.dueDateTime}
                    onChange={(e) => setAssignForm({ ...assignForm, dueDateTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assignment Instructions / Manual Question Description *
                </label>
                <textarea
                  rows="4"
                  required
                  value={assignForm.description}
                  onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                  placeholder="Write the complete assignment details, problem statement, and expected submission format..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <FileUploadInput
                  label="PDF Question Paper / Assignment Brief (Optional)"
                  value={assignForm.pdfAttachmentUrl}
                  onChange={(url) => setAssignForm({ ...assignForm, pdfAttachmentUrl: url })}
                  accept=".pdf,.doc,.docx"
                  category="ASSIGNMENT_ATTACHMENT"
                  helperText="Upload question paper or brief from your computer directly into Aiven MySQL, or switch to paste external link."
                />
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="assignAll"
                    checked={assignForm.assignedToAll}
                    onChange={(e) => setAssignForm({ ...assignForm, assignedToAll: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="assignAll" className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
                    Assign to All Enrolled Students in this Institution
                  </label>
                </div>

                {!assignForm.assignedToAll && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Select Individual Students:
                    </label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {students.map((st) => (
                        <label key={st.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 p-1 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={assignForm.assignedStudentIds.includes(String(st.id))}
                            onChange={(e) => {
                              const sId = String(st.id);
                              if (e.target.checked) {
                                setAssignForm({ ...assignForm, assignedStudentIds: [...assignForm.assignedStudentIds, sId] });
                              } else {
                                setAssignForm({ ...assignForm, assignedStudentIds: assignForm.assignedStudentIds.filter(id => id !== sId) });
                              }
                            }}
                          />
                          <span>{st.fullName} ({st.email})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                <input
                  type="checkbox"
                  id="allowResub"
                  checked={assignForm.allowResubmission}
                  onChange={(e) => setAssignForm({ ...assignForm, allowResubmission: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="allowResub" className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
                  Allow Students to Edit / Re-submit after initial submission
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-transparent dark:border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Review Submission Details */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Submission Under Review</h3>
                <span className="text-xs px-2 py-0.5 rounded font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  UNDER_REVIEW
                </span>
              </div>
              <button onClick={() => setShowReviewModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-800 dark:text-slate-200">
              <p><strong>Student:</strong> <span className="text-slate-900 dark:text-white font-semibold">{showReviewModal.studentName}</span></p>
              <p><strong>Format:</strong> <span className="font-mono">{showReviewModal.submissionType}</span></p>
              {showReviewModal.pdfSubmissionUrl && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <p className="font-semibold mb-1 text-slate-900 dark:text-white">Attached PDF File:</p>
                  <a
                    href={showReviewModal.pdfSubmissionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold font-mono"
                  >
                    <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Open Student PDF Deliverable</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
              {showReviewModal.submissionContent && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <p className="font-semibold mb-1 text-slate-900 dark:text-white">Student Notes / Explanation:</p>
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{showReviewModal.submissionContent}</p>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  const s = showReviewModal;
                  setShowReviewModal(null);
                  setShowGradingModal(s);
                  setGradeForm({
                    score: s.score || 95,
                    grade: s.grade || 'A+',
                    feedback: s.feedback || 'Work reviewed and approved.'
                  });
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Proceed to Grade & Mark Checked
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Grade Submission (Moves to CHECKED) */}
      {showGradingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Grade & Check Submission</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Student: {showGradingModal.studentName}</p>
              </div>
              <button onClick={() => setShowGradingModal(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGradeSubmission} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Score (0 - 100) *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={gradeForm.score}
                    onChange={(e) => setGradeForm({ ...gradeForm, score: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Grade Letter</label>
                  <select
                    value={gradeForm.grade}
                    onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="A+">A+ (Outstanding)</option>
                    <option value="A">A (Excellent)</option>
                    <option value="B+">B+ (Very Good)</option>
                    <option value="B">B (Good)</option>
                    <option value="C">C (Pass)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Detailed Feedback</label>
                <textarea
                  rows="3"
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGradingModal(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Mark as CHECKED
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Deadline */}
      {showDeadlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Extend / Edit Deadline</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Assignment: {showDeadlineModal.title}</p>
            <form onSubmit={handleUpdateDeadline} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Due Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeadlineModal(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors"
                >
                  Update Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Create Project Topic */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Publish Project Topic</h3>
              <button onClick={() => setShowProjectModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  placeholder="e.g. Distributed Load Balancer with Rate Limiting"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Subject *</label>
                <select
                  value={projectForm.courseId}
                  onChange={(e) => {
                    const cid = Number(e.target.value);
                    const sel = courses.find(c => c.id === cid);
                    setProjectForm({
                      ...projectForm,
                      courseId: cid,
                      subjectName: sel?.title || projectForm.subjectName
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {courses.length === 0 ? (
                    <option value="" disabled>No assigned subjects available</option>
                  ) : (
                    courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Minimum Team Size *</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    required
                    value={projectForm.minTeamSize}
                    onChange={(e) => setProjectForm({ ...projectForm, minTeamSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Min required members per team</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Maximum Team Size *</label>
                  <input
                    type="number"
                    min={projectForm.minTeamSize || 2}
                    max="10"
                    required
                    value={projectForm.maxTeamSize}
                    onChange={(e) => setProjectForm({ ...projectForm, maxTeamSize: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Max capacity limit for teams</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Description & Requirements *</label>
                <textarea
                  rows="4"
                  required
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  placeholder="Specify required deliverables: ZIP code, PPT slides, PDF report, and GitHub repo..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold transition-colors"
                >
                  Publish to Project Hub
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Schedule Proctored Exam with Deadlines & Automatic Checking */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <span>Schedule Trainer-Assigned Assessment</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span>{user?.institutionName || 'Institutional Assessment'}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Create a formal, locked examination for your institution&apos;s students. Configured assessments appear in students&apos; Protected Exam dashboard with proctoring lockdown and single-attempt enforcement.
                </p>
              </div>
              <button onClick={() => setShowExamModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleScheduleExam} className="space-y-5">
              {/* SECTION 1: ASSESSMENT BASICS & DEADLINES */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    1. Assessment Details & Scheduled Deadlines (With Time)
                  </h4>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    Type: Trainer-Assigned Examination (Single Attempt)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assessment Title *</label>
                    <input
                      type="text"
                      required
                      value={examForm.title}
                      onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                      placeholder="e.g. Spring Boot Microservices & Cloud Persistence Midterm"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Assigned Subject *</label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => {
                        const cid = Number(e.target.value);
                        setSelectedCourseId(cid);
                        setExamForm(prev => ({ ...prev, courseId: cid }));
                      }}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 focus:outline-none"
                    >
                      {courses.length === 0 ? (
                        <option value="" disabled className="dark:bg-slate-800">No subjects assigned to you — Contact Super Admin</option>
                      ) : (
                        courses.map((c) => (
                          <option key={c.id} value={c.id} className="dark:bg-slate-800">
                            {c.title} (ID #{c.id})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Start Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={examForm.scheduledStartTime}
                      onChange={(e) => setExamForm({ ...examForm, scheduledStartTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 text-rose-700 dark:text-rose-400">
                      End Deadline (Date & Time) *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={examForm.scheduledEndTime}
                      onChange={(e) => setExamForm({ ...examForm, scheduledEndTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-lg focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Duration (Minutes) *
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      required
                      value={examForm.durationMinutes}
                      onChange={(e) => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Passing Score (Marks) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={examForm.passingMarks}
                      onChange={(e) => setExamForm({ ...examForm, passingMarks: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-900 dark:text-rose-200">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span><strong>Proctoring Strikes Policy:</strong> Maximum strikes before automated examination termination is strictly configured by the <strong>Super Boss Admin</strong>.</span>
                  </div>
                  <span className="font-bold text-[11px] px-2 py-0.5 bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 rounded whitespace-nowrap">
                    Super Boss Admin Governance
                  </span>
                </div>

                <p className="text-[11px] text-rose-600 font-medium">
                  • Automatic Deadline Enforcement: If a student does not submit before the End Deadline, the assessment is automatically locked as <strong>MISSED</strong> (0 marks).
                </p>
              </div>

              {/* SECTION 2: CSV UPLOAD IN PRECISE ORDER */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Bulk Upload Questions via CSV File</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Columns must strictly follow the required order: <code className="bg-slate-200 dark:bg-slate-700 dark:text-slate-200 px-1 py-0.5 rounded font-mono text-[10px]">question, optionA, optionB, optionC, optionD, correctOption, marks, explanation</code>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Download Sample CSV</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 p-3 bg-white dark:bg-slate-850 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>Choose CSV file to append questions</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* SECTION 3: ASSESSMENT QUESTION BUILDER (MCQ + CODING QUESTIONS WITH TEST CASES) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>2. Assessment Questions &amp; Problems</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure only MCQs, only coding problems, or any mixed combination. Total score is computed automatically from assigned marks.
                    </p>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700">
                      Total: {examForm.questions?.length || 0} ({examForm.questions?.reduce((acc, q) => acc + (Number(q.marks) || 10), 0)} Marks)
                    </span>
                    <span className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>MCQs: {examForm.questions?.filter(q => q.questionType !== 'CODING').length || 0}</span>
                    </span>
                    <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <Code2 className="w-3 h-3" />
                      <span>Coding: {examForm.questions?.filter(q => q.questionType === 'CODING').length || 0}</span>
                    </span>
                  </div>
                </div>

                {/* Question Builder Action Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddManualQuestion}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add MCQ Question</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddCodingQuestion}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>+ Add Coding Problem</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleCodingProblems}
                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Load Sample Coding Problems</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleMcqs}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Load Sample MCQs</span>
                  </button>

                  {examForm.questions && examForm.questions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExamForm(prev => ({ ...prev, questions: [] }))}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto transition-colors"
                      title="Clear all questions"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {(!examForm.questions || examForm.questions.length === 0) ? (
                  <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl text-slate-500 text-xs bg-slate-50/50 space-y-2">
                    <p className="font-semibold text-slate-700">No questions added yet to this assessment.</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Choose "+ Add MCQ Question", "+ Add Coding Problem", load predefined presets, or upload a CSV above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {examForm.questions.map((q, idx) => {
                      const isCoding = q.questionType === 'CODING';

                      if (isCoding) {
                        return (
                          <div key={idx} className="border-2 border-emerald-200 dark:border-emerald-800/80 rounded-xl p-4 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-900/60 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                                  <Code2 className="w-3 h-3" />
                                  <span>CODING PROBLEM #{idx + 1}</span>
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                  {q.problemTitle || 'Untitled Coding Problem'}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Marks:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={q.marks || 20}
                                    onChange={(e) => handleQuestionFieldChange(idx, 'marks', Number(e.target.value))}
                                    className="w-16 px-2 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded text-slate-800 dark:text-slate-200 text-center"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveQuestion(idx)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                  title="Remove Problem"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Problem Title *</label>
                              <input
                                type="text"
                                required
                                value={q.problemTitle || ''}
                                onChange={(e) => {
                                  handleQuestionFieldChange(idx, 'problemTitle', e.target.value);
                                  handleQuestionFieldChange(idx, 'questionText', e.target.value);
                                }}
                                placeholder="e.g. Two Sum Target, Palindrome Checker, Longest Substring..."
                                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500 font-medium placeholder-slate-400 dark:placeholder-slate-500"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Problem Description *</label>
                              <textarea
                                rows="3"
                                required
                                value={q.problemDescription || ''}
                                onChange={(e) => handleQuestionFieldChange(idx, 'problemDescription', e.target.value)}
                                placeholder="State the problem clearly, specifying edge cases, algorithmic requirements, and problem parameters..."
                                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none leading-relaxed placeholder-slate-400 dark:placeholder-slate-500"
                              />
                            </div>

                            {/* Structured Problem Constraints Manager */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-700 pb-2">
                                <div>
                                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                    <ListOrdered className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                                    <span>Problem Constraints &amp; Bounds</span>
                                  </label>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    Define input size bounds, value ranges, and algorithmic limits. Each item appears as an individual bullet for candidates.
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleAddConstraintItem(idx)}
                                  className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add Constraint</span>
                                </button>
                              </div>

                              {/* Quick Insert Preset Chips */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="font-semibold text-slate-500">Quick Insert:</span>
                                {[
                                  '1 <= N <= 10^5',
                                  '-10^9 <= nums[i] <= 10^9',
                                  '1 <= length(S) <= 1000',
                                  '1 <= target <= 2 * 10^9',
                                  'Time Limit: 2.0s',
                                  'Memory Limit: 256MB',
                                  'Only one valid solution exists'
                                ].map((preset, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => handleQuickAddConstraint(idx, preset)}
                                    className="px-2 py-0.5 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 border border-slate-300 hover:border-indigo-300 rounded font-mono transition-colors shadow-2xs"
                                  >
                                    + {preset}
                                  </button>
                                ))}
                              </div>

                              {/* Itemized Constraints List */}
                              {(() => {
                                const cItems = q.constraintsList !== undefined
                                  ? q.constraintsList
                                  : (q.constraints ? q.constraints.split(/\r?\n/) : []);
                                if (cItems.length === 0) {
                                  return (
                                    <div className="p-3 bg-white border border-dashed border-slate-300 rounded-lg text-center text-xs text-slate-500 space-y-1">
                                      <span>No constraints specified yet.</span>
                                      <div className="text-[10px] text-slate-400">
                                        Click <strong>&quot;Add Constraint&quot;</strong> or choose a quick insert preset above.
                                      </div>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="space-y-1.5">
                                    {cItems.map((cVal, cIdx) => (
                                      <div key={cIdx} className="flex items-center gap-2">
                                        <span className="text-[11px] font-mono text-slate-400 font-bold w-5 text-right">
                                          {cIdx + 1}.
                                        </span>
                                        <input
                                          type="text"
                                          value={cVal}
                                          onChange={(e) => handleUpdateConstraintItem(idx, cIdx, e.target.value)}
                                          placeholder="e.g. 1 <= N <= 10^5, -10^9 <= nums[i] <= 10^9"
                                          className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                          autoFocus={cVal === '' && cIdx === cItems.length - 1}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveConstraintItem(idx, cIdx)}
                                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                          title="Remove Constraint"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })()}

                              {/* Raw Multiline Textarea fallback */}
                              <div className="pt-1 border-t border-slate-200/60 dark:border-slate-700">
                                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                                  Raw Constraints Text (One constraint per line):
                                </label>
                                <textarea
                                  rows="2"
                                  value={q.constraints || ''}
                                  onChange={(e) => handleRawConstraintsChange(idx, e.target.value)}
                                  placeholder="e.g.&#10;2 <= N <= 10^4&#10;-10^9 <= nums[i] <= 10^9&#10;target fits in 32-bit integer"
                                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg font-mono focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Input Format</label>
                                <textarea
                                  rows="2"
                                  value={q.inputFormat || ''}
                                  onChange={(e) => handleQuestionFieldChange(idx, 'inputFormat', e.target.value)}
                                  placeholder="e.g. Line 1: N (array length)\nLine 2: N space-separated integers"
                                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none font-mono"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Output Format</label>
                                <textarea
                                  rows="2"
                                  value={q.outputFormat || ''}
                                  onChange={(e) => handleQuestionFieldChange(idx, 'outputFormat', e.target.value)}
                                  placeholder="e.g. Two space-separated integers: i j"
                                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none font-mono"
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Supported Compiler Languages:</span>
                              {['Python 3', 'Java', 'C++', 'C', 'C#', 'Kotlin'].map((lang, lIdx) => (
                                <span key={lIdx} className="px-2 py-0.5 bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-mono font-medium">
                                  {lang}
                                </span>
                              ))}
                            </div>

                            {/* Test Cases Sub-Section */}
                            <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                <div>
                                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                    <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Configured Test Cases ({q.testCases?.length || 0})</span>
                                  </h5>
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                    Sample test cases are visible to students in the online compiler. Hidden test cases are evaluated upon submission. Proportional marks are awarded based on passed test cases.
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleAddTestCase(idx)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+ Add Test Case</span>
                                </button>
                              </div>

                              {(!q.testCases || q.testCases.length === 0) ? (
                                <p className="text-center text-xs text-slate-400 py-2">
                                  No test cases configured. Click "+ Add Test Case" to add sample or hidden tests.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {q.testCases.map((tc, tcIdx) => (
                                    <div key={tcIdx} className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-md space-y-2">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                            Test Case #{tcIdx + 1}
                                          </span>
                                          <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                            <input
                                              type="checkbox"
                                              checked={tc.sample === true}
                                              onChange={(e) => handleUpdateTestCase(idx, tcIdx, 'sample', e.target.checked)}
                                              className="rounded text-emerald-600"
                                            />
                                            <span className={tc.sample ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                                              {tc.sample ? 'Sample Test (Public)' : 'Hidden Evaluation Test'}
                                            </span>
                                          </label>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => handleRemoveTestCase(idx, tcIdx)}
                                          className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                          title="Remove Test Case"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                          <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Input (stdin) *</label>
                                          <textarea
                                            rows="2"
                                            required
                                            value={tc.input || ''}
                                            onChange={(e) => handleUpdateTestCase(idx, tcIdx, 'input', e.target.value)}
                                            placeholder="Standard input provided to student code..."
                                            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded font-mono focus:outline-none"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Expected Output (stdout) *</label>
                                          <textarea
                                            rows="2"
                                            required
                                            value={tc.expectedOutput || ''}
                                            onChange={(e) => handleUpdateTestCase(idx, tcIdx, 'expectedOutput', e.target.value)}
                                            placeholder="Expected standard output to match..."
                                            className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded font-mono focus:outline-none"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">Explanation (Optional)</label>
                                        <input
                                          type="text"
                                          value={tc.explanation || ''}
                                          onChange={(e) => handleUpdateTestCase(idx, tcIdx, 'explanation', e.target.value)}
                                          placeholder="Explanation for students if this is a sample case..."
                                          className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Standard MCQ Question Card
                      return (
                        <div key={idx} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-bold font-mono">
                                MCQ #{idx + 1}
                              </span>
                              Question #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(idx)}
                              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1"
                              title="Remove Question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Question Statement *</label>
                            <textarea
                              rows="2"
                              required
                              value={q.questionText}
                              onChange={(e) => handleQuestionFieldChange(idx, 'questionText', e.target.value)}
                              placeholder="Enter the examination question text..."
                              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-1 focus:ring-rose-500 focus:outline-none"
                            />
                          </div>

                          {/* Options A, B, C, D */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Option A *</label>
                              <input
                                type="text"
                                required
                                value={q.optionA}
                                onChange={(e) => handleQuestionFieldChange(idx, 'optionA', e.target.value)}
                                placeholder="Choice A text..."
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Option B *</label>
                              <input
                                type="text"
                                required
                                value={q.optionB}
                                onChange={(e) => handleQuestionFieldChange(idx, 'optionB', e.target.value)}
                                placeholder="Choice B text..."
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Option C *</label>
                              <input
                                type="text"
                                required
                                value={q.optionC}
                                onChange={(e) => handleQuestionFieldChange(idx, 'optionC', e.target.value)}
                                placeholder="Choice C text..."
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Option D *</label>
                              <input
                                type="text"
                                required
                                value={q.optionD}
                                onChange={(e) => handleQuestionFieldChange(idx, 'optionD', e.target.value)}
                                placeholder="Choice D text..."
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                              />
                            </div>
                          </div>

                          {/* Automatic Evaluation Selector & Marks */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-lg">
                            <div>
                              <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                                Correct Answer (Auto-Evaluated) *
                              </label>
                              <select
                                value={normalizeCorrectOption(q.correctOption, q.optionA, q.optionB, q.optionC, q.optionD)}
                                onChange={(e) => handleQuestionFieldChange(idx, 'correctOption', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-md text-emerald-900 dark:text-emerald-300 focus:outline-none"
                              >
                                <option value="A">Option A (Marked as Correct)</option>
                                <option value="B">Option B (Marked as Correct)</option>
                                <option value="C">Option C (Marked as Correct)</option>
                                <option value="D">Option D (Marked as Correct)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Marks Awarded
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={q.marks}
                                onChange={(e) => handleQuestionFieldChange(idx, 'marks', Number(e.target.value))}
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Explanation (Optional)
                              </label>
                              <input
                                type="text"
                                value={q.explanation || ''}
                                onChange={(e) => handleQuestionFieldChange(idx, 'explanation', e.target.value)}
                                placeholder="Why this answer is correct..."
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                >
                  Schedule Assessment ({examForm.questions?.length || 0} Questions)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: Upload / Link Recording */}
      {showRecordingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload / Update Session Recording</h3>
            <form onSubmit={handleAddRecording} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Video Stream URL *</label>
                <input
                  type="url"
                  required
                  value={recordingForm.recordingVideoUrl}
                  onChange={(e) => setRecordingForm({ ...recordingForm, recordingVideoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Lecture Notes / Summary</label>
                <textarea
                  rows="3"
                  value={recordingForm.recordingNotes}
                  onChange={(e) => setRecordingForm({ ...recordingForm, recordingNotes: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecordingModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors"
                >
                  Save Recording
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create New Module */}
      {showCreateModuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create New Course Module</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">Subject: {selectedCourse?.title}</p>
              </div>
              <button onClick={() => setShowCreateModuleModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateModule} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  placeholder="e.g. Module 5: Event-Driven Microservices & Kafka"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Module Description</label>
                <textarea
                  rows="3"
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  placeholder="Summary of concepts covered in this module..."
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModuleModal(false)}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors"
                >
                  Create Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: Modular Style Study Material */}
      {showMaterialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Publish Modular Study Material</h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5">Subject: {selectedCourse?.title} • Faculty: {selectedCourse?.trainerName}</p>
              </div>
              <button onClick={() => setShowMaterialModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-md transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QUICK PRE-FILL EXAMPLE STUDY MATERIAL FOR TESTING */}
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-lg">
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Need an example study material to test uploading?</p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">Click to automatically populate all fields with a comprehensive enterprise architecture article & MCQs.</p>
              </div>
              <button
                type="button"
                onClick={handleLoadExampleMaterial}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs shrink-0 flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load Example Template</span>
              </button>
            </div>

            <form onSubmit={handleAddMaterial} className="space-y-3.5">
              {/* LIBRARY VISIBILITY & STUDENT ACCESS SCOPE */}
              <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Library Visibility & Student Access Scope *
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Configure whether this study material is published to all portal students globally, restricted to your institution, or both.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMaterialForm(prev => ({ ...prev, isGlobal: true, isInstitution: true, visibilityScope: 'BOTH' }))}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors flex items-center gap-1 ${
                        materialForm.isGlobal && materialForm.isInstitution
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Layers className="w-3 h-3" />
                      <span>Both Libraries</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Global Library Checkbox */}
                  <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                    materialForm.isGlobal
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-1 ring-blue-300 dark:ring-blue-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}>
                    <input
                      type="checkbox"
                      checked={materialForm.isGlobal}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (!checked && !materialForm.isInstitution) return;
                        setMaterialForm(prev => ({
                          ...prev,
                          isGlobal: checked,
                          visibilityScope: checked ? (prev.isInstitution ? 'BOTH' : 'GLOBAL') : 'INSTITUTION'
                        }));
                      }}
                      className="w-4 h-4 mt-0.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Global Library</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Accessible to students from all enrolled institutions across the portal.
                      </p>
                    </div>
                  </label>

                  {/* Institution Private Library Checkbox */}
                  <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                    materialForm.isInstitution
                      ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 ring-1 ring-purple-300 dark:ring-purple-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}>
                    <input
                      type="checkbox"
                      checked={materialForm.isInstitution}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (!checked && !materialForm.isGlobal) return;
                        setMaterialForm(prev => ({
                          ...prev,
                          isInstitution: checked,
                          visibilityScope: checked ? (prev.isGlobal ? 'BOTH' : 'INSTITUTION') : 'GLOBAL'
                        }));
                      }}
                      className="w-4 h-4 mt-0.5 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {user?.institutionName || selectedCourse?.institutionName || 'My Institution'} Library
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Accessible strictly and exclusively to students registered under your institution.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Module *</label>
                  <select
                    required
                    value={materialForm.moduleId}
                    onChange={(e) => setMaterialForm({ ...materialForm, moduleId: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {courseDetail?.modules?.map((mItem) => (
                      <option key={mItem.module.id} value={mItem.module.id}>
                        {mItem.module.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Article / Topic Title *</label>
                  <input
                    type="text"
                    required
                    value={materialForm.title}
                    onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                    placeholder="e.g. Memory Model & Concurrency"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Structured Rich Content (Markdown & Code) *</label>
                <textarea
                  rows="6"
                  required
                  value={materialForm.richContent}
                  onChange={(e) => setMaterialForm({ ...materialForm, richContent: e.target.value })}
                  placeholder="Write the full structured article with headings (###), explanations, and code blocks (```java ... ```)"
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Embedded Video URL (Optional)</label>
                  <input
                    type="url"
                    value={materialForm.videoEmbedUrl}
                    onChange={(e) => setMaterialForm({ ...materialForm, videoEmbedUrl: e.target.value })}
                    placeholder="https://www.youtube.com/embed/..."
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Optional YouTube/Vimeo lecture embed link</p>
                </div>
                <div>
                  <FileUploadInput
                    label="Downloadable PDF / Notes / Slides"
                    value={materialForm.urlOrPath === '#' ? '' : materialForm.urlOrPath}
                    onChange={(url) => setMaterialForm({ ...materialForm, urlOrPath: url || '#' })}
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.xlsx,.png,.jpg"
                    category="COURSE_MATERIAL"
                    helperText="Upload reference document from computer to save into Aiven MySQL."
                  />
                </div>
              </div>

              {/* MODULE ASSESSMENT QUESTIONS (MCQs) SECTION */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={materialForm.includeModuleTest}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setMaterialForm(prev => ({ ...prev, includeModuleTest: checked }));
                          if (checked && materialQuestions.length === 0) {
                            handleAddMaterialQuestion();
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Attach Self-Assessment / Module Test (Multiple practice attempts allowed)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                          Students can attempt this test multiple times for practice and self-evaluation directly from their study material dashboard.
                        </span>
                      </div>
                    </label>

                    {materialForm.includeModuleTest && (
                      <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {materialQuestions.length} Question{materialQuestions.length === 1 ? '' : 's'} • Unlimited Practice Attempts
                      </span>
                    )}
                  </div>

                  {materialForm.includeModuleTest && (
                    <div className="space-y-4 pt-1">
                      {/* Test Title & Duration */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                        <div className="md:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Module Test Title</label>
                          <input
                            type="text"
                            value={materialForm.testTitle || (materialForm.title ? `${materialForm.title} - Module Test` : '')}
                            onChange={(e) => setMaterialForm({ ...materialForm, testTitle: e.target.value })}
                            placeholder="e.g. Module 1 Assessment"
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Duration (Mins)</label>
                          <input
                            type="number"
                            min="5"
                            max="180"
                            value={materialForm.durationMinutes || 20}
                            onChange={(e) => setMaterialForm({ ...materialForm, durationMinutes: Number(e.target.value) })}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Bulk Tools Toolbar */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handlePrefillMaterialQuestions}
                            className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 rounded-md flex items-center gap-1.5 transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Load 3 Example Questions</span>
                          </button>

                          <label className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-md flex items-center gap-1.5 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload CSV</span>
                            <input
                              type="file"
                              accept=".csv"
                              onChange={handleMaterialCsvUpload}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={handleDownloadSampleCsv}
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md flex items-center gap-1 transition-colors"
                            title="Download CSV format template"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Sample CSV</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleAddMaterialQuestion}
                          className="px-3 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 shadow-2xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Question</span>
                        </button>
                      </div>

                      {/* Question Cards */}
                      {materialQuestions.length === 0 ? (
                        <div className="p-6 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900">
                          <HelpCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">No Questions Added Yet</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Click "Load 3 Example Questions" or "+ Add Question" to attach an assessment to this module.</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                          {materialQuestions.map((q, qIdx) => (
                            <div key={qIdx} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                                  Question #{qIdx + 1}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Points:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={q.marks || 10}
                                    onChange={(e) => handleUpdateMaterialQuestion(qIdx, 'marks', Number(e.target.value))}
                                    className="w-14 px-1.5 py-0.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-center text-slate-900 dark:text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMaterialQuestion(qIdx)}
                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                                    title="Remove Question"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <input
                                type="text"
                                required
                                value={q.questionText}
                                onChange={(e) => handleUpdateMaterialQuestion(qIdx, 'questionText', e.target.value)}
                                placeholder="Type the question text here..."
                                className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                              />

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">A</span>
                                    <input
                                      type="text"
                                      required
                                      value={q.optionA}
                                      onChange={(e) => handleUpdateMaterialQuestion(qIdx, 'optionA', e.target.value)}
                                      placeholder="Option A"
                                      className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">B</span>
                                    <input
                                      type="text"
                                      required
                                      value={q.optionB}
                                      onChange={(e) => handleUpdateMaterialQuestion(qIdx, 'optionB', e.target.value)}
                                      placeholder="Option B"
                                      className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">C</span>
                                    <input
                                      type="text"
                                      required
                                      value={q.optionC}
                                      onChange={(e) => handleUpdateMaterialQuestion(qIdx, 'optionC', e.target.value)}
                                      placeholder="Option C"
                                      className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">D</span>
                                    <input
                                      type="text"
                                      required
                                      value={q.optionD}
                                      onChange={(e) => handleUpdateMaterialQuestion(qIdx, 'optionD', e.target.value)}
                                      placeholder="Option D"
                                      className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Correct Option</label>
                                  <select
                                    value={normalizeCorrectOption(q.correctOption, q.optionA, q.optionB, q.optionC, q.optionD)}
                                    onChange={(e) => handleUpdateMaterialQuestion(qIdx, 'correctOption', e.target.value)}
                                    className="w-full px-2 py-1 text-xs border border-blue-400 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/60 font-bold text-blue-900 dark:text-blue-200 rounded focus:outline-none"
                                  >
                                    <option value="A">Option A</option>
                                    <option value="B">Option B</option>
                                    <option value="C">Option C</option>
                                    <option value="D">Option D</option>
                                  </select>
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Explanation (Displayed after test completion)</label>
                                  <input
                                    type="text"
                                    value={q.explanation || ''}
                                    onChange={(e) => handleUpdateMaterialQuestion(qIdx, 'explanation', e.target.value)}
                                    placeholder="Why is this answer correct?"
                                    className="w-full px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors"
                >
                  Publish Study Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: Edit Assignment */}
      {showEditAssignModal && editingAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden text-slate-900 dark:text-white">
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  Edit Assignment
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Modify task details, score, or submission settings</p>
              </div>
              <button onClick={() => setShowEditAssignModal(false)} className="text-slate-400 hover:text-white p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditAssignment} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Assignment Title</label>
                <input
                  type="text"
                  required
                  value={editingAssign.title}
                  onChange={(e) => setEditingAssign({ ...editingAssign, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Description / Instructions</label>
                <textarea
                  rows="3"
                  value={editingAssign.description}
                  onChange={(e) => setEditingAssign({ ...editingAssign, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Maximum Marks</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={editingAssign.maxScore}
                    onChange={(e) => setEditingAssign({ ...editingAssign, maxScore: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Submission Type</label>
                  <select
                    value={editingAssign.submissionType}
                    onChange={(e) => setEditingAssign({ ...editingAssign, submissionType: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="GITHUB">GitHub Repository</option>
                    <option value="TEXT">Text Answer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={editingAssign.dueDateTime}
                  onChange={(e) => setEditingAssign({ ...editingAssign, dueDateTime: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editAllowResubmission"
                  checked={editingAssign.allowResubmission}
                  onChange={(e) => setEditingAssign({ ...editingAssign, allowResubmission: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="editAllowResubmission" className="font-semibold text-slate-700 dark:text-slate-300">
                  Allow Resubmission after submission
                </label>
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditAssignModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Project Topic */}
      {showEditProjectModal && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden text-slate-900 dark:text-white">
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-emerald-400" />
                  Edit Project Topic
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Modify topic specs, team sizing, and deadline</p>
              </div>
              <button onClick={() => setShowEditProjectModal(false)} className="text-slate-400 hover:text-white p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditProject} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Project Title</label>
                <input
                  type="text"
                  required
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Project Description / Scope</label>
                <textarea
                  rows="3"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Min Team Size</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingProject.minTeamSize}
                    onChange={(e) => setEditingProject({ ...editingProject, minTeamSize: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Max Team Size</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={editingProject.maxTeamSize}
                    onChange={(e) => setEditingProject({ ...editingProject, maxTeamSize: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Submission Deadline</label>
                <input
                  type="date"
                  value={editingProject.deadline}
                  onChange={(e) => setEditingProject({ ...editingProject, deadline: e.target.value })}
                  className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditProjectModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Exam Schedule */}
      {showEditExamModal && editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden text-slate-900 dark:text-white">
            <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                  Edit Assessment Schedule
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Update exam timings, total marks, and passing criteria</p>
              </div>
              <button onClick={() => setShowEditExamModal(false)} className="text-slate-400 hover:text-white p-1 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditExam} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Exam Title</label>
                <input
                  type="text"
                  required
                  value={editingExam.title}
                  onChange={(e) => setEditingExam({ ...editingExam, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows="2"
                  value={editingExam.description}
                  onChange={(e) => setEditingExam({ ...editingExam, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Duration (min)</label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={editingExam.durationMinutes}
                    onChange={(e) => setEditingExam({ ...editingExam, durationMinutes: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Total Marks</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={editingExam.totalMarks}
                    onChange={(e) => setEditingExam({ ...editingExam, totalMarks: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Passing Marks</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={editingExam.passingMarks}
                    onChange={(e) => setEditingExam({ ...editingExam, passingMarks: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Start Window</label>
                  <input
                    type="datetime-local"
                    value={editingExam.scheduledStartTime}
                    onChange={(e) => setEditingExam({ ...editingExam, scheduledStartTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">End Window</label>
                  <input
                    type="datetime-local"
                    value={editingExam.scheduledEndTime}
                    onChange={(e) => setEditingExam({ ...editingExam, scheduledEndTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editExamActive"
                  checked={editingExam.active}
                  onChange={(e) => setEditingExam({ ...editingExam, active: e.target.checked })}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="editExamActive" className="font-semibold text-slate-700 dark:text-slate-300">
                  Assessment Active & Visible to Students
                </label>
              </div>
              <div className="flex gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditExamModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-sm"
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
        userRole="ROLE_TRAINER"
        userEmail={user?.email || 'trainer@bridgeai.edu'}
      />
    </>
  );
};
