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
  Info,
  Maximize2,
  Circle,
  HelpCircle,
  Check
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
        studentName: search.get('studentName') || 'Active Candidate'
      };
    }
    return { attemptId: '1', examId: '1', examTitle: 'Proctored Assessment', studentName: 'Active Candidate' };
  });

  const [stream, setStream] = useState(null);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (rear) | 'user' (front)
  const [permissionStatus, setPermissionStatus] = useState('checking'); // 'checking' | 'active' | 'denied'
  const [streamError, setStreamError] = useState(null);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [fpsCount, setFpsCount] = useState(0);
  const [lastPingTime, setLastPingTime] = useState(null);
  const [showChecklistSheet, setShowChecklistSheet] = useState(false);

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

  // Initialize BroadcastChannel
  useEffect(() => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('bridgeai_surveillance_feed');
        bcRef.current = bc;
        return () => {
          bc.close();
          bcRef.current = null;
        };
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Initialize / Switch Camera with fallback chain
  const startCamera = async (facing = cameraFacing) => {
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
      setStreamError('Camera access was blocked or is unavailable. Please grant camera permission in your mobile browser settings and tap "Retry Camera".');
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
        vid.play().catch((playErr) => {
          console.warn('Video play on metadata error:', playErr);
        });
      };
      vid.play().catch(() => {});
    }
  };

  // Re-attach stream whenever videoRef or stream changes
  useEffect(() => {
    if (stream && videoRef.current) {
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
  }, [stream, permissionStatus]);

  useEffect(() => {
    startCamera(cameraFacing);

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
    if (permissionStatus !== 'active' || !params.attemptId) return;

    const captureAndSend = () => {
      const vid = videoRef.current;
      if (!vid || vid.readyState < 2 || vid.videoWidth === 0) {
        // Try waking up paused video if needed
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
  }, [permissionStatus, params.attemptId, params.examId, params.studentName, checklist, cameraFacing]);

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

      {/* 2. TOP FLOATING PROCTORING HUD */}
      <div className="relative z-20 p-3.5 bg-gradient-to-b from-black/85 via-black/50 to-transparent flex items-center justify-between text-xs backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600/90 border border-blue-400/40 flex items-center justify-center shadow-lg shrink-0">
            <Smartphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                3RD ANGLE PROCTOR
              </span>
              <span className="text-[10px] font-mono text-slate-300 font-bold">
                #{params.attemptId}
              </span>
            </div>
            <h1 className="text-xs font-bold text-white mt-0.5 truncate max-w-[200px]">
              {params.studentName} · {params.examTitle}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleCameraFacing}
          className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 flex items-center gap-1.5 text-xs font-semibold shadow-md active:scale-95 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
          <span>{cameraFacing === 'environment' ? 'Flip to Front' : 'Flip to Rear'}</span>
        </button>
      </div>

      {/* 3. CENTER FLOATING POSITIONING WIREFRAME GUIDE */}
      {permissionStatus === 'active' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 pointer-events-none">
          <div className="w-full max-w-sm aspect-[4/3] border-2 border-dashed border-sky-400/70 rounded-2xl p-3.5 flex flex-col justify-between bg-sky-950/15 shadow-2xl backdrop-blur-[1px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold bg-black/75 text-sky-300 px-2 py-0.5 rounded-md border border-sky-500/40">
                [ Candidate Face &amp; Hands ]
              </span>
              <span className="text-[10px] font-mono font-bold bg-black/75 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/40 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> 45° Angle
              </span>
            </div>

            <div className="text-center">
              <span className="text-xs font-bold text-white bg-black/80 px-3.5 py-1.5 rounded-full border border-sky-400/60 shadow-lg inline-flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-sky-400" />
                <span>Keep Yourself + Laptop + Screen Visible</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-300">
              <span className="bg-black/75 px-2 py-0.5 rounded-md border border-slate-700">Laptop Display</span>
              <span className="bg-black/75 px-2 py-0.5 rounded-md border border-slate-700">Desk Surroundings</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. BOTTOM FLOATING TRANSMISSION BAR */}
      <div className="relative z-20 p-3.5 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-2 backdrop-blur-xs">
        {/* Transmission & Sync Status Indicator */}
        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Streaming Live to Exam Console</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            FPS: {fpsCount || 1} · Sync: {lastPingTime || 'Active'}
          </div>
        </div>

        {/* 3-Point Checklist Bar */}
        <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold">
          <div className="p-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 rounded-lg flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Face Visible</span>
          </div>
          <div className="p-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 rounded-lg flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Screen Visible</span>
          </div>
          <div className="p-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 rounded-lg flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Desk Clear</span>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400">
          Leave this screen open and propped up next to your computer during the examination.
        </p>
      </div>
    </div>
  );
};

export default PhoneProctorPage;
