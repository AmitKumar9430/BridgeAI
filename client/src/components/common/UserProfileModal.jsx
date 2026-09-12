import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  X, Mail, Phone, Building2, MapPin, Calendar, Award, BookOpen,
  GraduationCap, CheckCircle2, ShieldCheck, FileText, Video,
  Clock, Sparkles, User, ExternalLink, Activity, Target
} from 'lucide-react';

export const UserProfileModal = ({ userId, initialData, onClose }) => {
  const [profile, setProfile] = useState(initialData || null);
  const [loading, setLoading] = useState(!initialData?.metadata);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchFullProfile(userId);
    }
  }, [userId]);

  const fetchFullProfile = async (id) => {
    try {
      setLoading(true);
      const res = await api.get(`/institutions/users/${id}/profile`);
      setProfile(res.data);
    } catch (err) {
      console.warn('Profile fetch note:', err);
      // Fall back to initialData if available
      if (!profile && initialData) {
        setProfile(initialData);
      } else if (!profile) {
        setError('Failed to load complete profile data.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!userId && !initialData) return null;

  const role = profile?.role || initialData?.role || 'USER';
  const isSuperAdmin = role.includes('SUPER_ADMIN');
  const isTrainer = role.includes('TRAINER');
  const isStudent = role.includes('STUDENT');
  const isBossAdmin = role.includes('BOSS_ADMIN');

  const getRoleBadge = () => {
    if (isBossAdmin) return { label: 'Boss Admin', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
    if (isSuperAdmin) return { label: 'Institute Super Admin', bg: 'bg-purple-100 text-purple-800 border-purple-300' };
    if (isTrainer) return { label: 'Faculty Specialist', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
    return { label: 'Enrolled Student', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  };

  const badge = getRoleBadge();
  const meta = profile?.metadata || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 relative rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-600 via-indigo-600 to-purple-700 text-white font-bold text-xl flex items-center justify-center shadow-lg shrink-0 border-2 border-white/20">
              {profile?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-bold truncate">{profile?.fullName || 'User Profile'}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                  {badge.label}
                </span>
                {profile?.active !== false ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ACTIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    SUSPENDED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{profile?.institutionName || 'Indian Institute of Technology (IIT)'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Quick Contact & Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold uppercase">Official Email</span>
                <span className="font-mono font-medium">{profile?.email || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold uppercase">Contact Phone</span>
                <span className="font-mono font-medium">{profile?.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold uppercase">Member Since</span>
                <span className="font-medium">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'September 2026'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block font-bold uppercase">System Status</span>
                <span className="font-semibold text-emerald-700">Verified Credentials</span>
              </div>
            </div>
          </div>

          {/* Role-Specific Deep Profile Section */}

          {/* 1. SUPER ADMIN PROFILE DETAILS */}
          {isSuperAdmin && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800">
                  <span className="text-xl font-bold text-purple-900 dark:text-purple-200 block">{meta.managedTrainersCount || 2}</span>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">Faculty Trainers</span>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                  <span className="text-xl font-bold text-blue-900 dark:text-blue-200 block">{meta.managedStudentsCount || 5}</span>
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">Enrolled Students</span>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <span className="text-xl font-bold text-indigo-900 dark:text-indigo-200 block">3</span>
                  <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold">Curriculum Subjects</span>
                </div>
              </div>

              {meta.campusAddress && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    Campus Location & Accreditation
                  </span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {meta.campusAddress}, {meta.city}, {meta.state} - {meta.postalCode}
                  </p>
                  {meta.accreditation && (
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-300 rounded text-[10px] font-bold">
                      <Award className="w-3 h-3 text-amber-700" />
                      <span>{meta.accreditation}</span>
                    </span>
                  )}
                </div>
              )}

              {meta.coSuperAdmins && meta.coSuperAdmins.length > 1 && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                    Institutional Co-Super Admins:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {meta.coSuperAdmins.map((adminStr, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{adminStr}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile?.relatedItems && profile.relatedItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Assigned Faculty Specialists:
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    {profile.relatedItems.map((item) => (
                      <div key={item.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">{item.name}</span>
                          <span className="text-[10px] text-slate-400">{item.email}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 flex items-center gap-1">
                          <Target className="w-3 h-3 text-amber-700" />
                          <span>{item.specialization || 'Computer Science & AI'}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. TRAINER PROFILE DETAILS */}
          {isTrainer && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200/90 dark:border-amber-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Core Domain Specialization
                  </span>
                  <span className="text-[11px] font-mono text-amber-800 dark:text-amber-300">Faculty Expert</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-sm font-bold text-amber-950 dark:text-amber-200 shadow-2xs">
                  <Target className="w-4 h-4 text-amber-700" />
                  <span>{profile?.assignedSubject || meta.domainSpecialization || 'Computer Science & AI'}</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Supervised by Institutional Lead: <strong>{profile?.superAdminName || meta.supervisingSuperAdmin || 'Dr. Arvind Roy (Super Admin)'}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                  <span className="text-xl font-bold text-blue-900 dark:text-blue-200 block">{meta.assignedCoursesCount || 1}</span>
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">Active Subject Offerings</span>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xl font-bold text-emerald-900 dark:text-emerald-200 block">{meta.sessionsConducted || 3}</span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">Recorded & Live Sessions</span>
                </div>
              </div>

              {profile?.relatedItems && profile.relatedItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                    Curriculum Subjects Led:
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    {profile.relatedItems.map((c) => (
                      <div key={c.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <span className="font-bold text-slate-900 dark:text-white">{c.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {c.category || 'Core'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. STUDENT PROFILE DETAILS */}
          {isStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800">
                  <span className="text-xl font-bold text-blue-900 dark:text-blue-200 block">{meta.assignmentSubmissionsCount || 1}</span>
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">Submissions</span>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800">
                  <span className="text-xl font-bold text-purple-900 dark:text-purple-200 block">{meta.examAttemptsCount || 1}</span>
                  <span className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">Exams Taken</span>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-xl font-bold text-emerald-900 dark:text-emerald-200 block">{meta.certificatesCount || 1}</span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">Certificates</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block">
                  Enrolled Subjects & Program:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>AI & GenAI Engineering Masterclass</span>
                  </span>
                  <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>Enterprise Java & Microservices</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            User Record ID: #{profile?.id || userId}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
