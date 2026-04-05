import React, { useState, useEffect } from 'react';
import {
  Clock, X, Save, Stethoscope, Calendar, CalendarOff,
  ChevronRight, CheckCircle, AlertTriangle, Plus, Trash2,
  Activity, Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_SHORT = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

const DoctorAvailability = () => {
  const [doctors, setDoctors]           = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [formData, setFormData]         = useState({ days: [], timeSlots: [] });
  const [leaves, setLeaves]             = useState([]);
  const [newLeaveDate, setNewLeaveDate]  = useState('');
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [search, setSearch]              = useState('');

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/receptionist/doctors/availability');
      if (res.data.success) setDoctors(res.data.data.doctors);
    } catch { toast.error('Failed to fetch doctors'); }
    finally { setLoading(false); }
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      days: doctor.availability?.days || [],
      timeSlots: doctor.availability?.timeSlots || []
    });
    fetchDoctorLeaves(doctor._id);
  };

  const fetchDoctorLeaves = async (doctorId) => {
    try {
      setLoadingLeaves(true);
      const res = await api.get(`/receptionist/doctors/${doctorId}/leaves`);
      if (res.data.success) setLeaves(res.data.data.leaves);
    } catch { toast.error('Failed to fetch doctor leaves'); }
    finally { setLoadingLeaves(false); }
  };

  const handleAddLeave = async () => {
    if (!newLeaveDate) { toast.error('Please select a date'); return; }
    try {
      const res = await api.post(`/receptionist/doctors/${selectedDoctor._id}/leave`, { date: newLeaveDate });
      if (res.data.success) { toast.success('Leave marked'); setLeaves(res.data.data.leaves); setNewLeaveDate(''); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to mark leave'); }
  };

  const handleRemoveLeave = async (date) => {
    try {
      const res = await api.delete(`/receptionist/doctors/${selectedDoctor._id}/leave/${date}`);
      if (res.data.success) { toast.success('Leave removed'); setLeaves(res.data.data.leaves); }
    } catch { toast.error('Failed to remove leave'); }
  };

  const handleDayToggle = (day) =>
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));

  const handleAddTimeSlot = () =>
    setFormData(prev => ({ ...prev, timeSlots: [...prev.timeSlots, { start: '09:00', end: '17:00' }] }));

  const handleRemoveTimeSlot = (i) =>
    setFormData(prev => ({ ...prev, timeSlots: prev.timeSlots.filter((_, idx) => idx !== i) }));

  const handleTimeSlotChange = (i, field, value) =>
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((s, idx) => idx === i ? { ...s, [field]: value } : s)
    }));

  const handleSave = async () => {
    if (!selectedDoctor)            { toast.error('Select a doctor first'); return; }
    if (!formData.days.length)      { toast.error('Select at least one working day'); return; }
    if (!formData.timeSlots.length) { toast.error('Add at least one time slot'); return; }
    setSaving(true);
    try {
      const res = await api.patch(
        `/receptionist/doctors/${selectedDoctor._id}/availability`,
        { days: formData.days, timeSlots: formData.timeSlots }
      );
      if (res.data.success) {
        toast.success('Availability updated');
        setSelectedDoctor(null);
        fetchDoctors();
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleCancel = () => { setSelectedDoctor(null); setFormData({ days: [], timeSlots: [] }); };

  const filteredDoctors = doctors.filter(d => {
    const name = `Dr. ${d.userId.profile.firstName} ${d.userId.profile.lastName} ${d.specialization}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="loading-spinner" />
      <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Loading doctor roster...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>

          <h1 className="text-4xl font-black text-brand-dark font-display tracking-tight leading-none mb-2">
            Doctor Availability
          </h1>
          <p className="text-slate-500 font-medium">Configure working schedules, time slots and leaves</p>
        </div>

        {/* Active doctor counter */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Doctors</p>
            <p className="text-lg font-black text-brand-dark">{doctors.filter(d => d.isAvailable).length} / {doctors.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── DOCTOR LIST PANEL ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search doctors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-brand-teal outline-none text-sm font-semibold text-brand-dark bg-white focus:bg-white transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>

          {/* Doctor cards */}
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1 custom-scrollbar">
            {filteredDoctors.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-bold text-sm">No doctors found</div>
            ) : filteredDoctors.map(doctor => {
              const isSelected = selectedDoctor?._id === doctor._id;
              const initials = `${doctor.userId.profile.firstName[0]}${doctor.userId.profile.lastName[0]}`.toUpperCase();
              const activeDays = doctor.availability?.days?.length || 0;
              const slots = doctor.availability?.timeSlots?.length || 0;

              return (
                <button
                  key={doctor._id}
                  onClick={() => handleSelectDoctor(doctor)}
                  className={`w-full p-4 rounded-2xl border-2 text-left transition-all hover:-translate-y-0.5 ${
                    isSelected
                      ? 'border-brand-teal bg-brand-teal shadow-lg shadow-brand-teal/20 text-white'
                      : 'border-slate-100 bg-white hover:border-brand-teal/40 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-brand-dark text-white'
                    }`}>
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm truncate ${isSelected ? 'text-white' : 'text-brand-dark'}`}>
                        Dr. {doctor.userId.profile.firstName} {doctor.userId.profile.lastName}
                      </p>
                      <p className={`text-[10px] font-semibold truncate mt-0.5 ${isSelected ? 'text-teal-100/80' : 'text-slate-400'}`}>
                        {doctor.specialization || 'General'}
                      </p>
                    </div>

                    {/* Schedule summary */}
                    <div className="text-right shrink-0">
                      <p className={`text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-teal-100/70' : 'text-slate-400'}`}>
                        {activeDays}d · {slots} slot{slots !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {isSelected && <ChevronRight className="h-4 w-4 text-white/60 shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── EDITOR PANEL ── */}
        <div className="lg:col-span-3">
          {selectedDoctor ? (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-premium overflow-hidden">

              {/* Editor header */}
              <div className="relative bg-brand-dark px-8 py-6 overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-brand-teal opacity-20 blur-2xl" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-teal-100/60 uppercase tracking-widest mb-1">Editing Schedule</p>
                    <h2 className="text-2xl font-black text-white font-display">
                      Dr. {selectedDoctor.userId.profile.firstName} {selectedDoctor.userId.profile.lastName}
                    </h2>
                    <p className="text-sm text-teal-100/70 font-medium mt-0.5">{selectedDoctor.specialization}</p>
                  </div>
                  <button onClick={handleCancel}
                    className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="px-8 py-8 space-y-8">

                {/* ── WORKING DAYS ── */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Working Days</p>
                  <div className="grid grid-cols-7 gap-2">
                    {ALL_DAYS.map(day => {
                      const active = formData.days.includes(day);
                      return (
                        <button key={day} onClick={() => handleDayToggle(day)}
                          className={`py-3 rounded-xl text-center text-xs font-black transition-all hover:-translate-y-0.5 ${
                            active
                              ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/30'
                              : 'bg-slate-50 text-slate-400 border border-slate-100 hover:border-brand-teal/30 hover:text-brand-teal'
                          }`}>
                          {DAY_SHORT[day]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-2">
                    {formData.days.length === 0 ? 'No days selected' : `${formData.days.length} day${formData.days.length > 1 ? 's' : ''} selected`}
                  </p>
                </div>

                {/* ── TIME SLOTS ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Time Slots</p>
                    <button onClick={handleAddTimeSlot}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-teal/10 text-brand-teal hover:bg-brand-teal hover:text-white transition-all text-[10px] font-black uppercase tracking-widest">
                      <Plus className="h-3 w-3" /> Add Slot
                    </button>
                  </div>

                  {formData.timeSlots.length === 0 ? (
                    <button onClick={handleAddTimeSlot}
                      className="w-full py-6 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-brand-teal/50 hover:text-brand-teal transition-all text-sm font-bold flex flex-col items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Add your first time slot
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {formData.timeSlots.map((slot, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="h-8 w-8 rounded-xl bg-brand-teal/10 flex items-center justify-center shrink-0">
                            <Clock className="h-4 w-4 text-brand-teal" />
                          </div>
                          <div className="flex items-center gap-2 flex-1">
                            <input type="time" value={slot.start}
                              onChange={e => handleTimeSlotChange(i, 'start', e.target.value)}
                              className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-100 focus:border-brand-teal outline-none text-sm font-bold text-brand-dark bg-white transition-all" />
                            <span className="text-slate-400 font-bold text-xs">to</span>
                            <input type="time" value={slot.end}
                              onChange={e => handleTimeSlotChange(i, 'end', e.target.value)}
                              className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-100 focus:border-brand-teal outline-none text-sm font-bold text-brand-dark bg-white transition-all" />
                          </div>
                          <button onClick={() => handleRemoveTimeSlot(i)}
                            className="h-8 w-8 rounded-xl bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-rose-500 transition-colors shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── LEAVE MANAGEMENT ── */}
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Leave Management</p>

                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <CalendarOff className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type="date" value={newLeaveDate}
                        onChange={e => setNewLeaveDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-100 focus:border-brand-teal outline-none text-sm font-bold text-brand-dark bg-slate-50 focus:bg-white transition-all" />
                    </div>
                    <button onClick={handleAddLeave}
                      className="px-5 py-3 bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all hover:-translate-y-0.5 shadow-lg whitespace-nowrap">
                      Mark Leave
                    </button>
                  </div>

                  {loadingLeaves ? (
                    <p className="text-[10px] text-slate-400 italic">Loading leaves...</p>
                  ) : leaves.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {leaves.sort().map(date => (
                        <div key={date} className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl px-3 py-2 text-xs font-bold">
                          <CalendarOff className="h-3.5 w-3.5 text-rose-400" />
                          {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          <button onClick={() => handleRemoveLeave(date)}
                            className="ml-1 hover:text-rose-900 transition-colors">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 py-3 px-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                      <p className="text-xs font-bold text-emerald-700">No leaves marked — doctor is fully available</p>
                    </div>
                  )}
                </div>

                {/* ── ACTION BUTTONS ── */}
                <div className="flex gap-3 border-t border-slate-50 pt-6">
                  <button onClick={handleCancel}
                    className="flex-1 py-3.5 rounded-2xl border-2 border-slate-100 text-brand-dark font-black text-xs uppercase tracking-widest hover:border-slate-200 hover:bg-slate-50 transition-all">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex-1 py-3.5 rounded-2xl bg-brand-teal text-white font-black text-xs uppercase tracking-widest hover:bg-teal-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-teal/20 disabled:opacity-60 hover:-translate-y-0.5">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Schedule'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ── EMPTY EDITOR STATE ── */
            <div className="h-full min-h-[400px] bg-white rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 p-12">
              <div className="h-16 w-16 rounded-2xl bg-brand-light flex items-center justify-center">
                <Stethoscope className="h-8 w-8 text-brand-teal/50" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-black text-brand-dark mb-1">No Doctor Selected</h3>
                <p className="text-sm text-slate-400 font-medium">Pick a doctor from the list to configure their schedule</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {['Working Days', 'Time Slots', 'Leave Dates'].map(tag => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;
