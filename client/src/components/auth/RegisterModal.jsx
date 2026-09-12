import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Phone, KeyRound, CheckCircle, AlertCircle, X, ShieldCheck } from 'lucide-react';

export const RegisterModal = ({ isOpen, onClose, onOpenLogin }) => {
  const { registerWithOtp, requestOtp, loading } = useAuth();
  const [step, setStep] = useState(1); // 1: Details, 2: OTP Verification & Password
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !fullName.trim()) {
      setErrorMsg('Please enter your full name and valid email.');
      return;
    }
    setErrorMsg(null);
    setStatusMsg('Dispatching verification OTP to your email...');
    const res = await requestOtp(email, 'REGISTRATION', fullName);
    if (res.success) {
      setStatusMsg(`OTP dispatched to ${email}. Please enter the code below to complete registration.`);
      if (res.otpCode) {
        setOtpCode(res.otpCode);
      }
      setStep(2);
    } else {
      setErrorMsg('Failed to dispatch OTP. Check email format.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!otpCode.trim()) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    const payload = {
      email: email.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      password: password.trim(),
      role: 'ROLE_STUDENT',
      otpCode: otpCode.trim()
    };

    const res = await registerWithOtp(payload);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Registration failed. Check OTP and details.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Student Registration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Secure learning environment — strictly verified via EmailJS OTP
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-600 dark:text-slate-400">
          <div className={`flex-1 py-2.5 text-center border-r border-slate-200 ${step === 1 ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-600' : ''}`}>
            1. Student Details
          </div>
          <div className={`flex-1 py-2.5 text-center ${step === 2 ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-b-2 border-b-blue-600' : ''}`}>
            2. EmailJS OTP & Password
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address (for OTP)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul.student@bridgeai.edu"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mobile Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-9876543210"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-md text-xs text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#0F172A] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-semibold text-sm rounded-md shadow-sm transition-colors"
            >
              Continue to Verify OTP &rarr;
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="p-5 space-y-4">
            {/* Status notification */}
            {statusMsg && (
              <div className="flex items-start gap-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-md text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{statusMsg}</span>
              </div>
            )}

            {/* OTP Input */}
            <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  Enter 6-digit EmailJS Passcode
                </label>
                <button
                  type="button"
                  onClick={() => requestOtp(email, 'REGISTRATION', fullName)}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                >
                  Resend OTP
                </button>
              </div>
              <input
                type="text"
                required
                maxLength="6"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="000000"
                className="w-full px-3 py-2 text-center tracking-widest font-mono text-lg border border-blue-300 dark:border-blue-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Create Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-md text-xs text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm rounded-md"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 px-4 bg-[#0F172A] dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 text-white font-semibold text-sm rounded-md shadow-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Complete Registration & Start Learning'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 p-3 text-center">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
