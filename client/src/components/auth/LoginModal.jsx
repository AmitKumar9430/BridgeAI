import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { Mail, Lock, KeyRound, ShieldAlert, CheckCircle, AlertCircle, X, Crown, Shield, UserCheck, GraduationCap } from 'lucide-react';

import { OtpInput } from '../common/OtpInput';

export const LoginModal = ({ isOpen, onClose, onOpenRegister }) => {
  const { loginPasswordOtp, loginOtpOnly, requestOtp, lastDispatchedOtp, loading } = useAuth();
  const [authMode, setAuthMode] = useState('PASSWORD_OTP'); // 'PASSWORD_OTP' or 'OTP_ONLY'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setErrorMsg('Please enter your email address first.');
      return;
    }
    setErrorMsg(null);
    setStatusMsg('Dispatching OTP via EmailJS...');
    const res = await requestOtp(email, 'LOGIN');
    if (res.success) {
      setStatusMsg(`OTP dispatched successfully to ${email}. Check your inbox and fill the code below.`);
      setOtpCode(''); // Never prefill
    } else {
      setErrorMsg('Failed to dispatch OTP. Please verify email format.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

    // If Boss Admin, enforce OTP only
    if (email.toLowerCase().includes('boss')) {
      if (!otpCode.trim()) {
        setErrorMsg('Boss Admin requires OTP code verification to sign in.');
        return;
      }
      const res = await loginOtpOnly(email, otpCode);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Invalid OTP code.');
      }
      return;
    }

    if (authMode === 'OTP_ONLY') {
      if (!otpCode.trim()) {
        setErrorMsg('Please enter the OTP sent to your email.');
        return;
      }
      const res = await loginOtpOnly(email, otpCode);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Authentication failed.');
      }
    } else {
      if (!password.trim()) {
        setErrorMsg('Please enter your password.');
        return;
      }
      const res = await loginPasswordOtp(email, password, otpCode);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Invalid credentials or OTP.');
      }
    }
  };

  const fillDemo = (key) => {
    const demo = DEMO_USERS[key];
    setEmail(demo.email);
    if (key === 'BOSS_ADMIN') {
      setAuthMode('OTP_ONLY');
      setPassword('');
      setOtpCode('');
      setStatusMsg('Selected Boss Admin. Please click "Send OTP" to receive a verification code.');
    } else {
      setPassword(demo.password || 'Student@2026');
      setAuthMode('PASSWORD_OTP');
      setOtpCode('');
      setStatusMsg(`Loaded ${demo.fullName} credentials.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Secure Portal Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              EmailJS verified authentication with role-based policies
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Demo Pre-fills */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 px-5 py-3">
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Quick Test Accounts:</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => fillDemo('BOSS_ADMIN')}
              className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-300 dark:border-slate-700 hover:border-rose-400 text-slate-800 dark:text-slate-200 rounded font-medium flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 text-rose-600" />
              <span>Boss Admin (OTP)</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('SUPER_ADMIN')}
              className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-300 dark:border-slate-700 hover:border-amber-400 text-slate-800 dark:text-slate-200 rounded font-medium flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-amber-600" />
              <span>Super Admin</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('TRAINER')}
              className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-300 dark:border-slate-700 hover:border-blue-400 text-slate-800 dark:text-slate-200 rounded font-medium flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Trainer</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('STUDENT')}
              className="text-xs px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-300 dark:border-slate-700 hover:border-emerald-400 text-slate-800 dark:text-slate-200 rounded font-medium flex items-center gap-1.5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Student</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setAuthMode('PASSWORD_OTP')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                authMode === 'PASSWORD_OTP' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Password + OTP
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('OTP_ONLY')}
              className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                authMode === 'OTP_ONLY' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Direct OTP Login
            </button>
          </div>

          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@bridgeai.edu"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Password (if PASSWORD_OTP mode) */}
          {authMode === 'PASSWORD_OTP' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>
          )}

          {/* OTP Dispatch & Input */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                EmailJS Passcode
              </label>
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                Send OTP
              </button>
            </div>
            <div className="py-1">
              <OtpInput
                value={otpCode}
                onChange={(val) => setOtpCode(val)}
              />
            </div>
          </div>

          {/* Alerts */}
          {statusMsg && (
            <div className="flex items-start gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-md text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-md text-xs text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#0F172A] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-semibold text-sm rounded-md shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              New student?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegister();
                }}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Register with Email OTP
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
