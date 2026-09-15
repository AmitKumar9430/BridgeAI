import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
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
  const { user, switchRoleDemo, isBossAdmin, isSuperAdmin, isTrainer, isVigilanceOfficer } = useAuth();
  const {
    view,
    tab,
    activeExamId,
    activeCourseId,
    examResult,
    navigateToView,
    selectTab,
    openExam,
    closeExam,
    openCourse,
    closeCourse,
    openExamResult,
    closeExamResult
  } = useNavigation();

  // Auto-switch to vigilance officer if requested via QR scan / URL parameter on phone or tablet
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      if (roleParam && (roleParam.toLowerCase() === 'vigilance' || roleParam.toUpperCase() === 'VIGILANCE_OFFICER')) {
        switchRoleDemo('VIGILANCE_OFFICER');
        navigateToView('portal', { replace: true });
      }
    } catch {
      // ignore
    }
  }, [switchRoleDemo, navigateToView]);

  // If user logs out, go to landing page
  useEffect(() => {
    if (!user && view === 'portal') {
      navigateToView('landing', { replace: true });
    }
  }, [user, view, navigateToView]);

  // Dedicated Login Page
  if (view === 'login') {
    return (
      <LoginPage
        onNavigateLanding={() => navigateToView('landing')}
        onNavigateRegister={() => navigateToView('register')}
        onLoginSuccess={() => navigateToView('portal')}
      />
    );
  }

  // Dedicated Register Page (Only Students)
  if (view === 'register') {
    return (
      <RegisterPage
        onNavigateLanding={() => navigateToView('landing')}
        onNavigateLogin={() => navigateToView('login')}
        onRegisterSuccess={() => navigateToView('portal')}
      />
    );
  }

  // Primary Workspace View
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col font-sans text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      {/* Top Navbar */}
      <Navbar
        onOpenLogin={() => navigateToView('login')}
        onOpenRegister={() => navigateToView('register')}
        onNavigateLanding={() => navigateToView('landing')}
        onNavigateDashboard={() => navigateToView('portal')}
        currentView={view}
      />

      {/* Main Workspace Body: Kept mounted with display: none when taking an exam to preserve internal state & scroll position */}
      <main
        style={{ display: activeExamId ? 'none' : 'block' }}
        className={view === 'landing' ? "flex-1 w-full" : "flex-1 w-full max-w-[99%] mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6"}
      >
        {view === 'landing' ? (
          <LandingPage
            onNavigateLogin={() => navigateToView('login')}
            onNavigateRegister={() => navigateToView('register')}
            onExploreCourses={() => {
              if (user) {
                navigateToView('portal');
              } else {
                navigateToView('login');
              }
            }}
          />
        ) : examResult ? (
          <ExamResultPage
            result={examResult}
            onBackToDashboard={closeExamResult}
            onRetakeExam={openExam}
          />
        ) : activeCourseId ? (
          <CourseDetailsPage
            courseId={activeCourseId}
            onBack={closeCourse}
            onOpenExam={openExam}
          />
        ) : isBossAdmin ? (
          <BossAdminDashboard activeTab={tab} onSelectTab={selectTab} />
        ) : isSuperAdmin ? (
          <SuperAdminDashboard activeTab={tab} onSelectTab={selectTab} />
        ) : isTrainer ? (
          <TrainerDashboard activeTab={tab} onSelectTab={selectTab} />
        ) : isVigilanceOfficer ? (
          <VigilanceDashboard activeTab={tab} onSelectTab={selectTab} />
        ) : (
          <StudentDashboard
            activeTab={tab}
            onSelectTab={selectTab}
            onOpenExam={openExam}
            onSelectCourse={openCourse}
            onViewExamResult={openExamResult}
          />
        )}
      </main>

      {/* Crisp Clean Footer: Strictly only visible on landing page, never on any console or during exam */}
      {view === 'landing' && !activeExamId && (
        <Footer />
      )}

      {/* Proctored Exam: Takes full-screen priority when active */}
      {activeExamId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0B1120]">
          <ErrorBoundary onReset={closeExam}>
            <ProctoredExamPage
              examId={activeExamId}
              onExamCompleted={openExamResult}
              onCancel={closeExam}
            />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}

function AppWithNavigation() {
  const { user } = useAuth();
  return (
    <NavigationProvider user={user}>
      <AppContent />
    </NavigationProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppWithNavigation />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
