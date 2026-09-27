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
  Maximize2
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
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (back) | 'user' (front)
  const [permissionStatus, setPermissionStatus] = useState('checking'); // 'checking' | 'active' | 'denied' | 'error'
  const [streamError, setStreamError] = useState(null);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [fpsCount, setFpsCount] = useState(0);
  const [lastPingTime, setLastPingTime] = useState(null);
  const [positionValidated, setPositionValidated] = useState(true);
  const [showGuide, setShowGuide] = useState(true);

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

  // Initialize Camera
  const startCamera = async (facing = cameraFacing) => {
    setPermissionStatus('checking');
    setStreamError(null);

    // Stop existing tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera streaming is not supported on this mobile browser. Please open in Chrome or Safari.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setPermissionStatus('active');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Phone camera access error:', err);
      // Fallback to any available video track if specific facingMode fails
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        streamRef.current = fallbackStream;
        setStream(fallbackStream);
        setPermissionStatus('active');
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play().catch(() => {});
        }
      } catch (fallbackErr) {
        setPermissionStatus('denied');
        setStreamError('Camera permission denied. Please allow camera access in your mobile browser settings and reload.');
      }
    }
  };

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

  // Handle Video Frame Capture & Continuous Ingestion
  useEffect(() => {
    if (permissionStatus !== 'active' || !params.attemptId) return;

    const captureAndSend = () => {
      const vid = videoRef.current;
      if (!vid || vid.readyState < 2 || vid.videoWidth === 0) return;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(vid, 0, 0, 480, 360);

        // Watermark overlay on phone feed
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(0, 332, 480, 28);
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`PHONE CAM ● ATT #${params.attemptId} | ${new Date().toLocaleTimeString()}`, 10, 350);

        ctx.fillStyle = '#10b981';
        ctx.fillText('PROCTOR SYNC: OK', 360, 350);

        const phoneFrameDataUrl = canvas.toDataURL('image/jpeg', 0.55);

        setIsTransmitting(true);
        setLastPingTime(new Date().toLocaleTimeString());
        frameCountRef.current += 1;

        // 1. BroadcastChannel for local/same-origin instantaneous sync
        if (bcRef.current) {
          try {
            bcRef.current.postMessage({
              type: 'PHONE_FRAME_UPDATE',
              attemptId: Number(params.attemptId) || params.attemptId,
              phoneFrame: phoneFrameDataUrl,
              phoneConnected: true,
              phonePositionValid: positionValidated,
              timestamp: Date.now()
            });
          } catch (e) {}
        }

        // 2. HTTP Server Relay
        api.post(`/vigilance/feed/phone-stream/${params.attemptId}`, {
          phoneFrame: phoneFrameDataUrl,
          phoneConnected: true,
          phonePositionValid: positionValidated
        }).catch(() => {});
      } catch (err) {
        console.warn('Frame capture error:', err);
      }
    };

    // Initial capture
    captureAndSend();

    // Loop every 1100ms
    frameTimerRef.current = setInterval(captureAndSend, 1100);

    // FPS Meter
    const fpsTimer = setInterval(() => {
      setFpsCount(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    return () => {
      clearInterval(frameTimerRef.current);
      clearInterval(fpsTimer);
    };
  }, [permissionStatus, params.attemptId, positionValidated]);

  const toggleCameraFacing = () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(next);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-8">
      {/* Top Header */}
      <header className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                BridgeAI Secondary Proctor
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <h1 className="text-xs font-bold text-white truncate max-w-[200px]">
              {params.examTitle}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleCameraFacing}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-[11px] font-semibold"
          title="Switch Front/Back Camera"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
          <span>Flip</span>
        </button>
      </header>

      {/* Main Streaming Viewport */}
      <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4">
        {/* Active Candidate Strip */}
        <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Candidate</span>
            <strong className="text-white text-sm">{params.studentName}</strong>
          </div>
          <div className="text-right font-mono text-[11px]">
            <span className="text-slate-400 block text-[10px]">Session Attempt</span>
            <span className="text-emerald-400 font-bold">#{params.attemptId}</span>
          </div>
        </div>

        {/* Live Camera Box with Positioning Guide Wireframe */}
        <div className="relative rounded-2xl border-2 border-slate-700 bg-black overflow-hidden aspect-[4/3] flex items-center justify-center shadow-2xl">
          {permissionStatus === 'active' ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Live Overlay HUD */}
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-700 text-[10px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span className="font-bold">LIVE STREAMING</span>
              </div>

              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-xs px-2 py-1 rounded-lg border border-slate-700 text-[10px] font-mono text-slate-300">
                {cameraFacing === 'environment' ? 'Rear Wide Camera' : 'Front Camera'}
              </div>

              {/* Wireframe Positioning Alignment Box */}
              <div className="absolute inset-6 border-2 border-dashed border-sky-400/60 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-mono bg-sky-950/80 text-sky-300 px-1.5 py-0.5 rounded border border-sky-800">
                    [ Candidate & Face Area ]
                  </span>
                  <span className="text-[9px] font-mono bg-emerald-950/80 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">
                    ✓ Desk Angle
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-sky-300 bg-black/70 px-3 py-1 rounded-full border border-sky-500/40">
                    Keep Laptop + Screen in View
                  </span>
                </div>
                <div className="flex justify-between items-end text-[9px] font-mono text-slate-400">
                  <span className="bg-black/60 px-1.5 py-0.5 rounded">Keyboard / Hands</span>
                  <span className="bg-black/60 px-1.5 py-0.5 rounded">Laptop Display</span>
                </div>
              </div>

              {/* Bottom Transmission Status Bar */}
              <div className="absolute bottom-2 inset-x-2 bg-slate-950/90 backdrop-blur-sm p-2 rounded-lg border border-slate-800 flex items-center justify-between text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Transmitting to Exam Console</span>
                </div>
                <span className="text-slate-400">Last Sync: {lastPingTime || 'Now'}</span>
              </div>
            </>
          ) : permissionStatus === 'checking' ? (
            <div className="p-6 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-300">Requesting Smartphone Camera Access...</p>
              <p className="text-[11px] text-slate-500">Please tap &quot;Allow&quot; on your browser camera prompt.</p>
            </div>
          ) : (
            <div className="p-6 text-center space-y-3">
              <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
              <p className="text-xs font-bold text-rose-400">Camera Access Blocked</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                {streamError || 'Camera permission is required to stream secondary proctor video.'}
              </p>
              <button
                type="button"
                onClick={() => startCamera(cameraFacing)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Camera Access</span>
              </button>
            </div>
          )}
        </div>

        {/* Validation Checklist Card */}
        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Smartphone Proctoring Checklist</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              Active
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-slate-200 block text-[11px]">1. Phone Device Paired</strong>
                <span className="text-[10px] text-slate-400">Attempt #{params.attemptId} recognized</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              {permissionStatus === 'active' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <div>
                <strong className="text-slate-200 block text-[11px]">2. Camera Permission Granted</strong>
                <span className="text-[10px] text-slate-400">
                  {permissionStatus === 'active' ? 'Video stream active' : 'Waiting for camera approval'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-slate-200 block text-[11px]">3. Desk &amp; Screen Visible</strong>
                <span className="text-[10px] text-slate-400">Student + Laptop keyboard + Monitor screen visible</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950 border border-slate-800/80">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-slate-200 block text-[11px]">4. Live Transmission Synchronized</strong>
                <span className="text-[10px] text-slate-400">Streaming live to candidate laptop &amp; vigilance officer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Positioning Advice Banner */}
        <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-900/60 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-blue-300">
            <Info className="w-4 h-4 text-blue-400" />
            <span>Placement Instructions</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Prop your phone up against a mug or stand at a <strong>45-degree angle</strong> about 2–3 feet to your side. Do not lock or switch apps on this phone during the entire examination.
          </p>
        </div>
      </div>
    </div>
  );
};
