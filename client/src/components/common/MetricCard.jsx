import React from 'react';

export const MetricCard = ({ title, value, subtitle, icon: Icon, color = 'blue', onClick }) => {
  const colorMap = {
    blue: { iconBg: 'bg-blue-50 dark:bg-blue-950/60', iconText: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
    emerald: { iconBg: 'bg-emerald-50 dark:bg-emerald-950/60', iconText: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
    amber: { iconBg: 'bg-amber-50 dark:bg-amber-950/60', iconText: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    purple: { iconBg: 'bg-purple-50 dark:bg-purple-950/60', iconText: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
    slate: { iconBg: 'bg-slate-100 dark:bg-slate-800', iconText: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' }
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm transition-all ${
        onClick
          ? 'cursor-pointer hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 active:scale-[0.99]'
          : 'hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-md border ${scheme.border} ${scheme.iconBg} ${scheme.iconText}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};
