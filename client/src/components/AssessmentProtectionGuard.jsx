import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lock,
  Info
} from 'lucide-react';
import { runFullSecurityScan } from '../security/AssessmentProtectionSystem';

export const AssessmentProtectionGuard = ({ onProtectionStatusChange }) => {
  const [scanning, setScanning] = useState(true);
  const [scanReport, setScanReport] = useState(null);

  const executeScan = async () => {
    setScanning(true);
    try {
      // Allow DOM to settle and run diagnostic probe
      await new Promise((r) => setTimeout(r, 600));
      const report = await runFullSecurityScan();
      setScanReport(report);
      if (onProtectionStatusChange) {
        onProtectionStatusChange(report);
      }
    } catch (err) {
      console.error('Security scan error:', err);
      const fallbackReport = {
        passed: false,
        issues: [{ category: 'SCAN_FAILURE', title: 'Security Scan Interrupted', details: err.message }]
      };
      setScanReport(fallbackReport);
      if (onProtectionStatusChange) {
        onProtectionStatusChange(fallbackReport);
      }
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    executeScan();
    // Continuously probe every 3 seconds so if user disables the extension or switches to incognito,
    // the Institutional Security Shield unlocks automatically without manual action
    const interval = setInterval(() => {
      executeScan();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const isPassed = scanReport && scanReport.passed;

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
              scanning
                ? 'bg-blue-600'
                : isPassed
                ? 'bg-emerald-600'
                : 'bg-rose-600'
            }`}
          >
            {scanning ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : isPassed ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Institutional Security Shield
              </span>
              {scanning && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  Scanning Environment...
                </span>
              )}
              {!scanning && isPassed && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                  Zero Extensions Active
                </span>
              )}
              {!scanning && !isPassed && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                  Extensions Detected (Blocked)
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
              Browser Extension & Sandbox Protection
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={executeScan}
          disabled={scanning}
          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          title="Re-scan browser extensions"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>Re-scan Browser</span>
        </button>
      </div>

      {/* Security Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2.5">
          {scanning ? (
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
          ) : isPassed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">Extension Probing</div>
            <div className="text-[11px] text-slate-500">
              {scanning ? 'Analyzing...' : isPassed ? 'No extensions found' : 'Active extension detected'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2.5">
          {scanning ? (
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
          ) : isPassed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
          )}
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">API Integrity</div>
            <div className="text-[11px] text-slate-500">
              {scanning ? 'Verifying...' : isPassed ? 'Native code pure' : 'Hooking detected'}
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2.5">
          {scanning ? (
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
          ) : isPassed ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <Lock className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">DOM Isolation</div>
            <div className="text-[11px] text-slate-500">
              {scanning ? 'Probing...' : isPassed ? 'Clean environment' : 'Foreign nodes found'}
            </div>
          </div>
        </div>
      </div>

      {/* Blocked State Warning & Instructions */}
      {!scanning && !isPassed && scanReport && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider">
                Exam Launch Locked: Deactivate Browser Extensions to Proceed
              </h4>
              <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                The institutional assessment shield has detected active extensions on this browser. To prevent unauthorized assistance and protect exam integrity, this assessment cannot begin until all extensions are disabled.
              </p>
            </div>
          </div>

          {/* Details list */}
          <div className="bg-white/70 dark:bg-slate-900/70 p-3 rounded-lg border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-300 space-y-1.5">
            <span className="font-bold block text-[11px] uppercase tracking-wider text-rose-800 dark:text-rose-300">
              Detected Items ({scanReport.issues.length}):
            </span>
            <ul className="list-disc pl-4 space-y-1">
              {scanReport.issues.map((iss, i) => (
                <li key={i} className="text-[11px]">
                  <strong>{iss.title}:</strong> {iss.details}
                </li>
              ))}
            </ul>
          </div>

          {/* Resolution Guide */}
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
            <span className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
              <Info className="w-3.5 h-3.5" />
              How to resolve and unlock your exam:
            </span>
            <ol className="list-decimal pl-4 space-y-1 text-[11px]">
              <li>
                <strong>Option 1 (Fastest):</strong> Open this portal in an <strong>Incognito / InPrivate Window</strong> (Press <kbd className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded font-mono text-[10px]">Ctrl+Shift+N</kbd> or <kbd className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded font-mono text-[10px]">Cmd+Shift+N</kbd>). Extensions are disabled by default in private mode.
              </li>
              <li>
                <strong>Option 2:</strong> Go to <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded font-mono text-[10px]">chrome://extensions</code> or <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded font-mono text-[10px]">edge://extensions</code> and toggle OFF all extensions.
              </li>
              <li>
                After turning off extensions, click <strong>"Re-scan Browser"</strong> above to unlock the exam.
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Clean State Notification */}
      {!scanning && isPassed && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Environment Verified:</strong> Zero browser extensions or API modifications found. Examination shield active.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded">
            PASS
          </span>
        </div>
      )}
    </div>
  );
};
