import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { sendOtpEmail } from '../services/emailJsService';

const AuthContext = createContext(null);

export const DEMO_USERS = {
  BOSS_ADMIN: {
    email: 'boss@bridgeai.edu',
    fullName: 'Chief Director',
    role: 'ROLE_BOSS_ADMIN',
    password: 'BossAdmin@2026'
  },
  SUPER_ADMIN: {
    email: 'superadmin@bridgeai.edu',
    fullName: 'Dr. Arvind Roy',
    role: 'ROLE_SUPER_ADMIN',
    password: 'SuperAdmin@2026'
  },
  TRAINER: {
    email: 'bharat.trainer@bridgeai.edu',
    fullName: 'Bharat Sharma',
    role: 'ROLE_TRAINER',
    password: 'Trainer@2026'
  },
  STUDENT: {
    email: 'rahul.student@bridgeai.edu',
    fullName: 'Rahul Verma',
    role: 'ROLE_STUDENT',
    password: 'Student@2026'
  },
  VIGILANCE_OFFICER: {
    email: 'rahul.sharma@bridgeai.edu',
    staffId: 'VO-001',
    fullName: 'Rahul Sharma',
    role: 'ROLE_VIGILANCE_OFFICER',
    password: 'Vigilance@2026'
  }
};

const sanitizeUser = (usr) => {
  if (!usr) return usr;
  if (typeof usr.fullName === 'string') {
    return {
      ...usr,
      fullName: usr.fullName.replace(/\s*\([^)]*\)/g, '').trim()
    };
  }
  return usr;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bridgeai_user');
    if (!saved) return null;
    try {
      return sanitizeUser(JSON.parse(saved));
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('bridgeai_token') || null);
  const [loading, setLoading] = useState(false);
  const [lastDispatchedOtp, setLastDispatchedOtp] = useState(null);

  // Send OTP via backend + EmailJS
  const requestOtp = async (email, purpose = 'REGISTRATION', fullName = '') => {
    try {
      const res = await api.post('/auth/send-otp', { email, purpose, fullName });
      const { otpCode, templateParams } = res.data;
      setLastDispatchedOtp({ email, otpCode, purpose });

      // Dispatch to actual email inbox via EmailJS
      await sendOtpEmail(email, fullName, otpCode, purpose);

      return { success: true, otpCode, message: `Verification OTP dispatched to ${email}` };
    } catch (err) {
      console.error('Failed to request OTP:', err);
      // Fallback local OTP simulation for local offline testing
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      setLastDispatchedOtp({ email, otpCode: fallbackCode, purpose });
      return { success: true, otpCode: fallbackCode, message: `OTP generated: ${fallbackCode}` };
    }
  };

  // Register with OTP
  const registerWithOtp = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      const { token: jwtToken, user: userData } = res.data;
      const cleanUser = sanitizeUser(userData);
      setToken(jwtToken);
      setUser(cleanUser);
      localStorage.setItem('bridgeai_token', jwtToken);
      localStorage.setItem('bridgeai_user', JSON.stringify(cleanUser));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    } finally {
      setLoading(false);
    }
  };

  // Login with Password + OTP
  const loginPasswordOtp = async (email, password, otpCode) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login/password-otp', { email, password, otpCode });
      const { token: jwtToken, user: userData } = res.data;
      const cleanUser = sanitizeUser(userData);
      setToken(jwtToken);
      setUser(cleanUser);
      localStorage.setItem('bridgeai_token', jwtToken);
      localStorage.setItem('bridgeai_user', JSON.stringify(cleanUser));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    } finally {
      setLoading(false);
    }
  };

  // Login with OTP only (Boss Admin and Student/Trainer quick-login)
  const loginOtpOnly = async (email, otpCode) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login/otp-only', { email, otpCode });
      const { token: jwtToken, user: userData } = res.data;
      const cleanUser = sanitizeUser(userData);
      setToken(jwtToken);
      setUser(cleanUser);
      localStorage.setItem('bridgeai_token', jwtToken);
      localStorage.setItem('bridgeai_user', JSON.stringify(cleanUser));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    } finally {
      setLoading(false);
    }
  };

  // Switch Role for evaluation demo
  const switchRoleDemo = async (roleKey) => {
    const demo = DEMO_USERS[roleKey];
    if (demo) {
      try {
        const res = await api.post('/auth/demo-login', { role: demo.role });
        const { token: jwtToken, user: userData } = res.data;
        const cleanUser = sanitizeUser(userData);
        setToken(jwtToken);
        setUser(cleanUser);
        localStorage.setItem('bridgeai_token', jwtToken);
        localStorage.setItem('bridgeai_user', JSON.stringify(cleanUser));
        return { success: true, user: cleanUser };
      } catch (err) {
        console.warn('Demo login API fallback:', err);
        const cleanDemo = sanitizeUser(demo);
        setUser(cleanDemo);
        localStorage.setItem('bridgeai_user', JSON.stringify(cleanDemo));
        return { success: true, user: cleanDemo };
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bridgeai_token');
    localStorage.removeItem('bridgeai_user');
  };

  const updateCurrentUser = (userData, jwtToken = null) => {
    const cleanUser = sanitizeUser(userData);
    setUser(cleanUser);
    localStorage.setItem('bridgeai_user', JSON.stringify(cleanUser));
    if (jwtToken) {
      setToken(jwtToken);
      localStorage.setItem('bridgeai_token', jwtToken);
    }
  };

  const isBossAdmin = user?.role === 'ROLE_BOSS_ADMIN';
  const isSuperAdmin = user?.role === 'ROLE_SUPER_ADMIN';
  const isTrainer = user?.role === 'ROLE_TRAINER';
  const isVigilanceOfficer = user?.role === 'ROLE_VIGILANCE_OFFICER';
  const isStudent = user?.role === 'ROLE_STUDENT' || (!user?.role && !isBossAdmin && !isSuperAdmin && !isTrainer && !isVigilanceOfficer);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        lastDispatchedOtp,
        requestOtp,
        registerWithOtp,
        loginPasswordOtp,
        loginOtpOnly,
        switchRoleDemo,
        updateCurrentUser,
        logout,
        isBossAdmin,
        isSuperAdmin,
        isTrainer,
        isVigilanceOfficer,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
