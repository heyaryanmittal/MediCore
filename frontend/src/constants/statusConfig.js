export const APPOINTMENT_STATUS_CONFIG = {
  pending:     { label: 'Pending',     bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  confirmed:   { label: 'Confirmed',   bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  checked_in:  { label: 'In Service',  bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-400'    },
  checked_out: { label: 'Checked Out', bg: 'bg-violet-100',  text: 'text-violet-700',  dot: 'bg-violet-400'  },
  completed:   { label: 'Completed',   bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-400'  },
  cancelled:   { label: 'Cancelled',   bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-400'    },
};

export const BILL_STATUS_CONFIG = {
  paid:            { label: 'Paid',      dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-100', bar: 'from-emerald-400 to-emerald-600' },
  unpaid:          { label: 'Unpaid',    dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border border-rose-100',       bar: 'from-rose-400 to-rose-600' },
  overdue:         { label: 'Overdue',   dot: 'bg-red-600',     badge: 'bg-red-50 text-red-700 border border-red-100',           bar: 'from-red-400 to-red-600' },
  partially_paid:  { label: 'Partial',   dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border border-amber-100',     bar: 'from-amber-400 to-amber-600' },
  draft:           { label: 'Draft',     dot: 'bg-slate-400',   badge: 'bg-slate-50 text-slate-600 border border-slate-200',     bar: 'from-slate-300 to-slate-500' },
  sent:            { label: 'Sent',      dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border border-blue-100',        bar: 'from-blue-400 to-blue-600' },
  pending_payment: { label: 'Pending',   dot: 'bg-yellow-500',  badge: 'bg-yellow-50 text-yellow-700 border border-yellow-100',  bar: 'from-yellow-400 to-yellow-500' },
  refunded:        { label: 'Refunded',  dot: 'bg-violet-500',  badge: 'bg-violet-50 text-violet-700 border border-violet-100',  bar: 'from-violet-400 to-violet-600' },
};

export const ROLE_BADGE_CONFIG = {
  doctor:       { label: 'Doctor',       bg: 'bg-purple-100', text: 'text-purple-800' },
  receptionist: { label: 'Receptionist', bg: 'bg-green-100',  text: 'text-green-800'  },
  admin:        { label: 'Admin',        bg: 'bg-blue-100',   text: 'text-blue-800'   },
  superadmin:   { label: 'Super Admin',  bg: 'bg-red-100',    text: 'text-red-800'    },
  patient:      { label: 'Patient',      bg: 'bg-teal-100',   text: 'text-teal-800'   },
};
