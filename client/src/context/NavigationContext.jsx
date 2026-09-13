import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const NavigationContext = createContext(null);

export const getDefaultTabForRole = (role) => {
  switch (role) {
    case 'ROLE_TRAINER':
      return 'published-assignments';
    case 'ROLE_BOSS_ADMIN':
      return 'hierarchy';
    case 'ROLE_SUPER_ADMIN':
      return 'trainers';
    case 'ROLE_VIGILANCE_OFFICER':
      return 'live';
    case 'ROLE_STUDENT':
    default:
      return 'assignments';
  }
};

export const parseLocationToState = (loc, defaultUser) => {
  const pathname = loc.pathname || '/';
  const searchParams = new URLSearchParams(loc.search || '');

  let view = defaultUser ? 'portal' : 'landing';
  let tab = searchParams.get('tab') || (defaultUser ? getDefaultTabForRole(defaultUser.role) : 'assignments');
  let examId = searchParams.get('exam') ? Number(searchParams.get('exam')) : null;
  let courseId = searchParams.get('course') ? Number(searchParams.get('course')) : null;
  let examResult = null;

  if (pathname === '/login') {
    view = 'login';
  } else if (pathname === '/register') {
    view = 'register';
  } else if (pathname === '/' && !defaultUser) {
    view = 'landing';
  } else if (pathname === '/project-hub') {
    view = 'portal';
    tab = 'projects';
  } else if (pathname.startsWith('/protected-exam/')) {
    view = 'portal';
    const rawId = pathname.replace('/protected-exam/', '').split('/')[0];
    if (rawId && !isNaN(Number(rawId))) examId = Number(rawId);
  } else if (pathname.startsWith('/exam/')) {
    view = 'portal';
    const rawId = pathname.replace('/exam/', '').split('/')[0];
    if (rawId && !isNaN(Number(rawId))) examId = Number(rawId);
  } else if (pathname.startsWith('/course/')) {
    view = 'portal';
    const rawId = pathname.replace('/course/', '').split('/')[0];
    if (rawId && !isNaN(Number(rawId))) courseId = Number(rawId);
  } else if (pathname === '/exam-result') {
    view = 'portal';
  } else if (pathname.startsWith('/portal')) {
    view = 'portal';
  }

  return {
    _bridgeai: true,
    view,
    tab,
    examId,
    courseId,
    examResult
  };
};

export const getUrlForState = (st, user) => {
  if (st.examId) {
    const search = st.tab ? `?tab=${encodeURIComponent(st.tab)}` : '';
    return `/protected-exam/${st.examId}${search}`;
  }
  if (st.courseId) {
    const search = st.tab ? `?tab=${encodeURIComponent(st.tab)}` : '';
    return `/course/${st.courseId}${search}`;
  }
  if (st.examResult) {
    const search = st.tab ? `?tab=${encodeURIComponent(st.tab)}` : '';
    return `/exam-result${search}`;
  }
  if (st.view === 'login') return '/login';
  if (st.view === 'register') return '/register';
  if (st.view === 'landing') return '/';

  // Portal view
  const defaultTab = user ? getDefaultTabForRole(user.role) : 'assignments';
  if (st.tab && st.tab !== defaultTab) {
    return `/portal?tab=${encodeURIComponent(st.tab)}`;
  }
  return '/portal';
};

