import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import {
  Mail, Lock, User, Phone, KeyRound, ShieldCheck,
  CheckCircle, AlertCircle, ArrowRight, Sun, Moon, Info, Building2, BookMarked, BookOpen, Users
} from 'lucide-react';
import { OtpInput } from '../components/common/OtpInput';

const BG_IMAGE = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1920&q=80';

export const RegisterPage = ({ onNavigateLanding, onNavigateLogin, onRegisterSuccess }) => {
  const { registerWithOtp, requestOtp, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState('');
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  useEffect(() => {
    const fetchInstitutions = async () => {
      try {
        setLoadingInstitutions(true);
        const res = await api.get('/auth/institutions');
        const list = res.data || [];
        setInstitutions(list);
        if (list.length > 0) setSelectedInstitutionId(String(list[0].id));
      } catch (err) {
        console.error('Failed to load institutions:', err);
      } finally {
        setLoadingInstitutions(false);
      }
    };
    fetchInstitutions();
  }, []);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setErrorMsg(null); setStatusMsg(null);
    if (!fullName.trim()) { setErrorMsg('Please enter your full name.'); return; }
    if (!email.trim() || !email.includes('@')) { setErrorMsg('Enter a valid email address.'); return; }
    if (!selectedInstitutionId) { setErrorMsg('Please select your institution.'); return; }
    setIsSendingOtp(true);
    setStatusMsg('Dispatching verification OTP via EmailJS...');
    try {
      const res = await requestOtp(email.trim(), 'REGISTRATION', fullName.trim());
      if (res.success) {
        setStatusMsg(`Verification OTP sent to ${email}. Check your inbox.`);
        setOtpCode(''); setStep(2);
      } else { setErrorMsg('Failed to send OTP. Verify your email.'); }
    } catch { setErrorMsg('Error sending OTP. Please try again.'); }
    finally { setIsSendingOtp(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setErrorMsg(null); setStatusMsg(null);
    if (!otpCode.trim() || otpCode.trim().length < 6) { setErrorMsg('Enter the complete 6-digit OTP.'); return; }
    if (!password.trim() || password.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
    const chosenInst = institutions.find(i => String(i.id) === String(selectedInstitutionId));
    const payload = {
      email: email.trim().toLowerCase(), fullName: fullName.trim(), phone: phone.trim(),
      password: password.trim(), role: 'ROLE_STUDENT', otpCode: otpCode.trim(),
      institutionId: chosenInst ? chosenInst.id : (selectedInstitutionId ? Number(selectedInstitutionId) : null),
      institutionName: chosenInst ? chosenInst.name : ''
    };
    const res = await registerWithOtp(payload);
    if (res.success) { if (onRegisterSuccess) onRegisterSuccess(); }
    else { setErrorMsg(res.error || 'Registration failed. Check your OTP and details.'); }
  };

  const inputClass = "w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all";

  return (
    <div className="min-h-screen flex relative overflow-hidden font-sans">
      {/* BACKGROUND IMAGE - Vivid and visible */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('${BG_IMAGE}')` }} />
      {/* Light-dark balanced gradient: darker behind left text, transparent in center, soft on right */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#071329]/80 via-[#071329]/50 to-[#071329]/30 dark:from-[#020814]/90 dark:via-[#020814]/65 dark:to-[#020814]/40 backdrop-brightness-[0.82]" />

      <button onClick={toggleTheme} className="absolute top-4 right-4 z-20 p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all shadow-lg" title="Toggle theme">
        {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
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
            <div className="h-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500" />

            {/* Header */}
            <div className="px-7 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4 lg:hidden">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
                  <BookMarked className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">BridgeAI</p>
                  <p className="text-[10px] text-slate-500">Training & Examination Portal</p>
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Student Self-Registration</p>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Create Your Account</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Students only. Admins & trainers are provisioned by institution authorities.
              </p>
            </div>

            {/* Step indicator */}
            <div className="grid grid-cols-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 text-xs font-bold">
              {[['1', 'Your Details'], ['2', 'OTP & Password']].map(([num, lbl], i) => {
                const isActive = step === i + 1;
                return (
                  <div key={num} className={`py-3 px-4 text-center ${i === 0 ? 'border-r border-slate-200 dark:border-slate-800' : ''} ${isActive ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-b-2 border-b-emerald-500' : 'text-slate-500'}`}>
                    Step {num}: {lbl}
                  </div>
                );
              })}
            </div>

            {/* Policy notice */}
            <div className="px-7 py-3 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span><strong>Only students</strong> can self-register. Trainers and admins are provisioned by institution authorities.</span>
            </div>

            {/* Step 1 */}
            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="px-7 py-5 space-y-4">

                {/* Institution */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Your Institution <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select required value={selectedInstitutionId} onChange={(e) => setSelectedInstitutionId(e.target.value)} disabled={loadingInstitutions}
                      className={inputClass + " appearance-none"}>
                      <option value="">{loadingInstitutions ? 'Loading institutions...' : '-- Select your institution --'}</option>
                      {institutions.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.name}{inst.city ? ` (${inst.city})` : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Full name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Priya Sharma" className={inputClass} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya.student@bridgeai.edu" className={inputClass} />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone (Optional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91-9876543210" className={inputClass} />
                  </div>
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" /><span>{errorMsg}</span>
                  </div>
                )}

                <button type="submit" disabled={isSendingOtp} className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSendingOtp ? 'Sending OTP...' : 'Send Verification OTP'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                  Already registered?{' '}
                  <button type="button" onClick={onNavigateLogin} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Sign In</button>
                </p>
              </form>
            ) : (
              /* Step 2 */
              <form onSubmit={handleRegister} className="px-7 py-5 space-y-4">

                {statusMsg && (
                  <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                    <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" /><span>{statusMsg}</span>
                  </div>
                )}

                {/* OTP block */}
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-800 dark:text-white">Email OTP Verification</span>
                    </div>
                    <button type="button" onClick={handleSendOtp} disabled={isSendingOtp}
                      className="px-3 py-1.5 bg-slate-900 dark:bg-emerald-600 hover:bg-slate-700 dark:hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg disabled:opacity-50 transition-colors">
                      {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sent to <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{email}</span>
                  </p>
                  <OtpInput value={otpCode} onChange={setOtpCode} />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Create Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters"
                      className={inputClass.replace('ring-emerald-500', 'ring-emerald-500')} />
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className={inputClass} />
                  </div>
                </div>

                {errorMsg && (
                  <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" /><span>{errorMsg}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold rounded-xl transition-all">
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? 'Creating account...' : 'Complete Registration'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
