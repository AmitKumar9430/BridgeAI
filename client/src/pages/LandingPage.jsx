import React, { useState } from 'react';
import {
  BookOpen, ShieldCheck, Users, Award, CheckCircle2,
  ArrowRight, FileText, Code2, Terminal, Sparkles, Clock,
  UserCheck, GraduationCap, ChevronDown, Check, Play,
  Laptop, Database, Lock, BarChart3, Building2, Layers,
  Compass, Eye, MonitorCheck, HelpCircle, FileCheck
} from 'lucide-react';

const CAMPUS_IMG = '/iit_building_sunset.jpg';
const LAPTOP_MOCKUP = '/laptop_mockup_transparent.png';

export const LandingPage = ({ onNavigateLogin, onNavigateRegister, onExploreCourses }) => {
  const [openFaq, setOpenFaq] = useState(0);
  const [activeShowcase, setActiveShowcase] = useState(0);

  const showcaseTabs = [
    { id: 'dashboard', title: 'Student Dashboard', desc: 'Unified console for courses, tasks, attendance and progress' },
    { id: 'course', title: 'Course Learning', desc: 'Module curriculum, lectures, study materials and assignments' },
    { id: 'mcq', title: 'MCQ Assessment', desc: 'Secure timed tests with instant grading and strike audits' },
    { id: 'coding', title: 'Coding Assessment', desc: 'Integrated multi-language sandbox with automatic test suite' },
    { id: 'results', title: 'Results & Analytics', desc: 'Granular score breakdowns, pass/fail status and verified certificates' }
  ];

  const faqs = [
    {
      q: 'What is BridgeAI?',
      a: 'BridgeAI is a modern, unified Training & Examination Portal designed for higher education institutions, colleges, and training organizations. It bridges curriculum delivery, coding practice, safe proctored examinations, and institutional governance into one single platform.'
    },
    {
      q: 'Who can use BridgeAI?',
      a: 'BridgeAI serves three primary stakeholders: Students (learning, assignments, exams), Faculty Trainers (content authoring, evaluation, exam scheduling), and Institution Admins / Super Admins (cohort management, faculty allocation, performance auditing).'
    },
    {
      q: 'Can trainers create assessments?',
      a: 'Yes. Faculty trainers can author customized assessments combining Multiple Choice Questions (MCQs) and hands-on coding challenges with predefined test cases, deadlines, time limits, and passing percentages.'
    },
    {
      q: 'Can assessments include coding questions?',
      a: 'Yes. BridgeAI includes an embedded multi-language coding execution environment supporting Python, Java, C++, C, C#, and Kotlin with automated test-case evaluation and execution reports.'
    },
    {
      q: 'Can institutions manage students and trainers?',
      a: 'Yes. Institution administrators can provision faculty accounts, allocate courses, monitor student cohort attendance, review submission backlogs, and audit proctored examination integrity.'
    },
    {
      q: 'Does BridgeAI support online examinations?',
      a: 'Yes. BridgeAI features an automated proctoring layer that tracks tab switches, full-screen exits, webcam feeds, and window focus violations, with strict violation thresholds and automated exam termination.'
    },
    {
      q: 'How can students track their progress?',
      a: 'Students receive comprehensive real-time dashboards showing completed modules, assignment grades, exam scorecards, violation logs, and verified institutional course certificates.'
    }
  ];

  return (
    <div className="w-full font-sans bg-[#F8FAFC] dark:bg-[#0B1220] text-slate-800 dark:text-slate-100 transition-colors">

      {/* 2. CINEMATIC HERO SECTION */}
      <section className="relative min-h-[620px] lg:min-h-[700px] flex items-center overflow-hidden border-b border-slate-200/80 dark:border-slate-800/80">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${CAMPUS_IMG}')` }}
        />
        {/* Soft translucent tint: gives readability to text without fogging the picture */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#071329]/75 via-[#071329]/40 to-[#071329]/20 dark:from-[#020814]/85 dark:via-[#020814]/55 dark:to-[#020814]/35" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* LEFT SIDE: Hero Pitch */}
            <div className="lg:col-span-7 space-y-6 text-white text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold tracking-wide">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>BRIDGEAI • TRAINING &amp; EXAMINATION PORTAL</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] text-white drop-shadow-md">
                Learn. Build. <span className="text-amber-400 drop-shadow-md">Grow.</span>
              </h1>

              <p className="text-lg sm:text-xl font-semibold text-slate-100 leading-snug drop-shadow-sm">
                One platform for learning, skill development, assessments, and examinations.
              </p>

              <p className="text-sm sm:text-base text-slate-200 max-w-xl leading-relaxed drop-shadow-sm font-medium">
                BridgeAI brings students, trainers, and institutions together through a unified digital learning and assessment experience.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <button
                  onClick={onNavigateRegister}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    const el = document.getElementById('platform-features');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/25 backdrop-blur-md text-sm font-bold rounded-xl transition-all"
                >
                  Explore Platform
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-semibold text-slate-300 border-t border-white/15">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                  <span>Learn</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                  <span>Practice</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                  <span>Assess</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                  <span>Achieve</span>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Premium Interactive Platform Preview Card */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-7 transition-all">
                {/* Console Preview Body */}
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Institutional Platform</span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">Unified Learning Console</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Curriculum • Coding Sandbox • Proctored Assessments</p>
                  </div>

                  {/* 3 Interactive Highlight Badges */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Interactive Courses</p>
                          <p className="text-[10px] text-slate-500">Modules, PDFs, GitHub &amp; Lectures</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold font-mono text-blue-600 dark:text-blue-400">18 Topics</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <Code2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Embedded Code Sandbox</p>
                          <p className="text-[10px] text-slate-500">Python, Java, C++, C# Test Suites</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold font-mono text-emerald-600 dark:text-emerald-400">0s Latency</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Lockdown Proctoring</p>
                          <p className="text-[10px] text-slate-500">Full-Screen &amp; Tab-Switch Detection</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold font-mono text-indigo-600 dark:text-indigo-400">Strict Anti-Cheat</span>
                    </div>
                  </div>

                  {/* Actions leading to dedicated pages */}
                  <div className="pt-2 flex flex-col gap-2.5">
                    <button
                      onClick={onNavigateLogin}
                      className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Sign In to Your Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={onNavigateRegister}
                      className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors text-center"
                    >
                      Create Student Account (via Email OTP) &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. TRUST / PLATFORM HIGHLIGHTS STRIP */}
      <section className="bg-white dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              { icon: BookOpen, title: 'TRAINING', desc: 'Structured learning experiences' },
              { icon: FileCheck, title: 'ASSESSMENTS', desc: 'MCQ & coding evaluations' },
              { icon: Award, title: 'CERTIFICATIONS', desc: 'Track achievements' },
              { icon: Building2, title: 'INSTITUTIONS', desc: 'Built for institutional learning' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/60">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black tracking-wider uppercase text-slate-900 dark:text-white">{title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHAT IS BRIDGEAI? */}
      <section id="platform-features" className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Core Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Everything You Need to Learn and Assess
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400">
            BridgeAI connects learning, practice, assessment, and performance in one unified platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              icon: BookOpen,
              title: 'Learning & Training',
              desc: 'Access structured courses, learning resources, and training programs with rich multimedia and assignment tracking.'
            },
            {
              icon: FileCheck,
              title: 'Online Assessments',
              desc: 'Conduct and participate in secure MCQ and examination-based assessments with randomized questions and time limits.'
            },
            {
              icon: Code2,
              title: 'Coding Assessments',
              desc: 'Evaluate programming skills through an integrated coding environment with real-time compilation and automatic test suites.'
            },
            {
              icon: Award,
              title: 'Certifications',
              desc: 'Track completed learning and assessment achievements with tamper-proof institutional scorecards and certificates.'
            },
            {
              icon: BarChart3,
              title: 'Performance Analytics',
              desc: 'Understand learner progress and assessment performance with cohort analytics, strike counts, and score distributions.'
            },
            {
              icon: Building2,
              title: 'Institution Management',
              desc: 'Manage students, trainers, courses, assessments, and learning programs with hierarchical role-based governance.'
            }
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[18px] p-6 lg:p-7 shadow-2xs hover:shadow-md hover:border-blue-400/60 dark:hover:border-blue-500/60 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 border border-blue-100 dark:border-blue-900/60 group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. HOW BRIDGEAI WORKS */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Methodology
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              From Learning to Achievement
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              A structured progression pipeline connecting pedagogy with real verification.
            </p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-slate-300 dark:bg-slate-700 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
              {[
                { num: '01', title: 'Create Account', desc: 'Sign in or register with verified email OTP credentials.', color: 'border-blue-500 text-blue-600' },
                { num: '02', title: 'Join Training', desc: 'Enroll in designated subjects, cohorts, and curricula.', color: 'border-indigo-500 text-indigo-600' },
                { num: '03', title: 'Learn & Practice', desc: 'Work through modules, materials, and coding tasks.', color: 'border-purple-500 text-purple-600' },
                { num: '04', title: 'Take Assessment', desc: 'Attend proctored MCQ & live programming exams.', color: 'border-teal-500 text-teal-600' },
                { num: '05', title: 'Track Progress', desc: 'Review scorecards, strike logs, and certifications.', color: 'border-emerald-500 text-emerald-600' },
              ].map(({ num, title, desc, color }) => (
                <div key={num} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs space-y-3">
                  <div className={`w-12 h-12 mx-auto rounded-full bg-slate-50 dark:bg-slate-800 border-2 ${color} flex items-center justify-center font-black text-sm shadow-xs`}>
                    {num}
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">{title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. PLATFORM FOR EVERYONE */}
      <section id="built-for-everyone" className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Tailored Experiences
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Built for Every Learning Journey
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Dedicated consoles designed around the distinct needs of learners, faculty, and administrative leaders.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Students */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:border-emerald-400/80 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md">
                For Students
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Learn. Practice. Excel.</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Learn, practice, take assessments, and track your progress through an intuitive, focus-driven portal.
              </p>
              <ul className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Interactive course syllabus with video lectures</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Real-time multi-language coding editor</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Instant scorecard and performance analytics</span>
                </li>
              </ul>
            </div>
            <div className="pt-8">
              <button
                onClick={onNavigateRegister}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span>Explore Student Experience</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Trainers */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:border-blue-400/80 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md">
                For Trainers
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Teach. Assess. Mentor.</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Create courses, assign assessments, evaluate learners, and control re-attempt permissions with granular accuracy.
              </p>
              <ul className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Schedule proctored MCQ &amp; coding exams</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Evaluate project repositories &amp; assignments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Control 1-click student re-take overrides</span>
                </li>
              </ul>
            </div>
            <div className="pt-8">
              <button
                onClick={onNavigateLogin}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span>Explore Trainer Experience</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Institutions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-8 shadow-sm flex flex-col justify-between hover:border-indigo-400/80 transition-all">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800/60">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md">
                For Institutions
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">Govern. Monitor. Scale.</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Manage learners, trainers, training programs, and examinations with immutable audit logging and institutional oversight.
              </p>
              <ul className="space-y-2 pt-2 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Institutional cohort mapping &amp; department branches</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Boss Admin &amp; Super Admin multi-tier authorization</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>Proctoring strike records &amp; audit trails</span>
                </li>
              </ul>
            </div>
            <div className="pt-8">
              <button
                onClick={onNavigateLogin}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span>Explore Institution Experience</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ASSESSMENT EXPERIENCE */}
      <section id="assessment-experience" className="py-20 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white border-y border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Examination Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Professional Assessments. Built for Real Skills.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Conduct secure, structured assessments that evaluate knowledge and practical skills.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-xl dark:shadow-2xl mb-12 transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700/80 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="font-mono text-slate-500 dark:text-slate-400 ml-2 text-[11px] hidden sm:inline">BridgeAI Secure Proctored Browser • Institutional Session Active</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 px-2.5 py-0.5 rounded-full font-mono text-[11px] border border-rose-200 dark:border-rose-500/30 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>34:12 remaining</span>
                </span>
                <span className="bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Proctoring Active</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
              <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 space-y-4 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Question 04 of 08</span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">10 Marks</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Reverse a Linked List with Constraints</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Given the <code className="text-amber-600 dark:text-amber-300 font-mono">head</code> of a singly linked list, reverse the list in-place and return the reversed list. Ensure your solution achieves <code className="text-emerald-600 dark:text-emerald-300 font-mono">O(n)</code> time and <code className="text-emerald-600 dark:text-emerald-300 font-mono">O(1)</code> space complexity.
                </p>

                <div className="bg-white dark:bg-slate-950/80 rounded-lg p-3 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="text-slate-400 dark:text-slate-500">// Sample Test Case 1</p>
                  <p><span className="text-blue-600 dark:text-blue-400">Input:</span> head = [1,2,3,4,5]</p>
                  <p><span className="text-emerald-600 dark:text-emerald-400">Output:</span> [5,4,3,2,1]</p>
                </div>
              </div>

              <div className="lg:col-span-7 bg-[#0F172A] border border-slate-800 rounded-xl p-4 font-mono text-xs flex flex-col justify-between text-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                    <span>Solution.py (Python 3.11)</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>All 5 Hidden Test Cases Passed</span>
                    </span>
                  </div>
                  <pre className="pt-2 text-slate-300 leading-relaxed overflow-x-auto text-[11px]">
{`class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev, curr = None, head
        while curr:
            next_node = curr.next
            curr.next = prev
            prev = curr
            curr = next_node
        return prev`}
                  </pre>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Memory: 16.4 MB</span>
                    <span>•</span>
                    <span>Runtime: 38 ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold">Run Code</span>
                    <span className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold">Submit Solution</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 space-y-2 shadow-xs transition-colors">
              <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">MCQ Assessments</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">Flexible multiple-choice assessments with randomized shuffling, timer control, and instant automated grading.</p>
            </div>
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 space-y-2 shadow-xs transition-colors">
              <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Coding Assessments</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">Real coding problems with integrated execution and evaluation across Python, Java, C++, and C# against hidden test suites.</p>
            </div>
            <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-5 space-y-2 shadow-xs transition-colors">
              <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Proctored Examinations</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">Secure examination experience with tab-switch detection, fullscreen enforcement, and automated strike logging.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">
            {[
              'Timed assessments',
              'Auto submission',
              'Question navigation',
              'Mark for review',
              'Coding evaluation',
              'Performance reports'
            ].map((f) => (
              <div key={f} className="p-2.5 rounded-lg bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 flex items-center justify-center gap-1.5 shadow-2xs">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. LEARNING EXPERIENCE */}
      <section className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Continuous Curriculum
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Learning That Moves With You
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Keep every student engaged through structured course pathways, interactive assignments, and verified milestones that connect directly to final exam eligibility.
            </p>

            <div className="space-y-3 pt-2">
              {[
                { title: 'Courses', desc: 'Syllabus breakdown by modules, topics & credits' },
                { title: 'Lessons & Recordings', desc: 'Pre-recorded faculty sessions and notes' },
                { title: 'Assignments', desc: 'Structured PDF & text submissions with trainer reviews' },
                { title: 'Certificates', desc: 'Verifiable course completion credentials' }
              ].map(({ title, desc }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Realistic Laptop Mockup Resting Directly on Ground */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
            <div className="relative w-full max-w-xl lg:max-w-2xl flex flex-col items-center">
              {/* Realistic ground shadow directly beneath laptop base */}
              <div className="absolute -bottom-1 sm:bottom-0 w-4/5 h-6 bg-slate-900/20 dark:bg-black/60 rounded-[100%] blur-xl pointer-events-none transform -skew-x-6" />

              <img
                src={LAPTOP_MOCKUP}
                alt="BridgeAI Learning & Examination Platform on Laptop"
                className="relative z-10 w-full h-auto select-none pointer-events-none filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_20px_35px_rgba(0,0,0,0.5)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 9. WHY BRIDGEAI */}
      <section id="why-bridgeai" className="py-20 bg-slate-50 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Institutional Advantage
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Why Choose BridgeAI?
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Engineered for academic integrity, high reliability, and intuitive ease of use.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { icon: Lock, title: 'SECURE', desc: 'Designed for controlled and reliable assessments with lockdown proctoring.' },
              { icon: Layers, title: 'INTEGRATED', desc: 'Training and examination in one platform without third-party tool fragmentation.' },
              { icon: Terminal, title: 'PRACTICAL', desc: 'Evaluate real-world programming and technical skills through sandbox test suites.' },
              { icon: BarChart3, title: 'DATA-DRIVEN', desc: 'Understand learner performance through meaningful institutional insights.' },
              { icon: Users, title: 'SCALABLE', desc: 'Built to support thousands of students, trainers, and multiple university campuses.' }
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-3 text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black tracking-wider uppercase text-slate-900 dark:text-white">{title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. PRODUCT SHOWCASE */}
      <section id="product-showcase" className="py-20 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Interactive Product Tour
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Seamless Workflow From End to End
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
            Follow the learner journey from first login to certified graduation.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {showcaseTabs.map((tab, idx) => (
            <button
              key={tab.id}
              onClick={() => setActiveShowcase(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeShowcase === idx
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-10 shadow-sm">
          <div className="max-w-2xl mb-6">
            <span className="text-xs font-black uppercase text-blue-600 dark:text-blue-400">
              Stage 0{activeShowcase + 1}
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {showcaseTabs[activeShowcase].title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {showcaseTabs[activeShowcase].desc}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white p-6 sm:p-8 font-sans">
            {activeShowcase === 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-sm font-bold text-slate-200">Welcome Back, Rahul Kumar • IIT Kharagpur</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">Enrolled Student</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Completed Courses</span>
                    <p className="text-2xl font-black text-white mt-1">04</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Exam Attendance</span>
                    <p className="text-2xl font-black text-white mt-1">100%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Institutional Rank</span>
                    <p className="text-2xl font-black text-emerald-400 mt-1">Top 5%</p>
                  </div>
                </div>
              </div>
            )}

            {activeShowcase === 1 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-sm font-bold text-slate-200">Course: Cloud Architecture &amp; Distributed Systems</span>
                  <span className="text-xs font-mono text-blue-400">Prof. Bharat Sharma</span>
                </div>
                <p className="text-xs text-slate-300">
                  Interactive lecture recordings, downloadable starter kits, and peer team assignments automatically synced with submission deadlines.
                </p>
              </div>
            )}

            {activeShowcase === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-sm font-bold text-slate-200">Mid-Term Proctored Examination • MCQ Phase</span>
                  <span className="text-xs text-amber-400">0 Violations Logged</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">Q: What is the time complexity of searching an element in a balanced Binary Search Tree?</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-400">A) O(n)</div>
                    <div className="p-2.5 rounded bg-blue-600/30 border border-blue-500 text-blue-200 font-bold flex items-center justify-between">
                      <span>B) O(log n)</span>
                      <span className="flex items-center gap-1 text-[11px] text-blue-300"><Check className="w-3 h-3 stroke-[3]" /> Selected</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-400">C) O(1)</div>
                    <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-400">D) O(n log n)</div>
                  </div>
                </div>
              </div>
            )}

            {activeShowcase === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-sm font-bold text-slate-200">Problem 2: Implement LRU Cache</span>
                  <span className="text-xs font-mono text-emerald-400">Verdict: Accepted (100/100)</span>
                </div>
                <div className="p-3 bg-slate-900 rounded font-mono text-xs text-slate-300">
                  $ bridgeai-sandbox --run solution.cpp --target testcases.json<br />
                  &gt; Compiling with g++ 17... [OK]<br />
                  &gt; Test Case 1: [PASSED in 4ms]<br />
                  &gt; Test Case 2: [PASSED in 7ms]<br />
                  &gt; Memory Footprint: 2.1 MB within quota.
                </div>
              </div>
            )}

            {activeShowcase === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-sm font-bold text-slate-200">Official Exam Scorecard &amp; Audit Summary</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">PASSED WITH DISTINCTION</span>
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500 block">Total Score</span>
                    <span className="text-lg font-black text-white">92 / 100</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Proctoring Strikes</span>
                    <span className="text-lg font-black text-emerald-400">0 Clean</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Certificate Status</span>
                    <span className="text-lg font-black text-blue-400">Issued &amp; Verified</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 11. DESIGNED FOR MODERN LEARNING */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
              Our Educational Purpose
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Designed for Modern Indian Education
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              BridgeAI was built to replace fragmented tools with an authentic, unified academic environment where curriculum delivery, live programming practice, and safe examinations meet institutional standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Fair &amp; Honest Assessments</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Objective scoring, randomized item banks, and locked browsers safeguard candidate integrity, ensuring every student gets recognized on pure merit.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Faculty Empowerment</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Trainers spend less time wrestling with spreadsheets and more time mentoring learners with automated grading and instant feedback workflows.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Verifiable Career Readiness</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Hands-on coding challenges and authenticated institutional certificates translate academic coursework directly into workplace-ready skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 12. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-20 lg:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Answers &amp; Clarity
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Everything you need to know about BridgeAI policies, proctoring, and access roles.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={faq.q}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFaq === idx ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
              </button>
              {openFaq === idx && (
                <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 13. FINAL CTA SECTION */}
      <section className="py-20 lg:py-24 bg-slate-100 dark:bg-[#0B1528] text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-800 relative transition-colors">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-white/10 backdrop-blur-md border border-blue-200 dark:border-white/20 text-blue-700 dark:text-white text-xs font-semibold">
            <span>GET STARTED TODAY</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Ready to Start Your Learning Journey?
          </h2>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Learn new skills. Practice what you learn. Assess your progress. Achieve more.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onNavigateRegister}
              className="px-7 py-3.5 bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateLogin}
              className="px-7 py-3.5 bg-white dark:bg-white/10 hover:bg-slate-50 dark:hover:bg-white/15 text-slate-800 dark:text-white border border-slate-300 dark:border-white/20 rounded-xl text-sm font-bold transition-all shadow-xs"
            >
              Sign In
            </button>
          </div>

          <div className="pt-10 border-t border-slate-200 dark:border-white/10 max-w-lg mx-auto space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">Looking to bring BridgeAI to your institution?</p>
            <button
              onClick={onNavigateLogin}
              className="text-xs font-bold text-blue-600 dark:text-amber-400 hover:text-blue-700 dark:hover:text-amber-300 hover:underline inline-flex items-center gap-1"
            >
              <span>Partner With BridgeAI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
