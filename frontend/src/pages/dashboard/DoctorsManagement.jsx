import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Search, Eye, UserCheck, UserX, 
  Calendar, Clock, Save, Edit2, XCircle, Star, 
  Stethoscope, Briefcase, GraduationCap, Award, 
  ShieldCheck, Trash2, Edit, X, Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const DoctorsManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityForm, setAvailabilityForm] = useState({ days: [], timeSlots: [] });
  const [leaves, setLeaves] = useState([]);
  const [newLeaveDate, setNewLeaveDate] = useState('');
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isEditingDoctor, setIsEditingDoctor] = useState(false);
  const navigate = useNavigate();

  const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/admin/doctors');
      if (response.data.success) setDoctors(response.data.data.doctors);
    } catch { toast.error('Failed to fetch doctors data'); }
    finally { setLoading(false); }
  };

  const toggleDoctorStatus = async (doctorId, currentStatus) => {
    try {
      const response = await api.patch(`/admin/user/${doctorId}/status`, { isActive: !currentStatus });
      if (response.data.success) {
        const newStatus = !currentStatus;
        toast.success(`Doctor ${newStatus ? 'authorized' : 'unauthorized'} successfully`);
        setDoctors(prev => prev.map(d => d.userId?._id === doctorId ? { ...d, userId: { ...d.userId, isActive: newStatus } } : d));
        setSelectedDoctor(prev => prev && prev.userId?._id === doctorId ? { ...prev, userId: { ...prev.userId, isActive: newStatus } } : prev);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const startEditingAvailability = () => {
    setAvailabilityForm({ days: selectedDoctor?.availability?.days || [], timeSlots: selectedDoctor?.availability?.timeSlots || [] });
    setIsEditingAvailability(true);
  };

  const toggleDay = (day) => {
    setAvailabilityForm(prev => {
      const days = prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day];
      return { ...prev, days };
    });
  };

  const addTimeSlot = () => setAvailabilityForm(prev => ({ ...prev, timeSlots: [...prev.timeSlots, { start: '09:00', end: '17:00' }] }));
  const removeTimeSlot = (index) => setAvailabilityForm(prev => ({ ...prev, timeSlots: prev.timeSlots.filter((_, i) => i !== index) }));
  const updateTimeSlot = (index, field, value) => setAvailabilityForm(prev => { const slots = [...prev.timeSlots]; slots[index] = { ...slots[index], [field]: value }; return { ...prev, timeSlots: slots }; });

  const saveAvailability = async () => {
    if (!availabilityForm.days.length) { toast.error('Please select at least one day'); return; }
    if (!availabilityForm.timeSlots.length) { toast.error('Please add at least one time slot'); return; }
    try {
      setSavingAvailability(true);
      const response = await api.patch('/doctor/availability', { days: availabilityForm.days, timeSlots: availabilityForm.timeSlots, doctorId: selectedDoctor._id });
      if (response.data.success) {
        const updatedDoctor = { ...selectedDoctor, availability: response.data.data.doctor.availability };
        setSelectedDoctor(updatedDoctor);
        setDoctors(prev => prev.map(d => d._id === updatedDoctor._id ? updatedDoctor : d));
        setIsEditingAvailability(false);
        toast.success('Availability updated successfully');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update availability');
    } finally { setSavingAvailability(false); }
  };

  const fetchDoctorLeaves = async (doctorId) => {
    try {
      setLoadingLeaves(true);
      const response = await api.get(`/receptionist/doctors/${doctorId}/leaves`);
      if (response.data.success) setLeaves(response.data.data.leaves);
    } catch { toast.error('Failed to fetch doctor leaves'); }
    finally { setLoadingLeaves(false); }
  };

  const handleAddLeave = async () => {
    if (!newLeaveDate) { toast.error('Please select a date'); return; }
    try {
      const response = await api.post(`/receptionist/doctors/${selectedDoctor._id}/leave`, { date: newLeaveDate });
      if (response.data.success) { toast.success('Leave marked successfully'); setLeaves(response.data.data.leaves); setNewLeaveDate(''); }
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to mark leave'); }
  };

  const handleRemoveLeave = async (date) => {
    try {
      const response = await api.delete(`/receptionist/doctors/${selectedDoctor._id}/leave/${date}`);
      if (response.data.success) { toast.success('Leave removed successfully'); setLeaves(response.data.data.leaves); }
    } catch { toast.error('Failed to remove leave'); }
  };

  const handleDeleteDoctor = async () => {
    if (!doctorToDelete) return;
    try {
      const response = await api.delete(`/admin/user/${doctorToDelete.userId._id}`);
      if (response.data.success) {
        toast.success('Doctor deleted successfully');
        setDoctors(prev => prev.filter(d => d._id !== doctorToDelete._id));
        setShowDeleteConfirm(false);
        setDoctorToDelete(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete doctor');
    }
  };

  const handleEditDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setEditForm({
      firstName: doctor.userId.profile.firstName,
      lastName: doctor.userId.profile.lastName,
      specialization: doctor.specialization,
      department: doctor.department,
      experience: doctor.experience,
      qualifications: doctor.qualifications,
      consultationFee: doctor.consultationFee,
      licenseNumber: doctor.licenseNumber,
      phone: doctor.userId.profile.phone
    });
    setIsEditingDoctor(true);
    setShowDoctorModal(true);
  };

  const handleUpdateDoctor = async () => {
    try {
      const response = await api.patch(`/admin/doctor/${selectedDoctor._id}`, editForm);
      if (response.data.success) {
        toast.success('Doctor details updated successfully');
        setDoctors(prev => prev.map(d => d._id === selectedDoctor._id ? { ...d, ...editForm, userId: { ...d.userId, profile: { ...d.userId.profile, firstName: editForm.firstName, lastName: editForm.lastName, phone: editForm.phone } } } : d));
        setIsEditingDoctor(false);
        setShowDoctorModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update doctor');
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    if (!doctor || !doctor.userId || !doctor.userId.profile) return false;
    const { firstName = '', lastName = '' } = doctor.userId.profile;
    const email = doctor.userId.email || '';
    const spec = doctor.specialization || '';
    const q = searchTerm.toLowerCase();
    return firstName.toLowerCase().includes(q) || lastName.toLowerCase().includes(q) || email.toLowerCase().includes(q) || spec.toLowerCase().includes(q);
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="loading-spinner"></div></div>;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-brand-dark tracking-tight font-display mb-2">Doctors Management</h1>
          <p className="text-slate-500 font-medium text-lg">Manage medical practitioners</p>
        </div>
        <button onClick={() => navigate('/dashboard/create-staff')} className="btn btn-primary flex items-center shadow-2xl hover:scale-105 active:scale-95 transition-all">
          <UserPlus className="h-5 w-5 mr-3" /> Onboard New Doctor
        </button>
      </div>

      {/* Search */}
      <div className="card-dark group">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-brand-teal transition-colors" />
            <input
              type="text"
              placeholder="Search doctors by name, email, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input bg-white/10 border-white/10 text-white placeholder:text-white/40 pl-12 focus:bg-white/20"
            />
          </div>
          <div className="md:w-64">
            <select className="input bg-white/10 border-white/10 text-white focus:bg-white/20" disabled>
              <option value="doctor" className="text-brand-dark">Doctors</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0 border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {['Staff Member', 'Authority', 'Specialization', 'Contact', 'Status', 'Session', 'Actions'].map((h, i) => (
                  <th key={i} className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Users className="h-12 w-12 text-slate-200" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                        {searchTerm ? 'Search yielded no results' : 'No doctors found'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doctor) => {
                  const isActive = doctor.userId?.isActive;
                  return (
                    <tr key={doctor._id} className="group hover:bg-brand-light transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 rounded-2xl bg-brand-dark flex items-center justify-center text-white font-black shadow-lg transform group-hover:scale-110 transition-transform">
                            {doctor.userId?.profile?.firstName?.charAt(0)}{doctor.userId?.profile?.lastName?.charAt(0)}
                          </div>
                          <div className="ml-5">
                            <div className="text-sm font-black text-brand-dark">
                              Dr. {doctor.userId?.profile?.firstName} {doctor.userId?.profile?.lastName}
                            </div>
                            <div className="text-xs font-medium text-slate-400 tracking-tighter">{doctor.userId?.email?.toLowerCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border bg-brand-teal/5 text-brand-teal border-brand-teal/10">
                          Doctor
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-bold text-slate-600">{doctor.specialization || '—'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-600 tracking-tight">{doctor.userId?.profile?.phone || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{isActive ? 'Active' : 'Locked'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {doctor.userId?.lastLogin ? new Date(doctor.userId.lastLogin).toLocaleDateString() : 'New'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setSelectedDoctor(doctor); setShowDoctorModal(true); setIsEditingDoctor(false); fetchDoctorLeaves(doctor._id); }}
                            className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-brand-teal transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditDoctor(doctor)}
                            className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-blue-500 transition-colors"
                            title="Edit Doctor"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleDoctorStatus(doctor.userId?._id, isActive)}
                            className={`p-2 rounded-lg bg-white shadow-sm border border-slate-100 transition-colors ${isActive ? 'text-amber-400 hover:text-amber-600' : 'text-emerald-400 hover:text-emerald-600'}`}
                            title={isActive ? 'Deactivate' : 'Activate'}
                          >
                            {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => { setDoctorToDelete(doctor); setShowDeleteConfirm(true); }}
                            className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-rose-400 hover:text-rose-600 transition-colors"
                            title="Delete Doctor"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full relative animate-scale-in border border-slate-100">
            <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-black text-brand-dark text-center mb-2">Confirm Deletion</h3>
            <p className="text-slate-500 text-center mb-8 font-medium">Are you sure you want to remove Dr. {doctorToDelete?.userId?.profile?.firstName} from the system? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={handleDeleteDoctor} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200">Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Edit Modal */}
      {showDoctorModal && selectedDoctor && isEditingDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-md" onClick={() => setShowDoctorModal(false)}></div>
          <div className="bg-white rounded-[3rem] shadow-premium w-full max-w-2xl relative animate-slide-up overflow-hidden border border-slate-100">
            <div className="p-10">
              <h2 className="text-3xl font-black font-display text-brand-dark mb-8 flex items-center gap-3">
                <Edit className="h-8 w-8 text-brand-teal" /> Edit Practitioner Profile
              </h2>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                  <input type="text" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} className="input" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                  <input type="text" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} className="input" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialization</label>
                  <input type="text" value={editForm.specialization} onChange={e => setEditForm({ ...editForm, specialization: e.target.value })} className="input" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                  <input type="text" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} className="input" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Experience (Years)</label>
                  <input type="number" value={editForm.experience} onChange={e => setEditForm({ ...editForm, experience: e.target.value })} className="input" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">License Number</label>
                  <input type="text" value={editForm.licenseNumber} onChange={e => setEditForm({ ...editForm, licenseNumber: e.target.value })} className="input" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consultation Fee</label>
                  <input type="number" value={editForm.consultationFee} onChange={e => setEditForm({ ...editForm, consultationFee: e.target.value })} className="input" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                  <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="input" />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Qualifications</label>
                  <textarea value={editForm.qualifications} onChange={e => setEditForm({ ...editForm, qualifications: e.target.value })} className="input min-h-[100px]" />
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={handleUpdateDoctor} className="flex-1 btn btn-primary py-4 font-black uppercase text-xs tracking-widest">Update Records</button>
                <button onClick={() => setIsEditingDoctor(false)} className="flex-1 btn bg-slate-100 text-slate-600 py-4 font-black uppercase text-xs tracking-widest hover:bg-slate-200">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Details Modal */}
      {showDoctorModal && selectedDoctor && !isEditingDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-md animate-fade-in" onClick={() => setShowDoctorModal(false)}></div>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl relative animate-scale-in flex flex-col h-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="shrink-0 bg-brand-dark px-6 py-5 flex items-start justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="h-16 w-16 rounded-xl bg-teal-gradient flex items-center justify-center text-white text-3xl font-black shadow-lg border border-white/20 relative">
                  {selectedDoctor.userId?.profile?.firstName?.[0] || 'D'}
                  {selectedDoctor.userId?.isActive && (
                    <div className="absolute -top-2 -right-2 h-6 w-6 bg-emerald-500 rounded-full border-2 border-brand-dark flex items-center justify-center shadow-md">
                      <ShieldCheck className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest ${selectedDoctor.userId?.isActive ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                      {selectedDoctor.userId?.isActive ? 'Authorized' : 'Access Restricted'}
                    </span>
                    {selectedDoctor.licenseNumber && (
                      <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-white/90 text-[9px] font-bold tracking-widest border border-white/10">
                        LIC: {selectedDoctor.licenseNumber}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    Dr. {selectedDoctor.userId?.profile?.firstName} {selectedDoctor.userId?.profile?.lastName}
                  </h2>
                  <p className="text-brand-teal text-xs font-semibold mt-1">
                    {selectedDoctor.specialization} • {selectedDoctor.department} Ward
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowDoctorModal(false)} 
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors relative z-10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6 custom-scrollbar">
              {/* Stats & Actions */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Experience</p>
                      <p className="text-sm font-bold text-brand-dark">{selectedDoctor.experience} Years</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-brand-light text-brand-teal flex items-center justify-center shrink-0">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Consultation Fee</p>
                      <p className="text-sm font-bold text-brand-dark">₹{selectedDoctor.consultationFee}</p>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/3 flex flex-col justify-end">
                  <button
                    onClick={() => toggleDoctorStatus(selectedDoctor.userId?._id, selectedDoctor.userId?.isActive)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-colors shadow-sm ${selectedDoctor.userId?.isActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'}`}
                  >
                    {selectedDoctor.userId?.isActive ? <><UserX className="h-4 w-4" /> Unauthorize Access</> : <><UserCheck className="h-4 w-4" /> Grant Authorization</>}
                  </button>
                </div>
              </div>

              {/* Qualifications */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="h-4 w-4 text-purple-500" />
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Medical Qualifications</h3>
                </div>
                <p className="text-sm font-semibold text-brand-dark leading-relaxed">
                  {selectedDoctor.qualifications}
                </p>
              </div>

              {/* Availability Section */}
              {isEditingAvailability ? (
                <div className="p-5 bg-white rounded-xl border border-blue-200 shadow-sm">
                  <h3 className="font-bold text-brand-dark mb-4 flex items-center text-sm"><Calendar className="h-4 w-4 mr-2 text-blue-500" />Edit Availability</h3>
                  <div className="mb-5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Available Days</label>
                    <div className="grid grid-cols-7 gap-1.5">
                      {ALL_DAYS.map(day => (
                        <button key={day} type="button" onClick={() => toggleDay(day)}
                          className={`rounded-lg py-1.5 text-xs font-bold transition-all ${availabilityForm.days.includes(day) ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'}`}>
                          {DAY_LABELS[day]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Time Slots</label>
                    <div className="space-y-2">
                      {availabilityForm.timeSlots.map((slot, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="time" value={slot.start} onChange={(e) => updateTimeSlot(idx, 'start', e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none w-32" />
                          <span className="text-slate-400">—</span>
                          <input type="time" value={slot.end} onChange={(e) => updateTimeSlot(idx, 'end', e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none w-32" />
                          <button type="button" onClick={() => removeTimeSlot(idx)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><XCircle className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addTimeSlot} className="mt-3 px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-xs transition-colors">+ Add Slot</button>
                  </div>
                  <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                    <button onClick={() => setIsEditingAvailability(false)} className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors">Cancel</button>
                    <button onClick={saveAvailability} disabled={savingAvailability} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50">
                      <Save className="h-3.5 w-3.5" />{savingAvailability ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-brand-dark flex items-center text-sm"><Calendar className="h-4 w-4 mr-2 text-blue-500" />Weekly Availability</h3>
                    <button onClick={startEditingAvailability} className="px-3 py-1.5 bg-slate-50 text-blue-600 border border-blue-100 hover:bg-blue-50 hover:border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
                      <Edit2 className="h-3.5 w-3.5" />Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 mb-4">
                    {ALL_DAYS.map(day => {
                      const active = selectedDoctor?.availability?.days?.includes(day);
                      return <div key={day} className={`rounded-lg py-1.5 text-center text-xs font-bold ${active ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}>{DAY_LABELS[day]}</div>;
                    })}
                  </div>
                  {selectedDoctor?.availability?.timeSlots?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedDoctor.availability.timeSlots.map((slot, i) => (
                        <span key={i} className="flex items-center bg-blue-50 text-blue-700 border border-blue-100 rounded-lg px-2.5 py-1 text-xs font-semibold">
                          <Clock className="h-3 w-3 mr-1.5" />{slot.start} – {slot.end}
                        </span>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-400 italic">No time slots configured</p>}
                </div>
              )}

              {/* Leaves */}
              <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-brand-dark mb-4 flex items-center text-sm"><XCircle className="h-4 w-4 mr-2 text-rose-500" />Doctor Leaves</h3>
                <div className="flex gap-2 mb-4">
                  <input type="date" value={newLeaveDate} onChange={(e) => setNewLeaveDate(e.target.value)} className="w-40 px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-teal outline-none text-sm" />
                  <button onClick={handleAddLeave} className="px-4 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors">Mark on Leave</button>
                </div>
                {loadingLeaves ? <div className="loading-spinner h-5 w-5 border-brand-teal/30 border-t-brand-teal" /> : leaves.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {leaves.sort().map(date => (
                      <div key={date} className="flex items-center bg-rose-50 text-rose-600 border border-rose-100 rounded-lg px-2.5 py-1 text-xs font-semibold">
                        {new Date(date).toLocaleDateString()}
                        <button onClick={() => handleRemoveLeave(date)} className="ml-1.5 text-rose-400 hover:text-rose-600 transition-colors"><XCircle className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-slate-400 italic">No leaves currently scheduled</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsManagement;
