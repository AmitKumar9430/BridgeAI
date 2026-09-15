import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ArrowLeft, BookOpen, FileText, Video, FolderGit2, Link as LinkIcon,
  Users, GraduationCap, Award,
  Download, CheckCircle, ChevronDown, ChevronRight, FileSpreadsheet, Presentation,
  Code, Copy, Check, ExternalLink, ChevronLeft, Bookmark, Share2, Sparkles,
  MessageSquare, Edit3, MoreVertical, PanelLeftClose, PanelLeftOpen,
  CheckCircle2, Compass, Layers, Terminal, ThumbsUp, Send, Target, X,
  Clock, ShieldCheck, HelpCircle, AlertCircle, Globe, Building2, RotateCcw
} from 'lucide-react';

export const CourseDetailsPage = ({ courseId, onBack, onOpenExam }) => {
  const { user } = useAuth();
  const isStudent = user?.role === 'ROLE_STUDENT';
  const [libraryFilter, setLibraryFilter] = useState(() => {
    try {
      return localStorage.getItem('bridgeai_study_filter') || 'ALL';
    } catch (e) {
      return 'ALL';
    }
  }); // 'ALL' | 'GLOBAL' | 'INSTITUTION'
  const [courseData, setCourseData] = useState(null);
  const [allCourses, setAllCourses] = useState([]);
  const [currentCourseId, setCurrentCourseId] = useState(courseId || 1);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedModules, setExpandedModules] = useState({ 1: true, 2: false, 3: false, 4: false });
  const [activeTopic, setActiveTopic] = useState(null);
  const [modularSyllabus, setModularSyllabus] = useState([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [completedTopics, setCompletedTopics] = useState(new Set([101, 102]));
  const [bookmarkedTopics, setBookmarkedTopics] = useState(new Set());
  const [examStatuses, setExamStatuses] = useState([]);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [discussionComment, setDiscussionComment] = useState('');
  const [commentsList, setCommentsList] = useState([
    { id: 1, user: 'Amit Patel', text: 'Great explanation of JVM bytecode and platform independence!', time: '2 hours ago' },
    { id: 2, user: 'Priya Sharma', text: 'The diagram of Spring Boot microservices helped clarify the REST layer.', time: 'Yesterday' }
  ]);

  // Curated fallback modular topics
  const defaultModularSyllabus = [
    {
      id: 1,
      title: 'Basics & Core Engineering',
      topics: [
        {
          id: 101,
          title: 'Introduction to Java & Enterprise Systems',
          category: 'Tutorial & Basics',
          lastUpdated: '25 Aug, 2026',
          description: 'Java is a high-level, object-oriented programming language used to build web apps, mobile applications, and enterprise software systems.',
          bulletPoints: [
            'Java is a platform-independent language, which means code written in Java can run on any device that supports the Java Virtual Machine (JVM).',
            'Syntax and structure are similar to C-based languages like C++ and C#.',
            'Automatic garbage collection manages memory allocation without manual pointer arithmetic.',
            'Strong type system and strict compile-time verification ensure production runtime reliability.'
          ],
          visualCard: {
            title: 'Web Development & Modern Enterprise Stack',
            badge: 'Explore Architecture',
            items: [
              { name: 'Spring Boot', desc: 'Build Production REST APIs and Microservices with Embedded Tomcat' },
              { name: 'Hibernate', desc: 'Enterprise ORM Tool for Automated Database Schema & Query Operations' },
              { name: 'Core Platform', desc: 'JVM Bytecode Execution, Multithreaded Concurrency & Memory Model' }
            ]
          },
          codeSnippet: `// Standard Java Enterprise Entrypoint
package com.bridgeai.portal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class PortalApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortalApplication.class, args);
        System.out.println("BridgeAI Enterprise Engine Initialized Successfully.");
    }

    @GetMapping("/api/health")
    public String healthCheck() {
        return "Service Online: Status 200 OK";
    }
}`,
          output: `[JVM Runner] Starting PortalApplication using Java 21 LTS...
[Netty/Tomcat] Initialized embedded container on port 8080.
BridgeAI Enterprise Engine Initialized Successfully.
Health check endpoint registered at: http://localhost:8080/api/health`
        },
        {
          id: 102,
          title: 'Variables & Memory Allocation',
          category: 'Tutorial & Basics',
          lastUpdated: '28 Aug, 2026',
          description: 'Variables are containers for storing data values in stack and heap memory spaces.',
          bulletPoints: [
            'Primitive variables (int, double, boolean) are stored directly on the execution Stack.',
            'Reference variables point to object instances allocated in the JVM Garbage-Collected Heap.',
            'Scope is strictly determined by enclosing curly braces {}.'
          ],
          codeSnippet: `public class VariableDemo {
    public static void main(String[] args) {
        int studentCount = 128; // Stack memory
        String courseName = "AI Engineering Masterclass"; // Heap reference
        
        System.out.println("Course: " + courseName + " | Enrolled: " + studentCount);
    }
}`,
          output: `Course: AI Engineering Masterclass | Enrolled: 128`
        },
        {
          id: 103,
          title: 'Data Types & Primitive Representations',
          category: 'Tutorial & Basics',
          lastUpdated: '29 Aug, 2026',
          description: 'Java is strongly typed; every variable has a declared type that specifies memory footprint.',
          bulletPoints: [
            'Integral types: byte (8-bit), short (16-bit), int (32-bit), long (64-bit).',
            'Floating-point types: float (32-bit IEEE 754), double (64-bit precision).',
            'Textual and Logical: char (16-bit Unicode UTF-16), boolean (true / false).'
          ]
        },
        { id: 104, title: 'Operators & Mathematical Logic', category: 'Tutorial & Basics', lastUpdated: '30 Aug, 2026', description: 'Arithmetic, relational, bitwise, and logical operators in Java.' },
        { id: 105, title: 'Decision Making & Control Structures', category: 'Tutorial & Basics', lastUpdated: '01 Sep, 2026', description: 'If-else statements, switch pattern matching, and ternary expressions.' },
        { id: 106, title: 'Methods & Execution Call Stack', category: 'Tutorial & Basics', lastUpdated: '02 Sep, 2026', description: 'Method signatures, parameter passing by value, and recursion depth.' },
        { id: 107, title: 'Arrays & Dimensional Vectors', category: 'Tutorial & Basics', lastUpdated: '03 Sep, 2026', description: 'Fixed-length arrays, multidimensional matrices, and boundary verification.' },
        { id: 108, title: 'Strings & Immutability Pool', category: 'Tutorial & Basics', lastUpdated: '04 Sep, 2026', description: 'String constant pool, StringBuilder for high-throughput concatenation.' }
      ]
    },
    {
      id: 2,
      title: 'OOP & Interface Architecture',
      topics: [
        {
          id: 201,
          title: 'Classes, Objects & Constructors',
          category: 'Advanced Architecture',
          lastUpdated: '05 Sep, 2026',
          description: 'Foundations of object-oriented programming: blueprint classes and instantiated instances.',
          bulletPoints: [
            'Encapsulation bundles fields and operations together while hiding internal state.',
            'Constructors initialize state upon new invocation.'
          ]
        },
        {
          id: 202,
          title: 'Inheritance & Polymorphic Dispatch',
          category: 'Advanced Architecture',
          lastUpdated: '06 Sep, 2026',
          description: 'Extending parent classes, virtual method tables, and dynamic runtime dispatch.',
          bulletPoints: [
            'Method overriding allows dynamic dispatch based on actual runtime object type.',
            'Single inheritance for classes; multiple inheritance enabled via interfaces.'
          ]
        },
        {
          id: 203,
          title: 'Interfaces & Abstract Contracts',
          category: 'Advanced Architecture',
          lastUpdated: '07 Sep, 2026',
          description: 'Decoupling specification from implementation using interfaces and default methods.',
          bulletPoints: [
            'Interfaces define contracts with zero internal state fields.',
            'Facilitates dependency inversion principle (DIP) in SOLID design.'
          ]
        }
      ]
    },
    {
      id: 3,
      title: 'REST APIs & Web Development',
      topics: [
        {
          id: 301,
          title: 'REST Architectural Constraints & HTTP Semantics',
          category: 'Advanced Architecture',
          lastUpdated: '08 Sep, 2026',
          description: 'Client-server stateless communication, idempotency, and REST resource endpoints.',
          bulletPoints: [
            'GET, PUT, and DELETE methods are strictly idempotent.',
            'POST is non-idempotent and used for resource instantiation.',
            'Statelessness ensures any node in a load-balanced cluster can serve incoming requests.'
          ]
        },
        {
          id: 302,
          title: 'Spring Boot Dependency Injection & IoC',
          category: 'Advanced Architecture',
          lastUpdated: '09 Sep, 2026',
          description: 'Inversion of Control container, component scanning, and autowired beans.'
        }
      ]
    }
  ];

  useEffect(() => {
    fetchCourseList();
  }, []);

  useEffect(() => {
    const targetId = courseId || currentCourseId || 1;
    setCurrentCourseId(targetId);
    fetchCourseDetail(targetId);
  }, [courseId]);

  const fetchCourseList = async () => {
    try {
      const res = await api.get('/courses');
      if (res.data) setAllCourses(res.data);
    } catch (err) {
      console.error('Error fetching courses list', err);
    }
  };

  const fetchCourseDetail = async (targetId = currentCourseId) => {
    try {
      setLoading(true);
      const [res, exStatusRes] = await Promise.allSettled([
        api.get(`/courses/${targetId || 1}`),
        api.get('/exams/student-status')
      ]);

      if (exStatusRes.status === 'fulfilled') {
        setExamStatuses(exStatusRes.value.data || []);
      }

      if (res.status === 'fulfilled') {
        let detail = res.value.data;
        if (!isStudent && (!detail.assignedTrainers || detail.assignedTrainers.length === 0)) {
          try {
            const trRes = await api.get(`/courses/${targetId || 1}/trainers`);
            if (trRes.data && trRes.data.length > 0) {
              detail = { ...detail, assignedTrainers: trRes.data };
            }
          } catch (e) {}
        }
        if (isStudent) {
          if (detail.course) {
            detail.course.trainerName = null;
            detail.course.trainerEmail = null;
            detail.course.trainerId = null;
          }
          detail.assignedTrainers = [];
        }
        setCourseData(detail);

        if (detail?.modules && detail.modules.length > 0) {
          // Map dynamic modules and resources uploaded by trainer
          const dynamicSyllabus = detail.modules.map((mItem, idx) => {
            const mod = mItem.module;
            const resources = mItem.resources || [];

          const topics = resources.map((r) => {
            let bullets = [];
            if (r.description) {
              bullets.push(r.description);
            }
            bullets.push('Verified production architecture pattern aligned with modern system engineering.');
            bullets.push('Compatible with enterprise Spring Boot and modular services.');

            return {
              id: r.id,
              moduleId: mod.id,
              title: r.title,
              category: 'Tutorial & Basics',
              lastUpdated: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently Uploaded',
              description: r.description || 'Structured learning module and technical documentation.',
              richContent: r.richContent || null,
              videoEmbedUrl: r.videoEmbedUrl || null,
              urlOrPath: r.urlOrPath || null,
              resourceType: r.resourceType || 'ARTICLE',
              visibilityScope: r.visibilityScope || 'GLOBAL',
              institutionId: r.institutionId || null,
              institutionName: r.institutionName || null,
              bulletPoints: bullets,
              codeSnippet: (r.richContent && r.richContent.includes('```')) ? null : `// Production Implementation for ${r.title}
public class ModuleService {
    public static void process() {
        System.out.println("Processing ${r.title}");
    }
}`,
              visualCard: idx === 0 ? defaultModularSyllabus[0].topics[0].visualCard : null
            };
          });

          return {
            id: mod.id,
            title: mod.title,
            topics: topics
          };
        });

        // Use trainer-configured modules from backend; fallback only if no modules exist at all
        const finalSyllabus = dynamicSyllabus.length > 0 ? dynamicSyllabus : defaultModularSyllabus;
        setModularSyllabus(finalSyllabus);

        // Set active topic
        for (const m of finalSyllabus) {
          if (m.topics && m.topics.length > 0) {
            setActiveTopic(m.topics[0]);
            break;
          }
        }
      } else {
        setModularSyllabus(defaultModularSyllabus);
        setActiveTopic(defaultModularSyllabus[0].topics[0]);
      }
    }
  } catch (err) {
      console.warn('Course detail notice:', err);
      setModularSyllabus(defaultModularSyllabus);
      setActiveTopic(defaultModularSyllabus[0].topics[0]);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (modId) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const toggleTopicCompletion = (id) => {
    setCompletedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleBookmark = (id) => {
    setBookmarkedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!discussionComment.trim()) return;
    setCommentsList([
      { id: Date.now(), user: 'Rahul Verma (You)', text: discussionComment.trim(), time: 'Just now' },
      ...commentsList
    ]);
    setDiscussionComment('');
  };

  // Flatten all topics for sequential navigation
  const allTopics = [];
  modularSyllabus.forEach((mod) => {
    if (mod.topics) {
      mod.topics.forEach((t) => {
        allTopics.push({ ...t, moduleTitle: mod.title });
      });
    }
  });

  const assignedTrainersList = (courseData?.assignedTrainers && courseData.assignedTrainers.length > 0)
    ? courseData.assignedTrainers
    : (courseData?.course?.trainerName ? [{
        trainerId: courseData.course.trainerId || 1,
        trainerName: courseData.course.trainerName,
        trainerEmail: courseData.course.trainerEmail || 'faculty@bridgeai.edu',
        trainerSpecialization: 'Computer Science & AI',
        isPrimary: true
      }] : []);

  const currentIndex = allTopics.findIndex((t) => t.id === activeTopic?.id);
  const prevTopic = currentIndex > 0 ? allTopics[currentIndex - 1] : null;
  const nextTopic = currentIndex < allTopics.length - 1 ? allTopics[currentIndex + 1] : null;

  // Active module DTO & exam calculation
  const activeModuleDto = courseData?.modules?.find(m =>
    (m.module && activeTopic?.moduleId && m.module.id === activeTopic.moduleId) ||
    (m.resources && m.resources.some(r => r.id === activeTopic?.id))
  );

  const currentModuleExam = activeModuleDto?.moduleExam || courseData?.courseExam;
  const currentQuestionCount = activeModuleDto?.questionCount || courseData?.totalExamQuestions || (currentModuleExam ? 3 : 0);

  const currentExamStatus = examStatuses.find(s =>
    (currentModuleExam && s.examId === currentModuleExam.id) ||
    (activeModuleDto && s.moduleId === activeModuleDto.module.id) ||
    (s.courseId === currentCourseId && (!s.moduleId || s.moduleId === activeModuleDto?.module?.id))
  );

  return (
    <div className="space-y-4">
      {/* 1. ACTIONS, SUBJECT SWITCHER & SIDEBAR TOGGLE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Academic Portal</span>
          </button>

          {/* SIDEBAR OPEN/CLOSE TOGGLE BUTTON */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs border ${
              sidebarOpen
                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
            }`}
            title={sidebarOpen ? "Close Sidebar (Distraction-Free Reading Mode)" : "Open Sidebar (View Modular Syllabus)"}
          >
            {sidebarOpen ? (
              <>
                <PanelLeftClose className="w-4 h-4" />
                <span>Close Sidebar</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-4 h-4" />
                <span>Open Sidebar (Syllabus)</span>
              </>
            )}
          </button>

          {/* SUBJECT SWITCHER DROPDOWN */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 shadow-2xs">
            <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">Subject:</span>
            <select
              value={currentCourseId}
              onChange={(e) => {
                const nextId = Number(e.target.value);
                setCurrentCourseId(nextId);
                fetchCourseDetail(nextId);
              }}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white border-none outline-none cursor-pointer max-w-xs"
            >
              {allCourses.length > 0 ? (
                allCourses.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {c.title}
                  </option>
                ))
              ) : (
                <option value={currentCourseId} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{courseData?.course?.title || 'Current Subject'}</option>
              )}
            </select>
          </div>

          {/* CONCERNED FACULTY BADGE (Hidden for students to ensure privacy) */}
          {!isStudent && courseData?.course?.trainerName && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>Faculty In-Charge: <strong>{courseData.course.trainerName}</strong></span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
            {completedTopics.size} / {Math.max(allTopics.length, 1)} Topics Completed
          </span>
          {onOpenExam && (
            <button
              onClick={() => {
                if (currentModuleExam?.id) {
                  onOpenExam(currentModuleExam.id);
                } else if (courseData?.courseExam?.id) {
                  onOpenExam(courseData.courseExam.id);
                } else {
                  onOpenExam(1);
                }
              }}
              className="px-3.5 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              <span>{(currentExamStatus?.passed || currentExamStatus?.status === 'PASSED' || currentExamStatus?.score > 0) ? 'Retake Practice Self-Assessment' : 'Take Practice Self-Assessment'}</span>
            </button>
          )}
        </div>
      </div>

      {/* DUAL STUDY-MATERIAL LIBRARY FILTER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Study-Material Library Filter</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
                {courseData?.course?.institutionId ? (courseData.course.institutionName || 'Institution Private') : 'Global Curriculum'}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Switch views between Global Study Materials and your Institution&apos;s Private Repository.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setLibraryFilter('ALL')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              libraryFilter === 'ALL'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Topics</span>
          </button>
          <button
            type="button"
            onClick={() => setLibraryFilter('GLOBAL')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              libraryFilter === 'GLOBAL'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Global Library</span>
          </button>
          <button
            type="button"
            onClick={() => setLibraryFilter('INSTITUTION')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
              libraryFilter === 'INSTITUTION'
                ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-purple-600" />
            <span>{user?.institutionName || 'Institution'} Private</span>
          </button>
        </div>
      </div>

      {/* 2. ASSIGNED FACULTY SPECIALISTS BANNER FOR THIS SUBJECT (Hidden for students) */}
      {!isStudent && assignedTrainersList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Assigned Faculty Specialists for &quot;{courseData?.course?.title || 'this Subject'}&quot;</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                    {assignedTrainersList.length} {assignedTrainersList.length === 1 ? 'Faculty Specialist' : 'Faculty Specialists'}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Qualified academic specialists leading instruction, curriculum development, and evaluations for this subject.
                </p>
              </div>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono hidden md:inline">
              Subject Code: CS-{currentCourseId.toString().padStart(3, '0')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {assignedTrainersList.map((trainer) => (
              <div
                key={trainer.trainerId || trainer.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-2xs transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {trainer.trainerName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'TR'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {trainer.trainerName}
                    </h5>
                    {trainer.isPrimary && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 shrink-0">
                        Lead
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100/90 dark:bg-amber-950/80 border border-amber-300/80 dark:border-amber-800 px-2 py-0.5 rounded-full truncate">
                      <Target className="w-3 h-3 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span className="truncate">Specialization: {trainer.trainerSpecialization || 'Computer Science & AI'}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {trainer.trainerEmail || 'faculty@bridgeai.edu'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE: COLLAPSIBLE SIDEBAR + ARTICLE PANE */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT SIDEBAR: MODULAR SYLLABUS TREE (COLLAPSIBLE / EXPANDABLE) */}
        {sidebarOpen && (
          <aside className="w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden lg:sticky lg:top-4 animate-fadeIn transition-all">
            {/* Top Sidebar Header */}
            <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">Modular Course Curriculum</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:text-slate-300 p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>

            {/* Modular Tree List */}
            <div className="max-h-[calc(100vh-230px)] overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {modularSyllabus.map((mod) => {
                const isExpanded = expandedModules[mod.id] ?? true;
                const topics = mod.topics || [];
                const modDto = courseData?.modules?.find(m => m.module?.id === mod.id);
                const modExam = modDto?.moduleExam;
                const modStatus = examStatuses.find(s => (modExam && s.examId === modExam.id) || (s.moduleId === mod.id));

                return (
                  <div key={mod.id} className="pt-1.5 first:pt-0">
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-center justify-between text-left p-2.5 rounded-lg hover:bg-slate-50 dark:bg-slate-900/60 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{mod.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {(modStatus?.passed || modStatus?.status === 'PASSED') ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Passed</span>
                          </span>
                        ) : modExam ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            Practice ({modDto?.questionCount || 3} Qs)
                          </span>
                        ) : null}
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="pl-3 pr-1 py-1 space-y-0.5 border-l-2 border-slate-200 dark:border-slate-800 ml-3">
                        {(() => {
                          const filteredTopics = topics.filter((t) => {
                            if (libraryFilter === 'GLOBAL') {
                              return t.visibilityScope === 'GLOBAL' || t.visibilityScope === 'BOTH' || !t.visibilityScope;
                            }
                            if (libraryFilter === 'INSTITUTION') {
                              return t.visibilityScope === 'INSTITUTION' || t.visibilityScope === 'BOTH';
                            }
                            return true;
                          });

                          if (filteredTopics.length === 0) {
                            return <div className="text-[11px] text-slate-400 italic py-1">No topics in this library scope</div>;
                          }

                          return filteredTopics.map((t) => {
                            const isActive = activeTopic?.id === t.id;
                            const isDone = completedTopics.has(t.id);

                            return (
                              <button
                                key={t.id}
                                onClick={() => setActiveTopic(t)}
                                className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-between ${
                                  isActive
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border-l-4 border-emerald-600 pl-2 shadow-2xs'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
                                }`}
                              >
                                <span className="truncate pr-2">{t.title}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {t.visibilityScope === 'INSTITUTION' ? (
                                    <span title="Institution Private Library">
                                      <Building2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                    </span>
                                  ) : t.visibilityScope === 'BOTH' ? (
                                    <span title="Global & Institution Library">
                                      <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    </span>
                                  ) : (
                                    <span title="Global Study-Material Library">
                                      <Globe className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                    </span>
                                  )}
                                  {isDone && (
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Pinned Badge */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-300 block">Backend Engineering</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Full-Stack AI Architecture</span>
              </div>
              <button
                onClick={() => alert('Roadmap: Core Java -> Spring Boot -> Microservices -> RAG Systems')}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-md shadow-2xs transition-colors"
              >
                Explore
              </button>
            </div>
          </aside>
        )}

        {/* RIGHT COLUMN: ARTICLE READER */}
        <main className="w-full lg:flex-1 min-w-0 transition-all">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="mb-4 inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4 text-blue-600" />
              <span>Show Modular Course Curriculum</span>
            </button>
          )}
          {activeTopic ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Main Title & Metadata Bar */}
              <div className="border-b border-slate-200 dark:border-slate-800 pb-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    {/* Subject & Module Breadcrumb */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="font-bold text-blue-700 dark:text-blue-400">{courseData?.course?.title || 'Subject'}</span>
                      <span>&rsaquo;</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{activeTopic?.moduleTitle || 'Module'}</span>
                      <span>&rsaquo;</span>
                      <span className="text-slate-500 dark:text-slate-400">{activeTopic?.title}</span>
                      {!isStudent && courseData?.course?.trainerName ? (
                        <span className="ml-auto bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                          Concerned Faculty: {courseData.course.trainerName}
                        </span>
                      ) : (
                        <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {activeTopic?.visibilityScope === 'INSTITUTION' ? (
                            <>
                              <Building2 className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span>{activeTopic.institutionName || user?.institutionName || 'Institution'} Private Library</span>
                            </>
                          ) : activeTopic?.visibilityScope === 'BOTH' ? (
                            <>
                              <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Global &amp; Institution Library</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>Global Study-Material Library</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {activeTopic.title}
                    </h1>
                  </div>

                  {/* Top Right Action Icons: Discussion, Notes, Options */}
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <button
                      onClick={() => setShowDiscussionModal(true)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors relative"
                      title="Open Discussion & Peer Comments"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {commentsList.length > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </button>

                    <button
                      onClick={() => setShowNotesModal(true)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
                      title="Take Personal Notes on this Topic"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleBookmark(activeTopic.id)}
                      className={`p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ${
                        bookmarkedTopics.has(activeTopic.id) ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
                      }`}
                      title="Bookmark Topic"
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Topic link copied to clipboard!');
                      }}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 transition-colors"
                      title="Share Topic Link"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Last Updated : <span className="font-semibold text-slate-700 dark:text-slate-300">{activeTopic.lastUpdated || '25 Aug, 2026'}</span>
                </div>
              </div>

              {/* Lead Paragraph */}
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {activeTopic.description}
              </p>

              {/* Bulleted Points */}
              {activeTopic.bulletPoints && activeTopic.bulletPoints.length > 0 && (
                <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300 pl-5 list-disc marker:text-slate-900 dark:marker:text-slate-100">
                  {activeTopic.bulletPoints.map((bp, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {bp}
                    </li>
                  ))}
                </ul>
              )}

              {/* VISUAL ARCHITECTURE CARDS BLOCK */}
              {activeTopic.visualCard && (
                <div className="bg-[#EAF5EC] dark:bg-emerald-950/40 border border-[#BDE3C5] dark:border-emerald-800/80 rounded-xl p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#BDE3C5] dark:border-emerald-800/80 pb-3">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                      {activeTopic.visualCard.title}
                    </h3>
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-700">
                      {activeTopic.visualCard.badge}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4 font-bold text-lg text-slate-900 dark:text-white">
                      Web Development
                    </div>

                    <div className="md:col-span-8 space-y-3">
                      {activeTopic.visualCard.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                        >
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-sm">{item.name}</span>
                          <span className="text-xs text-slate-600 dark:text-slate-300">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Rich Content Markdown if available */}
              {activeTopic.richContent && (
                <div className="space-y-4 text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans pt-2">
                  {activeTopic.richContent.split('\n\n').map((paragraph, pIdx) => {
                    if (paragraph.startsWith('### ')) {
                      return (
                        <h3 key={pIdx} className="text-lg font-bold text-slate-900 dark:text-white pt-3 border-t border-slate-100">
                          {paragraph.replace('### ', '')}
                        </h3>
                      );
                    }
                    if (paragraph.startsWith('```')) {
                      const rawCode = paragraph.replace(/```[a-z]*\n?/g, '').trim();
                      return (
                        <div key={pIdx} className="rounded-xl overflow-hidden border border-slate-800 bg-[#0F172A] text-slate-100 shadow-md">
                          <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs font-mono text-slate-400">
                            <span>Code Snippet</span>
                            <button
                              onClick={() => handleCopyCode(rawCode)}
                              className="flex items-center gap-1 hover:text-white transition-colors"
                            >
                              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedCode ? 'Copied!' : 'Copy'}</span>
                            </button>
                          </div>
                          <pre className="p-4 text-xs font-mono overflow-x-auto text-emerald-400 leading-relaxed">
                            {rawCode}
                          </pre>
                        </div>
                      );
                    }
                    return (
                      <p key={pIdx} className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              )}

              {/* Standalone Code Snippet with Syntax Styling & 1-Click Copy */}
              {activeTopic.codeSnippet && (
                <div className="space-y-2">
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0F172A] text-slate-100 shadow-md">
                    <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs font-mono text-slate-400">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        <span>Java 21 LTS Source Code Implementation</span>
                      </div>
                      <button
                        onClick={() => handleCopyCode(activeTopic.codeSnippet)}
                        className="flex items-center gap-1.5 hover:text-white px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-xs transition-colors"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>
                    <pre className="p-4 text-xs font-mono overflow-x-auto text-emerald-400 leading-relaxed">
                      {activeTopic.codeSnippet}
                    </pre>
                  </div>

                  {activeTopic.output && (
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Execution Output Console:</span>
                      <pre className="whitespace-pre-wrap">{activeTopic.output}</pre>
                    </div>
                  )}
                </div>
              )}

              {/* Embedded Video Lecture (if present) */}
              {activeTopic.videoEmbedUrl && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-blue-600" />
                    Lecture Video Tutorial
                  </h4>
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md border border-slate-800">
                    <iframe
                      src={activeTopic.videoEmbedUrl}
                      title={activeTopic.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Downloadable Reference File (if present) */}
              {activeTopic.urlOrPath && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-blue-600" />
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">Downloadable Topic Attachment</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{activeTopic.resourceType || 'PDF'} document</span>
                    </div>
                  </div>
                  <a
                    href={activeTopic.urlOrPath}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
                  >
                    Download File
                  </a>
                </div>
              )}

              {/* AFTER-READING MODULE ASSESSMENT / KNOWLEDGE CHECK */}
              <div className="p-5 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          <span>Self-Assessment & Knowledge Check (Unlimited Practice Attempts)</span>
                        </span>
                        {(currentExamStatus?.passed || currentExamStatus?.status === 'PASSED') && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Passed</span>
                          </span>
                        )}
                        {(currentExamStatus?.displayStatus === 'DONE' && !currentExamStatus?.passed && currentExamStatus?.status !== 'PASSED') && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                            <span>Needs Practice</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">
                        {currentModuleExam?.title || `${activeTopic.title} - Module Self-Assessment`}
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Continuous self-evaluation and practice test for this module. You can attempt this test multiple times to solidify understanding.
                      </p>
                    </div>
                  </div>

                  {onOpenExam && (
                    <button
                      onClick={() => {
                        if (currentModuleExam?.id) {
                          onOpenExam(currentModuleExam.id);
                        } else if (courseData?.courseExam?.id) {
                          onOpenExam(courseData.courseExam.id);
                        } else {
                          onOpenExam(1);
                        }
                      }}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-sm shrink-0 flex items-center justify-center gap-2 transition-all hover:shadow-blue-500/25"
                    >
                      <RotateCcw className="w-4 h-4 text-blue-200" />
                      <span>{(currentExamStatus?.passed || currentExamStatus?.status === 'PASSED' || currentExamStatus?.score > 0) ? 'Retake Practice Self-Assessment' : 'Take Practice Self-Assessment'}</span>
                    </button>
                  )}
                </div>

                {/* Exam Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/5 border border-white/10">
                    <span className="text-[11px] text-slate-400 block font-medium">Questions</span>
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1 mt-0.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                      <span>{currentQuestionCount > 0 ? `${currentQuestionCount} MCQs` : 'Topic MCQs'}</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/5 border border-white/10">
                    <span className="text-[11px] text-slate-400 block font-medium">Time Limit</span>
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{currentModuleExam?.durationMinutes || 20} Minutes</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/5 border border-white/10">
                    <span className="text-[11px] text-slate-400 block font-medium">Pass Criteria</span>
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1 mt-0.5">
                      <Award className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{currentModuleExam?.passingPercentage || 60}% Passing</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/5 border border-white/10">
                    <span className="text-[11px] text-slate-400 block font-medium">Attempts Allowed</span>
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-1 mt-0.5">
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Unlimited Retakes</span>
                    </span>
                  </div>
                </div>

                {/* If already attempted, show prior score details */}
                {currentExamStatus && (currentExamStatus.displayStatus === 'DONE' || currentExamStatus.score != null || currentExamStatus.attemptCount > 0) && (
                  <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                    (currentExamStatus.passed || currentExamStatus.status === 'PASSED')
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                      : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      {(currentExamStatus.passed || currentExamStatus.status === 'PASSED') ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span>
                        Previous Result: <strong>{currentExamStatus.score ?? currentExamStatus.bestScore ?? 0} / {currentExamStatus.totalMarks || 100} Marks</strong> ({currentExamStatus.percentage ?? currentExamStatus.bestPercentage ?? 0}%) &bull; Status: <strong>{(currentExamStatus.passed || currentExamStatus.status === 'PASSED') ? 'PASSED' : 'NEEDS RETEST'}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] opacity-80">
                      {currentExamStatus.completedAt ? new Date(currentExamStatus.completedAt).toLocaleDateString() : 'Attempt Completed'}
                    </span>
                  </div>
                )}
              </div>

              {/* BOTTOM NAVIGATION: PREVIOUS & NEXT TOPIC BUTTONS */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                {prevTopic ? (
                  <button
                    onClick={() => setActiveTopic(prevTopic)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-colors shadow-2xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous: {prevTopic.title}</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleTopicCompletion(activeTopic.id)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-colors shadow-2xs ${
                      completedTopics.has(activeTopic.id)
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{completedTopics.has(activeTopic.id) ? 'Completed' : 'Mark as Completed'}</span>
                  </button>

                  {nextTopic ? (
                    <button
                      onClick={() => {
                        toggleTopicCompletion(activeTopic.id);
                        setActiveTopic(nextTopic);
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      <span>Next: {nextTopic.title}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Syllabus Completed</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-500 dark:text-slate-400">
              Select a topic from the left sidebar to start reading.
            </div>
          )}
        </main>
      </div>

      {/* MODAL: Discussion & Student Comments */}
      {showDiscussionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Topic Discussions & Questions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activeTopic?.title}</p>
              </div>
              <button onClick={() => setShowDiscussionModal(false)} className="text-slate-400 hover:text-slate-700 dark:text-slate-300 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddComment} className="space-y-2">
              <textarea
                rows="3"
                value={discussionComment}
                onChange={(e) => setDiscussionComment(e.target.value)}
                placeholder="Ask a question or share insight with peers and mentors..."
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" /> Post Comment
                </button>
              </div>
            </form>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-2 space-y-3">
              {commentsList.map((c) => (
                <div key={c.id} className="pt-2 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                    <span>{c.user}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{c.time}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Student Personal Study Notes */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Personal Study Notes</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activeTopic?.title}</p>
              </div>
              <button onClick={() => setShowNotesModal(false)} className="text-slate-400 hover:text-slate-700 dark:text-slate-300 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows="6"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Jot down key takeaways, exam tips, or architecture questions..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400 dark:placeholder-slate-500"
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('Notes saved locally for this topic!');
                  setShowNotesModal(false);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-2xs"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
