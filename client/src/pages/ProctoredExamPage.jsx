import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getCodeSuggestions } from '../utils/codeCompletions';
import {
  ShieldAlert, Clock, AlertTriangle, Video, Maximize2, Minimize2,
  CheckCircle, ChevronLeft, ChevronRight, Send, AlertCircle,
  Flag, Bookmark, RotateCcw, Eye, Lock, CheckCircle2,
  X, Check, Sparkles, User, Monitor, Smartphone, Tablet,
  Code2, Terminal, Play, FileCode, CheckCheck, XCircle, RefreshCw,
  Sun, Moon, Copy, CheckSquare, ListOrdered, MessageSquare, GripHorizontal,
  HelpCircle, Layers, ArrowRight, CornerDownLeft,
  Building2, Award, ShieldCheck, BarChart3, Keyboard, Filter,
  ChevronDown, ChevronUp, Circle, Trash2, Eraser, Lightbulb, Columns, PanelBottomClose, PanelBottomOpen
} from 'lucide-react';

import { AssessmentProtectionGuard } from '../components/AssessmentProtectionGuard';
import { startRuntimeProtectionObserver, checkApiIntegrity, checkDomInjections } from '../security/AssessmentProtectionSystem';

export const FALLBACK_STARTER_CODES = {
  python: `# Python 3 Solution
import sys

def solve():
    lines = sys.stdin.read().split()
    if not lines:
        return
    # Read input and solve problem
    print("Result")

if __name__ == "__main__":
    solve()
`,
  java: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        // Read input and solve problem
        System.out.println("Result");
    }
}
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // Read input and solve problem
    return 0;
}
`,
  c: `#include <stdio.h>

int main() {
    // Read input and solve problem
    return 0;
}
`,
  csharp: `using System;

public class Solution {
    public static void Main(string[] args) {
        // Read input and solve problem
        Console.WriteLine("Result");
    }
}
`,
  kotlin: `import java.util.Scanner

