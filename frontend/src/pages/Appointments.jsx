import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Calendar, Clock, User, UserCheck, XCircle, CheckCircle,
  AlertCircle, FileText, Stethoscope, Activity, RefreshCw,
  LogIn, LogOut, ClipboardList, Ban
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import PrescriptionModal from '../components/PrescriptionModal';
import ConfirmDialog from '../components/ConfirmDialog';

/* ─── Status config ─────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  pending:    { label: 'Pending',     bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  confirmed:  { label: 'Confirmed',   bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  checked_in: { label: 'In Service',  bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-400'    },
  checked_out:{ label: 'Checked Out', bg: 'bg-violet-100',  text: 'text-violet-700',  dot: 'bg-violet-400'  },
  completed:  { label: 'Completed',   bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-400'  },
  cancelled:  { label: 'Cancelled',   bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-400'    },
};

const FILTER_TABS = [
  { value: 'all',        label: 'All' },
  { value: 'pending',    label: 'Pending' },
  { value: 'confirmed',  label: 'Confirmed' },
  { value: 'checked_in', label: 'In Service' },
  { value: 'checked_out',label: 'Checked Out' },
  { value: 'completed',  label: 'Completed' },
  { value: 'cancelled',  label: 'Cancelled' },
];

/* ─── Status Badge ──────────────────────────────────────────────────────── */
const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

