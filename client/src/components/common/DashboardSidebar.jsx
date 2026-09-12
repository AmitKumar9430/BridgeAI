import React from 'react';
import {
  PanelLeftClose, Building2, Target,
  LayoutGrid, ChevronRight, CheckCircle2, Shield, KeyRound
} from 'lucide-react';

export const DashboardSidebar = ({
  isOpen,
  onToggle,
  title = "Essentials Menu",
  user,
  items = [],
  activeTab,
  onSelectTab,
  roleTheme = "blue", // "blue" | "emerald" | "amber" | "rose" | "purple"
  statsSummary,
  onChangePassword,
  onManageCredentials
}) => {
  if (!isOpen) return null;

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'ROLE_BOSS_ADMIN':
        return <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">Boss Admin</span>;
      case 'ROLE_SUPER_ADMIN':
        return <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">Super Admin</span>;
      case 'ROLE_TRAINER':
        return <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">Trainer Faculty</span>;
      case 'ROLE_VIGILANCE_OFFICER':
        return <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">Vigilance Officer</span>;
      default:
        return <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">Enrolled Student</span>;
    }
  };

  const getActiveStyles = (isActive) => {
    if (isActive) {
      switch (roleTheme) {
        case 'indigo':
          return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-bold border-l-4 border-indigo-600 shadow-2xs';
        case 'purple':
          return 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold border-l-4 border-purple-600 shadow-2xs';
        case 'emerald':
          return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border-l-4 border-emerald-600 shadow-2xs';
        case 'amber':
          return 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold border-l-4 border-amber-600 shadow-2xs';
        case 'rose':
          return 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold border-l-4 border-rose-600 shadow-2xs';
        default:
          return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold border-l-4 border-blue-600 shadow-2xs';
      }
    }
    return 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white font-medium border-l-4 border-transparent';
  };

  return (
    <aside className="w-64 sm:w-72 shrink-0 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden sticky top-20 h-[calc(100vh-5.5rem)] flex flex-col justify-between z-20 transition-colors">
      {/* Top Header & Collapse Action */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Quick-access navigation</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1"
          title="Switch to Attached Tabs"
          aria-label="Switch to Attached Tabs"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* User Context Strip */}
      {user && (
        <div className="p-3 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.fullName || 'User Profile'}</span>
            {getRoleBadge()}
          </div>
          {user.institutionName && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="truncate font-medium">{user.institutionName}</span>
            </div>
          )}
          {user.assignedSubject && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">{user.assignedSubject}</span>
            </div>
          )}
          {onChangePassword && (
            <button
              type="button"
              onClick={onChangePassword}
              className="w-full mt-2 py-1.5 px-2.5 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Change Password</span>
            </button>
          )}
          {onManageCredentials && (
            <button
              type="button"
              onClick={onManageCredentials}
              className="w-full mt-1.5 py-1.5 px-2.5 bg-gradient-to-r from-rose-500/10 to-purple-500/10 hover:from-rose-500/20 hover:to-purple-500/20 border border-rose-300/40 dark:border-rose-500/30 rounded-lg text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-rose-500" />
              <span>Manage Email & Login</span>
            </button>
          )}
        </div>
      )}

      {/* Essentials Items List */}
      <div className="flex-1 p-2 space-y-1 overflow-y-auto">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-2 py-1 block">
          Platform Essentials
        </span>

        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 ${getActiveStyles(isActive)}`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                {Icon && (
                  <Icon className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                  }`} />
                )}
                <span className="truncate">{item.label}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {item.count !== undefined && item.count !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {item.count}
                  </span>
                )}

                {item.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    item.badgeColor === 'emerald'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                      : item.badgeColor === 'purple'
                      ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                      : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info Strip */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-2 shrink-0">
        {statsSummary && (
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>{statsSummary.label}</span>
            <span className="font-bold text-slate-900 dark:text-white">{statsSummary.value}</span>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="w-full mt-1.5 py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
        >
          <PanelLeftClose className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Switch to Attached Tabs</span>
        </button>
      </div>
    </aside>
  );
};