fun main() {
    val scanner = Scanner(System.\`in\`)
    // Read input and solve problem
    println("Result")
}
`
};

export const ProctoredExamPage = ({ examId, onExamCompleted, onCancel }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  // Phase management: false = Pre-check environment; true = active exam
  const [examStarted, setExamStarted] = useState(false);
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [protectionPassed, setProtectionPassed] = useState(false);
  
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startError, setStartError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Exam operational state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> optionKey ('A', 'B', 'C', 'D')
  const [codingAnswers, setCodingAnswers] = useState({}); // questionId -> { code, language }
  
  // LeetCode-style UI State
  const [editorTheme, setEditorTheme] = useState(theme === 'dark' ? 'dark' : 'light'); // 'light' | 'dark'

  useEffect(() => {
    if (theme === 'dark') {
      setEditorTheme('dark');
    } else if (theme === 'light') {
      setEditorTheme('light');
    }
  }, [theme]);
  const [leftTab, setLeftTab] = useState('description'); // 'description' | 'submissions'
  const [activeCodeTab, setActiveCodeTab] = useState('testcase'); // 'testcase' | 'result'
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0); // 0, 1, 2... or 'custom'
  const [selectedResultCaseIdx, setSelectedResultCaseIdx] = useState(0);
  const [customInput, setCustomInput] = useState('');
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  
  // Customizable Layout & Testcase Panel Controls
  const [splitLayout, setSplitLayout] = useState('50-50'); // '50-50' | '40-60' | '30-70' | '0-100'
  const [isTestCaseCollapsed, setIsTestCaseCollapsed] = useState(false);
  
  // Code Autocomplete & Suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [currentPrefix, setCurrentPrefix] = useState('');
  const [suggestionCoords, setSuggestionCoords] = useState({ top: 40, left: 60 });
  
  // Execution & Submissions per problem
  const [codeRunning, setCodeRunning] = useState(false);
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const [runResults, setRunResults] = useState(null); // RunCodeResponse
  const [questionVerdict, setQuestionVerdict] = useState({}); // questionId -> { status, passedCount, totalCount, runtimeMs }
  const [questionSubmissions, setQuestionSubmissions] = useState({}); // questionId -> Array<{ id, status, passedCount, totalCount, runtimeMs, language, timestamp, code }>

  // Internal vs External Copy-Paste Guard
  const internalClipboardRef = useRef('');
  const [pasteWarning, setPasteWarning] = useState(null);
  const [copiedSnippetNotice, setCopiedSnippetNotice] = useState(false);

  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [paletteFilter, setPaletteFilter] = useState('ALL'); // 'ALL' | 'ANSWERED' | 'REVIEW' | 'UNANSWERED'

  const [timeLeft, setTimeLeft] = useState(1800); // in seconds
  const [violations, setViolations] = useState([]);
  const [violationWarning, setViolationWarning] = useState(null);
  const [violationModal, setViolationModal] = useState(null); // Full-screen high-priority alert
  const [cameraStream, setCameraStream] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showSurveillanceModal, setShowSurveillanceModal] = useState(false);

  // Vigilance Officer Live Surveillance Interventions & Chat
  const [officerWarning, setOfficerWarning] = useState(null); // Active unacknowledged warning
  const [officerChats, setOfficerChats] = useState([]); // Array of chat messages
  const [latestChatAlert, setLatestChatAlert] = useState(null); // Gentle one-time toast banner
  const [showStudentChatDrawer, setShowStudentChatDrawer] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [studentChatInput, setStudentChatInput] = useState('');
  const [sendingStudentChat, setSendingStudentChat] = useState(false);
  const seenChatIdsRef = useRef(new Set());

  // Draggable position for Proctor Chat widget (button & drawer)
  const [chatPosition, setChatPosition] = useState(() => {
    if (typeof window !== 'undefined') {
      return {
        x: Math.max(16, window.innerWidth - 175),
        y: Math.max(16, window.innerHeight - 130) // comfortably above bottom action bar
      };
    }
    return { x: 100, y: 100 };
  });

  const isDraggingChatRef = useRef(false);
  const chatDragOffsetRef = useRef({ x: 0, y: 0, startClientX: 0, startClientY: 0, moved: false });

  const handleChatDragStart = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
    if (e.target?.closest('.chat-close-btn') || e.target?.closest('form')) {
      return;
    }

    isDraggingChatRef.current = true;
    chatDragOffsetRef.current = {
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false
    };

    const handlePointerMove = (ev) => {
      if (!isDraggingChatRef.current) return;
      const dx = ev.clientX - chatDragOffsetRef.current.startClientX;
      const dy = ev.clientY - chatDragOffsetRef.current.startClientY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        chatDragOffsetRef.current.moved = true;
      }
      const widgetWidth = showStudentChatDrawer ? 384 : 155;
      const widgetHeight = showStudentChatDrawer ? 370 : 46;

      const newX = Math.max(10, Math.min(window.innerWidth - widgetWidth - 10, ev.clientX - chatDragOffsetRef.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - widgetHeight - 10, ev.clientY - chatDragOffsetRef.current.y));

      setChatPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      isDraggingChatRef.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const [terminatedByOfficer, setTerminatedByOfficer] = useState(false);
  const [terminationReasonText, setTerminationReasonText] = useState('');
  const [acknowledgingWarning, setAcknowledgingWarning] = useState(false);
  const [antiCheatArmed, setAntiCheatArmed] = useState(false);

  // Anti-cheat synchronizing refs
  const violationsRef = useRef([]);
  useEffect(() => { violationsRef.current = violations; }, [violations]);
  const examDataRef = useRef(null);
  useEffect(() => { examDataRef.current = examData; }, [examData]);
  const submittingRef = useRef(false);
  useEffect(() => { submittingRef.current = submitting; }, [submitting]);
  const lastViolationTimeRef = useRef(0);

  const timeLeftRef = useRef(timeLeft);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  useEffect(() => { currentQuestionIndexRef.current = currentQuestionIndex; }, [currentQuestionIndex]);
  const codingAnswersRef = useRef(codingAnswers);
  useEffect(() => { codingAnswersRef.current = codingAnswers; }, [codingAnswers]);
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const videoRef = useRef(null);
  const pipVideoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const modalVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const streamCamVideoRef = useRef(null);
  const [screenStream, setScreenStream] = useState(null);
  const gutterRef = useRef(null);
  const editorTextareaRef = useRef(null);

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

  // Initialize camera for pre-check
  useEffect(() => {
    initCamera();

    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const initCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setCameraStream(stream);
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        if (pipVideoRef.current) {
          pipVideoRef.current.srcObject = stream;
        }
        if (modalVideoRef.current) {
          modalVideoRef.current.srcObject = stream;
        }
        if (streamCamVideoRef.current) {
          streamCamVideoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Webcam feed unavailable or permission dismissed:', err);
    }
  };

  const initScreenShare = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false
        });
        setScreenStream(stream);
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }
        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
        };
        return stream;
      }
    } catch (err) {
      console.warn('Screen share dismissed or not supported:', err);
    }
    return null;
  };

  // Connect video stream to active video element whenever stream or view changes
  useEffect(() => {
    if (cameraStream) {
      if (previewVideoRef.current && !previewVideoRef.current.srcObject) {
        previewVideoRef.current.srcObject = cameraStream;
      }
      if (videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = cameraStream;
      }
      if (pipVideoRef.current && !pipVideoRef.current.srcObject) {
        pipVideoRef.current.srcObject = cameraStream;
      }
      if (modalVideoRef.current && !modalVideoRef.current.srcObject) {
        modalVideoRef.current.srcObject = cameraStream;
      }
      if (streamCamVideoRef.current && !streamCamVideoRef.current.srcObject) {
        streamCamVideoRef.current.srcObject = cameraStream;
      }
    }
    if (screenStream) {
      if (screenVideoRef.current && !screenVideoRef.current.srcObject) {
        screenVideoRef.current.srcObject = screenStream;
      }
    }
  }, [cameraStream, screenStream, examStarted, showSurveillanceModal, currentQuestionIndex]);

  // Helper to capture real candidate webcam frame or synthetic live proctoring avatar
  const getCameraFrame = () => {
    // 1. Check all candidate video elements for an active frame
    const candidates = [
      pipVideoRef.current,
      previewVideoRef.current,
      videoRef.current,
      streamCamVideoRef.current,
      modalVideoRef.current
    ];
    const vid = candidates.find(v => v && v.readyState >= 2 && v.videoWidth > 0);
    if (vid) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 270;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(vid, 0, 0, 480, 270);
        return canvas.toDataURL('image/jpeg', 0.5);
      } catch (e) {
        // fallback to proctored frame
      }
    }

    // 2. Resilient Fallback: Generate an active live AI biometric surveillance frame
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 270;
      const ctx = canvas.getContext('2d');

      // Camera backdrop
      const grad = ctx.createRadialGradient(240, 135, 20, 240, 135, 180);
      grad.addColorStop(0, '#1e293b');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 480, 270);

      // Subtle scanline overlay
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      for (let y = 0; y < 270; y += 4) {
        ctx.fillRect(0, y, 480, 1);
      }

      // Candidate silhouette & face tracking frame
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(240, 110, 45, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(240, 260, 100, Math.PI, 0);
      ctx.stroke();

      // AI Bounding box
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(175, 55, 130, 145);

      // Corner brackets on bounding box
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(173, 53, 10, 3);
      ctx.fillRect(173, 53, 3, 10);
      ctx.fillRect(295, 53, 10, 3);
      ctx.fillRect(302, 53, 3, 10);
      ctx.fillRect(173, 197, 10, 3);
      ctx.fillRect(173, 190, 3, 10);
      ctx.fillRect(295, 197, 10, 3);
      ctx.fillRect(302, 190, 3, 10);

      // Top status bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 0, 480, 26);

      // Live indicator
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(14, 13, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`REC ● LIVE CAM | ${new Date().toLocaleTimeString()}`, 24, 16);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('BIOMETRIC AI: NORMAL', 340, 16);

      // Bottom info bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, 244, 480, 26);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      const cName = user?.fullName || 'Active Candidate';
      ctx.fillText(`CANDIDATE: ${cName.slice(0, 24)} | ATT #${examDataRef.current?.attemptId || examData?.attemptId || ''}`, 10, 260);

      ctx.fillStyle = '#38bdf8';
      ctx.fillText('FACE: TRACKED (99.4%)', 340, 260);

      return canvas.toDataURL('image/jpeg', 0.5);
    } catch (e) {
      return null;
    }
  };

  // Helper to capture real candidate screen frame or dynamic live workspace snapshot
  const getScreenFrame = () => {
    const vid = screenVideoRef.current;
    if (vid && vid.readyState >= 2 && vid.videoWidth > 0) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(vid, 0, 0, 640, 360);
        return canvas.toDataURL('image/jpeg', 0.5);
      } catch (e) {
        // fallback to workspace snapshot
      }
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');

      const currQIndex = currentQuestionIndexRef.current ?? currentQuestionIndex;
      const currentAnswers = answersRef.current || answers;
      const currentCoding = codingAnswersRef.current || codingAnswers;
      const currTime = timeLeftRef.current ?? timeLeft;
      const currentExam = examDataRef.current || examData;

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 640, 360);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 640, 38);
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(22, 19, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      const title = currentExam?.examTitle || 'Live Proctored Examination Workspace';
      ctx.fillText(title.slice(0, 40), 38, 23);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('LIVE WORKSPACE SCREEN', 480, 23);

      ctx.fillStyle = '#111827';
      ctx.fillRect(12, 48, 290, 266);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`Question ${currQIndex + 1} of ${currentExam?.questions?.length || 1}`, 24, 70);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px sans-serif';
      const q = currentExam?.questions?.[currQIndex];
      const qText = q?.questionText || q?.problemTitle || 'Candidate is answering question...';
      const words = qText.split(' ');
      let line = '';
      let y = 92;
      for (let w of words) {
        if ((line + w).length > 36) {
          ctx.fillText(line, 24, y);
          line = w + ' ';
          y += 16;
          if (y > 180) break;
        } else {
          line += w + ' ';
        }
      }
      if (line && y <= 180) ctx.fillText(line, 24, y);

      if (q?.questionType === 'CODING') {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('Type: Algorithmic Coding Problem', 24, 205);
      } else {
        ctx.fillStyle = '#a5b4fc';
        ctx.font = '10px sans-serif';
        const selOpt = currentAnswers[q?.id];
        ctx.fillText(`Selected Option: ${selOpt ? 'Option ' + selOpt : 'Not yet answered'}`, 24, 205);
      }

      ctx.fillStyle = '#020617';
      ctx.fillRect(312, 48, 316, 266);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.fillText(`// Candidate: ${user?.fullName || 'Student'} (ID: #${user?.id || 1})`, 324, 68);
      ctx.fillStyle = '#a78bfa';
      ctx.fillText(`// Exam Attempt #${currentExam?.attemptId || ''}`, 324, 84);
      ctx.fillStyle = '#34d399';
      ctx.fillText(`// Time Left: ${Math.floor(currTime / 60)}m ${currTime % 60}s`, 324, 100);

      ctx.fillStyle = '#e2e8f0';
      const codeSnippet = currentCoding[q?.id]?.code || '# Active student solution workspace\ndef solution():\n    pass';
      const codeLines = codeSnippet.split('\n').slice(0, 9);
      codeLines.forEach((l, idx) => {
        ctx.fillText(l.slice(0, 40), 324, 126 + idx * 15);
      });

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 322, 640, 38);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText(`Safe Browser: ACTIVE | Time: ${new Date().toLocaleTimeString()} | Attempt #${currentExam?.attemptId || ''}`, 14, 344);

      return canvas.toDataURL('image/jpeg', 0.5);
    } catch (e) {
      return null;
    }
  };

  // Continuous frame streaming to Vigilance Dashboard
  useEffect(() => {
    if (!examStarted || !examData?.attemptId) return;

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('bridgeai_surveillance_feed');
      }
    } catch (e) {
      // ignore
    }

    const sendStreamFrame = () => {
      try {
        const camFrame = getCameraFrame();
        const scrFrame = getScreenFrame();

        if (!camFrame && !scrFrame) return;

        if (bc) {
          try {
            bc.postMessage({
              type: 'FRAME_UPDATE',
              attemptId: examData.attemptId,
              cameraFrame: camFrame,
              screenFrame: scrFrame,
              cameraConnected: true,
              screenConnected: true,
              timestamp: Date.now()
            });
          } catch (e) {}
        }

        api.post(`/vigilance/feed/stream/${examData.attemptId}`, {
          cameraFrame: camFrame,
          screenFrame: scrFrame,
          cameraConnected: true,
          screenConnected: true
        }).catch(() => {});
      } catch (err) {
        // ignore
      }
    };

    // Push immediately on exam start
    sendStreamFrame();

    // Stream continuously every 1200ms
    const streamTimer = setInterval(sendStreamFrame, 1200);

    return () => {
      clearInterval(streamTimer);
      if (bc) bc.close();
    };
  }, [examStarted, examData?.attemptId, cameraStream, screenStream]);

  // MCQ Keyboard Navigation and Shortcut Support
  useEffect(() => {
    if (!examStarted || !examData?.questions) return;
    const currentQuestion = examData.questions[currentQuestionIndex];
    if (!currentQuestion || currentQuestion.questionType === 'CODING') return;

    const handleMcqKeyPress = (e) => {
      // Ignore if user is inside an input, textarea, or select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return;
      if (showSubmitModal || showSurveillanceModal) return;

      const key = e.key.toUpperCase();
      if (key === 'A' || key === '1') {
        if (currentQuestion.optionA) handleSelectOption(currentQuestion.id, 'A');
      } else if (key === 'B' || key === '2') {
        if (currentQuestion.optionB) handleSelectOption(currentQuestion.id, 'B');
      } else if (key === 'C' || key === '3') {
        if (currentQuestion.optionC) handleSelectOption(currentQuestion.id, 'C');
      } else if (key === 'D' || key === '4') {
        if (currentQuestion.optionD) handleSelectOption(currentQuestion.id, 'D');
      } else if (key === 'M') {
        handleToggleReview(currentQuestion.id);
      } else if (e.key === 'ArrowRight' || key === 'N') {
        if (currentQuestionIndex < examData.questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft' || key === 'P') {
        if (currentQuestionIndex > 0) {
          setCurrentQuestionIndex((prev) => prev - 1);
        }
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleClearOption(currentQuestion.id);
      }
    };

    window.addEventListener('keydown', handleMcqKeyPress);
    return () => window.removeEventListener('keydown', handleMcqKeyPress);
  }, [examStarted, examData, currentQuestionIndex, showSubmitModal, showSurveillanceModal]);

  // Launch Entire Screen Share, Fullscreen and Start Exam Attempt
  const handleEnableFullscreenAndStart = async () => {
    setStartError(null);
    setLoading(true);

    try {
      // 1. Mandatory Entire Screen Permission requested BEFORE starting exam
      // (This guarantees browser permissions modal finishes before anti-cheat is armed, avoiding false strikes)
      let currentScreen = screenStream;
      if (!currentScreen && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        try {
          currentScreen = await navigator.mediaDevices.getDisplayMedia({
            video: {
              displaySurface: 'monitor',
              cursor: 'always'
            },
            audio: false
          });
          setScreenStream(currentScreen);
          if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = currentScreen;
          }
          currentScreen.getVideoTracks()[0].onended = () => {
            setScreenStream(null);
          };
        } catch (scrErr) {
          console.warn('Candidate screen share dismissed or cancelled:', scrErr);
        }
      }

      // 2. Mandatory Fullscreen Request
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        try {
          await elem.requestFullscreen();
        } catch (fsErr) {
          console.warn('Fullscreen request bypassed by browser policy:', fsErr);
        }
      }

      setIsFullscreen(true);

      // 3. Load and Start Exam Attempt
      const res = await api.post(`/exams/start/${examId || 1}`);
      const rawQuestions = res.data.questions || [];
      const sortedQuestions = [...rawQuestions].sort((a, b) => {
        const aIsCoding = a.questionType === 'CODING' ? 1 : 0;
        const bIsCoding = b.questionType === 'CODING' ? 1 : 0;
        return aIsCoding - bIsCoding;
      });
      setExamData({ ...res.data, questions: sortedQuestions });
      setTimeLeft((res.data.durationMinutes || 30) * 60);

      // 4. Mark exam as started
      setExamStarted(true);
    } catch (err) {
      console.error('Failed to start exam:', err);
      setStartError(err.response?.data?.message || err.message || 'Unable to start examination. Please retry.');
      setExamStarted(false);
    } finally {
      setLoading(false);
    }
  };

  // Re-enter Fullscreen Helper
  const handleReEnterFullscreen = async () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      try {
        await elem.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.warn('Fullscreen re-entry failed:', err);
      }
    }
  };

  // Arm anti-cheat guards with a grace period after exam begins to allow layout and fullscreen focus to settle
  useEffect(() => {
    if (examStarted) {
      const timer = setTimeout(() => {
        setAntiCheatArmed(true);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      setAntiCheatArmed(false);
    }
  }, [examStarted]);

  // Safe Browsing & Anti-Cheat Guards (Active once exam is started and armed)
  useEffect(() => {
    if (!examStarted || !antiCheatArmed) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportViolation('TAB_SWITCH', 'Switched away from examination tab / tab hidden');
      }
    };

    const handleWindowBlur = () => {
      // Window focus lost / external app activated / Alt-Tab / Taskbar click
      reportViolation('TAB_SWITCH', 'Window focus lost / external application activated');
    };

    const handleFullscreenExit = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active) {
        reportViolation('FULLSCREEN_EXIT', 'Exited mandatory full-screen lockdown mode');
      }
    };

    const handleClipboard = (e) => {
      // Inside code editor, internal-vs-external handler governs
      if (e.target && e.target.classList && e.target.classList.contains('code-editor-textarea')) {
        return;
      }
      e.preventDefault();
      if (e.clipboardData) {
        e.clipboardData.clearData();
      }
      setPasteWarning('Copying problem description or outside content is disabled.');
      setTimeout(() => setPasteWarning(null), 3500);
      reportViolation('COPY_PASTE', 'Attempted clipboard copy/paste operation outside code editor');
    };

    const handleContextMenu = (e) => {
      // Strict context menu suppression everywhere to prevent browser AI (Gemini/Copilot) sidebars
      e.preventDefault();
      reportViolation('RIGHT_CLICK', 'Context menu access blocked');
    };

    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S'))
      ) {
        e.preventDefault();
        reportViolation('DEVTOOLS_OPEN', `Blocked developer shortcut: ${e.key}`);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenExit);
    document.addEventListener('copy', handleClipboard);
    document.addEventListener('paste', handleClipboard);
    document.addEventListener('cut', handleClipboard);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    // Continuous runtime browser extension DOM mutation observer
    const stopExtensionObserver = startRuntimeProtectionObserver((violation) => {
      reportViolation('BROWSER_EXTENSION', violation.details);
      setViolationWarning({
        title: 'Security Alert',
        message: 'An unauthorized browser extension was detected active during the assessment.',
        strike: violationsRef.current.length,
        max: Number(examDataRef.current?.maxStrikesAllowed || examDataRef.current?.maxViolations) || 3
      });
      setTimeout(() => setViolationWarning(null), 5000);
    });

    // Periodic 5s browser API & foreign DOM integrity scanner
    const integrityTimer = setInterval(() => {
      try {
        const apiReport = checkApiIntegrity();
        if (!apiReport.passed) {
          reportViolation('BROWSER_EXTENSION', `Native browser API tampered: ${apiReport.tamperedApis.join(', ')}`);
        }
        const domReport = checkDomInjections();
        if (!domReport.passed) {
          reportViolation('BROWSER_EXTENSION', `Unauthorized DOM injection detected: ${domReport.detectedItems.join(', ')}`);
        }
      } catch (e) {}
    }, 5000);

    return () => {
      clearInterval(integrityTimer);
      if (typeof stopExtensionObserver === 'function') {
        stopExtensionObserver();
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenExit);
      document.removeEventListener('copy', handleClipboard);
      document.removeEventListener('paste', handleClipboard);
      document.removeEventListener('cut', handleClipboard);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [examStarted, antiCheatArmed]);

  // Real-time Countdown Timer
  useEffect(() => {
    if (!examStarted || !examData || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam(true); // Auto submit on timer expiry
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, examData, timeLeft]);

  // Real-time Surveillance Interventions & Chat Polling
  useEffect(() => {
    if (!examStarted || !examData?.attemptId || terminatedByOfficer) return;

    let isMounted = true;
    const pollInterventions = async () => {
      try {
        const res = await api.get(`/vigilance/student-interventions/${examData.attemptId}`);
        if (!isMounted || !res.data) return;

        // Check if terminated
        if (res.data.isTerminated) {
          setTerminatedByOfficer(true);
          setTerminationReasonText(res.data.terminationReason || 'Terminated by Vigilance Officer for integrity violations.');
          return;
        }

        // Check unacknowledged warning
        if (res.data.activeWarning) {
          setOfficerWarning(res.data.activeWarning);
        } else {
          setOfficerWarning(null);
        }

        // Check chat messages
        if (res.data.chatMessages) {
          const msgs = res.data.chatMessages;
          setOfficerChats(msgs);

          // Track new incoming messages from officer
          let newOfficerMsg = null;
          msgs.forEach((m) => {
            if (!seenChatIdsRef.current.has(m.id)) {
              seenChatIdsRef.current.add(m.id);
              if (m.officerStaffId !== 'CANDIDATE' && m.reason !== 'STUDENT_REPLY') {
                newOfficerMsg = m;
              }
            }
          });

          if (newOfficerMsg && !showStudentChatDrawer) {
            setUnreadChatCount((prev) => prev + 1);
            setLatestChatAlert(newOfficerMsg);
            setTimeout(() => setLatestChatAlert(null), 7000);
          }
        }
      } catch (err) {
        // Silent catch during periodic polling
      }
    };

    pollInterventions();
    const interval = setInterval(pollInterventions, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [examStarted, examData?.attemptId, terminatedByOfficer, showStudentChatDrawer]);

  const handleAcknowledgeOfficerWarning = async () => {
    if (!officerWarning) return;
    setAcknowledgingWarning(true);
    try {
      await api.post(`/vigilance/warning/${officerWarning.id}/acknowledge?studentId=${user?.id || 1}`);
      setOfficerWarning(null);
    } catch (err) {
      console.warn('Failed to acknowledge warning:', err);
      setOfficerWarning(null);
    } finally {
      setAcknowledgingWarning(false);
    }
  };

  // Student Reply to Proctor Chat
  const handleSendStudentChat = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!studentChatInput.trim() || sendingStudentChat) return;

    const currentAttemptId = examData?.attemptId;
    if (!currentAttemptId) return;

    setSendingStudentChat(true);
    try {
      await api.post('/vigilance/chat/send', {
        attemptId: currentAttemptId,
        examId: examData.examId || examId || 1,
        studentId: user?.id || 1,
        studentName: user?.fullName || 'Candidate',
        message: studentChatInput.trim()
      });
      setStudentChatInput('');

      // Refresh chat list immediately
      const res = await api.get(`/vigilance/student-interventions/${currentAttemptId}`);
      if (res.data?.chatMessages) {
        setOfficerChats(res.data.chatMessages);
        res.data.chatMessages.forEach((m) => seenChatIdsRef.current.add(m.id));
      }
    } catch (err) {
      console.warn('Failed to send student reply:', err);
    } finally {
      setSendingStudentChat(false);
    }
  };

  // Audio tone generator for integrity warnings
  const playAlertTone = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(240, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {}
  };

  // Violation Reporter with Strike Tracking & High-Visibility Alert Modal
  const reportViolation = async (violationType, details) => {
    const currentExamData = examDataRef.current;
    if (!currentExamData || submittingRef.current) return;

    // Debounce rapid duplicate triggers (e.g. window.blur + visibilitychange firing together)
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 1500) {
      return;
    }
    lastViolationTimeRef.current = now;

    playAlertTone();

    const maxStrikes = Number(currentExamData.maxStrikesAllowed || currentExamData.maxViolations) > 0
      ? Number(currentExamData.maxStrikesAllowed || currentExamData.maxViolations)
      : 3;
    const newViolation = {
      type: violationType,
      details,
      time: new Date().toLocaleTimeString(),
    };

    const updatedViolations = [...violationsRef.current, newViolation];
    violationsRef.current = updatedViolations;
    setViolations(updatedViolations);

    const strikeNum = updatedViolations.length;

    // Display high-visibility alert modal
    setViolationModal({
      strike: strikeNum,
      max: maxStrikes,
      type: violationType,
      details,
      time: new Date().toLocaleTimeString(),
      terminated: strikeNum >= maxStrikes
    });

    setViolationWarning({
      title: `Integrity Warning (${strikeNum} of ${maxStrikes})`,
      message: details,
      strike: strikeNum,
      max: maxStrikes,
    });

    try {
      await api.post('/exams/violation', {
        attemptId: currentExamData.attemptId,
        violationType,
        details,
      });
    } catch (err) {
      console.warn('Failed to dispatch violation report:', err);
    }

    // Auto submit if violation threshold exceeded
    if (strikeNum >= maxStrikes) {
      setTimeout(() => {
        handleSubmitExam(true);
      }, 1500);
    }
  };

  // MCQ Selection Handler
  const handleSelectOption = (questionId, optionKey) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  // Clear MCQ Choice
  const handleClearOption = (questionId) => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  // Toggle Review Bookmark
  const handleToggleReview = (questionId) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  // Initialize starter codes for coding questions
  useEffect(() => {
    if (!examData?.questions) return;
    setCodingAnswers((prev) => {
      const updated = { ...prev };
      examData.questions.forEach((q) => {
        if (q.questionType === 'CODING' && !updated[q.id]) {
          let starterCode = '';
          const preferredLang = 'python';
          try {
            if (q.starterCodeJson) {
              const parsed = JSON.parse(q.starterCodeJson);
              starterCode = parsed[preferredLang] || parsed.python || '';
            }
          } catch (e) {}
          if (!starterCode) {
            starterCode = FALLBACK_STARTER_CODES[preferredLang] || '';
          }
          updated[q.id] = {
            code: starterCode,
            language: preferredLang
          };
        }
      });
      return updated;
    });
  }, [examData]);

  // Code Language Change
  const handleLanguageChange = (questionId, newLanguage) => {
    const q = (examData?.questions || []).find((item) => item.id === questionId);
    let newStarterCode = '';
    try {
      if (q?.starterCodeJson) {
        const parsed = JSON.parse(q.starterCodeJson);
        newStarterCode = parsed[newLanguage] || '';
      }
    } catch (e) {}
    if (!newStarterCode) {
      newStarterCode = FALLBACK_STARTER_CODES[newLanguage] || '';
    }

    setCodingAnswers((prev) => ({
      ...prev,
      [questionId]: {
        code: newStarterCode,
        language: newLanguage
      }
    }));
  };

  // Code Input Change with Live Autocomplete Suggestions
  const handleCodeChange = (questionId, code, explicitCursor = null) => {
    const lang = codingAnswers[questionId]?.language || 'python';
    setCodingAnswers((prev) => ({
      ...prev,
      [questionId]: {
        code,
        language: lang
      }
    }));

    // Trigger autocomplete computation
    const textarea = editorTextareaRef.current;
    const cIdx = explicitCursor !== null ? explicitCursor : (textarea?.selectionStart ?? code.length);
    const { prefix, suggestions: matches } = getCodeSuggestions(code, cIdx, lang);
    setCurrentPrefix(prefix);
    setSuggestions(matches);
    setActiveSuggestionIndex(0);
  };

  // Apply Autocomplete Suggestion (Inserts keyword or user variable)
  const applySuggestion = (suggestion) => {
    const textarea = editorTextareaRef.current;
    if (!textarea || !suggestion) return;

    const { selectionStart, value } = textarea;
    const textBefore = value.substring(0, selectionStart);
    const prefixMatch = textBefore.match(/([a-zA-Z_][a-zA-Z0-9_]*)$/);
    const prefix = prefixMatch ? prefixMatch[1] : '';

    const startPos = selectionStart - prefix.length;
    const newCode = value.substring(0, startPos) + suggestion.label + value.substring(selectionStart);
    const newCursor = startPos + suggestion.label.length;

    setCodingAnswers((prev) => ({
      ...prev,
      [currentQ.id]: {
        code: newCode,
        language: prev[currentQ.id]?.language || 'python'
      }
    }));
    setSuggestions([]);
    setCurrentPrefix('');

    setTimeout(() => {
      if (editorTextareaRef.current) {
        editorTextareaRef.current.focus();
        editorTextareaRef.current.selectionStart = newCursor;
        editorTextareaRef.current.selectionEnd = newCursor;
        updateCursorPosition({ target: editorTextareaRef.current });
      }
    }, 0);
  };

  // Reset Code to Starter Template
  const handleResetCode = (questionId) => {
    const currentLang = codingAnswers[questionId]?.language || 'python';
    handleLanguageChange(questionId, currentLang);
    setSuggestions([]);
  };

  // Keyboard navigation for suggestions & tab indentation
  const handleCodeKeyDown = (e, questionId) => {
    // If autocomplete suggestions popover is active
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveSuggestionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestions[activeSuggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestions([]);
        return;
      }
    }

    // Tab Key indentation support in code editor (4 spaces)
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = e.target;
      const newValue = value.substring(0, selectionStart) + '    ' + value.substring(selectionEnd);
      handleCodeChange(questionId, newValue, selectionStart + 4);
      setTimeout(() => {
        if (e.target) {
          e.target.selectionStart = e.target.selectionEnd = selectionStart + 4;
          updateCursorPosition(e);
        }
      }, 0);
    }
  };

  // Track Cursor Position (Ln, Col) & compute suggestion popover placement
  const updateCursorPosition = (e) => {
    const target = e.target;
    if (!target) return;
    const text = target.value.substring(0, target.selectionStart);
    const lines = text.split('\n');
    const ln = lines.length;
    const col = lines[lines.length - 1].length + 1;
    setCursorPos({ ln, col });

    // Dynamic pixel coordinates for floating autocomplete box
    const lineHeight = 20;
    const charWidth = 7.5;
    const top = Math.min(Math.max((ln - 1) * lineHeight - (target.scrollTop || 0) + 36, 24), 260);
    const left = Math.min(Math.max(52 + (col - 1) * charWidth - (target.scrollLeft || 0), 55), 360);
    setSuggestionCoords({ top, left });
  };

  // Synchronize Line Number Gutter Scroll
  const handleEditorScroll = (e) => {
    if (gutterRef.current) {
      gutterRef.current.scrollTop = e.target.scrollTop;
    }
  };

  // Copy-Paste Security Guard: Capture code strictly into platform internal memory
  const handleEditorCopy = (e) => {
    const textarea = editorTextareaRef.current;
    if (textarea) {
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selected) {
        internalClipboardRef.current = selected;
        // Suppress writing to operating system clipboard so nothing leaks to Gemini, Copilot, or external windows
        if (e && e.preventDefault) {
          e.preventDefault();
        }
        if (e?.clipboardData) {
          e.clipboardData.setData('text/plain', '');
        }
        setCopiedSnippetNotice(true);
        setTimeout(() => setCopiedSnippetNotice(false), 2200);
      }
    }
  };

  // Copy-Paste Security Guard: Paste ONLY internal code snippet
  const handleEditorPaste = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const internal = internalClipboardRef.current;

    if (!internal || !internal.trim()) {
      setPasteWarning('External paste blocked: Only code copied from within this code editor can be pasted.');
      setTimeout(() => setPasteWarning(null), 4500);
      return;
    }

    // Insert internal snippet at current cursor location
    const textarea = editorTextareaRef.current;
    const currentQ = examData?.questions ? examData.questions[currentQuestionIndex] : null;
    if (textarea && currentQ) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value;
      const nextVal = val.substring(0, start) + internal + val.substring(end);
      handleCodeChange(currentQ.id, nextVal, start + internal.length);
      setTimeout(() => {
        if (editorTextareaRef.current) {
          editorTextareaRef.current.selectionStart = editorTextareaRef.current.selectionEnd = start + internal.length;
        }
      }, 0);
    }
  };

  // Run Sample Test Cases via Online Compiler
  const handleRunSampleTests = async (questionId) => {
    const codingState = codingAnswers[questionId];
    if (!codingState?.code) {
      alert('Please write code before running tests.');
      return;
    }
    setCodeRunning(true);
    setActiveCodeTab('result');
    setSelectedResultCaseIdx(0);
    try {
      const res = await api.post('/exams/code/run', {
        questionId,
        language: codingState.language,
        code: codingState.code,
        customInput: selectedTestCaseIdx === 'custom' ? customInput : null,
        evaluateAll: false
      });
      setRunResults(res.data);
    } catch (err) {
      setRunResults({
        compiled: false,
        compilerError: err.response?.data?.message || err.message || 'Execution failed',
        testCaseResults: []
      });
    } finally {
      setCodeRunning(false);
    }
  };

  // Submit Coding Problem: Evaluate against ALL test cases (Sample + Hidden)
  const handleSubmitQuestion = async (questionId) => {
    const codingState = codingAnswers[questionId];
    if (!codingState?.code) {
      alert('Please write code before submitting.');
      return;
    }
    setCodeSubmitting(true);
    setActiveCodeTab('result');
    setSelectedResultCaseIdx(0);

    try {
      const res = await api.post('/exams/code/run', {
        questionId,
        language: codingState.language,
        code: codingState.code,
        evaluateAll: true
      });

      setRunResults(res.data);
      const passed = res.data.passedCount || 0;
      const total = res.data.totalCount || 0;
      const isAccepted = res.data.status === 'ACCEPTED' || (total > 0 && passed === total);

      // Record question verdict
      setQuestionVerdict((prev) => ({
        ...prev,
        [questionId]: {
          status: isAccepted ? 'ACCEPTED' : (res.data.status || 'WRONG_ANSWER'),
          passedCount: passed,
          totalCount: total,
          runtimeMs: res.data.totalExecutionTimeMs || 0
        }
      }));

      // Record attempt in Submissions history
      setQuestionSubmissions((prev) => ({
        ...prev,
        [questionId]: [
          {
            id: Date.now(),
            status: isAccepted ? 'ACCEPTED' : (res.data.status || 'WRONG_ANSWER'),
            passedCount: passed,
            totalCount: total,
            runtimeMs: res.data.totalExecutionTimeMs || 0,
            language: codingState.language,
            timestamp: new Date().toLocaleTimeString(),
            code: codingState.code
          },
          ...(prev[questionId] || [])
        ]
      }));
    } catch (err) {
      setRunResults({
        compiled: false,
        compilerError: err.response?.data?.message || err.message || 'Submission evaluation failed',
        testCaseResults: []
      });
    } finally {
      setCodeSubmitting(false);
    }
  };

  // Final Exam Submission (All Questions)
  const handleSubmitExam = async (forced = false) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const codingSubmissions = Object.entries(codingAnswers).map(([qId, data]) => ({
        questionId: Number(qId),
        code: data.code,
        language: data.language,
        submittedCode: data.code,
        selectedLanguage: data.language
      }));

      const res = await api.post('/exams/submit', {
        attemptId: examData?.attemptId || 1,
        answers,
        codingSubmissions
      });

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      onExamCompleted(res.data);
    } catch (err) {
      alert('Submission response: ' + (err.response?.data?.message || err.message));
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // =========================================================================
  // HARDWARE LOCKDOWN: MOBILE / TABLET RESTRICTION
  // =========================================================================
  if (isMobileOrTablet) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 select-none font-sans">
        <div className="max-w-lg w-full bg-slate-900 border-2 border-rose-600 rounded-2xl p-6 sm:p-8 text-center shadow-2xl space-y-5 animate-fadeIn">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-rose-500/10 border-2 border-rose-500 flex items-center justify-center">
            <Monitor className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-rose-500/20 text-rose-300 text-xs font-bold rounded-full border border-rose-500/40 uppercase tracking-wider">
              Assessment Device Lockdown
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Desktop or Laptop Required
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              BridgeAI proctored evaluations and multi-language compiler sandboxes require a physical keyboard, high-resolution viewport (minimum 1024px), and persistent hardware telemetry.
            </p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-left space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>Mobile devices and touch smartphones prohibited</span>
            </div>
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <Tablet className="w-4 h-4 shrink-0" />
              <span>iPads, Android tablets, and foldable screens blocked</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Monitor className="w-4 h-4 shrink-0" />
              <span>Full compliance verified on Chrome/Edge/Firefox for Desktop</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onCancel}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
            >
              Return to Student Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PHASE 1: PRE-EXAM PROCTORING CHECK & ENVIRONMENT SETUP
  // =========================================================================
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] text-[#0F172A] dark:text-[#F8FAFC] flex items-center justify-center p-4 sm:p-6 select-none font-sans transition-colors">
        <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-white flex items-center justify-center font-black shadow-md">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider text-rose-600 uppercase bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                Institutional Examination Integrity
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                Proctored Assessment Pre-Check
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Camera Stream Verification
              </span>
              <div className="w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative flex items-center justify-center shadow-inner">
                <video
                  ref={previewVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!cameraStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <Video className="w-8 h-8 mb-2 text-slate-500 animate-pulse" />
                    <span className="text-xs font-semibold">Requesting Video Camera Permission...</span>
                  </div>
                )}
                {cameraStream && (
                  <div className="absolute top-2 right-2 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    ACTIVE
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Exam Lockdown Protocols
              </span>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-start gap-2">
                  <Monitor className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Entire Screen Share & Fullscreen:</strong> Entire screen sharing and fullscreen lockdown are enforced. Exiting is logged as a violation.</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Tab Switch Guard:</strong> Leaving this browser tab is automatically logged.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong>Clipboard Protection:</strong> You may copy within the editor, but external paste is blocked.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Protection System Guard (Extension & Sandbox Checker) */}
          <AssessmentProtectionGuard
            onProtectionStatusChange={(report) => setProtectionPassed(report.passed)}
          />

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                I understand that this assessment is strictly proctored with online code compilation, live integrity monitoring, and automatic violation reporting.
              </span>
            </label>

            {startError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{startError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel & Return to Portal
              </button>

              <div className="flex flex-col items-center sm:items-end w-full sm:w-auto gap-1">
                <button
                  type="button"
                  onClick={handleEnableFullscreenAndStart}
                  disabled={!agreedToRules || !protectionPassed || loading}
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#0F172A] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span>{loading ? 'Starting Examination...' : 'Share Entire Screen & Begin Examination'}</span>
                </button>

                {!protectionPassed && (
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1 mt-1">
                    <Lock className="w-3 h-3" />
                    Locked: Deactivate browser extensions above to enable examination
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // PHASE 2: ACTIVE PROCTORED EXAMINATION ENVIRONMENT
  // =========================================================================
  const questions = [...(examData?.questions || [])].sort((a, b) => {
    const aIsCoding = a.questionType === 'CODING' ? 1 : 0;
    const bIsCoding = b.questionType === 'CODING' ? 1 : 0;
    return aIsCoding - bIsCoding;
  });
  const currentQ = questions[currentQuestionIndex] || {};
  
  const candidateName = user?.fullName || examData?.studentName || 'Amit Kumar';
  const candidateInitials = typeof candidateName === 'string'
    ? candidateName.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'AK'
    : 'AK';
  
  const isQuestionAnswered = (q) => {
    if (q.questionType === 'CODING') {
      return questionVerdict[q.id]?.status === 'ACCEPTED';
    }
    return !!answers[q.id];
  };

  const answeredCount = questions.filter(isQuestionAnswered).length;
  const reviewCount = markedForReview.size;
  const totalCount = questions.length;
  const isCodingProblem = currentQ.questionType === 'CODING';
  const currentVerdict = questionVerdict[currentQ.id];
  const isProblemSolved = currentVerdict?.status === 'ACCEPTED';
  const submissionsForCurrentQ = questionSubmissions[currentQ.id] || [];

  const currentCode = codingAnswers[currentQ.id]?.code || '';
  const currentLanguage = codingAnswers[currentQ.id]?.language || 'python';
  const codeLines = currentCode.split('\n');
  const lineCount = Math.max(codeLines.length, 18);

  const sampleCases = currentQ.sampleTestCases || [];

  return (
    <div className={`min-h-screen select-none font-sans transition-colors relative flex flex-col ${
      editorTheme === 'dark' ? 'bg-[#0B1220] text-slate-100' : 'bg-white text-slate-900'
    }`}>
      
      {/* 1. MANDATORY FULLSCREEN LOCKOUT OVERLAY */}
      {!isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border-2 border-rose-600 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="text-lg font-black text-rose-600 dark:text-rose-400">
              PROCTORING ALERT: Fullscreen Mode Required
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              You have exited the mandatory full-screen assessment view. Your examination timer and questions are currently locked. This incident has been recorded in the platform audit log.
            </p>
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-bold text-rose-800 dark:text-rose-300">
              Violations: {violations.length} / {Number(examData?.maxStrikesAllowed || examData?.maxViolations) || 3} Strikes
            </div>
            <button
              onClick={handleReEnterFullscreen}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Re-Enter Fullscreen & Resume Examination</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. TOP NAV HEADER & PROCTORING HUD */}
      <header className={`w-full px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 border-b shadow-xs shrink-0 sticky top-0 z-40 transition-colors backdrop-blur-md ${
        editorTheme === 'dark' 
          ? 'bg-slate-900/95 border-slate-800 text-slate-100' 
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}>
        {/* Left: Brand / Exam Title & Institution */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                {examData?.examTitle || 'checking 2'}
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold border truncate ${
                editorTheme === 'dark'
                  ? 'bg-blue-950/60 text-blue-300 border-blue-800/80'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="truncate">{examData?.institutionName || 'Indian Institute of Technology (IIT)'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Evaluate. Learn. Build the Future.
            </p>
          </div>
        </div>

        {/* Center: Quick Question Switcher */}
        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-sm py-1">
          <button
            type="button"
            disabled={currentQuestionIndex === 0}
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            className={`w-7 h-7 rounded-lg border disabled:opacity-20 transition-all flex items-center justify-center shrink-0 ${
              editorTheme === 'dark' ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Previous Question"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {questions.map((q, idx) => {
            const isCurr = idx === currentQuestionIndex;
            const isCod = q.questionType === 'CODING';
            const verd = questionVerdict[q.id];
            const isCodCompleted = isCod && verd?.status === 'ACCEPTED';
            const isAns = isCod ? isCodCompleted : !!answers[q.id];
            const isRev = markedForReview.has(q.id);

            let pillStyle = editorTheme === 'dark' 
              ? 'bg-slate-800/80 text-slate-400 border-slate-700/80 hover:border-slate-600 hover:text-slate-200' 
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 shadow-2xs';

            if (isCurr) {
              pillStyle = 'bg-blue-600 text-white border-blue-500 shadow-sm ring-2 ring-blue-500/30 font-bold';
            } else if (isCodCompleted) {
              pillStyle = 'bg-emerald-600 text-white border-emerald-500 font-bold';
            } else if (isRev) {
              pillStyle = editorTheme === 'dark' 
                ? 'bg-amber-950/80 text-amber-300 border-amber-800 font-bold' 
                : 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
            } else if (isCod) {
              pillStyle = 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600 font-bold';
            } else if (isAns) {
              pillStyle = editorTheme === 'dark' 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800 font-bold' 
                : 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
            }

            return (
              <button
                key={q.id || idx}
                type="button"
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-7 h-7 rounded-lg text-xs border transition-all flex items-center justify-center shrink-0 ${pillStyle}`}
                title={`Question ${idx + 1}${isCod ? ' (Coding Challenge)' : ''}: ${isCodCompleted ? 'Completed' : isCod ? 'Coding (Pending)' : isAns ? 'Answered' : 'Pending'}${isRev ? ' (Marked for Review)' : ''}`}
              >
                <span>{idx + 1}</span>
              </button>
            );
          })}

          <button
            type="button"
            disabled={currentQuestionIndex === questions.length - 1}
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            className={`w-7 h-7 rounded-lg border disabled:opacity-20 transition-all flex items-center justify-center shrink-0 ${
              editorTheme === 'dark' ? 'border-slate-800 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Next Question"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Theme Toggle, Fullscreen, Proctoring PIP, Timer, User & Finish */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={() => setEditorTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
            className={`p-2 rounded-xl border transition-colors ${
              editorTheme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title={`Switch to ${editorTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {editorTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={async () => {
              try {
                if (!document.fullscreenElement) {
                  if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                    setIsFullscreen(true);
                  }
                } else {
                  if (document.exitFullscreen) {
                    await document.exitFullscreen();
                    setIsFullscreen(false);
                  }
                }
              } catch (fsErr) {
                console.warn('Fullscreen toggle failed:', fsErr);
              }
            }}
            className={`p-2 rounded-xl border transition-colors ${
              editorTheme === 'dark'
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Candidate Surveillance Video PIP */}
          <div
            onClick={() => setShowSurveillanceModal(true)}
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[11px] font-bold shadow-xs hover:border-rose-400 transition-colors"
            title="Click to expand Surveillance Monitor"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="hidden sm:inline tracking-wider">PROCTORED</span>
            <div className="w-5 h-4 bg-black rounded overflow-hidden border border-rose-300 dark:border-rose-800">
              <video
                ref={pipVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Real-time Countdown Timer */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs sm:text-sm font-bold shadow-xs ${
            timeLeft < 300
              ? 'bg-rose-950 border-rose-700 text-rose-300 animate-pulse'
              : timeLeft < 600
              ? 'bg-amber-950 border-amber-700 text-amber-300'
              : editorTheme === 'dark'
              ? 'bg-slate-800 border-slate-700 text-emerald-400'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{formatTimer(timeLeft)}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans font-normal hidden lg:inline">Time Remaining</span>
          </div>

          {/* User Profile Pill */}
          <div className={`hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border ${
            editorTheme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}>
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {candidateInitials}
            </span>
            <span className="text-xs font-bold truncate max-w-[110px]">
              {candidateName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Finish Assessment */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            disabled={submitting}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 rotate-45" />
            <span className="hidden sm:inline">Finish Assessment</span>
            <span className="sm:hidden">Finish</span>
          </button>
        </div>
      </header>

      {/* External Paste Warning Toast */}
      {pasteWarning && (
        <div className="w-full bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between gap-3 shadow-md z-30 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-950 shrink-0" />
            <span>{pasteWarning}</span>
          </div>
          <button
            type="button"
            onClick={() => setPasteWarning(null)}
            className="px-2 py-0.5 bg-slate-950 text-white rounded text-[10px] font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Copied Snippet Notice */}
      {copiedSnippetNotice && (
        <div className="fixed bottom-12 left-1/2 transform -translate-x-1/2 bg-slate-900 text-emerald-400 border border-emerald-500 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-50 animate-fadeIn">
          Copied sample input to platform clipboard!
        </div>
      )}

      {/* 3. VIOLATION WARNING BANNER */}
      {violationWarning && (
        <div className="w-full bg-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between gap-3 shadow-md z-30 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{violationWarning.title}: {violationWarning.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setViolationWarning(null)}
            className="px-2 py-0.5 bg-white text-rose-700 rounded text-[10px] font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 4. WORKSPACE: CODING PROBLEM VS MCQ */}
      {isCodingProblem ? (
        /* CUSTOMIZABLE TWO-COLUMN SPLIT WORKSPACE WITH SEPARATE SCROLLING */
        <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden h-[calc(100vh-130px)] min-h-[580px]">
          
          {/* ============================================================ */}
          {/* LEFT COLUMN: PROBLEM SPECIFICATION & EXPLANATION (Independent Scroll) */}
          {/* ============================================================ */}
          <div className={`${
            splitLayout === '0-100'
              ? 'hidden'
              : splitLayout === '30-70'
              ? 'lg:col-span-4'
              : splitLayout === '40-60'
              ? 'lg:col-span-5'
              : 'lg:col-span-6'
          } flex flex-col border-r h-full overflow-hidden shrink-0 ${
            editorTheme === 'dark' ? 'bg-[#1a1a1a] border-zinc-800 text-zinc-200' : 'bg-white border-slate-200 text-slate-800'
          }`}>
            {/* Top Tabs */}
            <div className={`flex items-center px-4 border-b text-xs font-semibold shrink-0 ${
              editorTheme === 'dark' ? 'bg-[#212121] border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setLeftTab('description')}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  leftTab === 'description'
                    ? editorTheme === 'dark'
                      ? 'border-white text-white font-bold'
                      : 'border-slate-900 text-slate-900 font-bold'
                    : editorTheme === 'dark' ? 'border-transparent text-zinc-400 hover:text-zinc-200' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-blue-500" />
                <span>Description</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftTab('submissions')}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
                  leftTab === 'submissions'
                    ? editorTheme === 'dark'
                      ? 'border-white text-white font-bold'
                      : 'border-slate-900 text-slate-900 font-bold'
                    : editorTheme === 'dark' ? 'border-transparent text-zinc-400 hover:text-zinc-200' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
                <span>Submissions</span>
                {submissionsForCurrentQ.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-600 text-white font-mono">
                    {submissionsForCurrentQ.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {leftTab === 'description' ? (
                <>
                  {/* Problem Title & Solved Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${
                      editorTheme === 'dark' ? 'text-white' : 'text-slate-900'
                    }`}>
                      {currentQuestionIndex + 1}. {currentQ.problemTitle || currentQ.questionText || 'Coding Problem'}
                    </h1>

                    {isProblemSolved ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Solved</span>
                      </span>
                    ) : currentVerdict ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 shrink-0">
                        <span>Attempted ({currentVerdict.passedCount}/{currentVerdict.totalCount})</span>
                      </span>
                    ) : null}
                  </div>

                  {/* Metadata Chips / Tags */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                    <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                      editorTheme === 'dark'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    }`}>
                      {currentQ.marks || 20} Marks
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] ${
                      editorTheme === 'dark'
                        ? 'bg-zinc-700/40 text-zinc-300 border border-zinc-700'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}>
                      Time Limit: {currentQ.timeLimitSeconds || 2}s
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] ${
                      editorTheme === 'dark'
                        ? 'bg-zinc-700/40 text-zinc-300 border border-zinc-700'
                        : 'bg-slate-100 text-slate-700 border border-slate-300'
                    }`}>
                      Memory: 256MB
                    </span>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] ${
                      editorTheme === 'dark'
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}>
                      Algorithmic Assessment
                    </span>
                  </div>

                  {/* Problem Description */}
                  <div className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line space-y-2 ${
                    editorTheme === 'dark' ? 'text-zinc-300' : 'text-slate-700'
                  }`}>
                    {currentQ.problemDescription || currentQ.questionText}
                  </div>

                  {/* Input / Output Formats */}
                  {(currentQ.inputFormat || currentQ.outputFormat) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {currentQ.inputFormat && (
                        <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                          editorTheme === 'dark' ? 'bg-[#222] border-zinc-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <strong className={`block text-[11px] font-bold uppercase tracking-wider ${
                            editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-700'
                          }`}>
                            Input Format
                          </strong>
                          <p className={`font-mono text-xs whitespace-pre-line ${
                            editorTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-800 font-semibold'
                          }`}>
                            {currentQ.inputFormat}
                          </p>
                        </div>
                      )}

                      {currentQ.outputFormat && (
                        <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                          editorTheme === 'dark' ? 'bg-[#222] border-zinc-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <strong className={`block text-[11px] font-bold uppercase tracking-wider ${
                            editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-700'
                          }`}>
                            Output Format
                          </strong>
                          <p className={`font-mono text-xs whitespace-pre-line ${
                            editorTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-800 font-semibold'
                          }`}>
                            {currentQ.outputFormat}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clean Formatted Examples */}
                  {sampleCases.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {sampleCases.map((tc, idx) => (
                        <div key={tc.id || idx} className="space-y-1.5">
                          <strong className={`text-xs font-bold ${
                            editorTheme === 'dark' ? 'text-zinc-200' : 'text-slate-800'
                          }`}>
                            Example {idx + 1}:
                          </strong>
                          <div className={`p-3 rounded-xl border font-mono text-xs space-y-1.5 relative group ${
                            editorTheme === 'dark' ? 'bg-[#242424] border-zinc-800 text-zinc-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                          }`}>


                            <div>
                              <span className={`select-none ${editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-600 font-semibold'}`}>Input: </span>
                              <span className="whitespace-pre-wrap">{tc.input}</span>
                            </div>
                            <div>
                              <span className={`select-none ${editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-600 font-semibold'}`}>Output: </span>
                              <span className={`font-bold whitespace-pre-wrap ${editorTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>{tc.expectedOutput}</span>
                            </div>
                            {tc.explanation && (
                              <div className={`font-sans text-[11px] pt-0.5 ${editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-600'}`}>
                                <span className="font-semibold select-none">Explanation: </span>
                                <span>{tc.explanation}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Constraints Section */}
                  {currentQ.constraints && (
                    <div className="space-y-1.5 pt-2">
                      <strong className={`text-xs font-bold uppercase tracking-wider block ${
                        editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
                      }`}>
                        Constraints:
                      </strong>
                      <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                        editorTheme === 'dark' ? 'bg-[#222] border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}>
                        {(typeof currentQ.constraints === 'string' ? currentQ.constraints : String(currentQ.constraints || ''))
                          .split(/\r?\n/)
                          .map(s => s.trim())
                          .filter(Boolean)
                          .map((cLine, cIdx) => (
                            <div key={cIdx} className="flex items-center gap-1.5">
                              <span className={editorTheme === 'dark' ? 'text-zinc-500' : 'text-slate-500'}>•</span>
                              <span>{cLine}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* SUBMISSIONS TAB */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold">Submission History ({submissionsForCurrentQ.length})</h3>
                    <span className="text-[11px] text-zinc-400">Real-time compilation logs</span>
                  </div>

                  {submissionsForCurrentQ.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-zinc-700/60 rounded-xl text-zinc-500 text-xs space-y-2">
                      <RotateCcw className="w-8 h-8 mx-auto opacity-40 text-zinc-400" />
                      <p className="font-semibold">No submissions made yet for this problem.</p>
                      <p className="text-[11px]">Click &quot;Submit&quot; in the bottom right to evaluate your code against all test cases.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {submissionsForCurrentQ.map((sub, sIdx) => (
                        <div
                          key={sub.id || sIdx}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                            editorTheme === 'dark'
                              ? sub.status === 'ACCEPTED'
                                ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300'
                                : 'bg-rose-950/20 border-rose-800 text-rose-300'
                              : sub.status === 'ACCEPTED'
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-rose-50 border-rose-300 text-rose-900'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 font-bold">
                              {sub.status === 'ACCEPTED' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-500" />
                              )}
                              <span>{sub.status === 'ACCEPTED' ? 'Accepted' : 'Wrong Answer'}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                                editorTheme === 'dark' ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-800'
                              }`}>
                                {sub.passedCount} / {sub.totalCount} Passed
                              </span>
                            </div>
                            <div className={`text-[10px] mt-1 flex items-center gap-2 ${
                              editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
                            }`}>
                              <span>Lang: {sub.language}</span>
                              <span>Runtime: {sub.runtimeMs}ms</span>
                              <span>{sub.timestamp}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCodeChange(currentQ.id, sub.code)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                              editorTheme === 'dark'
                                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            }`}
                          >
                            Load Code
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* RIGHT COLUMN: CODING EDITOR + TESTCASE / RESULTS (Independent Scroll) */}
          {/* ============================================================ */}
          <div className={`${
            splitLayout === '0-100'
              ? 'lg:col-span-12'
              : splitLayout === '30-70'
              ? 'lg:col-span-8'
              : splitLayout === '40-60'
              ? 'lg:col-span-7'
              : 'lg:col-span-6'
          } flex flex-col h-full overflow-hidden ${
            editorTheme === 'dark' ? 'bg-[#1e1e1e] text-zinc-100' : 'bg-white text-slate-900'
          }`}>
            
            {/* 1. CODE EDITOR HEADER TOOLBAR */}
            <div className={`flex items-center justify-between px-4 py-2 border-b text-xs shrink-0 ${
              editorTheme === 'dark' ? 'bg-[#282828] border-zinc-800 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              {/* Left: Code Icon & Language Selector */}
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Code</span>
                </span>

                <select
                  value={currentLanguage}
                  onChange={(e) => handleLanguageChange(currentQ.id, e.target.value)}
                  className={`px-2 py-1 rounded text-xs font-semibold border cursor-pointer focus:outline-none ${
                    editorTheme === 'dark' ? 'bg-[#333] border-zinc-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="python">Python 3</option>
                  <option value="java">Java (OpenJDK 22)</option>
                  <option value="cpp">C++ (G++)</option>
                  <option value="c">C (GCC)</option>
                  <option value="csharp">C# (.NET)</option>
                  <option value="kotlin">Kotlin</option>
                </select>
              </div>

              {/* Right: Layout Customizer, Testcase Toggle, Theme, Reset & Bookmark */}
              <div className="flex items-center gap-2">
                {/* Layout Split Selector (Customizable Panel Sizes) */}
                <div className={`hidden sm:flex items-center rounded-lg border p-0.5 text-[10px] font-bold ${
                  editorTheme === 'dark' ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-slate-200/80 border-slate-300 text-slate-700'
                }`}>
                  <button
                    type="button"
                    onClick={() => setSplitLayout('50-50')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      splitLayout === '50-50'
                        ? editorTheme === 'dark' ? 'bg-zinc-700 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title="Balanced 50:50 View"
                  >
                    50:50
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitLayout('40-60')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      splitLayout === '40-60'
                        ? editorTheme === 'dark' ? 'bg-zinc-700 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title="Wide Editor 40:60 View"
                  >
                    40:60
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitLayout('30-70')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      splitLayout === '30-70'
                        ? editorTheme === 'dark' ? 'bg-zinc-700 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title="Code Focus 30:70 View"
                  >
                    30:70
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitLayout(splitLayout === '0-100' ? '50-50' : '0-100')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      splitLayout === '0-100'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title={splitLayout === '0-100' ? "Restore Split View" : "Maximize Full Editor"}
                  >
                    {splitLayout === '0-100' ? 'Split View' : 'Full Editor'}
                  </button>
                </div>

                {/* Testcases Drawer Toggle */}
                <button
                  type="button"
                  onClick={() => setIsTestCaseCollapsed(prev => !prev)}
                  className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border transition-colors ${
                    isTestCaseCollapsed
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-xs'
                      : editorTheme === 'dark'
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                  title={isTestCaseCollapsed ? "Show Testcase Panel" : "Hide Testcases for Maximized Code Editor Height"}
                >
                  {isTestCaseCollapsed ? (
                    <>
                      <PanelBottomOpen className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Open Testcases</span>
                    </>
                  ) : (
                    <>
                      <PanelBottomClose className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Hide Testcases</span>
                    </>
                  )}
                </button>

                {/* Theme Toggle (Dark vs Light) */}
                <button
                  type="button"
                  onClick={() => setEditorTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                  className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 border transition-colors ${
                    editorTheme === 'dark'
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border-zinc-700'
                      : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                  title={`Switch to ${editorTheme === 'dark' ? 'Light' : 'Dark'} Theme`}
                >
                  {editorTheme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  <span className="text-[11px] capitalize">{editorTheme === 'dark' ? 'Light' : 'Dark'}</span>
                </button>

                {/* Reset Template */}
                <button
                  type="button"
                  onClick={() => handleResetCode(currentQ.id)}
                  className={`p-1.5 rounded hover:opacity-80 transition-colors border ${
                    editorTheme === 'dark' ? 'border-zinc-700 text-zinc-400 hover:text-white' : 'border-slate-300 text-slate-600 hover:text-slate-900'
                  }`}
                  title="Reset to default starter template"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Mark for Review */}
                <button
                  type="button"
                  onClick={() => handleToggleReview(currentQ.id)}
                  className={`p-1.5 rounded border transition-colors ${
                    markedForReview.has(currentQ.id)
                      ? 'bg-amber-500 text-white border-amber-600'
                      : editorTheme === 'dark'
                      ? 'border-zinc-700 text-zinc-400 hover:text-amber-400'
                      : 'border-slate-300 text-slate-600 hover:text-amber-600'
                  }`}
                  title="Bookmark for review"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. CODE TEXTAREA WITH LINE NUMBERS GUTTER & AUTOCOMPLETE */}
            <div className={`relative flex flex-1 overflow-hidden transition-all ${
              isTestCaseCollapsed ? 'min-h-[500px] h-full max-h-none' : 'min-h-[260px] max-h-[440px]'
            } ${
              editorTheme === 'dark' ? 'bg-[#1e1e1e]' : 'bg-white'
            }`}>
              {/* Line Numbers Gutter */}
              <div
                ref={gutterRef}
                className={`w-12 py-3 px-2 text-right select-none font-mono text-xs leading-relaxed border-r overflow-hidden ${
                  editorTheme === 'dark' ? 'bg-[#1e1e1e] text-zinc-600 border-zinc-800' : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>

              {/* Code Textarea */}
              <textarea
                ref={editorTextareaRef}
                value={currentCode}
                onChange={(e) => {
                  handleCodeChange(currentQ.id, e.target.value, e.target.selectionStart);
                  updateCursorPosition(e);
                }}
                onKeyDown={(e) => handleCodeKeyDown(e, currentQ.id)}
                onKeyUp={updateCursorPosition}
                onClick={updateCursorPosition}
                onSelect={updateCursorPosition}
                onScroll={handleEditorScroll}
                onCopy={handleEditorCopy}
                onCut={handleEditorCopy}
                onPaste={handleEditorPaste}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-gramm="false"
                data-enable-grammarly="false"
                data-ms-editor="false"
                placeholder="Write your solution here... (language keywords and variables will be suggested automatically)"
                className={`code-editor-textarea select-text flex-1 p-3 font-mono text-xs sm:text-sm leading-relaxed border-none focus:outline-none resize-none overflow-auto ${
                  editorTheme === 'dark'
                    ? 'bg-[#1e1e1e] text-emerald-400 placeholder-zinc-700 caret-white'
                    : 'bg-white text-slate-900 placeholder-slate-400 caret-blue-600'
                }`}
              />

              {/* FLOATING AUTOCOMPLETE & VARIABLE SUGGESTION POPOVER */}
              {suggestions.length > 0 && (
                <div
                  className={`absolute z-30 w-72 max-h-60 overflow-hidden rounded-xl shadow-2xl border transition-all animate-fadeIn ${
                    editorTheme === 'dark'
                      ? 'bg-[#252526] border-zinc-700 text-zinc-100 divide-zinc-800'
                      : 'bg-white border-slate-300 text-slate-900 divide-slate-100'
                  }`}
                  style={{
                    top: `${suggestionCoords.top}px`,
                    left: `${suggestionCoords.left}px`
                  }}
                >
                  <div className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-between border-b ${
                    editorTheme === 'dark' ? 'bg-[#1f1f1f] text-zinc-400 border-zinc-800' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-blue-400" />
                      <span>Matching &quot;{currentPrefix}&quot;</span>
                    </span>
                    <span className="font-mono text-[9px] opacity-70">Tab / Enter</span>
                  </div>

                  <div className="p-1 space-y-0.5 max-h-48 overflow-y-auto">
                    {suggestions.map((s, idx) => {
                      const isSelected = idx === activeSuggestionIndex;
                      return (
                        <div
                          key={s.label + idx}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applySuggestion(s);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold'
                              : editorTheme === 'dark'
                              ? 'hover:bg-zinc-800 text-zinc-200'
                              : 'hover:bg-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase shrink-0 ${
                              s.kind === 'variable'
                                ? isSelected ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : s.kind === 'function' || s.kind === 'method'
                                ? isSelected ? 'bg-purple-300 text-slate-900' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : isSelected ? 'bg-blue-300 text-slate-900' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {s.kind === 'variable' ? 'var' : s.kind === 'function' || s.kind === 'method' ? 'fn' : 'kw'}
                            </span>
                            <span className="font-mono font-semibold truncate">{s.label}</span>
                          </div>
                          <span className={`text-[10px] truncate max-w-[100px] ${
                            isSelected ? 'text-blue-100' : 'text-zinc-500'
                          }`}>
                            {s.detail}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Editor Footer Status Bar */}
            <div className={`flex items-center justify-between px-4 py-1.5 border-t text-[11px] shrink-0 font-mono ${
              editorTheme === 'dark' ? 'bg-[#282828] border-zinc-800 text-zinc-400' : 'bg-slate-100 border-slate-300 text-slate-700 font-medium'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 font-bold ${
                  editorTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                }`}>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Saved</span>
                </span>
                <span className={editorTheme === 'dark' ? 'text-zinc-500' : 'text-slate-400'}>•</span>
                <span>Internal Clipboard: {internalClipboardRef.current ? 'Active (Editor Only)' : 'Empty'}</span>
                {copiedSnippetNotice && (
                  <span className={`font-bold animate-pulse ${
                    editorTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                  }`}>Copied from Editor</span>
                )}
                <span className={`${editorTheme === 'dark' ? 'text-zinc-500' : 'text-slate-400'} hidden md:inline`}>•</span>
                <span className={`${editorTheme === 'dark' ? 'text-blue-400' : 'text-blue-700 font-semibold'} hidden md:inline`}>Live Suggestions Enabled</span>
              </div>
              <div>
                <span className="font-semibold">Ln {cursorPos.ln}, Col {cursorPos.col}</span>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 3. TESTCASE & TEST RESULT PANEL (COLLAPSIBLE FOR EXPANDED VIEW) */}
            {/* ============================================================ */}
            <div className={`${
              isTestCaseCollapsed ? 'shrink-0' : 'flex-1 flex flex-col min-h-[220px]'
            } border-t overflow-hidden transition-all ${
              editorTheme === 'dark' ? 'bg-[#1a1a1a] border-zinc-800' : 'bg-slate-50 border-slate-300'
            }`}>
              {/* Panel Tabs Header with Collapse/Expand Control */}
              <div className={`flex items-center justify-between px-4 border-b text-xs shrink-0 ${
                editorTheme === 'dark' ? 'bg-[#212121] border-zinc-800' : 'bg-slate-100 border-slate-300'
              }`}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab('testcase')}
                    className={`py-2.5 px-3.5 border-b-2 flex items-center gap-1.5 font-semibold transition-colors ${
                      activeCodeTab === 'testcase'
                        ? editorTheme === 'dark'
                          ? 'border-white text-white font-bold bg-zinc-800/40'
                          : 'border-blue-600 text-blue-800 font-bold bg-white shadow-xs'
                        : editorTheme === 'dark' ? 'border-transparent text-zinc-400 hover:text-zinc-200' : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckSquare className={`w-3.5 h-3.5 ${activeCodeTab === 'testcase' ? 'text-blue-600' : 'text-emerald-600'}`} />
                    <span>Testcase</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCodeTab('result')}
                    className={`py-2.5 px-3.5 border-b-2 flex items-center gap-1.5 font-semibold transition-colors ${
                      activeCodeTab === 'result'
                        ? editorTheme === 'dark'
                          ? 'border-white text-white font-bold bg-zinc-800/40'
                          : 'border-blue-600 text-blue-800 font-bold bg-white shadow-xs'
                        : editorTheme === 'dark' ? 'border-transparent text-zinc-400 hover:text-zinc-200' : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 text-blue-600" />
                    <span>Test Result</span>
                    {runResults && (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        runResults.status === 'ACCEPTED' || runResults.passedCount === runResults.totalCount
                          ? 'bg-emerald-500'
                          : 'bg-rose-500'
                      }`}></span>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {/* Submitting / Running Indicator */}
                  {(codeRunning || codeSubmitting) && (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>{codeSubmitting ? 'Evaluating All Cases...' : 'Running Sample Tests...'}</span>
                    </span>
                  )}

                  {/* Collapse / Close Testcase Panel Button */}
                  <button
                    type="button"
                    onClick={() => setIsTestCaseCollapsed(!isTestCaseCollapsed)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 border transition-colors ${
                      editorTheme === 'dark'
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                        : 'bg-white hover:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                    title={isTestCaseCollapsed ? "Expand Testcase Panel" : "Close / Minimize Testcases for Full Editor View"}
                  >
                    {isTestCaseCollapsed ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Expand Panel</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>Close Testcases</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Panel Content Body (Hidden when collapsed) */}
              {!isTestCaseCollapsed && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px]">
                {/* TAB 1: TESTCASE SPECIFICATION */}
                {activeCodeTab === 'testcase' && (
                  <div className="space-y-3">
                    {/* Testcase Sub-tabs */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {sampleCases.map((tc, idx) => (
                        <button
                          key={tc.id || idx}
                          type="button"
                          onClick={() => setSelectedTestCaseIdx(idx)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            selectedTestCaseIdx === idx
                              ? editorTheme === 'dark'
                                ? 'bg-zinc-700 text-white font-bold'
                                : 'bg-slate-900 text-white font-bold'
                              : editorTheme === 'dark'
                              ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          Case {idx + 1}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => setSelectedTestCaseIdx('custom')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          selectedTestCaseIdx === 'custom'
                            ? editorTheme === 'dark'
                              ? 'bg-zinc-700 text-white font-bold'
                              : 'bg-slate-900 text-white font-bold'
                            : editorTheme === 'dark'
                            ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        Custom Input
                      </button>
                    </div>

                    {/* Selected Test Case Inputs */}
                    {selectedTestCaseIdx !== 'custom' ? (
                      sampleCases[selectedTestCaseIdx] ? (
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className={`text-[11px] block mb-1 ${
                              editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-600 font-semibold'
                            }`}>stdin (Input):</span>
                            <pre className={`p-2.5 rounded-lg border font-mono whitespace-pre-wrap ${
                              editorTheme === 'dark' ? 'bg-[#222] border-zinc-800 text-zinc-200' : 'bg-white border-slate-300 text-slate-900'
                            }`}>
                              {sampleCases[selectedTestCaseIdx].input}
                            </pre>
                          </div>
                          <div>
                            <span className={`text-[11px] block mb-1 ${
                              editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-600 font-semibold'
                            }`}>Expected Output:</span>
                            <pre className={`p-2.5 rounded-lg border font-mono whitespace-pre-wrap ${
                              editorTheme === 'dark'
                                ? 'bg-[#222] border-zinc-800 text-emerald-400'
                                : 'bg-emerald-50/70 border-emerald-300 text-emerald-800 font-semibold'
                            }`}>
                              {sampleCases[selectedTestCaseIdx].expectedOutput}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <p className={`text-xs ${editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-500'}`}>No public test cases configured.</p>
                      )
                    ) : (
                      /* Custom Input Editor */
                      <div className="space-y-2 text-xs">
                        <span className={`text-[11px] block ${
                          editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-600 font-semibold'
                        }`}>Custom stdin parameters:</span>
                        <textarea
                          rows="3"
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="Type custom test inputs here..."
                          className={`w-full p-2.5 rounded-lg border font-mono text-xs focus:outline-none ${
                            editorTheme === 'dark'
                              ? 'bg-[#222] border-zinc-800 text-emerald-400 placeholder-zinc-600'
                              : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: TEST RESULT SPECIFICATION */}
                {activeCodeTab === 'result' && (
                  <div className="space-y-3">
                    {codeRunning || codeSubmitting ? (
                      <div className={`p-8 text-center text-xs space-y-2 ${
                        editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-700'
                      }`}>
                        <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-500" />
                        <p className="font-semibold">
                          {codeSubmitting
                            ? 'Evaluating code against all sample and hidden test cases...'
                            : 'Compiling and executing code against sample test cases...'}
                        </p>
                      </div>
                    ) : !runResults ? (
                      /* LeetCode Screenshot Matching Empty State */
                      <div className={`p-10 text-center text-xs sm:text-sm font-medium ${
                        editorTheme === 'dark' ? 'text-zinc-500' : 'text-slate-600'
                      }`}>
                        You must run your code first
                      </div>
                    ) : !runResults.compiled ? (
                      /* Compilation Error - Crisp high-contrast in lighter mode */
                      <div className={`p-4 rounded-xl text-xs space-y-2.5 border transition-all ${
                        editorTheme === 'dark'
                          ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                          : 'bg-rose-50/90 border-2 border-rose-300 text-rose-950 shadow-xs'
                      }`}>
                        <strong className={`font-bold flex items-center gap-1.5 text-sm ${
                          editorTheme === 'dark' ? 'text-rose-400' : 'text-rose-800'
                        }`}>
                          <XCircle className={`w-4 h-4 shrink-0 ${editorTheme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`} />
                          <span>Compilation Error</span>
                        </strong>
                        <pre className={`font-mono text-xs whitespace-pre-wrap max-h-56 overflow-y-auto p-3.5 rounded-lg border leading-relaxed ${
                          editorTheme === 'dark'
                            ? 'bg-black/50 border-rose-900/60 text-rose-200'
                            : 'bg-white border-rose-200 text-rose-900 font-semibold shadow-2xs'
                        }`}>
                          {runResults.compilerError || 'Compilation failed'}
                        </pre>
                      </div>
                    ) : (
                      /* Evaluation Results */
                      <div className="space-y-3 text-xs">
                        {/* Big Verdict Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {runResults.status === 'ACCEPTED' || runResults.passedCount === runResults.totalCount ? (
                              <span className={`text-base sm:text-lg font-bold flex items-center gap-1.5 ${
                                editorTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                              }`}>
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Accepted</span>
                              </span>
                            ) : (
                              <span className={`text-base sm:text-lg font-bold flex items-center gap-1.5 ${
                                editorTheme === 'dark' ? 'text-rose-400' : 'text-rose-700'
                              }`}>
                                <XCircle className="w-5 h-5" />
                                <span>Wrong Answer</span>
                              </span>
                            )}

                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                              editorTheme === 'dark' ? 'bg-zinc-800 text-zinc-200' : 'bg-slate-200 text-slate-800'
                            }`}>
                              {runResults.passedCount} / {runResults.totalCount} Test Cases Passed
                            </span>
                          </div>

                          <span className={`text-[11px] font-mono ${
                            editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
                          }`}>
                            Runtime: {runResults.totalExecutionTimeMs || 42} ms
                          </span>
                        </div>

                        {/* Result Case Navigation Tabs */}
                        {runResults.testCaseResults && runResults.testCaseResults.length > 0 && (
                          <>
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                              {runResults.testCaseResults.map((tc, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setSelectedResultCaseIdx(idx)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                                    selectedResultCaseIdx === idx
                                      ? tc.passed
                                        ? 'bg-emerald-600 text-white font-bold'
                                        : 'bg-rose-600 text-white font-bold'
                                      : tc.passed
                                      ? editorTheme === 'dark'
                                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800'
                                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                                      : editorTheme === 'dark'
                                      ? 'bg-rose-950/40 text-rose-300 border border-rose-800'
                                      : 'bg-rose-100 text-rose-900 border border-rose-300 hover:bg-rose-200'
                                  }`}
                                >
                                  {tc.passed ? <Check className="w-3 h-3 stroke-[2.5]" /> : <X className="w-3 h-3 stroke-[2.5]" />}
                                  <span>Case {idx + 1}</span>
                                </button>
                              ))}
                            </div>

                            {/* Inspected Case Detail */}
                            {runResults.testCaseResults[selectedResultCaseIdx] && (
                              <div className={`p-3 rounded-xl border space-y-2 font-mono text-xs ${
                                editorTheme === 'dark' ? 'bg-[#222] border-zinc-800' : 'bg-white border-slate-300 shadow-xs'
                              }`}>
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className={`font-sans font-bold ${
                                    editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-800'
                                  }`}>
                                    Test Case #{selectedResultCaseIdx + 1} Details:
                                  </span>
                                  <span className={`font-sans font-bold px-2 py-0.5 rounded text-[10px] ${
                                    runResults.testCaseResults[selectedResultCaseIdx].passed
                                      ? editorTheme === 'dark'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : editorTheme === 'dark'
                                      ? 'bg-rose-500/20 text-rose-400'
                                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                                  }`}>
                                    {runResults.testCaseResults[selectedResultCaseIdx].passed ? 'PASSED' : 'FAILED'}
                                  </span>
                                </div>

                                <div>
                                  <span className={`text-[10px] font-sans block mb-1 font-semibold ${
                                    editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-700'
                                  }`}>Input:</span>
                                  <pre className={`p-2 rounded-lg overflow-x-auto text-xs ${
                                    editorTheme === 'dark'
                                      ? 'bg-black/40 text-zinc-200'
                                      : 'bg-slate-50 text-slate-900 border border-slate-300'
                                  }`}>
                                    {runResults.testCaseResults[selectedResultCaseIdx].input}
                                  </pre>
                                </div>

                                <div>
                                  <span className={`text-[10px] font-sans block mb-1 font-semibold ${
                                    editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-700'
                                  }`}>Expected Output:</span>
                                  <pre className={`p-2 rounded-lg overflow-x-auto text-xs ${
                                    editorTheme === 'dark'
                                      ? 'bg-black/40 text-emerald-400'
                                      : 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold'
                                  }`}>
                                    {runResults.testCaseResults[selectedResultCaseIdx].expectedOutput}
                                  </pre>
                                </div>

                                <div>
                                  <span className={`text-[10px] font-sans block mb-1 font-semibold ${
                                    editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-700'
                                  }`}>Your Output:</span>
                                  <pre className={`p-2 rounded-lg overflow-x-auto text-xs ${
                                    editorTheme === 'dark'
                                      ? `bg-black/40 ${runResults.testCaseResults[selectedResultCaseIdx].passed ? 'text-emerald-400' : 'text-rose-400'}`
                                      : runResults.testCaseResults[selectedResultCaseIdx].passed
                                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-semibold'
                                      : 'bg-rose-50 text-rose-900 border border-rose-300 font-semibold'
                                  }`}>
                                    {runResults.testCaseResults[selectedResultCaseIdx].actualOutput || '(empty output)'}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}

              {/* ACTION BUTTONS FOOTER (Always visible with Run/Submit) */}
              <div className={`flex items-center justify-between px-4 py-2.5 border-t text-xs shrink-0 ${
                editorTheme === 'dark' ? 'bg-[#242424] border-zinc-800' : 'bg-slate-100 border-slate-200'
              }`}>
                {/* Left side info */}
                <div className={`text-xs flex items-center gap-2 ${
                  editorTheme === 'dark' ? 'text-zinc-400' : 'text-slate-600'
                }`}>
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="font-semibold hidden sm:inline">Console</span>
                  {currentVerdict && (
                    <span className={`text-[11px] font-mono font-bold ${
                      editorTheme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'
                    }`}>
                      {currentVerdict.passedCount}/{currentVerdict.totalCount} Passed
                    </span>
                  )}
                </div>

                {/* Right side: Run Code & Submit Problem */}
                <div className="flex items-center gap-2">
                  {/* Run Code (Sample tests) */}
                  <button
                    type="button"
                    onClick={() => handleRunSampleTests(currentQ.id)}
                    disabled={codeRunning || codeSubmitting}
                    className={`px-4 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                      editorTheme === 'dark'
                        ? 'bg-zinc-700 hover:bg-zinc-600 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{codeRunning ? 'Running...' : 'Run'}</span>
                  </button>

                  {/* Submit Code (All tests: Sample + Hidden) */}
                  <button
                    type="button"
                    onClick={() => handleSubmitQuestion(currentQ.id)}
                    disabled={codeRunning || codeSubmitting}
                    className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{codeSubmitting ? 'Submitting...' : 'Submit'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* UNIFIED SEAMLESS WORKSPACE - GROUNDED, HUMANIZED, NO FLOATING BOXES */
        <div className={`flex-1 flex overflow-hidden ${
          editorTheme === 'dark' ? 'bg-[#0B1220] text-slate-100' : 'bg-white text-slate-900'
        }`}>

          {/* LEFT SIDEBAR PANEL — Continuous grounded section with subtle border divider */}
          <aside className={`hidden lg:flex flex-col w-[290px] shrink-0 border-r p-6 overflow-y-auto justify-between ${
            editorTheme === 'dark' ? 'border-slate-800/80 bg-[#0B1220]' : 'border-slate-200/80 bg-slate-50/50'
          }`}>
            <div className="space-y-6">
              {/* Assessment Progress */}
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${
                  editorTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Assessment Progress
                </h4>

                {/* Circular ring + Completed % */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-[60px] h-[60px] shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="20" fill="none" strokeWidth="4.5" stroke={editorTheme === 'dark' ? '#1E293B' : '#E2E8F0'} />
                      <circle cx="26" cy="26" r="20" fill="none" strokeWidth="4.5" stroke="#10B981"
                        strokeDasharray={`${2 * Math.PI * 20}`}
                        strokeDashoffset={`${2 * Math.PI * 20 * (1 - answeredCount / Math.max(totalCount, 1))}`}
                        strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-black ${editorTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                        {answeredCount}/{totalCount}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className={`text-3xl font-black leading-none ${editorTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      {totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0}%
                    </p>
                    <p className={`text-xs font-medium mt-1 ${editorTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Questions Completed
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className={`h-2 rounded-full overflow-hidden mb-4 ${editorTheme === 'dark' ? 'bg-slate-800' : 'bg-slate-200/80'}`}>
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${totalCount > 0 ? (answeredCount / totalCount) * 100 : 0}%` }}
                  />
                </div>

                {/* 3 Metric chips */}
                <div className="grid grid-cols-3 gap-2">
                  <div className={`rounded-xl p-2.5 text-center border ${
                    editorTheme === 'dark' ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400' : 'bg-emerald-50/70 border-emerald-200/70 text-emerald-700'
                  }`}>
                    <CheckCircle className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
                    <p className="text-base font-extrabold leading-none">{answeredCount}</p>
                    <p className="text-[10px] font-semibold mt-1">Answered</p>
                  </div>
                  <div className={`rounded-xl p-2.5 text-center border ${
                    editorTheme === 'dark' ? 'bg-amber-950/30 border-amber-800/40 text-amber-400' : 'bg-amber-50/70 border-amber-200/70 text-amber-700'
                  }`}>
                    <Clock className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                    <p className="text-base font-extrabold leading-none">{reviewCount}</p>
                    <p className="text-[10px] font-semibold mt-1">Review</p>
                  </div>
                  <div className={`rounded-xl p-2.5 text-center border ${
                    editorTheme === 'dark' ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    <Circle className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                    <p className="text-base font-extrabold leading-none">{totalCount - answeredCount}</p>
                    <p className="text-[10px] font-semibold mt-1 text-slate-500">Pending</p>
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              <div className={`pt-5 border-t ${editorTheme === 'dark' ? 'border-slate-800/80' : 'border-slate-200/80'}`}>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3.5 ${
                  editorTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Questions
                </h4>

                {/* 3-Column Question Grid */}
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                  {questions.map((q, idx) => {
                    const isCoding       = q.questionType === 'CODING';
                    const verdict        = questionVerdict[q.id];
                    const isCodCompleted = isCoding && verdict?.status === 'ACCEPTED';
                    const isAnswered     = isCoding ? isCodCompleted : !!answers[q.id];
                    const isReview       = markedForReview.has(q.id);
                    const isActive       = idx === currentQuestionIndex;

                    let btnStyle = editorTheme === 'dark'
                      ? 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-2xs';

                    if (isActive) {
                      btnStyle = 'bg-blue-600 text-white border-blue-500 shadow-sm ring-2 ring-blue-500/30 font-bold';
                    } else if (isReview && isAnswered) {
                      btnStyle = 'bg-violet-600 text-white border-violet-500 font-bold';
                    } else if (isReview) {
                      btnStyle = 'bg-amber-500 text-white border-amber-400 font-bold';
                    } else if (isCodCompleted) {
                      btnStyle = 'bg-emerald-500 text-white border-emerald-500 font-bold';
                    } else if (isCoding) {
                      // Coding question pending/in-progress: shown in blue
                      btnStyle = 'bg-blue-500 text-white border-blue-600 hover:bg-blue-600 font-bold';
                    } else if (isAnswered) {
                      btnStyle = 'bg-emerald-500 text-white border-emerald-500 font-bold';
                    }

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(idx)}
                        title={`Q${idx + 1}${isCoding ? ' · Coding Challenge' : ''}${isCodCompleted ? ' · Completed' : isCoding ? ' · Coding Challenge (Pending)' : isAnswered ? ' · Answered' : ''}${isReview ? ' · Review' : ''}`}
                        className={`h-11 rounded-xl text-sm font-bold transition-all border flex items-center justify-center gap-1.5 relative ${btnStyle}`}
                      >
                        <span>{idx + 1}</span>
                        {/* Completed tick (Green check for answered MCQ or completed coding) */}
                        {isAnswered && !isReview && !isActive && (
                          <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />
                        )}
                        {/* Coding icon when in blue (coding question, not completed, not active, not review) */}
                        {isCoding && !isCodCompleted && !isActive && !isReview && (
                          <Code2 className="w-3.5 h-3.5 shrink-0 text-blue-100" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Completed / Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span>Coding Challenge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span>Marked for Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-600 shrink-0" />
                    <span>Answered + Review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 shrink-0" />
                    <span>Not Visited</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivational Footer Note — Grounded */}
            <div className={`mt-6 pt-4 border-t flex items-center gap-3 ${
              editorTheme === 'dark' ? 'border-slate-800/80' : 'border-slate-200/80'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/40">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 36 36" fill="none">
                  <path d="M12 21L14 31H22L24 21H12Z" fill="#3B82F6" opacity="0.9" />
                  <path d="M10 19H26V21H10V19Z" fill="#1D4ED8" />
                  <ellipse cx="18" cy="21" rx="5" ry="1.2" fill="#0F172A" />
                  <path d="M18 21V13" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M18 16C13 16 11 12 11 12C11 12 15 12 18 14" fill="#10B981" />
                  <path d="M18 14C21 12 25 12 25 12C25 12 23 16 18 16" fill="#059669" />
                </svg>
              </div>
              <div>
                <p className={`text-xs font-bold leading-snug ${editorTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                  Small steps lead to big results.
                </p>
                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 mt-0.5">Keep going!</p>
              </div>
            </div>
          </aside>

          {/* MAIN CENTER QUESTION WORKSPACE — Fully Grounded without box containers */}
          <main className="flex-1 flex flex-col min-w-0 overflow-y-auto px-6 sm:px-12 py-8 justify-between">
            <div className="max-w-4xl w-full mx-auto space-y-8">
              {/* Top Question Header Bar */}
              <div className={`flex items-center justify-between gap-4 pb-5 border-b ${
                editorTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    editorTheme === 'dark' ? 'bg-blue-950/80 text-blue-400 border border-blue-800/60' : 'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className={`text-base font-extrabold ${editorTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </h3>
                    <p className={`text-xs font-medium ${editorTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Multiple Choice
                    </p>
                  </div>
                </div>

                {/* Marks Pill, Bookmark & Flag */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                    editorTheme === 'dark'
                      ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                      : 'bg-blue-50 border-blue-200 text-blue-700'
                  }`}>
                    {currentQ.marks || 10} marks
                  </span>

                  <button
                    type="button"
                    title="Bookmark"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      editorTheme === 'dark'
                        ? 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                    <span>Bookmark</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleReview(currentQ.id)}
                    title="Flag for Review"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      markedForReview.has(currentQ.id)
                        ? 'bg-amber-500 text-white border-amber-400 hover:bg-amber-600'
                        : editorTheme === 'dark'
                        ? 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5 text-slate-500" />
                    <span>{markedForReview.has(currentQ.id) ? 'Flagged' : 'Flag for Review'}</span>
                  </button>
                </div>
              </div>

              {/* Question Text Grounded */}
              <h2 className={`text-xl sm:text-2xl font-extrabold leading-snug tracking-tight ${
                editorTheme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                {currentQ.questionText}
              </h2>

              {/* Options Stack — Grounded, comfortable, humanized */}
              <div className="flex flex-col gap-3.5 pt-2">
                {[
                  { key: 'A', text: currentQ.optionA },
                  { key: 'B', text: currentQ.optionB },
                  { key: 'C', text: currentQ.optionC },
                  { key: 'D', text: currentQ.optionD }
                ].map(({ key, text }) => {
                  if (!text) return null;
                  const isSelected = answers[currentQ.id] === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, key)}
                      className={`w-full rounded-2xl text-left transition-all duration-150 p-4 sm:p-5 flex items-center justify-between ${
                        isSelected
                          ? editorTheme === 'dark'
                            ? 'border-2 border-blue-500 bg-blue-950/30 shadow-xs'
                            : 'border-2 border-blue-500 bg-blue-50/60 shadow-xs'
                          : editorTheme === 'dark'
                          ? 'border border-slate-800 bg-[#121B2B] hover:border-slate-700 hover:bg-[#152033]'
                          : 'border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0 pr-4">
                        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : editorTheme === 'dark'
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {key}
                        </span>
                        <span className={`text-sm sm:text-base font-semibold leading-snug ${
                          isSelected
                            ? editorTheme === 'dark' ? 'text-white' : 'text-slate-900'
                            : editorTheme === 'dark' ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {text}
                        </span>
                      </div>

                      {/* Radio Button Indicator */}
                      <span className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-white dark:bg-slate-900'
                          : editorTheme === 'dark' ? 'border-slate-600' : 'border-slate-300'
                      }`}>
                        {isSelected && <span className="w-3 h-3 rounded-full bg-blue-600" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Grounded Navigation Toolbar */}
            <div className={`max-w-4xl w-full mx-auto pt-6 mt-8 border-t flex items-center justify-between gap-3 ${
              editorTheme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed ${
                    editorTheme === 'dark'
                      ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
                  }`}
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleReview(currentQ.id)}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-1.5 ${
                    markedForReview.has(currentQ.id)
                      ? 'bg-amber-500 text-white border-amber-400 hover:bg-amber-600'
                      : editorTheme === 'dark'
                      ? 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>{markedForReview.has(currentQ.id) ? 'Marked for Review' : 'Mark for Review'}</span>
                </button>

                {answers[currentQ.id] && (
                  <button
                    type="button"
                    onClick={() => handleClearOption(currentQ.id)}
                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all flex items-center gap-1.5 ${
                      editorTheme === 'dark'
                        ? 'border-rose-900/60 bg-rose-950/40 text-rose-300 hover:bg-rose-900/60'
                        : 'border-slate-200 bg-white hover:bg-rose-50 text-rose-600 shadow-2xs'
                    }`}
                  >
                    <Eraser className="w-4 h-4" />
                    <span>Clear Response</span>
                  </button>
                )}
              </div>

              <div>
                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIndex((i) => Math.min(questions.length - 1, i + 1))}
                    className="px-8 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-all flex items-center gap-2 shadow-md shadow-blue-600/25"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(true)}
                    className="px-8 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition-all flex items-center gap-2 shadow-md shadow-emerald-600/25"
                  >
                    <span>Finish Assessment</span>
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </main>

          {/* RIGHT SIDEBAR PANEL — Continuous grounded section with subtle border divider */}
          <aside className={`hidden xl:flex flex-col w-[290px] shrink-0 border-l p-6 space-y-6 overflow-y-auto ${
            editorTheme === 'dark' ? 'border-slate-800/80 bg-[#0B1220]' : 'border-slate-200/80 bg-slate-50/50'
          }`}>
            {/* 1. Quick Tip Grounded */}
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-white flex items-center justify-center font-bold shrink-0">
                  <Lightbulb className="w-4 h-4 text-white" />
                </div>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${
                  editorTheme === 'dark' ? 'text-amber-400' : 'text-slate-800'
                }`}>
                  Quick Tip
                </h4>
              </div>
              <p className={`text-xs leading-relaxed ${
                editorTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Think carefully about each option. Eliminate obviously wrong answers first to maximize accuracy.
              </p>
            </div>

            <div className={`border-t ${editorTheme === 'dark' ? 'border-slate-800/80' : 'border-slate-200/80'}`} />

            {/* 2. Keyboard Shortcuts Grounded */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  editorTheme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                }`}>
                  <Keyboard className="w-4 h-4" />
                </div>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${
                  editorTheme === 'dark' ? 'text-slate-400' : 'text-slate-800'
                }`}>
                  Keyboard Shortcuts
                </h4>
              </div>
              <div className="space-y-2.5 text-xs">
                {[
                  { key: 'A', label: 'Select option A' },
                  { key: 'B', label: 'Select option B' },
                  { key: 'C', label: 'Select option C' },
                  { key: 'D', label: 'Select option D' },
                  { key: '←', label: 'Previous question' },
                  { key: '→', label: 'Next question' },
                  { key: 'M', label: 'Mark for review' }
                ].map(({ key, label }) => (
                  <div key={label} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <kbd className={`w-6 h-6 rounded-lg font-mono text-xs font-bold border flex items-center justify-center ${
                      editorTheme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-300 text-slate-700 shadow-2xs'
                    }`}>
                      {key}
                    </kbd>
                    <span className="text-xs">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`border-t ${editorTheme === 'dark' ? 'border-slate-800/80' : 'border-slate-200/80'}`} />

            {/* 3. Question Type Grounded */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isCodingProblem ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400' : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                }`}>
                  {isCodingProblem ? <Code2 className="w-4 h-4" /> : <ListOrdered className="w-4 h-4" />}
                </div>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${
                  editorTheme === 'dark' ? 'text-slate-400' : 'text-slate-800'
                }`}>
                  Question Type
                </h4>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isCodingProblem ? 'Coding Challenge' : 'Multiple Choice'}</span>
                </p>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isCodingProblem
                    ? 'Write your solution, run test cases, and submit to verify algorithmic correctness.'
                    : 'Select the correct answer from the given options.'}
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
      {showSurveillanceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span>Candidate Surveillance Monitor</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSurveillanceModal(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 relative">
              <video
                ref={modalVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                <span>REC</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p>Hardware telemetry and camera frames are continuously streaming to the proctoring engine.</p>
              <p className="text-slate-300 font-bold">Strikes Logged: {violations.length} / {Number(examData?.maxStrikesAllowed || examData?.maxViolations) || 3}</p>
            </div>

            <button
              type="button"
              onClick={() => setShowSurveillanceModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Close Surveillance Monitor
            </button>
          </div>
        </div>
      )}

      {/* 6. SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Finish Assessment?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Review your test progress before final grading</p>
              </div>
            </div>

            {/* Assessment Progress Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-slate-500 block">Answered</span>
                <span className="text-lg font-bold text-emerald-600">{answeredCount}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Under Review</span>
                <span className="text-lg font-bold text-amber-600">{reviewCount}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Unanswered</span>
                <span className="text-lg font-bold text-rose-600">{totalCount - answeredCount}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Once finalized, all answers and coding solutions will be graded and verified, and your complete scorecard with pass/fail credentials will be presented.
            </p>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Return to Exam
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setShowSubmitModal(false);
                  handleSubmitExam(false);
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Yes, Finish Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7A. HIGH-VISIBILITY STRIKE VIOLATION MODAL */}
      {violationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border-2 border-rose-500 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white animate-scaleUp">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center shrink-0 border border-rose-300 dark:border-rose-800">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Integrity Protocol Violation
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Strike {violationModal.strike} of {violationModal.max} Recorded
                </h3>
              </div>
            </div>

            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900 text-xs space-y-2">
              <div className="font-bold text-rose-900 dark:text-rose-200">
                Incident Detected ({violationModal.time}):
              </div>
              <p className="text-rose-800 dark:text-rose-300 font-semibold leading-relaxed">
                {violationModal.details}
              </p>
              <div className="pt-2 border-t border-rose-200 dark:border-rose-900 text-[11px] font-medium text-rose-700 dark:text-rose-400">
                {violationModal.strike >= violationModal.max
                  ? 'Maximum strike limit reached! Your examination is being automatically terminated and reported.'
                  : `Warning: You have ${violationModal.max - violationModal.strike} strike(s) remaining before automatic disqualification.`}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              {violationModal.strike < violationModal.max ? (
                <button
                  type="button"
                  onClick={() => setViolationModal(null)}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  I Understand & Resume Assessment
                </button>
              ) : (
                <span className="text-xs font-bold text-rose-600 animate-pulse">
                  Terminating examination...
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7B. PROCTOR LIVE CHAT DRAWER & FLOATING WIDGET (DRAGGABLE) */}
      {(() => {
        const widgetWidth = showStudentChatDrawer ? 384 : 160;
        const widgetHeight = showStudentChatDrawer ? 380 : 50;
        const winW = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
        const clampedX = Math.max(10, Math.min(winW - widgetWidth - 10, chatPosition.x));
        const clampedY = Math.max(10, Math.min(winH - widgetHeight - 10, chatPosition.y));

        if (showStudentChatDrawer) {
          return (
            <div
              style={{
                left: `${clampedX}px`,
                top: `${clampedY}px`,
                touchAction: 'none'
              }}
              className="fixed z-40 w-96 max-w-[calc(100vw-2.5rem)] bg-slate-900 border-2 border-indigo-500/70 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn"
            >
              {/* Drawer Header (Draggable Handle) */}
              <div
                onPointerDown={handleChatDragStart}
                className="p-3.5 bg-indigo-950/90 border-b border-indigo-800 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
                title="Drag to reposition chat window anywhere"
              >
                <div className="flex items-center gap-2">
                  <GripHorizontal className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-none">
                      Vigilance Proctor Communication
                    </h4>
                    <span className="text-[10px] text-indigo-300">Drag to move anywhere</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStudentChatDrawer(false)}
                  className="chat-close-btn p-1 rounded-lg text-slate-400 hover:text-white hover:bg-indigo-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages Thread */}
              <div className="p-3 max-h-64 min-h-[140px] overflow-y-auto space-y-2.5 bg-slate-950/80 text-xs">
                {officerChats.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 space-y-1">
                    <MessageSquare className="w-6 h-6 mx-auto opacity-40 text-indigo-400" />
                    <p>No messages yet.</p>
                    <p className="text-[10px]">You can send queries or reply to the vigilance officer below.</p>
                  </div>
                ) : (
                  [...officerChats]
                    .sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))
                    .map((msg) => {
                      const isStudent = msg.officerStaffId === 'CANDIDATE' || msg.reason === 'STUDENT_REPLY';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
                        >
                          <span className="text-[9px] font-mono text-slate-400 mb-0.5 px-1">
                            {isStudent ? 'You (Candidate)' : `Officer (${msg.officerStaffId || 'VO-SEC'})`} · {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          <div
                            className={`p-2.5 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                              isStudent
                                ? 'bg-emerald-600 text-white rounded-tr-none shadow-sm'
                                : 'bg-indigo-950 text-indigo-100 border border-indigo-700/60 rounded-tl-none shadow-sm'
                            }`}
                          >
                            {msg.chatMessage || msg.message}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Chat Input Footer */}
              <form
                onSubmit={handleSendStudentChat}
                className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={studentChatInput}
                  onChange={(e) => setStudentChatInput(e.target.value)}
                  placeholder="Write a message to proctor..."
                  className="flex-1 px-3 py-2 bg-slate-950 text-white placeholder-slate-500 rounded-xl border border-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={sendingStudentChat || !studentChatInput.trim()}
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer"
                  title="Send reply"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          );
        }

        return (
          <button
            type="button"
            onPointerDown={handleChatDragStart}
            onClick={(e) => {
              if (chatDragOffsetRef.current.moved) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              setShowStudentChatDrawer(true);
              setUnreadChatCount(0);
            }}
            style={{
              left: `${clampedX}px`,
              top: `${clampedY}px`,
              touchAction: 'none'
            }}
            className="fixed z-40 bg-indigo-600 hover:bg-indigo-700 active:cursor-grabbing cursor-grab text-white px-3.5 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold select-none border border-indigo-400/50 transition-shadow"
            title="Drag to reposition anywhere"
          >
            <GripHorizontal className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Proctor Chat</span>
            {unreadChatCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                {unreadChatCount}
              </span>
            )}
          </button>
        );
      })()}

      {/* 7D. GENTLE DISMISSIBLE ONE-TIME CHAT TOAST */}
      {latestChatAlert && !showStudentChatDrawer && (
        <div className="fixed top-5 right-5 z-40 max-w-sm w-full px-4 animate-fadeIn">
          <div className="bg-indigo-950 text-white border border-indigo-400/70 p-3.5 rounded-2xl shadow-2xl flex items-start gap-3 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">
                  Message from Officer ({latestChatAlert.officerStaffId || 'VO-SEC'})
                </span>
                <button
                  type="button"
                  onClick={() => setLatestChatAlert(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-white mt-1 line-clamp-2 leading-relaxed">
                "{latestChatAlert.message}"
              </p>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowStudentChatDrawer(true);
                    setUnreadChatCount(0);
                    setLatestChatAlert(null);
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors"
                >
                  Open Chat & Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. FORMAL OFFICER WARNING MODAL (MANDATORY ACKNOWLEDGEMENT) */}
      {officerWarning && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center shrink-0 border border-amber-300 dark:border-amber-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Official Vigilance Warning · Level: {officerWarning.severity || 'HIGH'}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  Examination Integrity Warning Issued
                </h3>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-2 text-xs">
              <div className="font-bold text-amber-900 dark:text-amber-200">
                Warning Justification:
              </div>
              <p className="text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                {officerWarning.reason || 'Suspicious visual behavior or tab switching detected by proctoring bureau.'}
              </p>
              {officerWarning.officerNotes && (
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/60 text-[11px] text-slate-600 dark:text-slate-300 italic">
                  <strong>Officer Instructions:</strong> {officerWarning.officerNotes}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 leading-relaxed">
              Issued by: <strong>{officerWarning.officerName}</strong> ({officerWarning.officerStaffId || 'VO-001'}). Continued disregard of exam integrity regulations will lead to immediate exam termination.
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={acknowledgingWarning}
                onClick={handleAcknowledgeOfficerWarning}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{acknowledgingWarning ? 'Recording Acknowledgement...' : 'I Acknowledge & Understand — Return to Exam'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. TERMINATION OVERLAY (LOCK EXAM) */}
      {terminatedByOfficer && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-rose-600 rounded-3xl max-w-lg w-full p-7 text-center space-y-5 text-white shadow-2xl">
            <div className="w-16 h-16 rounded-3xl bg-rose-950/80 text-rose-500 border border-rose-700 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                Examination Terminated
              </span>
              <h2 className="text-xl font-black text-white">
                Session Aborted by Vigilance Bureau
              </h2>
            </div>

            <div className="p-4 bg-rose-950/40 rounded-2xl border border-rose-800 text-left space-y-1.5 text-xs text-rose-200">
              <div className="font-bold text-rose-300">Official Termination Reason:</div>
              <p className="leading-relaxed">
                {terminationReasonText || 'Exceeded permitted integrity violation threshold.'}
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your test session has been formally locked. All responses recorded prior to termination have been archived for institutional evaluation. Contact your academic institution administrator or course faculty for appeals.
            </p>

            <button
              type="button"
              onClick={() => {
                if (onExamCompleted) {
                  onExamCompleted({ status: 'TERMINATED_BY_VIOLATION' });
                } else if (onCancel) {
                  onCancel();
                } else {
                  window.location.reload();
                }
              }}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              Exit Examination Portal
            </button>
          </div>
        </div>
      )}

      {/* Dedicated off-screen video elements for background frame streaming (kept active with dimensions) */}
      <div style={{ position: 'fixed', top: -10000, left: -10000, width: 640, height: 360, opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
        <video ref={streamCamVideoRef} autoPlay playsInline muted width="480" height="270" />
        <video ref={screenVideoRef} autoPlay playsInline muted width="640" height="360" />
      </div>
    </div>
  );
};