/* ─── Main Component ────────────────────────────────────────────────────── */
const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Receptionists default to 'pending' — they see only what needs confirming.
  const [filter, setFilter] = useState(user?.role === 'receptionist' ? 'pending' : 'all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, appointmentId: null });

  useEffect(() => { fetchAppointments(); }, [filter]);

  /* ── Data fetching ── */
  const fetchAppointments = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await api.get('/appointments', { params });
      if (res.data.success) setAppointments(res.data.data.appointments);
    } catch {
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ── Actions ── */
  const handleCancel = (appointmentId) => setConfirmDialog({ open: true, appointmentId });

  const confirmCancel = async () => {
    const { appointmentId } = confirmDialog;
    setConfirmDialog({ open: false, appointmentId: null });
    try {
      const res = await api.patch(`/appointments/${appointmentId}/cancel`, { reason: 'Cancelled by patient' });
      if (res.data.success) { toast.success('Appointment cancelled'); fetchAppointments(); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  // Used by the receptionist/superadmin status modal
  const handleUpdateStatus = async (status) => {
    if (!selectedAppointment) return;
    try {
      const res = await api.patch(`/appointments/${selectedAppointment._id}/status`, { status });
      if (res.data.success) {
        toast.success(`Appointment ${status}`);
        setShowStatusModal(false);
        setSelectedAppointment(null);
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Used by inline doctor Check In / Check Out buttons (direct, no modal)
  const handleUpdateStatusDirect = async (appointment, status) => {
    try {
      const res = await api.patch(`/appointments/${appointment._id}/status`, { status });
      if (res.data.success) {
        toast.success(status === 'checked_in' ? 'Patient checked in ✓' : 'Patient checked out ✓');
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const openStatusModal = (appt) => { setSelectedAppointment(appt); setShowStatusModal(true); };
  const openPrescriptionModal = (appt) => { setSelectedAppointment(appt); setShowPrescriptionModal(true); };

  const getAvailableStatuses = (appt) => {
    if (user.role === 'receptionist' || user.role === 'superadmin') {
      if (appt.status === 'pending')   return ['confirmed', 'cancelled'];
      if (appt.status === 'confirmed') return ['cancelled'];
      if (appt.status === 'checked_in') return ['cancelled'];
      // checked_out & completed: patient visit is done — no cancel allowed
    }
    return [];
  };

  /* ── Page title & subtitle ── */
  const pageSubtitle =
    user.role === 'patient'      ? 'View and manage your scheduled consultations'
    : user.role === 'receptionist' ? 'Confirm pending bookings — only confirmed ones reach the doctor'
    : user.role === 'doctor'       ? 'Your confirmed patient queue and consultation records'
    : 'Full appointment management across all patients';

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="loading-spinner" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading Appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-[1px] w-8 bg-brand-teal" />
            <span className="text-[11px] font-black text-brand-teal uppercase tracking-widest">
              {user.role === 'patient' ? 'Patient Portal' : user.role === 'doctor' ? 'Clinical Queue' : 'Appointment Manager'}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-brand-dark font-display tracking-tight leading-none">
            {user.role === 'patient' ? 'My Appointments'
              : user.role === 'doctor' ? 'Patient Queue'
              : 'Appointments'}
          </h1>
          <p className="text-slate-500 font-medium max-w-lg">{pageSubtitle}</p>
        </div>

        <button
          onClick={() => fetchAppointments(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 rounded-full shadow-sm hover:shadow-md text-[10px] font-black text-slate-600 uppercase tracking-widest transition-all hover:bg-brand-dark hover:text-white group"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
          Refresh
        </button>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
              filter === tab.value
                ? 'bg-brand-dark text-white shadow-lg'
                : 'bg-white text-slate-500 border border-slate-100 hover:border-brand-teal/40 hover:text-brand-teal shadow-sm'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Appointment Cards ── */}
      {appointments.length > 0 ? (
        <div className="space-y-4">
          {appointments.map((appt, i) => (
            <AppointmentCard
              key={appt._id}
              appt={appt}
              user={user}
              onCancel={handleCancel}
              onUpdateStatusDirect={handleUpdateStatusDirect}
              onOpenStatusModal={openStatusModal}
              onOpenPrescription={openPrescriptionModal}
              getAvailableStatuses={getAvailableStatuses}
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-premium p-16 text-center">
          <div className="w-20 h-20 bg-brand-light rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <ClipboardList className="h-10 w-10 text-brand-teal" />
          </div>
          <h3 className="text-2xl font-black text-brand-dark font-display mb-2">No appointments found</h3>
          <p className="text-slate-400 font-medium mb-8">
            {filter !== 'all' ? `No ${filter} appointments at the moment.` : "You don't have any appointments yet."}
          </p>
          {user.role === 'patient' && (
            <a
              href="/patient/book-appointment"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-dark text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-lg"
            >
              <Calendar className="h-4 w-4" />
              Book an Appointment
            </a>
          )}
        </div>
      )}

      {/* ── Status Update Modal (receptionist / superadmin) ── */}
      {showStatusModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-sm w-full p-10 border border-slate-100 animate-scale-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-brand-light rounded-[1.5rem] flex items-center justify-center flex-shrink-0">
                <Activity className="h-7 w-7 text-brand-teal" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Action Required</p>
                <h2 className="text-xl font-black text-brand-dark font-display">Update Status</h2>
              </div>
            </div>

            {/* Patient info */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Patient</p>
              <p className="text-lg font-black text-brand-dark">
                {selectedAppointment.patientId?.userId?.profile?.firstName} {selectedAppointment.patientId?.userId?.profile?.lastName}
              </p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Status</span>
                <StatusBadge status={selectedAppointment.status} />
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 mb-6">
              {getAvailableStatuses(selectedAppointment).map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 active:scale-95 ${
                    status === 'confirmed'
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-100'
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                  }`}
                >
                  {status === 'confirmed' && <CheckCircle className="h-5 w-5" />}
                  {status === 'cancelled' && <Ban className="h-5 w-5" />}
                  <span className="capitalize">{status}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setShowStatusModal(false); setSelectedAppointment(null); }}
              className="w-full py-3.5 border border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-colors text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Prescription Modal ── */}
      {showPrescriptionModal && selectedAppointment && (
        <PrescriptionModal
          isOpen={showPrescriptionModal}
          onClose={() => { setShowPrescriptionModal(false); setSelectedAppointment(null); }}
          appointment={selectedAppointment}
          onSuccess={fetchAppointments}
        />
      )}

      {/* ── Cancel Confirmation ── */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        title="Cancel Appointment?"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmLabel="Yes, Cancel It"
        cancelLabel="Keep Appointment"
        variant="danger"
        onConfirm={confirmCancel}
        onCancel={() => setConfirmDialog({ open: false, appointmentId: null })}
      />
    </div>
  );
};

/* ─── Appointment Card ──────────────────────────────────────────────────── */
const AppointmentCard = ({
  appt, user, onCancel, onUpdateStatusDirect,
  onOpenStatusModal, onOpenPrescription, getAvailableStatuses, style
}) => {
  const isPatient      = user.role === 'patient';
  const isDoctor       = user.role === 'doctor';
  const isReceptionist = user.role === 'receptionist' || user.role === 'superadmin';

  const primaryName = isPatient
    ? `Dr. ${appt.doctorId?.userId?.profile?.firstName || ''} ${appt.doctorId?.userId?.profile?.lastName || 'Unknown'}`
    : `${appt.patientId?.userId?.profile?.firstName || ''} ${appt.patientId?.userId?.profile?.lastName || 'Unknown Patient'}`;

  const availableStatuses = getAvailableStatuses(appt);

  return (
    <div
      className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-premium hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden animate-slide-up"
      style={style}
    >
      {/* Top accent line — colour reflects status */}
      <div className={`h-1 w-full ${
        appt.status === 'confirmed'  ? 'bg-emerald-400'
        : appt.status === 'pending'  ? 'bg-amber-400'
        : appt.status === 'checked_in' ? 'bg-blue-500'
        : appt.status === 'checked_out' ? 'bg-violet-400'
        : appt.status === 'completed' ? 'bg-indigo-400'
        : 'bg-rose-400'
      }`} />

      <div className="p-7 flex flex-col md:flex-row md:items-center gap-6">
        {/* ── Avatar / Icon ── */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-[1.75rem] bg-brand-light flex items-center justify-center group-hover:bg-brand-dark transition-all duration-300">
            <Stethoscope className="h-7 w-7 text-brand-teal group-hover:text-white transition-colors" />
          </div>
        </div>

        {/* ── Main Info ── */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <h3 className="text-xl font-black text-brand-dark font-display">{primaryName}</h3>
            <StatusBadge status={appt.status} />
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            <InfoChip icon={Calendar}>
              {format(new Date(appt.date), 'dd MMM yyyy')}
            </InfoChip>
            <InfoChip icon={Clock}>
              {appt.timeSlot.start} – {appt.timeSlot.end}
            </InfoChip>
            <InfoChip icon={Activity}>
              {appt.consultationType || 'In-person'}
            </InfoChip>
            {!isPatient && appt.patientId?.userId?.profile?.email && (
              <InfoChip icon={User}>
                {appt.patientId.userId.profile.email}
              </InfoChip>
            )}
          </div>

          {appt.symptoms && (
            <p className="mt-3 text-sm text-slate-400 italic bg-slate-50 rounded-xl px-4 py-2 inline-block">
              "{appt.symptoms}"
            </p>
          )}

          {/* Patient Documents */}
          {appt.patientDocuments?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {appt.patientDocuments.map((doc, idx) => (
                <a
                  key={idx}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-light text-brand-teal text-[10px] font-black rounded-xl border border-brand-teal/10 hover:bg-brand-teal/10 transition-colors uppercase tracking-widest"
                >
                  <FileText className="h-3 w-3" />
                  {doc.name?.length > 20 ? doc.name.substring(0, 20) + '…' : doc.name}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0">

          {/* Patient: Cancel */}
          {isPatient && ['pending', 'confirmed'].includes(appt.status) && (
            <ActionButton
              onClick={() => onCancel(appt._id)}
              variant="danger"
              icon={<XCircle className="h-4 w-4" />}
            >
              Cancel
            </ActionButton>
          )}

          {/* Doctor: Check In → Check Out → Prescribe */}
          {isDoctor && (
            <>
              {appt.status === 'confirmed' && (
                <ActionButton
                  onClick={() => onUpdateStatusDirect(appt, 'checked_in')}
                  variant="blue"
                  icon={<LogIn className="h-4 w-4" />}
                >
                  Check In
                </ActionButton>
              )}
              {appt.status === 'checked_in' && (
                <ActionButton
                  onClick={() => onUpdateStatusDirect(appt, 'checked_out')}
                  variant="amber"
                  icon={<LogOut className="h-4 w-4" />}
                >
                  Check Out
                </ActionButton>
              )}
              {appt.status === 'checked_out' && (
                <ActionButton
                  onClick={() => onOpenPrescription(appt)}
                  variant="dark"
                  icon={<FileText className="h-4 w-4" />}
                >
                  Prescribe
                </ActionButton>
              )}
              {appt.status === 'completed' && (
                <ActionButton
                  onClick={() => onOpenPrescription(appt)}
                  variant={appt.prescription ? 'amber-outline' : 'dark'}
                  icon={<FileText className="h-4 w-4" />}
                >
                  {appt.prescription ? 'Update Rx' : 'Give Rx'}
                </ActionButton>
              )}
            </>
          )}

          {/* Receptionist / Superadmin: Status modal */}
          {isReceptionist && availableStatuses.length > 0 && (
            <ActionButton
              onClick={() => onOpenStatusModal(appt)}
              variant="teal"
              icon={<CheckCircle className="h-4 w-4" />}
            >
              {appt.status === 'pending' ? 'Confirm / Cancel' : 'Cancel'}
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Small helpers ─────────────────────────────────────────────────────── */
const InfoChip = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
    {children}
  </div>
);

const BUTTON_VARIANTS = {
  blue:          'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-100',
  amber:         'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-100',
  dark:          'bg-brand-dark text-white hover:bg-slate-800 shadow-sm',
  teal:          'bg-brand-teal text-white hover:opacity-90 shadow-sm',
  danger:        'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200',
  'amber-outline':'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200',
};

const ActionButton = ({ onClick, variant = 'dark', icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-200 active:scale-95 whitespace-nowrap ${BUTTON_VARIANTS[variant]}`}
  >
    {icon}
    {children}
  </button>
);

export default Appointments;
