import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BookMarked, LogOut, Sun, Moon, Menu, X, ArrowRight } from 'lucide-react';

export const Navbar = ({ onOpenLogin, onOpenRegister, onNavigateLanding, onNavigateDashboard, currentView }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (currentView !== 'landing') {
      onNavigateLanding();
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getRolePill = () => {
    switch (user?.role) {
      case 'ROLE_BOSS_ADMIN':
        return <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-rose-200 dark:border-rose-800">Boss Admin</span>;
      case 'ROLE_SUPER_ADMIN':
        return <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-amber-200 dark:border-amber-800">Super Admin</span>;
      case 'ROLE_TRAINER':
        return <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-blue-200 dark:border-blue-800">Trainer</span>;
      case 'ROLE_VIGILANCE_OFFICER':
        return <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-indigo-200 dark:border-indigo-800">Vigilance Officer</span>;
      default:
        return <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-200 dark:border-emerald-800">Student</span>;
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 dark:bg-[#0B1220]/90 backdrop-blur-md shadow-sm border-b border-slate-200/80 dark:border-slate-800/80 py-2.5'
          : 'bg-white/95 dark:bg-[#0B1220]/95 backdrop-blur-sm border-b border-slate-200/60 dark:border-slate-800/60 py-3.5'
      }`}
    >
      <div
        className={`w-full ${
          user ? 'px-4 sm:px-6 lg:px-8' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'
        } flex items-center justify-between`}
      >
        {/* Left: Brand Logo & Title */}
        <button
          onClick={onNavigateLanding}
          className="flex items-center gap-3 text-left group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                BridgeAI
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                Portal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
              Training &amp; Examination Portal
            </p>
          </div>
        </button>

        {/* Center: Navigation Links (Only visible on Landing Page when NOT logged in) */}
        {!user && currentView === 'landing' && (
          <nav className="hidden lg:flex items-center gap-1 text-[13px] font-medium text-slate-600 dark:text-slate-300">
            <button
              onClick={() => scrollToSection('platform-features')}
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
            >
              Platform
            </button>
            <button
              onClick={() => scrollToSection('assessment-experience')}
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('built-for-everyone')}
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
            >
              For Students
            </button>
            <button
              onClick={() => scrollToSection('built-for-everyone')}
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
            >
              For Trainers
            </button>
            <button
              onClick={() => scrollToSection('built-for-everyone')}
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
            >
              For Institutions
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="px-3.5 py-1.5 rounded-lg hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
            >
              About
            </button>
          </nav>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {user ? (
            <div className="flex items-center gap-3">
              <button
                onClick={onNavigateDashboard}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
              >
                <span>Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-right hidden md:block">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {user.fullName ? user.fullName.replace(/\s*\([^)]*\)/g, '').trim() : ''}
                  </span>
                  {getRolePill()}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</span>
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2.5">
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300/80 dark:border-slate-700 rounded-xl transition-all"
              >
                Sign In
              </button>
              <button
                onClick={onOpenRegister}
                className="px-4.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl shadow-sm shadow-blue-500/25 transition-all flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mobile menu trigger for all users on mobile/tablet */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-3 pb-6 bg-white dark:bg-[#0B1220] border-b border-slate-200 dark:border-slate-800 space-y-3 animate-fadeIn">
          {user ? (
            /* Mobile Logged-in Menu */
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{user.fullName}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{user.email}</div>
                </div>
                <div>{getRolePill()}</div>
              </div>

              <div className="flex flex-col space-y-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateDashboard();
                  }}
                  className="w-full py-2.5 px-3 text-left text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span>Open Management Console</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateLanding();
                  }}
                  className="w-full py-2 px-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Platform Home & Overview
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2 px-3 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Mobile Guest Menu */
            <>
              {currentView === 'landing' && (
                <div className="flex flex-col space-y-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <button
                    onClick={() => scrollToSection('platform-features')}
                    className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Platform
                  </button>
                  <button
                    onClick={() => scrollToSection('assessment-experience')}
                    className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Features
                  </button>
                  <button
                    onClick={() => scrollToSection('built-for-everyone')}
                    className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    For Students
                  </button>
                  <button
                    onClick={() => scrollToSection('built-for-everyone')}
                    className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    For Trainers
                  </button>
                  <button
                    onClick={() => scrollToSection('built-for-everyone')}
                    className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    For Institutions
                  </button>
                  <button
                    onClick={() => scrollToSection('faq')}
                    className="text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    About
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}
                  className="w-full py-2.5 text-center text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenRegister(); }}
                  className="w-full py-2.5 text-center text-xs font-bold text-white bg-blue-600 rounded-xl shadow-sm"
                >
                  Get Started →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
};