export const NavigationProvider = ({ children, user }) => {
  const isInitializedRef = useRef(false);
  const stateRef = useRef({
    view: user ? 'portal' : 'landing',
    tab: user ? getDefaultTabForRole(user.role) : 'assignments',
    examId: null,
    courseId: null,
    examResult: null
  });

  const [view, setViewState] = useState(() => {
    if (typeof window === 'undefined') return user ? 'portal' : 'landing';
    const parsed = parseLocationToState(window.location, user);
    return parsed.view;
  });

  const [tab, setTabState] = useState(() => {
    if (typeof window === 'undefined') return user ? getDefaultTabForRole(user.role) : 'assignments';
    const parsed = parseLocationToState(window.location, user);
    return parsed.tab;
  });

  const [activeExamId, setActiveExamIdState] = useState(() => {
    if (typeof window === 'undefined') return null;
    const parsed = parseLocationToState(window.location, user);
    return parsed.examId;
  });

  const [activeCourseId, setActiveCourseIdState] = useState(() => {
    if (typeof window === 'undefined') return null;
    const parsed = parseLocationToState(window.location, user);
    return parsed.courseId;
  });

  const [examResult, setExamResultState] = useState(null);

  // Keep stateRef in sync with current state
  useEffect(() => {
    stateRef.current = {
      view,
      tab,
      examId: activeExamId,
      courseId: activeCourseId,
      examResult
    };
  }, [view, tab, activeExamId, activeCourseId, examResult]);

  // Initial mount: replace initial history state if not tagged (only run once)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const existingState = window.history.state;
    if (!existingState || !existingState._bridgeai) {
      const parsed = parseLocationToState(window.location, user);
      const initialState = {
        _bridgeai: true,
        view: parsed.view,
        tab: parsed.tab,
        examId: parsed.examId,
        courseId: parsed.courseId,
        examResult: null
      };
      stateRef.current = initialState;
      const url = getUrlForState(initialState, user);
      window.history.replaceState(initialState, '', url);
    } else {
      // Restore from existing history state (e.g. reload or session restore)
      stateRef.current = {
        view: existingState.view || (user ? 'portal' : 'landing'),
        tab: existingState.tab || (user ? getDefaultTabForRole(user?.role) : 'assignments'),
        examId: existingState.examId || null,
        courseId: existingState.courseId || null,
        examResult: existingState.examResult || null
      };
      if (existingState.view) setViewState(existingState.view);
      if (existingState.tab) setTabState(existingState.tab);
      if (existingState.examId !== undefined) setActiveExamIdState(existingState.examId);
      if (existingState.courseId !== undefined) setActiveCourseIdState(existingState.courseId);
      if (existingState.examResult !== undefined) setExamResultState(existingState.examResult);
    }
  }, [user]);

  // Handle popstate: fired when user clicks Back, Forward, mouse buttons, or trackpad swipe back
  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      if (state && state._bridgeai) {
        const nextState = {
          view: state.view || (user ? 'portal' : 'landing'),
          tab: state.tab || (user ? getDefaultTabForRole(user?.role) : 'assignments'),
          examId: state.examId || null,
          courseId: state.courseId || null,
          examResult: state.examResult || null
        };
        stateRef.current = nextState;
        setViewState(nextState.view);
        setTabState(nextState.tab);
        setActiveExamIdState(nextState.examId);
        setActiveCourseIdState(nextState.courseId);
        setExamResultState(nextState.examResult);
      } else {
        // Fallback for untagged initial state
        const parsed = parseLocationToState(window.location, user);
        const nextState = {
          view: parsed.view,
          tab: parsed.tab,
          examId: parsed.examId,
          courseId: parsed.courseId,
          examResult: null
        };
        stateRef.current = nextState;
        setViewState(nextState.view);
        setTabState(nextState.tab);
        setActiveExamIdState(nextState.examId);
        setActiveCourseIdState(nextState.courseId);
        setExamResultState(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Navigation core action
  const navigateTo = useCallback((updates, { replace = false } = {}) => {
    const currentState = stateRef.current;
    const nextState = {
      _bridgeai: true,
      ...currentState,
      ...updates
    };

    // Synchronously update stateRef immediately so successive clicks have fresh state
    stateRef.current = nextState;

    // Calculate URL
    const url = getUrlForState(nextState, user);

    if (replace) {
      window.history.replaceState(nextState, '', url);
    } else {
      window.history.pushState(nextState, '', url);
    }

    if (updates.view !== undefined) setViewState(updates.view);
    if (updates.tab !== undefined) setTabState(updates.tab);
    if (updates.examId !== undefined) setActiveExamIdState(updates.examId);
    if (updates.courseId !== undefined) setActiveCourseIdState(updates.courseId);
    if (updates.examResult !== undefined) setExamResultState(updates.examResult);
  }, [user]);

  // Specific helpers
  const navigateToView = useCallback((nextView, options) => {
    navigateTo({ view: nextView, examId: null, courseId: null, examResult: null }, options);
  }, [navigateTo]);

  const selectTab = useCallback((nextTab, options) => {
    // Avoid pushing duplicate entry if already on the same tab with no modal/exam active
    if (
      nextTab === stateRef.current.tab &&
      !stateRef.current.examId &&
      !stateRef.current.courseId &&
      !stateRef.current.examResult
    ) {
      return;
    }
    navigateTo({ view: 'portal', tab: nextTab, examId: null, courseId: null, examResult: null }, options);
  }, [navigateTo]);

  const openExam = useCallback((examId, fromTab) => {
    const currentTab = fromTab || stateRef.current.tab;
    navigateTo({ view: 'portal', tab: currentTab, examId, examResult: null });
  }, [navigateTo]);

  const closeExam = useCallback(() => {
    // If the browser history stack has an exam entry, pop it via history.back()
    // This cleanly removes the exam from history and returns to the previous tab
    if (window.history.state && window.history.state.examId) {
      window.history.back();
    } else {
      navigateTo({ examId: null }, { replace: true });
    }
  }, [navigateTo]);

  const openCourse = useCallback((courseId) => {
    navigateTo({ view: 'portal', courseId, examId: null, examResult: null });
  }, [navigateTo]);

  const closeCourse = useCallback(() => {
    if (window.history.state && window.history.state.courseId) {
      window.history.back();
    } else {
      navigateTo({ courseId: null }, { replace: true });
    }
  }, [navigateTo]);

  const openExamResult = useCallback((resultData) => {
    // Replace the exam entry with exam result so going back returns to the previous tab
    navigateTo({ examId: null, examResult: resultData }, { replace: true });
  }, [navigateTo]);

  const closeExamResult = useCallback(() => {
    if (window.history.state && window.history.state.examResult) {
      window.history.back();
    } else {
      navigateTo({ examResult: null }, { replace: true });
    }
  }, [navigateTo]);

  const value = {
    view,
    tab,
    activeExamId,
    activeCourseId,
    examResult,
    navigateTo,
    navigateToView,
    selectTab,
    openExam,
    closeExam,
    openCourse,
    closeCourse,
    openExamResult,
    closeExamResult
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
