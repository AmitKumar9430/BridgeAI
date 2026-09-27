import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Video,
  VideoOff,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Eye,
  RotateCcw,
  Sparkles,
  Check,
  XCircle,
  Power
} from 'lucide-react';
import api from '../services/api';

export const PhoneProctorPage = () => {
  const [params, setParams] = useState(() => {
    if (typeof window !== 'undefined') {
      const search = new URLSearchParams(window.location.search);
      return {
        attemptId: search.get('attemptId') || '1',
        examId: search.get('examId') || '1',
        examTitle: search.get('examTitle') || 'Proctored Assessment',
        studentName: search.get('studentName') || 'Candidate'
      };
    }
    return { attemptId: '1', examId: '1', examTitle: 'Proctored Assessment', studentName: 'Candidate' };
  });

  const [stream, setStream] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (rear) | 'user' (front)
  const [permissionStatus, setPermissionStatus] = useState('checking'); // 'checking' | 'active' | 'denied'
  const [streamError, setStreamError] = useState(null);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [fpsCount, setFpsCount] = useState(0);
  const [lastPingTime, setLastPingTime] = useState(null);
  const [isExamCompleted, setIsExamCompleted] = useState(false);
  const [showPhoneLeaveWarning, setShowPhoneLeaveWarning] = useState(false);
  const [phoneLeaveCountdown, setPhoneLeaveCountdown] = useState(10);
  const leaveCountdownTimerRef = useRef(null);

  // Position Checklist States (Default true so exam is unlocked once streaming)
  const [checklist, setChecklist] = useState({
    studentFaceVisible: true,
    screenKeyboardVisible: true,
    workspaceVisible: true
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const bcRef = useRef(null);
  const frameTimerRef = useRef(null);
  const frameCountRef = useRef(0);
  const pollCompletionTimerRef = useRef(null);

  // Initialize BroadcastChannel
  useEffect(() => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('bridgeai_surveillance_feed');
        bcRef.current = bc;
        bc.onmessage = (e) => {
          if (e.data?.type === 'EXAM_COMPLETED' || e.data?.type === 'EXAM_SUBMITTED' || e.data?.type === 'EXAM_TERMINATED') {
            handleExamFinished();
          } else if (e.data?.type === 'EXAM_REATTEMPT_STARTED' || e.data?.type === 'EXAM_RESET') {
            handleRestartStreaming();
          }
        };
        return () => {
          bc.close();
          bcRef.current = null;
        };
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Detect tab-switch, minimizing, or closing phone camera during active exam
  useEffect(() => {
    if (isExamCompleted) return;

    const handleVisibilityChange = () => {
      if (isExamCompleted) return;
      if (document.hidden) {
        // Phone camera was minimized / backgrounded
        setShowPhoneLeaveWarning(true);
        setPhoneLeaveCountdown(10);

        if (bcRef.current) {
          try {
            bcRef.current.postMessage({
              type: 'PHONE_CAMERA_CLOSED_WARNING',
              attemptId: params.attemptId,
              examId: params.examId,
              reason: 'Student minimized or switched tab on smartphone',
              timestamp: Date.now()
            });
          } catch (e) {}
        }

        // Start 10-second countdown for auto-submission
        if (leaveCountdownTimerRef.current) clearInterval(leaveCountdownTimerRef.current);
        let count = 10;
        leaveCountdownTimerRef.current = setInterval(() => {
          count -= 1;
          setPhoneLeaveCountdown(count);
          if (count <= 0) {
            clearInterval(leaveCountdownTimerRef.current);
            leaveCountdownTimerRef.current = null;
            if (bcRef.current) {
              try {
                bcRef.current.postMessage({
                  type: 'PHONE_CAMERA_TERMINATED',
                  attemptId: params.attemptId,
                  examId: params.examId,
                  reason: 'You closed or minimized the 3rd-angle phone camera during the proctored exam.',
                  timestamp: Date.now()
                });
              } catch (e) {}
            }
          }
        }, 1000);
      } else {
        // Returned to screen
        if (leaveCountdownTimerRef.current) {
          clearInterval(leaveCountdownTimerRef.current);
          leaveCountdownTimerRef.current = null;
        }
        setShowPhoneLeaveWarning(false);
        if (bcRef.current) {
          try {
            bcRef.current.postMessage({
              type: 'PHONE_CAMERA_RESTORED',
              attemptId: params.attemptId,
              examId: params.examId,
              timestamp: Date.now()
            });
          } catch (e) {}
        }
      }
    };

    const handleBeforeUnload = (e) => {
      if (!isExamCompleted) {
        if (bcRef.current) {
          try {
            bcRef.current.postMessage({
              type: 'PHONE_CAMERA_TERMINATED',
              attemptId: params.attemptId,
              examId: params.examId,
              reason: 'Phone camera page closed by candidate',
              timestamp: Date.now()
            });
          } catch (err) {}
        }
        e.preventDefault();
        e.returnValue = 'WARNING: Closing your phone camera will automatically terminate and submit your examination.';
        return e.returnValue;
      }
    };

    const handlePageHide = () => {
      if (!isExamCompleted && bcRef.current) {
        try {
          bcRef.current.postMessage({
            type: 'PHONE_CAMERA_TERMINATED',
            attemptId: params.attemptId,
            examId: params.examId,
            reason: 'Phone camera page hidden or closed',
            timestamp: Date.now()
          });
        } catch (err) {}
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      if (leaveCountdownTimerRef.current) clearInterval(leaveCountdownTimerRef.current);
    };
  }, [isExamCompleted, params.attemptId, params.examId]);

  // Stop camera tracks and timers when exam is completed
  const handleExamFinished = () => {
    setIsExamCompleted(true);
    setShowPhoneLeaveWarning(false);
    if (leaveCountdownTimerRef.current) {
      clearInterval(leaveCountdownTimerRef.current);
      leaveCountdownTimerRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      streamRef.current = null;
    }
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    setStream(null);
    setIsTransmitting(false);
  };

  // Restart camera tracks and streaming when trainer permits re-attempt
  const handleRestartStreaming = () => {
    setIsExamCompleted(false);
    setShowPhoneLeaveWarning(false);
    api.post(`/vigilance/feed/exam-status/${params.attemptId}/reset`).catch(() => {});
    startCamera(cameraFacing);
  };

  // Poll server to check if exam is completed OR if a re-attempt has been started
  useEffect(() => {
    if (!params.attemptId) return;

    const checkStatus = async () => {
      try {
        const res = await api.get(`/vigilance/feed/phone-stream/${params.attemptId}`);
        if (res.data) {
          if (res.data.examCompleted && !isExamCompleted) {
            handleExamFinished();
          } else if (!res.data.examCompleted && isExamCompleted) {
            handleRestartStreaming();
          }
        }
      } catch (e) {
        // ignore
      }
    };

    pollCompletionTimerRef.current = setInterval(checkStatus, 2000);
    return () => {
      if (pollCompletionTimerRef.current) {
        clearInterval(pollCompletionTimerRef.current);
      }
    };
  }, [params.attemptId, isExamCompleted, cameraFacing]);

  // Initialize / Switch Camera with fallback chain
  const startCamera = async (facing = cameraFacing) => {
    if (isExamCompleted) return;
    setPermissionStatus('checking');
    setStreamError(null);

    // Stop existing media tracks
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      streamRef.current = null;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionStatus('denied');
      setStreamError('Camera streaming is not supported on this mobile browser. Please open in Google Chrome, Microsoft Edge, or Safari.');
      return;
    }

    const constraintsList = [
      {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 }
        },
        audio: false
      },
      {
        video: {
          facingMode: facing
        },
        audio: false
      },
      {
        video: true,
        audio: false
      }
    ];

    let mediaStream = null;
    for (const constraints of constraintsList) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (mediaStream && mediaStream.getVideoTracks().length > 0) {
          break;
        }
      } catch (e) {
        // try next fallback constraint
      }
    }

    if (!mediaStream) {
      setPermissionStatus('denied');
      setStreamError('Camera access was blocked or unavailable. Please enable camera permission in your mobile browser settings and tap "Retry Camera".');
      return;
    }

    streamRef.current = mediaStream;
    setStream(mediaStream);
    setPermissionStatus('active');

    if (videoRef.current) {
      const vid = videoRef.current;
      vid.srcObject = mediaStream;
      vid.setAttribute('playsinline', 'true');
      vid.setAttribute('webkit-playsinline', 'true');
      vid.setAttribute('autoplay', 'true');
      vid.setAttribute('muted', 'true');
      vid.muted = true;
      vid.defaultMuted = true;
      vid.onloadedmetadata = () => {
        vid.play().catch(() => {});
      };
      vid.play().catch(() => {});
    }
  };

  // Re-attach stream whenever videoRef or stream changes
  useEffect(() => {
    if (stream && videoRef.current && !isExamCompleted) {
      const vid = videoRef.current;
      if (vid.srcObject !== stream) {
        vid.srcObject = stream;
        vid.muted = true;
        vid.defaultMuted = true;
        vid.setAttribute('playsinline', 'true');
        vid.setAttribute('webkit-playsinline', 'true');
        vid.play().catch(() => {});
      }
    }
  }, [stream, permissionStatus, isExamCompleted]);

  useEffect(() => {
    if (!isExamCompleted) {
      startCamera(cameraFacing);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (frameTimerRef.current) {
        clearInterval(frameTimerRef.current);
      }
    };
  }, [cameraFacing]);

  // Frame Capture & Ingestion Loop
  useEffect(() => {
    if (permissionStatus !== 'active' || !params.attemptId || isExamCompleted) return;

    const captureAndSend = () => {
      if (isExamCompleted) return;
      const vid = videoRef.current;
      if (!vid || vid.readyState < 2 || vid.videoWidth === 0) {
        if (vid && vid.paused && streamRef.current) {
          vid.play().catch(() => {});
        }
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(vid, 0, 0, 480, 360);

        // Watermark HUD Overlay on streamed frame
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(0, 332, 480, 28);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`PHONE 3RD CAM ● ${params.studentName.slice(0, 16)} | ${new Date().toLocaleTimeString()}`, 10, 350);

        ctx.fillStyle = '#10b981';
        ctx.fillText('STATUS: PROCTORED', 360, 350);

        const phoneFrameDataUrl = canvas.toDataURL('image/jpeg', 0.55);

        setIsTransmitting(true);
        setLastPingTime(new Date().toLocaleTimeString());
        frameCountRef.current += 1;

        const isPosValid = checklist.studentFaceVisible && checklist.screenKeyboardVisible && checklist.workspaceVisible;

        // 1. BroadcastChannel for local / same-device synchronization
        if (bcRef.current) {
          try {
            bcRef.current.postMessage({
              type: 'PHONE_FRAME_UPDATE',
              attemptId: params.attemptId,
              examId: params.examId,
              phoneFrame: phoneFrameDataUrl,
              phoneConnected: true,
              phonePositionValid: isPosValid,
              facingMode: cameraFacing,
              timestamp: Date.now()
            });

            bcRef.current.postMessage({
              type: 'PHONE_CHECKLIST_UPDATE',
              attemptId: params.attemptId,
              examId: params.examId,
              checklist,
              phonePositionValid: isPosValid,
              timestamp: Date.now()
            });
          } catch (e) {}
        }

        // 2. HTTP Server Relay
        api.post(`/vigilance/feed/phone-stream/${params.attemptId}`, {
          phoneFrame: phoneFrameDataUrl,
          phoneConnected: true,
          phonePositionValid: isPosValid,
          studentName: params.studentName,
          examId: params.examId
        }).catch(() => {});
      } catch (err) {
        console.warn('Frame capture error:', err);
      }
    };

    // Push initial frame
    captureAndSend();

    // Stream continuously every 1000ms
    frameTimerRef.current = setInterval(captureAndSend, 1000);

    // FPS Meter
    const fpsTimer = setInterval(() => {
      setFpsCount(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    return () => {
      clearInterval(frameTimerRef.current);
      clearInterval(fpsTimer);
    };
  }, [permissionStatus, params.attemptId, params.examId, params.studentName, checklist, cameraFacing, isExamCompleted]);

  const toggleCameraFacing = (e) => {
    if (e) e.stopPropagation();
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
  };

  const handleScreenTap = () => {
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    }
  };

  // =========================================================================
  // VIEW: EXAM COMPLETED SCREEN (Clean, simple, friendly message)
  // =========================================================================
  if (isExamCompleted) {
    return (
      <div className="fixed inset-0 w-full h-full bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans z-50">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/80 flex items-center justify-center text-emerald-400 mb-5 shadow-2xl shadow-emerald-500/20 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Examination Completed</h1>
        <p className="text-sm text-slate-300 max-w-xs mb-6 leading-relaxed">
          Your proctored examination has been submitted. Smartphone 3rd-angle streaming has now stopped.
        </p>

        <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300 max-w-xs w-full space-y-2 mb-6 text-left shadow-lg">
          <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-slate-800 pb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Streaming Session Closed</span>
          </div>
          <div><span className="text-slate-500">Candidate:</span> {params.studentName}</div>
          <div><span className="text-slate-500">Exam:</span> {params.examTitle}</div>
        </div>

        <div className="space-y-3 w-full max-w-xs">
          <button
            type="button"
            onClick={handleRestartStreaming}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Restart Camera Stream (Re-Attempt)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              try { window.close(); } catch (e) {}
              window.location.href = '/';
            }}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Close Streaming Window
          </button>
          <p className="text-[11px] text-slate-500">
            If your trainer granted a re-attempt, tap &quot;Restart Camera Stream&quot; above.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: ACTIVE CLEAN STREAMING VIEW
  // =========================================================================
  return (
    <div
      onClick={handleScreenTap}
      className="fixed inset-0 w-full h-full bg-black text-white flex flex-col justify-between overflow-hidden font-sans select-none"
    >
      {/* 1. FULL-SCREEN BACKGROUND CAMERA VIDEO FEED */}
      <div className="absolute inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center">
        {permissionStatus === 'active' ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : permissionStatus === 'checking' ? (
          <div className="p-6 text-center space-y-3 z-10">
            <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
            <p className="text-sm font-bold text-white">Starting Smartphone Camera...</p>
            <p className="text-xs text-slate-400">Please tap &quot;Allow&quot; if prompted by your mobile browser.</p>
          </div>
        ) : (
          <div className="p-6 text-center space-y-3 z-10 max-w-sm mx-auto">
            <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
            <p className="text-base font-bold text-rose-400">Camera Access Blocked</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {streamError || 'Please grant camera permissions to stream your 3rd-angle proctor feed.'}
            </p>
            <button
              type="button"
              onClick={() => startCamera(cameraFacing)}
              className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 mx-auto cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Camera Permission</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. TOP MINIMAL FLOATING HUD */}
      <div className="relative z-20 p-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between text-xs backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
            3rd Angle Proctoring
          </span>
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            · {params.studentName}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleCameraFacing}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 flex items-center gap-1.5 text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
          <span>{cameraFacing === 'environment' ? 'Flip to Front' : 'Flip to Rear'}</span>
        </button>
      </div>

      {/* 3. CENTER SUBTLE POSITIONING GUIDE */}
      {permissionStatus === 'active' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 pointer-events-none">
          <div className="w-full max-w-xs aspect-[4/3] border border-dashed border-sky-400/50 rounded-2xl p-3 flex flex-col justify-between bg-sky-950/10 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono font-bold bg-black/75 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                [ Face &amp; Hands ]
              </span>
              <span className="text-[9px] font-mono font-bold bg-black/75 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                45° Angle
              </span>
            </div>

            <div className="text-center">
              <span className="text-[11px] font-bold text-white bg-black/80 px-3 py-1 rounded-full border border-sky-400/40 shadow-sm inline-flex items-center gap-1">
                <Eye className="w-3 h-3 text-sky-400" />
                <span>Keep Student + Screen + Desk in View</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-slate-300">
              <span className="bg-black/75 px-2 py-0.5 rounded border border-slate-700">Laptop Screen</span>
              <span className="bg-black/75 px-2 py-0.5 rounded border border-slate-700">Desk Area</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. BOTTOM CLEAN STATUS BAR */}
      <div className="relative z-20 p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-2 backdrop-blur-xs">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Stream Active</span>
          </div>
          <div className="font-mono text-[10px] text-slate-400">
            FPS: {fpsCount || 1} · Sync: {lastPingTime || 'Active'}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-semibold">
          <div className="p-1 bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 rounded-lg flex items-center justify-center gap-1">
            <Check className="w-2.5 h-2.5 text-emerald-400" />
            <span>Face &amp; Hands</span>
          </div>
          <div className="p-1 bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 rounded-lg flex items-center justify-center gap-1">
            <Check className="w-2.5 h-2.5 text-emerald-400" />
            <span>Laptop Screen</span>
          </div>
          <div className="p-1 bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 rounded-lg flex items-center justify-center gap-1">
            <Check className="w-2.5 h-2.5 text-emerald-400" />
            <span>Desk Clear</span>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400">
          Leave smartphone propped at 45° angle facing you &amp; your laptop.
        </p>
      </div>

      {/* 5. HIGH-PRIORITY PHONE LEAVE / CAMERA CLOSED WARNING OVERLAY */}
      {showPhoneLeaveWarning && !isExamCompleted && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-500 mb-4 shadow-2xl shadow-rose-500/30 animate-pulse">
            <AlertTriangle className="w-10 h-10" />
          </div>

          <div className="text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-950/90 px-3 py-1 rounded-full border border-rose-800 mb-3">
            CRITICAL PROCTORING WARNING
          </div>

          <h2 className="text-xl font-black text-white mb-2">
            DO NOT CLOSE PHONE CAMERA!
          </h2>

          <p className="text-xs text-slate-300 max-w-xs mb-5 leading-relaxed">
            You switched away or minimized the 3rd-angle smartphone camera. Closing or leaving this screen during an active proctored exam is strictly prohibited.
          </p>

          <div className="p-4 bg-rose-950/70 rounded-2xl border-2 border-rose-600 max-w-xs w-full mb-6 space-y-2">
            <div className="text-xs text-slate-300 font-semibold">Automatic Exam Submission In:</div>
            <div className="text-4xl font-black font-mono text-rose-400 animate-pulse">
              {phoneLeaveCountdown}s
            </div>
            <div className="text-[10px] text-rose-300">
              Return to camera view immediately to avoid automatic disqualification!
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowPhoneLeaveWarning(false);
              if (leaveCountdownTimerRef.current) {
                clearInterval(leaveCountdownTimerRef.current);
                leaveCountdownTimerRef.current = null;
              }
              if (bcRef.current) {
                try {
                  bcRef.current.postMessage({
                    type: 'PHONE_CAMERA_RESTORED',
                    attemptId: params.attemptId,
                    examId: params.examId,
                    timestamp: Date.now()
                  });
                } catch (e) {}
              }
            }}
            className="w-full max-w-xs py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            I am Back — Keep Streaming
          </button>
        </div>
      )}
    </div>
  );
};

export default PhoneProctorPage;
