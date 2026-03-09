import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Filter, Eye, Edit, Star, Calendar, Phone, Mail, Save, Edit2, XCircle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const DoctorsManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isEditingAvailability, setIsEditingAvailability] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availabilityForm, setAvailabilityForm] = useState({
    days: [],
    timeSlots: []
  });
  const [leaves, setLeaves] = useState([]);
  const [newLeaveDate, setNewLeaveDate] = useState('');
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/admin/doctors');
      if (response.data.success) {
        setDoctors(response.data.data.doctors);
      }
    } catch (error) {
      toast.error('Failed to fetch doctors data');
    } finally {
      setLoading(false);
    }
  };

  const startEditingAvailability = () => {
    setAvailabilityForm({
      days: selectedDoctor?.availability?.days || [],
      timeSlots: selectedDoctor?.availability?.timeSlots || []
    });
    setIsEditingAvailability(true);
  };

  const toggleDay = (day) => {
    setAvailabilityForm(prev => {
      const days = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      return { ...prev, days };
    });
  };

  const addTimeSlot = () => {
    setAvailabilityForm(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { start: '09:00', end: '17:00' }]
    }));
  };

  const removeTimeSlot = (index) => {
    setAvailabilityForm(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index, field, value) => {
    setAvailabilityForm(prev => {
      const slots = [...prev.timeSlots];
      slots[index] = { ...slots[index], [field]: value };
      return { ...prev, timeSlots: slots };
    });
  };

  const saveAvailability = async () => {
    if (availabilityForm.days.length === 0) {
      toast.error('Please select at least one day');
      return;
    }
    if (availabilityForm.timeSlots.length === 0) {
      toast.error('Please add at least one time slot');
      return;
    }

    try {
      setSavingAvailability(true);
      const response = await api.patch('/doctor/availability', {
        days: availabilityForm.days,
        timeSlots: availabilityForm.timeSlots,
        doctorId: selectedDoctor._id
      });
      if (response.data.success) {
        // Correctly merge the update to maintain populated data (userId, etc.)
        const updatedDoctor = {
          ...selectedDoctor,
          availability: response.data.data.doctor.availability
        };

        setSelectedDoctor(updatedDoctor);
        setDoctors(prev => prev.map(d => d._id === updatedDoctor._id ? updatedDoctor : d));
        setIsEditingAvailability(false);
        toast.success('Availability updated successfully');
      }
    } catch (error) {
      console.error('Update availability error:', error);
      toast.error(error.response?.data?.message || 'Failed to update availability');
    } finally {
      setSavingAvailability(false);
    }
  };

  const fetchDoctorLeaves = async (doctorId) => {
    try {
      setLoadingLeaves(true);
      const response = await api.get(`/receptionist/doctors/${doctorId}/leaves`);
      if (response.data.success) {
        setLeaves(response.data.data.leaves);
      }
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
      toast.error('Failed to fetch doctor leaves');
    } finally {
      setLoadingLeaves(false);
    }
  };

  const handleAddLeave = async () => {
    if (!newLeaveDate) {
      toast.error('Please select a date');
      return;
    }

    try {
      const response = await api.post(`/receptionist/doctors/${selectedDoctor._id}/leave`, { date: newLeaveDate });
      if (response.data.success) {
        toast.success('Leave marked successfully');
        setLeaves(response.data.data.leaves);
        setNewLeaveDate('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark leave');
    }
  };

  const handleRemoveLeave = async (date) => {
    try {
      const response = await api.delete(`/receptionist/doctors/${selectedDoctor._id}/leave/${date}`);
      if (response.data.success) {
        toast.success('Leave removed successfully');
        setLeaves(response.data.data.leaves);
      }
    } catch (error) {
      toast.error('Failed to remove leave');
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    // Basic null check for doctor and user data
    if (!doctor || !doctor.userId || !doctor.userId.profile) return false;

    const profile = doctor.userId.profile;
    const email = doctor.userId.email || '';
    const firstName = profile.firstName || '';
    const lastName = profile.lastName || '';
    const specialization = doctor.specialization || '';

    const matchesSearch =
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialization.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filterDepartment === 'all' || doctor.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const getDepartmentBadgeColor = (department) => {
    switch (department) {
      case 'cardiology': return 'bg-red-100 text-red-800';
      case 'neurology': return 'bg-blue-100 text-blue-800';
      case 'orthopedics': return 'bg-green-100 text-green-800';
      case 'pediatrics': return 'bg-purple-100 text-purple-800';
      case 'gynecology': return 'bg-pink-100 text-pink-800';
      case 'dermatology': return 'bg-yellow-100 text-yellow-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-200 text-yellow-400" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light text-brand-dark mb-4 border border-brand-dark/5">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Medical Directorate</span>
          </div>
          <h1 className="text-4xl font-extrabold text-brand-dark tracking-tight font-display mb-2">Doctors Management</h1>
          <p className="text-slate-500 font-medium text-lg">View and manage all medical practitioners in the ecosystem</p>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard/create-staff'}
          className="btn btn-primary flex items-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          <UserPlus className="h-5 w-5 mr-3" />
          Onboard New Doctor
        </button>
      </div>

      {/* Filters */}
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
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="input bg-white/10 border-white/10 text-white focus:bg-white/20"
            >
              <option value="all" className="text-brand-dark">All Units</option>
              <option value="cardiology" className="text-brand-dark">Cardiology</option>
              <option value="neurology" className="text-brand-dark">Neurology</option>
              <option value="orthopedics" className="text-brand-dark">Orthopedics</option>
              <option value="pediatrics" className="text-brand-dark">Pediatrics</option>
              <option value="gynecology" className="text-brand-dark">Gynecology</option>
              <option value="dermatology" className="text-brand-dark">Dermatology</option>
              <option value="general" className="text-brand-dark">General Medicine</option>
            </select>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDoctors.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-4">
            <Users className="h-16 w-16 text-slate-200" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No practitioners matched your filter</p>
          </div>
        ) : (
          filteredDoctors.map((doctor) => (
            <div key={doctor._id} className="card group hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light rounded-full -mr-16 -mt-16 group-hover:bg-brand-teal/10 transition-colors"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-5 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-brand-dark flex items-center justify-center text-white text-xl font-black shadow-lg shadow-brand-dark/20 transform group-hover:rotate-6 transition-transform">
                    {doctor.userId?.profile?.firstName?.[0] || 'D'}{doctor.userId?.profile?.lastName?.[0] || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-black font-display text-brand-dark leading-tight truncate">
                      Dr. {doctor.userId?.profile?.firstName || 'Unknown'} {doctor.userId?.profile?.lastName || 'Doctor'}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal mt-1">{doctor.department} unit</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
                    <Mail className="h-4 w-4 text-slate-300" />
                    <span className="truncate">{doctor.userId?.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
                    <Calendar className="h-4 w-4 text-slate-300" />
                    <span>{doctor.experience}Y Practice Experience</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getRatingStars(4.8)}
                    <span className="text-[10px] font-black text-slate-400 ml-2">4.8 (Verified)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                  <div className="text-2xl font-black text-brand-dark font-display tracking-tight">
                    <span className="text-sm font-bold text-slate-400 mr-1 italic">₹</span>{doctor.consultationFee}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setShowDoctorModal(true);
                        fetchDoctorLeaves(doctor._id);
                      }}
                      className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-brand-dark hover:bg-brand-light transition-all"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => window.location.href = `/dashboard/create-staff?edit=${doctor._id}`}
                      className="p-3 bg-brand-dark rounded-xl text-white shadow-lg hover:shadow-brand-dark/30 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Doctor Details Modal - Premium */}
      {showDoctorModal && selectedDoctor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-md animate-fade-in" onClick={() => setShowDoctorModal(false)}></div>
          <div className="bg-white rounded-[3rem] shadow-premium w-full max-w-2xl relative animate-slide-up overflow-hidden border border-slate-100">
            <div className="h-48 bg-brand-dark relative overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-brand-dark/80 to-transparent"></div>
              <div className="absolute top-10 right-10 flex gap-4">
                <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur text-[10px] font-black text-white uppercase tracking-widest border border-white/10">License: {selectedDoctor.licenseNumber}</div>
              </div>
              <div className="absolute -bottom-10 left-12 h-32 w-32 rounded-[2.5rem] bg-brand-teal shadow-2xl flex items-center justify-center text-white text-4xl font-black border-8 border-white">
                {selectedDoctor.userId?.profile?.firstName?.[0] || 'D'}
              </div>
            </div>

            <div className="px-12 pt-16 pb-12 overflow-y-auto max-h-[70vh]">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h2 className="text-4xl font-black font-display text-brand-dark leading-none mb-2">
                    Dr. {selectedDoctor.userId?.profile?.firstName} {selectedDoctor.userId?.profile?.lastName}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="text-brand-teal font-black uppercase text-[10px] tracking-[0.2em]">{selectedDoctor.specialization} specialist</span>
                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                    <span className="text-slate-400 font-bold text-xs capitalize">{selectedDoctor.department} Ward</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-3xl font-black text-brand-dark font-display">₹{selectedDoctor.consultationFee}</div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Fee per session</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Exp.</p>
                  <p className="text-sm font-black text-brand-dark">{selectedDoctor.experience} Years</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Qualification</p>
                  <p className="text-sm font-black text-brand-dark truncate">{selectedDoctor.qualifications}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Reviews</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-black text-brand-dark">4.9/5</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Unit Status</p>
                  <span className="text-[10px] font-black text-emerald-500 uppercase">On Duty</span>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center text-brand-teal">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold tracking-tight">{selectedDoctor.userId.email?.toLowerCase()}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-brand-light flex items-center justify-center text-brand-teal">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-tight">{selectedDoctor.userId?.profile?.phone || 'Emergency Contact Unavailable'}</span>
                </div>
              </div>

              {/* Availability Section */}
              {isEditingAvailability ? (
                <div className="mb-10 p-6 bg-slate-50 rounded-2xl border-2 border-blue-200">
                  <h3 className="font-black text-brand-dark mb-6 flex items-center"><Calendar className="h-5 w-5 mr-2" />Edit Availability</h3>

                  {/* Days Selection */}
                  <div className="mb-6">
                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3 block">Available Days</label>
                    <div className="grid grid-cols-7 gap-2">
                      {ALL_DAYS.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`rounded-lg p-2 text-xs font-bold transition-all ${availabilityForm.days.includes(day)
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                          {DAY_LABELS[day]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  <div className="mb-6">
                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest mb-3 block">Time Slots</label>
                    <div className="space-y-2">
                      {availabilityForm.timeSlots.map((slot, idx) => (
                        <div key={idx} className="flex gap-2 items-end">
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => updateTimeSlot(idx, 'start', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                          <span className="text-gray-400">—</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => updateTimeSlot(idx, 'end', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(idx)}
                            className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addTimeSlot}
                      className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                    >
                      + Add Slot
                    </button>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={saveAvailability}
                      disabled={savingAvailability}
                      className="flex-1 btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {savingAvailability ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setIsEditingAvailability(false)}
                      className="flex-1 btn bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-brand-dark flex items-center"><Calendar className="h-5 w-5 mr-2" />Weekly Availability</h3>
                    <button
                      onClick={startEditingAvailability}
                      className="btn btn-sm bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 mb-4">
                    {ALL_DAYS.map(day => {
                      const active = selectedDoctor?.availability?.days?.includes(day);
                      return (
                        <div
                          key={day}
                          className={`rounded-lg p-2 text-center text-xs font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-400'
                            }`}
                        >
                          {DAY_LABELS[day]}
                        </div>
                      );
                    })}
                  </div>

                  {selectedDoctor?.availability?.timeSlots?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedDoctor.availability.timeSlots.map((slot, i) => (
                        <span key={i} className="flex items-center bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-semibold">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          {slot.start} – {slot.end}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No time slots configured</p>
                  )}
                </div>
              )}

              {/* Leaves Management Section */}
              <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="font-black text-brand-dark mb-4 flex items-center"><XCircle className="h-5 w-5 mr-2" />Doctor Leaves</h3>

                <div className="flex gap-2 mb-6">
                  <input
                    type="date"
                    value={newLeaveDate}
                    onChange={(e) => setNewLeaveDate(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-teal outline-none text-sm"
                  />
                  <button
                    onClick={handleAddLeave}
                    className="px-6 py-2 bg-brand-dark text-white text-sm font-black rounded-xl hover:bg-brand-dark/90 transition-all"
                  >
                    Mark on Leave
                  </button>
                </div>

                {loadingLeaves ? (
                  <div className="flex justify-center p-4">
                    <div className="loading-spinner h-6 w-6"></div>
                  </div>
                ) : leaves.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {leaves.sort().map(date => (
                      <div key={date} className="flex items-center bg-red-50 text-red-600 border border-red-100 rounded-lg px-3 py-1.5 text-xs font-bold">
                        {new Date(date).toLocaleDateString()}
                        <button onClick={() => handleRemoveLeave(date)} className="ml-2 hover:text-red-800 transition-colors">
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 font-medium italic">No leaves currently scheduled</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDoctorModal(false)}
                  className="btn btn-primary w-full py-5 text-xl font-display font-black shadow-2xl hover:scale-101 active:scale-99 transition-all"
                >
                  Exit Practitioner Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsManagement;

