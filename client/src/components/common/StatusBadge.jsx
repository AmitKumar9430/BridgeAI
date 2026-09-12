import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'SUBMITTED':
      case 'PASSED':
      case 'COMPLETED':
      case 'EVALUATED':
        return {
          bg: 'bg-emerald-100 dark:bg-emerald-950/60',
          text: 'text-emerald-800 dark:text-emerald-300',
          border: 'border-emerald-300 dark:border-emerald-800',
          dot: 'bg-emerald-600 dark:bg-emerald-400',
          label: status.replace(/_/g, ' ')
        };
      case 'IN_PROGRESS':
      case 'UNDER_REVIEW':
      case 'LIVE':
        return {
          bg: 'bg-amber-100 dark:bg-amber-950/60',
          text: 'text-amber-800 dark:text-amber-300',
          border: 'border-amber-300 dark:border-amber-800',
          dot: 'bg-amber-600 dark:bg-amber-400',
          label: status.replace(/_/g, ' ')
        };
      case 'TERMINATED_BY_VIOLATION':
      case 'FAILED':
        return {
          bg: 'bg-rose-100 dark:bg-rose-950/60',
          text: 'text-rose-800 dark:text-rose-300',
          border: 'border-rose-300 dark:border-rose-800',
          dot: 'bg-rose-600 dark:bg-rose-400',
          label: status === 'TERMINATED_BY_VIOLATION' ? 'TERMINATED (VIOLATION)' : 'FAILED'
        };
      case 'NOT_STARTED':
      case 'UPCOMING':
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-800',
          text: 'text-slate-800 dark:text-slate-300',
          border: 'border-slate-300 dark:border-slate-700',
          dot: 'bg-slate-500 dark:bg-slate-400',
          label: status ? status.replace(/_/g, ' ') : 'NOT STARTED'
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
};
