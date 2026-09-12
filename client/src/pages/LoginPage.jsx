import React, { useState } from 'react';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Mail, Lock, KeyRound, ShieldAlert, CheckCircle,
  AlertCircle, ArrowRight, UserCheck, Award, GraduationCap,
  Sun, Moon, BookMarked, Users, BookOpen, ShieldCheck, Briefcase
} from 'lucide-react';
import { OtpInput } from '../components/common/OtpInput';

const BG_IMAGE = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1920&q=80';

export const LoginPage = ({ onNavigateLanding, onNavigateRegister, onLoginSuccess }) => {
  const { loginPasswordOtp, loginOtpOnly, requestOtp, switchRoleDemo, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Primary user-facing login modes: 'STUDENT' | 'STAFF'
  const [activeLoginType, setActiveLoginType] = useState('STUDENT'); // 'STUDENT' | 'STAFF'
  const [studentAuthMode, setStudentAuthMode] = useState('PASSWORD'); // 'PASSWORD' | 'OTP'
  const [emailOrStaffId, setEmailOrStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showStaffOtp, setShowStaffOtp] = useState(false);

  const handleSelectLoginType = (type) => {
    setActiveLoginType(type);
    setErrorMsg(null);
    setStatusMsg(null);
    setOtpCode('');
    setShowStaffOtp(false);
    if (type === 'STUDENT') {
      setEmailOrStaffId(DEMO_USERS.STUDENT.email);
      setPassword(DEMO_USERS.STUDENT.password);
    } else {
      setEmailOrStaffId(DEMO_USERS.VIGILANCE_OFFICER.staffId);
      setPassword(DEMO_USERS.VIGILANCE_OFFICER.password);
    }
  };

  const handleSendOtp = async () => {
    if (!emailOrStaffId.trim()) {
      setErrorMsg('Enter your official email first.');
      return;
    }
    setErrorMsg(null);
    setIsSendingOtp(true);
    setStatusMsg('Dispatching OTP...');
    try {
      const res = await requestOtp(emailOrStaffId.trim(), 'LOGIN');
      if (res.success) {
        setStatusMsg(`OTP sent to ${emailOrStaffId}. Check your inbox.`);
        setOtpCode('');
        setShowStaffOtp(true);
      } else {
        setErrorMsg('Failed to send OTP. Verify your email address.');
      }
    } catch {
      setErrorMsg('Error triggering OTP dispatch.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

    const identifier = emailOrStaffId.trim();
    if (!identifier) {
      setErrorMsg(activeLoginType === 'STAFF' ? 'Please enter your Official Email Address or Staff ID.' : 'Please enter your student email.');
      return;
    }

    // Staff OTP-only login (when user explicitly chooses OTP without entering password)
    if (activeLoginType === 'STAFF' && showStaffOtp && !password.trim()) {
      if (!otpCode.trim()) {
        setErrorMsg('Please enter the OTP code sent to your email.');
        return;
      }
      const res = await loginOtpOnly(identifier, otpCode);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMsg(res.error || 'Invalid OTP credentials.');
      }
      return;
    }

    // Student OTP login mode
    if (activeLoginType === 'STUDENT' && studentAuthMode === 'OTP') {
      if (!otpCode.trim()) {
        setErrorMsg('Enter the 6-digit OTP code received on your email.');
        return;
      }
      const res = await loginOtpOnly(identifier, otpCode);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMsg(res.error || 'OTP authentication failed.');
      }
      return;
    }

    // Standard Password login (Student or Staff: Trainer, Admin, Vigilance Officer)
    if (!password.trim()) {
      setErrorMsg('Please enter your password.');
      return;
    }

    const res = await loginPasswordOtp(identifier, password, otpCode);
    if (res.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setErrorMsg(res.error || 'Invalid email/Staff ID or password.');
    }
  };

  const handleQuickDemo = async (roleKey) => {
    setErrorMsg(null);
    setStatusMsg(`Signing in as ${DEMO_USERS[roleKey].fullName}...`);
    await switchRoleDemo(roleKey);
    if (onLoginSuccess) onLoginSuccess();
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans">
      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${BG_IMAGE}')` }} />
      <div className="absolute inset-0 bg-[#071329]/75 dark:bg-[#020814]/85 backdrop-brightness-[0.82]" />

      {/* THEME TOGGLE BUTTON */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-20 p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all shadow-lg"
        title="Toggle theme"
      >
        {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-200" />}
      </button>

      {/* LEFT — branding */}
      <div className="relative z-10 hidden lg:flex flex-col justify-between w-1/2 xl:w-[55%] p-10 xl:p-16 text-white">
        <div>
          <button onClick={onNavigateLanding} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center group-hover:bg-white/25 transition-all shadow-md">
              <BookMarked className="w-6 h-6 text-white" />
            </div>
            <div className="border-l border-white/30 pl-3 text-left">
              <p className="text-xl font-black tracking-tight leading-none text-white drop-shadow-sm">BridgeAI</p>
              <p className="text-xs text-white/85 font-medium mt-0.5">Training & Examination Portal</p>
            </div>
          </button>
          <p className="text-xs text-white/70 font-semibold tracking-wider uppercase mt-2 ml-1">Learn | Assess | Grow</p>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl xl:text-5xl font-black leading-tight drop-shadow-md text-white">
            Learn. Build. <span className="text-amber-400">Grow.</span>
          </h1>
          <p className="text-base text-white/90 max-w-md leading-relaxed font-normal drop-shadow-sm">
            Join thousands of students on India's premier AI-powered education and examination platform.
          </p>
          <div className="space-y-3.5 max-w-md">
            {[
              { icon: BookOpen, title: 'Quality Education', sub: 'Access world-class learning resources' },
              { icon: Users, title: 'Empowering Learners', sub: 'Build skills for a better tomorrow' },
            ].map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3.5 bg-slate-900/60 backdrop-blur-md border border-white/15 rounded-xl px-4.5 py-3.5 shadow-lg">
                <div className="w-9 h-9 rounded-lg bg-emerald-600/30 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <Icon className="w-4.5 h-4.5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white tracking-wide">{title}</p>
                  <p className="text-xs text-white/75">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/50 font-medium">BridgeAI Portal — Government & Private Institution Partner Network</p>
      </div>

      {/* RIGHT — form card */}
      <div className="relative z-10 flex items-center justify-center w-full lg:w-1/2 xl:w-[45%] p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-white/10 dark:border-slate-700/60 overflow-hidden">
            <div className="h-1 bg-blue-600" />

            {/* Header */}
            <div className="px-7 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Institutional Access Gateway
                  </p>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    Sign In to BridgeAI
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  {activeLoginType === 'STUDENT' ? <GraduationCap className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                {activeLoginType === 'STUDENT'
                  ? 'Access courses, coding challenges, assignments, and proctored examinations.'
                  : 'Universal staff portal: Trainer, Super Admin, Boss Admin, and Vigilance Officers.'}
              </p>
            </div>

            {/* 1-Click Evaluation Demo Access Strip */}
            <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  1-Click Demo Evaluation
                </span>
                <span className="text-[9px] text-slate-400">Instant Switch</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { key: 'BOSS_ADMIN', icon: ShieldAlert, color: 'text-rose-500', label: 'Boss' },
                  { key: 'SUPER_ADMIN', icon: UserCheck, color: 'text-amber-500', label: 'Admin' },
                  { key: 'TRAINER', icon: Award, color: 'text-blue-500', label: 'Trainer' },
                  { key: 'STUDENT', icon: GraduationCap, color: 'text-emerald-500', label: 'Student' },
                  { key: 'VIGILANCE_OFFICER', icon: ShieldCheck, color: 'text-indigo-500', label: 'Vigilance' }
                ].map(({ key, icon: Icon, color, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleQuickDemo(key)}
                    className="flex flex-col items-center gap-1 py-1.5 px-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-400 dark:hover:border-slate-500 transition-all text-[9px] font-bold text-slate-700 dark:text-slate-300"
                    title={`Quick sign in as ${DEMO_USERS[key].fullName}`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="truncate max-w-[50px]">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Final Role Structure: Two User-Facing Tabs */}
            <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 p-1 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleSelectLoginType('STUDENT')}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeLoginType === 'STUDENT'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student Login</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectLoginType('STAFF')}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeLoginType === 'STAFF'
                    ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Staff Login</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-7 py-5 space-y-4">
              {/* Staff Portal Helper Notice */}
              {activeLoginType === 'STAFF' && (
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Supports <strong>Trainers, Admins, Boss Admins, and Vigilance Officers (Staff ID login)</strong>.</span>
                </div>
              )}

              {/* Student Mode Switcher: Password vs OTP */}
              {activeLoginType === 'STUDENT' && (
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
                  {[['PASSWORD', 'Password'], ['OTP', 'OTP Login']].map(([mode, lbl]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setStudentAuthMode(mode)}
                      className={`py-1.5 rounded-lg transition-all ${
                        studentAuthMode === mode
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              )}

              {/* Identifier Input: Email or Staff ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {activeLoginType === 'STAFF' ? 'Email / Staff ID' : 'Student Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={emailOrStaffId}
                    onChange={(e) => setEmailOrStaffId(e.target.value)}
                    placeholder={
                      activeLoginType === 'STAFF'
                        ? 'e.g. rahul.sharma@bridgeai.edu OR VO-001'
                        : 'e.g. rahul.student@bridgeai.edu'
                    }
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              {!(activeLoginType === 'STUDENT' && studentAuthMode === 'OTP') && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                    {activeLoginType === 'STAFF' && (
                      <button
                        type="button"
                        onClick={() => setShowStaffOtp(!showStaffOtp)}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                      >
                        {showStaffOtp ? 'Hide OTP Code' : 'Have OTP Code?'}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required={!showStaffOtp}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              )}

              {/* OTP Input (When Student OTP or Staff Boss Admin OTP is toggled) */}
              {((activeLoginType === 'STUDENT' && studentAuthMode === 'OTP') || showStaffOtp) && (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">Email OTP Code</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      className="px-3 py-1.5 bg-slate-900 dark:bg-blue-600 hover:bg-slate-700 dark:hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {isSendingOtp ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                  <OtpInput value={otpCode} onChange={setOtpCode} />
                </div>
              )}

              {/* Status & Error Messages */}
              {statusMsg && (
                <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                  <span>{statusMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                  activeLoginType === 'STUDENT'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                }`}
              >
                {loading
                  ? 'Signing in...'
                  : activeLoginType === 'STUDENT'
                  ? 'Sign In as Student →'
                  : 'Sign In as Staff →'}
              </button>

              {activeLoginType === 'STUDENT' && (
                <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                  New student?{' '}
                  <button
                    type="button"
                    onClick={onNavigateRegister}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    Register via Email OTP
                  </button>
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
