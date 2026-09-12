import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/common/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { TrainerDashboard } from './pages/TrainerDashboard';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { BossAdminDashboard } from './pages/BossAdminDashboard';
import { VigilanceDashboard } from './pages/VigilanceDashboard';
import { CourseDetailsPage } from './pages/CourseDetailsPage';
import { ProctoredExamPage } from './pages/ProctoredExamPage';
import { ExamResultPage } from './pages/ExamResultPage';
import { Footer } from './components/common/Footer';
import { ErrorBoundary } from './components/common/ErrorBoundary';

function AppContent() {
  const { user, switchRoleDemo, isBossAdmin, isSuperAdmin, isTrainer, isVigilanceOfficer, isStudent } = useAuth();

  // Primary page view: 'landing' | 'login' | 'register' | 'portal'
  const [view, setView] = useState(() => (user ? 'portal' : 'landing'));

  const [activeCourseId, setActiveCourseId] = useState(null);
  const [activeExamId, setActiveExamId] = useState(null);
  const [examResult, setExamResult] = useState(null);

  // Auto-switch to vigilance officer if requested via QR scan / URL parameter on phone or tablet
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (roleParam && (roleParam.toLowerCase() === 'vigilance' || roleParam.toUpperCase() === 'VIGILANCE_OFFICER')) {
        switchRoleDemo('VIGILANCE_OFFICER');
        setView('portal');
      }
    } catch {
      // ignore
    }
  }, []);

  // If user logs out, go to landing page
  useEffect(() => {
    if (!user && view === 'portal') {
      setView('landing');
    }
  }, [user, view]);

  // Handlers
  const handleOpenExam = (examId) => {
    setActiveExamId(examId);
    setExamResult(null);
  };

  const handleExamCompleted = (resultData) => {
    setActiveExamId(null);
    setExamResult(resultData);
  };

  const handleSelectCourse = (courseId) => {
    setActiveCourseId(courseId);
  };

  // 1. Proctored Exam: Takes full-screen priority
  if (activeExamId) {
    return (
      <ErrorBoundary onReset={() => setActiveExamId(null)}>
        <ProctoredExamPage
          examId={activeExamId}
          onExamCompleted={handleExamCompleted}
          onCancel={() => setActiveExamId(null)}
        />
      </ErrorBoundary>
    );
  }

  // 2. Dedicated Login Page
  if (view === 'login') {
    return (
      <LoginPage
        onNavigateLanding={() => setView('landing')}
        onNavigateRegister={() => setView('register')}
        onLoginSuccess={() => setView('portal')}
      />
    );
  }

  // 3. Dedicated Register Page (Only Students)
  if (view === 'register') {
    return (
      <RegisterPage
        onNavigateLanding={() => setView('landing')}
        onNavigateLogin={() => setView('login')}
        onRegisterSuccess={() => setView('portal')}
      />
    );
  }

  // 4. Portal View / Landing View
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col font-sans text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      {/* Top Navbar */}
      <Navbar
        onOpenLogin={() => setView('login')}
        onOpenRegister={() => setView('register')}
        onNavigateLanding={() => setView('landing')}
        onNavigateDashboard={() => setView('portal')}
        currentView={view}
      />

      {/* Main Workspace Body */}
      <main className={view === 'landing' ? "flex-1 w-full" : "flex-1 w-full max-w-[99%] mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6"}>
        {view === 'landing' ? (
          <LandingPage
            onNavigateLogin={() => setView('login')}
            onNavigateRegister={() => setView('register')}
            onExploreCourses={() => {
              if (user) {
                setView('portal');
              } else {
                setView('login');
              }
            }}
          />
        ) : examResult ? (
          <ExamResultPage
            result={examResult}
            onBackToDashboard={() => setExamResult(null)}
            onRetakeExam={handleOpenExam}
          />
        ) : activeCourseId ? (
          <CourseDetailsPage
            courseId={activeCourseId}
            onBack={() => setActiveCourseId(null)}
            onOpenExam={handleOpenExam}
          />
        ) : isBossAdmin ? (
          <BossAdminDashboard />
        ) : isSuperAdmin ? (
          <SuperAdminDashboard />
        ) : isTrainer ? (
          <TrainerDashboard />
        ) : isVigilanceOfficer ? (
          <VigilanceDashboard />
        ) : (
          <StudentDashboard
            onOpenExam={handleOpenExam}
            onSelectCourse={handleSelectCourse}
          />
        )}
      </main>

      {/* Crisp Clean Footer: Strictly only visible on landing page, never on any console */}
      {view === 'landing' && (
        <Footer />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
