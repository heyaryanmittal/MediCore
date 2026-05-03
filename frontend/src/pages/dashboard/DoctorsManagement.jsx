import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Eye, UserCheck, UserX, Calendar, Clock, Save, Edit2, XCircle, Star, Stethoscope, Briefcase, GraduationCap, Award, ShieldCheck } from 'lucide-react';
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
        <button onClick={() => window.location.href = '/dashboard/create-staff'} className="btn btn-primary flex items-center shadow-2xl hover:scale-105 active:scale-95 transition-all">
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
                  <th key={i} className={`px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${i === 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-8 py-20 text-center">
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
                      <td className="px-8 py-5 whitespace-nowrap">
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
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border bg-brand-teal/5 text-brand-teal border-brand-teal/10">
                          Doctor
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span className="text-xs font-bold text-slate-600">{doctor.specialization || '—'}</span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-600 tracking-tight">{doctor.userId?.profile?.phone || '—'}</div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{isActive ? 'Active' : 'Locked'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {doctor.userId?.lastLogin ? new Date(doctor.userId.lastLogin).toLocaleDateString() : 'New'}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setSelectedDoctor(doctor); setShowDoctorModal(true); fetchDoctorLeaves(doctor._id); }}
                            className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-brand-teal transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleDoctorStatus(doctor.userId?._id, isActive)}
                            className={`p-2 rounded-lg bg-white shadow-sm border border-slate-100 transition-colors ${isActive ? 'text-rose-400 hover:text-rose-600' : 'text-emerald-400 hover:text-emerald-600'}`}
                          >
                            {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
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

      {/* Doctor Details Modal */}
      {showDoctorModal && selectedDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-md animate-fade-in" onClick={() => setShowDoctorModal(false)}></div>
          <div className="bg-white rounded-[3rem] shadow-premium w-full max-w-2xl relative animate-slide-up overflow-hidden border border-slate-100">
            <div className="h-48 bg-brand-dark relative overflow-hidden">
              <div className="absolute top-10 right-10">
                <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur text-[10px] font-black text-white uppercase tracking-widest border border-white/10">License: {selectedDoctor.licenseNumber}</div>
              </div>
              <div className="absolute -bottom-12 left-12 h-40 w-40 rounded-[3rem] bg-teal-gradient shadow-2xl flex items-center justify-center text-white text-5xl font-black border-[10px] border-white relative overflow-hidden group/avatar">
                <div className="absolute inset-0 opacity-10 flex items-center justify-center transform -rotate-12 scale-150 group-hover/avatar:scale-125 transition-transform duration-700">
                  <Stethoscope className="h-full w-full" />
                </div>
                <span className="relative z-10 drop-shadow-lg">{selectedDoctor.userId?.profile?.firstName?.[0] || 'D'}</span>
                {selectedDoctor.userId?.isActive && (
                  <div className="absolute top-3 right-3 h-10 w-10 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg group-hover/avatar:scale-110 transition-transform">
                    <ShieldCheck className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
            </div>

            <div className="px-10 pt-12 pb-10 overflow-y-auto max-h-[75vh]">
              {/* Profile Header Section */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${selectedDoctor.userId?.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                      {selectedDoctor.userId?.isActive ? 'Authorized Practitioner' : 'Access Restricted'}
                    </span>
                    <span className="px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-amber-600" /> Excellence Accredited
                    </span>
                  </div>
                  
                  <h2 className="text-4xl md:text-5xl font-black font-display text-brand-dark leading-tight mb-4">
                    Dr. {selectedDoctor.userId?.profile?.firstName} {selectedDoctor.userId?.profile?.lastName}
                  </h2>
                  
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 w-fit">
                    <div className="p-3 bg-brand-teal text-white rounded-xl shadow-lg shadow-brand-teal/20">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-brand-teal font-black uppercase text-[10px] tracking-[0.2em] mb-0.5">{selectedDoctor.specialization} specialist</p>
                      <p className="text-slate-500 font-bold text-sm capitalize">{selectedDoctor.department} Medical Ward</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-stretch gap-4 w-full md:w-auto">
                  <div className="bg-brand-dark p-6 rounded-[2.5rem] flex flex-col items-center min-w-[180px] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500"></div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 relative z-10">Consultation Fee</p>
                    <div className="text-4xl font-black text-white font-display relative z-10">₹{selectedDoctor.consultationFee}</div>
                    <p className="text-[8px] font-black text-brand-teal uppercase tracking-widest mt-1 relative z-10">per clinical session</p>
                  </div>
                  
                  <button
                    onClick={() => toggleDoctorStatus(selectedDoctor.userId?._id, selectedDoctor.userId?.isActive)}
                    className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-lg active:scale-95 ${selectedDoctor.userId?.isActive ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'}`}
                  >
                    {selectedDoctor.userId?.isActive ? <><UserX className="h-4 w-4" /> Unauthorize Access</> : <><UserCheck className="h-4 w-4" /> Grant Authorization</>}
                  </button>
                </div>
              </div>

              {/* Stats & Highlights Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:bg-white hover:shadow-xl transition-all group">
                  <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Clinical Experience</p>
                  <p className="text-xl font-black text-brand-dark">{selectedDoctor.experience} Years</p>
                </div>
                
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 hover:bg-white hover:shadow-xl transition-all group md:col-span-2">
                  <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Medical Qualifications</p>
                  <p className="text-xl font-black text-brand-dark truncate" title={selectedDoctor.qualifications}>{selectedDoctor.qualifications}</p>
                </div>
              </div>

              {/* Availability Section */}
              {isEditingAvailability ? (
                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border-2 border-blue-200">
                  <h3 className="font-black text-brand-dark mb-6 flex items-center"><Calendar className="h-5 w-5 mr-2" />Edit Availability</h3>
                  <div className="mb-6">
                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3 block">Available Days</label>
                    <div className="grid grid-cols-7 gap-2">
                      {ALL_DAYS.map(day => (
                        <button key={day} type="button" onClick={() => toggleDay(day)}
                          className={`rounded-lg p-2 text-xs font-bold transition-all ${availabilityForm.days.includes(day) ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
                          {DAY_LABELS[day]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-6">
                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3 block">Time Slots</label>
                    <div className="space-y-2">
                      {availabilityForm.timeSlots.map((slot, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input type="time" value={slot.start} onChange={(e) => updateTimeSlot(idx, 'start', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                          <span className="text-gray-400">—</span>
                          <input type="time" value={slot.end} onChange={(e) => updateTimeSlot(idx, 'end', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
                          <button type="button" onClick={() => removeTimeSlot(idx)} className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"><XCircle className="h-4 w-4" /></button>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addTimeSlot} className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors">+ Add Slot</button>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={saveAvailability} disabled={savingAvailability} className="flex-1 btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50"><Save className="h-4 w-4" />{savingAvailability ? 'Saving...' : 'Save'}</button>
                    <button onClick={() => setIsEditingAvailability(false)} className="flex-1 btn bg-gray-200 text-gray-700 hover:bg-gray-300">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-brand-dark flex items-center"><Calendar className="h-5 w-5 mr-2" />Weekly Availability</h3>
                    <button onClick={startEditingAvailability} className="btn btn-sm bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center gap-2"><Edit2 className="h-4 w-4" />Edit</button>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 mb-4">
                    {ALL_DAYS.map(day => {
                      const active = selectedDoctor?.availability?.days?.includes(day);
                      return <div key={day} className={`rounded-lg p-2 text-center text-xs font-bold ${active ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-400'}`}>{DAY_LABELS[day]}</div>;
                    })}
                  </div>
                  {selectedDoctor?.availability?.timeSlots?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedDoctor.availability.timeSlots.map((slot, i) => (
                        <span key={i} className="flex items-center bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-semibold">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />{slot.start} – {slot.end}
                        </span>
                      ))}
                    </div>
                  ) : <p className="text-sm text-gray-400 italic">No time slots configured</p>}
                </div>
              )}

              {/* Leaves */}
              <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="font-black text-brand-dark mb-4 flex items-center"><XCircle className="h-5 w-5 mr-2" />Doctor Leaves</h3>
                <div className="flex gap-2 mb-4">
                  <input type="date" value={newLeaveDate} onChange={(e) => setNewLeaveDate(e.target.value)} className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-teal outline-none text-sm" />
                  <button onClick={handleAddLeave} className="px-6 py-2 bg-brand-dark text-white text-sm font-black rounded-xl hover:bg-brand-dark/90 transition-all">Mark on Leave</button>
                </div>
                {loadingLeaves ? <div className="loading-spinner h-6 w-6 mx-auto" /> : leaves.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {leaves.sort().map(date => (
                      <div key={date} className="flex items-center bg-red-50 text-red-600 border border-red-100 rounded-lg px-3 py-1.5 text-xs font-bold">
                        {new Date(date).toLocaleDateString()}
                        <button onClick={() => handleRemoveLeave(date)} className="ml-2 hover:text-red-800 transition-colors"><XCircle className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400 italic">No leaves currently scheduled</p>}
              </div>

              <button onClick={() => setShowDoctorModal(false)} className="group relative w-full py-6 bg-brand-dark text-white rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                <div className="absolute inset-0 bg-brand-teal translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <span className="relative z-10 text-xl font-display font-black tracking-widest uppercase">Close Practitioner File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsManagement;
