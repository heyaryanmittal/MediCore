import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Calendar, Clock, User, UserCheck, XCircle, CheckCircle, AlertCircle, Filter, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import PrescriptionModal from '../components/PrescriptionModal';
import ConfirmDialog from '../components/ConfirmDialog';

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, appointmentId: null });
  
  // Reschedule/Reject State
  const [modalMode, setModalMode] = useState('status'); // 'status', 'reject', 'reschedule'
  const [rejectionReason, setRejectionReason] = useState('');
  const [rescheduleData, setRescheduleData] = useState({ date: '', slot: null });
  const [doctorAvailability, setDoctorAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/appointments', { params });
      if (response.data.success) {
        setAppointments(response.data.data.appointments);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleCancel = async (appointmentId) => {
    // Open the custom confirm dialog instead of window.confirm
    setConfirmDialog({ open: true, appointmentId });
  };

  const confirmCancel = async () => {
    const appointmentId = confirmDialog.appointmentId;
    setConfirmDialog({ open: false, appointmentId: null });
    try {
      const response = await api.patch(`/appointments/${appointmentId}/cancel`, {
        reason: 'Cancelled by patient'
      });
      if (response.data.success) {
        toast.success('Appointment cancelled successfully');
        fetchAppointments();
      }
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  const handleUpdateStatus = async (status, extraData = {}) => {
    if (!selectedAppointment) return;

    // If doctor marks as completed, we might want to suggest adding a prescription
    if (user.role === 'doctor' && status === 'completed') {
      setShowStatusModal(false);
      setShowPrescriptionModal(true);
      return;
    }

    try {
      const payload = { status, ...extraData };
      const response = await api.patch(`/appointments/${selectedAppointment._id}/status`, payload);
      if (response.data.success) {
        toast.success(`Appointment ${status} successfully`);
        closeStatusModal();
        fetchAppointments();
      }
    } catch (error) {
      console.error(`Failed to update appointment status:`, error);
      toast.error(error.response?.data?.message || `Failed to update appointment status`);
    }
  };

  const fetchAvailability = async (doctorId) => {
    try {
      setLoadingAvailability(true);
      // We use the patient endpoint as it already has the logic to get availability
      // Alternatively, we could create a doctor-specific one, but this works
      const response = await api.get(`/patient/doctor/${doctorId}/availability`);
      if (response.data.success) {
        setDoctorAvailability(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      toast.error('Failed to load availability');
    } finally {
      setLoadingAvailability(false);
    }
  };

  const openStatusModal = (appointment) => {
    setSelectedAppointment(appointment);
    setModalMode('status');
    setShowStatusModal(true);
    // Pre-fetch availability if doctor might reschedule
    if (user.role === 'doctor') {
      fetchAvailability(appointment.doctorId._id);
    }
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedAppointment(null);
    setModalMode('status');
    setRejectionReason('');
    setRescheduleData({ date: '', slot: null });
  };

  const openPrescriptionModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowPrescriptionModal(true);
  };

  const getAvailableStatuses = (appointment) => {
    if (user.role === 'doctor') {
      if (appointment.status === 'pending') return ['confirmed', 'rejected', 'rescheduled'];
      if (appointment.status === 'confirmed') return ['completed', 'rescheduled'];
      if (appointment.status === 'rescheduled') return ['confirmed', 'rejected'];
    } else if (user.role === 'receptionist' || user.role === 'superadmin') {
      if (appointment.status === 'pending') return ['confirmed', 'cancelled'];
      if (appointment.status === 'confirmed') return ['completed', 'cancelled', 'rescheduled'];
    }
    return [];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rejected': return 'bg-rose-100 text-rose-800';
      case 'rescheduled': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'pending': return <Clock className="h-4 w-4 mr-1" />;
      case 'cancelled': return <XCircle className="h-4 w-4 mr-1" />;
      case 'rejected': return <XCircle className="h-4 w-4 mr-1" />;
      case 'rescheduled': return <Clock className="h-4 w-4 mr-1" />;
      case 'completed': return <UserCheck className="h-4 w-4 mr-1" />;
      default: return <AlertCircle className="h-4 w-4 mr-1" />;
    }
  };

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">
            {user.role === 'patient'
              ? 'View and manage your medical appointments'
              : `Manage ${user.role} schedule and appointments`}
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white p-1 rounded-lg border border-gray-200">
          <Filter className="h-4 w-4 text-gray-400 ml-2" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border-none focus:ring-0 text-sm text-gray-600 bg-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {appointments.length > 0 ? (
          appointments.map((appointment) => (
            <div key={appointment._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.role === 'patient'
                          ? `Dr. ${appointment.doctorId?.userId?.profile?.firstName || ''} ${appointment.doctorId?.userId?.profile?.lastName || 'Unknown'}`
                          : `${appointment.patientId?.userId?.profile?.firstName || ''} ${appointment.patientId?.userId?.profile?.lastName || 'Unknown Patient'}`}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(appointment.date), 'PPPP')}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {appointment.timeSlot.start} - {appointment.timeSlot.end}
                      </div>
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {appointment.consultationType || 'In-person'}
                      </div>
                      {user.role !== 'patient' && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {appointment.patientId?.userId?.profile?.email}
                        </div>
                      )}
                    </div>

                    {appointment.symptoms && (
                      <p className="mt-3 text-sm text-gray-500 italic">
                        " {appointment.symptoms} "
                      </p>
                    )}

                    {(appointment.status === 'cancelled' || appointment.status === 'rejected') && appointment.cancellationReason && (
                      <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-lg">
                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {appointment.status === 'rejected' ? 'Rejection Reason' : 'Cancellation Reason'}
                        </p>
                        <p className="text-sm text-rose-700 italic">
                          "{appointment.cancellationReason}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-center">
                  {user.role === 'patient' && (['pending', 'confirmed', 'rescheduled'].includes(appointment.status)) && (
                    <button
                      onClick={() => handleCancel(appointment._id)}
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}

                  {user.role === 'doctor' && (
                    <>
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => openPrescriptionModal(appointment)}
                          className="px-4 py-2 bg-brand-dark text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Prescribe
                        </button>
                      )}
                      {appointment.status === 'completed' && (
                        <button
                          onClick={() => openPrescriptionModal(appointment)}
                          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${appointment.prescription
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200'
                            : 'bg-brand-dark text-white hover:bg-slate-800'
                            }`}
                        >
                          <FileText className="h-4 w-4" />
                          {appointment.prescription ? 'Update Prescription' : 'Give Prescription'}
                        </button>
                      )}
                    </>
                  )}

                  {(user.role === 'doctor' || user.role === 'receptionist' || user.role === 'superadmin') &&
                    getAvailableStatuses(appointment).length > 0 && (
                      <button
                        onClick={() => openStatusModal(appointment)}
                        className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
                      >
                        Update Status
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No appointments found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              You don't have any appointments matching the selected filter.
            </p>
            {user.role === 'patient' && (
              <a
                href="/patient/book-appointment"
                className="mt-6 inline-block btn-primary px-6 py-2"
              >
                Book Now
              </a>
            )}
          </div>
        )}
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-8 border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-6 font-display">
              Update Appointment Status
            </h2>

            <div className="mb-8 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Patient</p>
              <p className="text-lg font-black text-brand-dark">
                {selectedAppointment.patientId?.userId?.profile?.firstName} {selectedAppointment.patientId?.userId?.profile?.lastName}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Status</span>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(selectedAppointment.status)}`}>
                  {selectedAppointment.status}
                </span>
              </div>
              <div className="mt-2 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-400">
                <span>SCHEDULED FOR</span>
                <span className="text-slate-600">
                  {format(new Date(selectedAppointment.date), 'MMM d')} at {selectedAppointment.timeSlot.start}
                </span>
              </div>
            </div>

            {modalMode === 'status' && (
              <>
                <div className="space-y-4 mb-8">
                  {getAvailableStatuses(selectedAppointment).map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        if (status === 'rejected') setModalMode('reject');
                        else if (status === 'rescheduled') setModalMode('reschedule');
                        else handleUpdateStatus(status);
                      }}
                      className={`w-full py-4 px-6 rounded-2xl font-black font-display text-sm transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md active:scale-95 ${status === 'confirmed'
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                        : status === 'completed'
                          ? 'bg-brand-dark text-white hover:bg-slate-800'
                          : status === 'rescheduled'
                            ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-100'
                            : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                        }`}
                    >
                      {status === 'confirmed' && <CheckCircle className="h-5 w-5" />}
                      {status === 'completed' && <FileText className="h-5 w-5" />}
                      {status === 'cancelled' && <XCircle className="h-5 w-5" />}
                      {status === 'rejected' && <XCircle className="h-5 w-5" />}
                      {status === 'rescheduled' && <Clock className="h-5 w-5" />}
                      <span className="capitalize">{status === 'completed' && user.role === 'doctor' ? 'Complete & Prescribe' : status}</span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={closeStatusModal}
                  className="w-full py-4 px-6 border border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              </>
            )}

            {modalMode === 'reject' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Reason for Rejection</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for the patient..."
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none resize-none h-32 text-sm"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalMode('status')}
                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl border border-slate-200 text-sm transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('rejected', { cancellationReason: rejectionReason })}
                    disabled={!rejectionReason.trim()}
                    className="flex-[2] py-4 bg-rose-600 text-white font-bold rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-[0.98] text-sm disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}

            {modalMode === 'reschedule' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Select New Date</label>
                  <input
                    type="date"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    value={rescheduleData.date}
                    onChange={(e) => {
                      const dateStr = e.target.value;
                      const dayOfWeek = format(new Date(dateStr), 'EEEE').toLowerCase();
                      const isWorkingDay = doctorAvailability?.availability?.days?.includes(dayOfWeek);
                      setRescheduleData({ ...rescheduleData, date: dateStr, slot: null });
                      if (dateStr && !isWorkingDay) {
                        toast.error(`Doctor is not normally available on ${dayOfWeek}s`);
                      }
                    }}
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm"
                  />
                  {rescheduleData.date && doctorAvailability?.availability?.days && !doctorAvailability.availability.days.includes(format(new Date(rescheduleData.date), 'EEEE').toLowerCase()) && (
                    <p className="mt-2 text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Doctor not scheduled for this day
                    </p>
                  )}
                </div>

                {rescheduleData.date && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Select Available Slot</label>
                    {loadingAvailability ? (
                      <div className="flex justify-center p-4">
                        <div className="loading-spinner h-6 w-6"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {doctorAvailability?.availability?.timeSlots.map((slot, i) => {
                          const isBooked = doctorAvailability?.bookedSlots?.some(
                            s => format(new Date(s.date), 'yyyy-MM-dd') === rescheduleData.date && s.timeSlot.start === slot.start
                          );
                          const isSelected = rescheduleData.slot?.start === slot.start;

                          return (
                            <button
                              key={i}
                              disabled={isBooked}
                              onClick={() => setRescheduleData({ ...rescheduleData, slot })}
                              className={`p-2 text-xs rounded-xl border transition-all ${isSelected
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : isBooked
                                  ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                  : 'bg-white border-slate-200 text-slate-600 hover:border-purple-400'
                                }`}
                            >
                              {slot.start}
                            </button>
                          );
                        })}
                        {(!doctorAvailability?.availability?.timeSlots || doctorAvailability.availability.timeSlots.length === 0) && (
                          <p className="col-span-2 text-center text-slate-400 text-xs py-4">No slots available</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setModalMode('status')}
                    className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl border border-slate-200 text-sm transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('rescheduled', { date: rescheduleData.date, timeSlot: rescheduleData.slot })}
                    disabled={!rescheduleData.date || !rescheduleData.slot}
                    className="flex-[2] py-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all active:scale-[0.98] text-sm disabled:opacity-50"
                  >
                    Confirm Reschedule
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedAppointment && (
        <PrescriptionModal
          isOpen={showPrescriptionModal}
          onClose={() => {
            setShowPrescriptionModal(false);
            setSelectedAppointment(null);
          }}
          appointment={selectedAppointment}
          onSuccess={fetchAppointments}
        />
      )}

      {/* Cancel Confirmation Dialog */}
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

export default Appointments;


