import React from 'react';

/**
 * Reusable StatCard for displaying KPI metrics on dashboards and list pages.
 */
const StatCard = ({ icon: Icon, label, value, color = 'bg-blue-500', hint, delay = 0 }) => (
  <div
    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden animate-fade-in"
    style={delay ? { animationDelay: `${delay}ms` } : undefined}
  >
    <div className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-10 rounded-bl-[3rem]`} />
    {Icon && (
      <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center mb-4 text-white shadow-sm`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    )}
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-brand-dark font-display">{value}</p>
    {hint && <p className="text-[10px] text-slate-400 font-medium mt-1">{hint}</p>}
  </div>
);

export default StatCard;
