import React, { useState, useEffect } from 'react';
import { Users, Clock, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const DoctorAvailability = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    days: [],
    timeSlots: []
  });
  const [leaves, setLeaves] = useState([]);
  const [newLeaveDate, setNewLeaveDate] = useState('');
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const DAY_LABELS = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/receptionist/doctors/availability');
      if (response.data.success) {
        setDoctors(response.data.data.doctors);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
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

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleAddTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { start: '09:00', end: '17:00' }]
    }));
  };

  const handleRemoveTimeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, i) => i !== index)
    }));
  };

  const handleTimeSlotChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, i) =>
        i === index ? { ...slot, [field]: value } : slot
      )
    }));
  };

  const handleSave = async () => {
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }

    if (formData.days.length === 0) {
      toast.error('Please select at least one day');
      return;
    }

    if (formData.timeSlots.length === 0) {
      toast.error('Please add at least one time slot');
      return;
    }

    setSaving(true);
    try {
      const response = await api.patch(
        `/receptionist/doctors/${selectedDoctor._id}/availability`,
        {
          days: formData.days,
          timeSlots: formData.timeSlots
        }
      );

      if (response.data.success) {
        toast.success('Doctor availability updated successfully');
        setSelectedDoctor(null);
        fetchDoctors();
      }
    } catch (error) {
      console.error('Failed to update availability:', error);
      toast.error(error.response?.data?.message || 'Failed to update availability');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedDoctor(null);
    setFormData({ days: [], timeSlots: [] });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light text-brand-dark mb-4 border border-brand-dark/5">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-[10px] font-black uppercase tracking-widest">Reception Management</span>
        </div>
        <h1 className="text-4xl font-extrabold text-brand-dark tracking-tight font-display mb-2">
          Manage Doctor Availability
        </h1>
        <p className="text-slate-500 font-medium text-lg">
          Update working schedules and time slots for doctors
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Doctors List */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Doctor</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {doctors.map(doctor => (
                <button
                  key={doctor._id}
                  onClick={() => handleSelectDoctor(doctor)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${selectedDoctor?._id === doctor._id
                      ? 'border-brand-teal bg-brand-light'
                      : 'border-gray-200 hover:border-brand-teal/50'
                    }`}
                >
                  <p className="font-semibold text-gray-900">
                    Dr. {doctor.userId.profile.firstName} {doctor.userId.profile.lastName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{doctor.specialization}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Availability Editor */}
        <div className="lg:col-span-2">
          {selectedDoctor ? (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Dr. {selectedDoctor.userId.profile.firstName} {selectedDoctor.userId.profile.lastName}
                  </h2>
                  <p className="text-gray-500 mt-1">{selectedDoctor.specialization}</p>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6 border-t pt-6">
                {/* Days Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Available Days
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {ALL_DAYS.map(day => (
                      <label key={day} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.days.includes(day)}
                          onChange={() => handleDayToggle(day)}
                          className="w-4 h-4 rounded border-gray-300 text-brand-teal cursor-pointer"
                        />
                        <span className="text-sm text-gray-700">{DAY_LABELS[day]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Time Slots
                  </label>
                  <div className="space-y-3">
                    {formData.timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => handleTimeSlotChange(index, 'start', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => handleTimeSlotChange(index, 'end', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        <button
                          onClick={() => handleRemoveTimeSlot(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddTimeSlot}
                    className="mt-3 w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-700 font-medium rounded-lg hover:border-brand-teal hover:text-brand-teal transition-colors"
                  >
                    + Add Time Slot
                  </button>
                </div>

                {/* Leaves Management */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Mark Doctor on Leave
                  </label>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="date"
                      value={newLeaveDate}
                      onChange={(e) => setNewLeaveDate(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                      onClick={handleAddLeave}
                      className="px-4 py-2 bg-brand-dark text-white text-sm font-semibold rounded-lg hover:bg-brand-dark/90 transition-colors"
                    >
                      Mark Leave
                    </button>
                  </div>

                  {loadingLeaves ? (
                    <p className="text-xs text-gray-400 italic">Loading leaves...</p>
                  ) : leaves.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {leaves.sort().map(date => (
                        <div key={date} className="flex items-center bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-1 text-xs font-semibold">
                          {new Date(date).toLocaleDateString()}
                          <button onClick={() => handleRemoveLeave(date)} className="ml-2 hover:text-red-900">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No leaves marked</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 border-t pt-6">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-brand-teal text-white font-semibold rounded-lg hover:bg-brand-teal/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="card h-96 flex items-center justify-center">
              <div className="text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Select a doctor to edit availability</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorAvailability;
