import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, UserCheck, GraduationCap, Award, ShieldCheck } from 'lucide-react';

export const RoleSwitcherDemo = ({ onRoleSelected }) => {
  const { user, switchRoleDemo } = useAuth();

  const handleSelect = async (roleKey) => {
    await switchRoleDemo(roleKey);
    if (onRoleSelected) onRoleSelected();
  };

  return (
    <aside aria-label="Portal role switcher" className="bg-slate-100 dark:bg-[#0F172A] text-slate-800 dark:text-white px-2 sm:px-4 py-2 text-xs border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="w-full max-w-[99%] mx-auto px-2 sm:px-4 lg:px-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Switch View:</span>
          <span className="text-slate-800 dark:text-slate-300 font-semibold">{user?.fullName || 'Guest'}</span>
        </div>

        {/* Clean Role Switcher without metadata */}
        <div className="inline-flex rounded-md bg-slate-200/80 dark:bg-slate-800 p-0.5 border border-slate-300/80 dark:border-slate-700">
          <button
            onClick={() => handleSelect('BOSS_ADMIN')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              user?.role === 'ROLE_BOSS_ADMIN'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Boss Admin
          </button>

          <button
            onClick={() => handleSelect('SUPER_ADMIN')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              user?.role === 'ROLE_SUPER_ADMIN'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Super Admin
          </button>

          <button
            onClick={() => handleSelect('TRAINER')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              user?.role === 'ROLE_TRAINER'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Trainer
          </button>

          <button
            onClick={() => handleSelect('STUDENT')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              user?.role === 'ROLE_STUDENT'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            Student
          </button>

          <button
            onClick={() => handleSelect('VIGILANCE_OFFICER')}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              user?.role === 'ROLE_VIGILANCE_OFFICER'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Vigilance Officer
          </button>
        </div>
      </div>
    </aside>
  );
};
