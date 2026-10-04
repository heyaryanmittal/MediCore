import React from 'react';
import { APPOINTMENT_STATUS_CONFIG, BILL_STATUS_CONFIG, ROLE_BADGE_CONFIG } from '../constants/statusConfig';

/**
 * Reusable StatusBadge component for rendering styled badge indicators.
 */
const StatusBadge = ({ status, type = 'appointment' }) => {
  if (type === 'bill') {
    const cfg = BILL_STATUS_CONFIG[status] || { label: status, badge: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
    );
  }

  if (type === 'role') {
    const cfg = ROLE_BADGE_CONFIG[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-800' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
        {cfg.label}
      </span>
    );
  }

  // Default: appointment / general status badge
  const cfg = APPOINTMENT_STATUS_CONFIG[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

export default StatusBadge;
