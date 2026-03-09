import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  User, Mail, Phone, MapPin, Shield, Activity, Save, Edit2, AlertCircle,
  Stethoscope, Award, Clock, DollarSign, Calendar, CheckCircle, XCircle,
  Briefcase, Hash, Building2, Camera
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProfileAvatar = ({ user, defaultIcon: DefaultIcon }) => {
  const [uploading, setUploading] = useState(false);
  const avatarUrl = user?.profile?.avatar;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.post('/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success('Profile picture updated');
        // Update local storage and force a refresh of the user data if needed
        const currentUser = JSON.parse(localStorage.getItem('user'));
        currentUser.profile.avatar = res.data.data.avatar;
        localStorage.setItem('user', JSON.stringify(currentUser));
        window.location.reload(); // Simple way to sync all profile views
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="h-20 w-20 shrink-0 rounded-2xl bg-white p-1.5 shadow-2xl relative overflow-hidden">
        <div className="h-full w-full rounded-xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center overflow-hidden">
          {uploading ? (
            <div className="loading-spinner h-6 w-6 border-primary-600" />
          ) : avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <DefaultIcon className="h-10 w-10 text-primary-600" />
          )}
        </div>
      </div>
      <label className="absolute -bottom-1 -right-1 h-7 w-7 bg-white rounded-lg shadow-lg border border-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
        <Camera className="h-4 w-4 text-gray-600" />
        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      </label>
    </div>
  );
};

/* ─────────────────────────────────────────────
   DOCTOR PROFILE VIEW
   ───────────────────────────────────────────── */
const DoctorProfile = ({ user }) => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const res = await api.get('/doctor/profile');
        if (res.data.success) {
          setDoctor(res.data.data.doctor);
        }
      } catch (err) {
        console.error('Doctor profile fetch error:', err);
        toast.error('Failed to load doctor profile');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorProfile();
  }, []);



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  const fullName = `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 'Doctor';
  const days = doctor?.availability?.days || [];
  const slots = doctor?.availability?.timeSlots || [];
  const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };
  const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-r from-primary-700 via-primary-500 to-secondary-500 rounded-2xl shadow-xl overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="relative flex items-center gap-5 px-8 py-6">
          <ProfileAvatar user={user} defaultIcon={Stethoscope} />
          <div className="text-white">
            <h1 className="text-2xl font-black tracking-tight drop-shadow">Dr. {fullName}</h1>
            <p className="opacity-90 flex items-center text-sm font-medium mt-1">
              <Award className="h-3.5 w-3.5 mr-1.5" />
              {doctor?.specialization || 'Specialist'} &nbsp;·&nbsp; {doctor?.department || 'General'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: Identity + Stats ── */}
        <div className="space-y-5 lg:col-span-1">

          {/* Contact Info */}
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Contact &amp; Identity</h2>
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={user?.profile?.phone || 'Not provided'} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={user?.profile?.address || 'Not specified'} />
            <InfoRow icon={<Hash className="h-4 w-4" />} label="License No." value={doctor?.licenseNumber || '—'} />
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Department" value={doctor?.department || '—'} />
          </div>

          {/* Quick Stats */}
          <div className="card p-5 bg-gradient-to-br from-primary-900 to-primary-800 text-white space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-75">Career Snapshot</h3>
            <StatPill icon={<Briefcase className="h-4 w-4" />} label="Experience" value={`${doctor?.experience || 0} yrs`} />
            <StatPill icon={<DollarSign className="h-4 w-4" />} label="Consultation" value={`₹${doctor?.consultationFee || 0}`} />

            <StatPill
              icon={doctor?.isAvailable
                ? <CheckCircle className="h-4 w-4 text-green-400" />
                : <XCircle className="h-4 w-4 text-red-400" />}
              label="Status"
              value={doctor?.isAvailable ? 'Available' : 'Not Available'}
            />
          </div>
        </div>

        {/* ── Right: Credentials + Availability ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Qualifications */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary-600" /> Qualifications &amp; Specialization
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailBox label="Specialization" value={doctor?.specialization} />
              <DetailBox label="Qualifications" value={doctor?.qualifications} />
            </div>
          </div>

          {/* Availability */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary-600" /> Weekly Availability
              </h2>
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1.5 mb-5">
              {ALL_DAYS.map(day => {
                const active = doctor?.availability?.days?.includes(day);
                return (
                  <div
                    key={day}
                    className={`rounded-xl p-2 text-center text-xs font-bold transition-all ${active
                      ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                      : 'bg-gray-100 text-gray-400'
                      }`}
                  >
                    {DAY_LABELS[day]}
                  </div>
                );
              })}
            </div>

            {/* Time slots */}
            {doctor?.availability?.timeSlots?.length > 0 ? (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Time Slots</p>
                <div className="flex flex-wrap gap-2">
                  {doctor.availability.timeSlots.map((slot, i) => (
                    <span key={i} className="flex items-center bg-primary-50 text-primary-700 border border-primary-100 rounded-lg px-3 py-1.5 text-sm font-semibold">
                      <Clock className="h-3.5 w-3.5 mr-1.5" />
                      {slot.start} – {slot.end}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No time slots configured.</p>
            )}
          </div>

          {/* Info Notice */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-800">
              <span className="font-bold">Your availability is managed by the administration team.</span> Contact the hospital administrator to update your availability, specialization, qualifications, fees, or other profile details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   PATIENT PROFILE VIEW
───────────────────────────────────────────── */
const PatientProfile = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bloodGroup: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
    insuranceInfo: { provider: '', policyNumber: '', expiryDate: '' },
    allergies: [],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/patient/profile');
        if (response.data.success) {
          const patient = response.data.data.patient;
          setProfileData(patient);
          setFormData({
            bloodGroup: patient.bloodGroup || '',
            emergencyContact: patient.emergencyContact || { name: '', phone: '', relationship: '' },
            insuranceInfo: patient.insuranceInfo || { provider: '', policyNumber: '', expiryDate: '' },
            allergies: patient.allergies || [],
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.patch('/patient/profile', formData);
      if (response.data.success) {
        setProfileData(response.data.data.patient);
        setIsEditing(false);
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
      </div>
    );
  }

  const fullName = `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || user?.profile?.name || 'Patient';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        <div className="relative flex items-center gap-5 px-8 py-6">
          <ProfileAvatar user={user} defaultIcon={User} />
          <div className="text-white">
            <h1 className="text-2xl font-black tracking-tight drop-shadow">{fullName}</h1>
            <p className="opacity-90 flex items-center text-sm font-medium mt-1">
              <Shield className="h-3.5 w-3.5 mr-1.5" /> OrvantaHealth Member
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="space-y-5 lg:col-span-1">
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Basic Information</h2>
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={user?.profile?.phone || 'Not provided'} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={user?.profile?.address || 'No address set'} />
          </div>

          <div className="card p-5 bg-gradient-to-br from-primary-900 to-primary-800 text-white">
            <h3 className="font-bold flex items-center text-sm">
              <Activity className="h-4 w-4 mr-2" /> Health Status
            </h3>
            <div className="mt-4 p-4 bg-white/10 rounded-xl">
              <p className="text-xs opacity-75 uppercase tracking-widest">Blood Group</p>
              <p className="text-4xl font-black mt-1">{formData.bloodGroup || '--'}</p>
            </div>
            <p className="mt-4 text-xs opacity-60">Keep your medical details updated for better emergency care.</p>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900">Medical Information</h2>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)}
                  className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg transition-all">
                  <Edit2 className="h-4 w-4 mr-1.5" /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button onClick={() => setIsEditing(false)}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center btn-primary px-4 py-1.5 text-sm">
                    {saving ? 'Saving...' : <><Save className="h-4 w-4 mr-1.5" /> Save Changes</>}
                  </button>
                </div>
              )}
            </div>

            <form className="space-y-8">
              {/* Emergency Contact */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Contact Name" disabled={!isEditing}
                    value={formData.emergencyContact.name}
                    onChange={v => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: v } })} />
                  <FormField label="Phone Number" disabled={!isEditing}
                    value={formData.emergencyContact.phone}
                    onChange={v => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: v } })} />
                </div>
              </section>

              {/* Insurance */}
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Insurance Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Provider" disabled={!isEditing}
                    value={formData.insuranceInfo.provider}
                    onChange={v => setFormData({ ...formData, insuranceInfo: { ...formData.insuranceInfo, provider: v } })} />
                  <FormField label="Policy Number" disabled={!isEditing}
                    value={formData.insuranceInfo.policyNumber}
                    onChange={v => setFormData({ ...formData, insuranceInfo: { ...formData.insuranceInfo, policyNumber: v } })} />
                  <FormField label="Expiry Date" disabled={!isEditing} type="date"
                    value={formData.insuranceInfo.expiryDate?.split('T')[0]}
                    onChange={v => setFormData({ ...formData, insuranceInfo: { ...formData.insuranceInfo, expiryDate: v } })} />
                </div>
              </section>

              {/* Blood Group + Allergies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Blood Group</h3>
                  <select disabled={!isEditing} value={formData.bloodGroup}
                    onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 outline-none">
                    <option value="">Select Blood Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Allergies</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.allergies.map((allergy, idx) => (
                      <span key={idx} className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-sm font-medium border border-red-100 flex items-center">
                        {allergy}
                        {isEditing && (
                          <button type="button"
                            onClick={() => setFormData({ ...formData, allergies: formData.allergies.filter((_, i) => i !== idx) })}
                            className="ml-2 hover:text-red-800">×</button>
                        )}
                      </span>
                    ))}
                    {isEditing && (
                      <input type="text" placeholder="+ Add allergy"
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (e.target.value) {
                              setFormData({ ...formData, allergies: [...formData.allergies, e.target.value] });
                              e.target.value = '';
                            }
                          }
                        }}
                        className="text-sm text-primary-600 bg-primary-50 px-3 py-1 rounded-full border border-primary-100 outline-none focus:ring-1 focus:ring-primary-300 w-28" />
                    )}
                    {!isEditing && formData.allergies.length === 0 && (
                      <p className="text-sm text-gray-400 italic">No allergies reported.</p>
                    )}
                  </div>
                </section>
              </div>
            </form>
          </div>

          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-sm text-yellow-800">
              <span className="font-bold">Important:</span> Profile changes may take a few moments to reflect across all hospital records.
              Contact the front desk to update your legal name or date of birth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   STAFF PROFILE VIEW (Receptionist, SuperAdmin, etc)
───────────────────────────────────────────── */
const StaffProfile = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    dateOfBirth: user?.profile?.dateOfBirth?.split('T')[0] || '',
    gender: user?.profile?.gender || '',
    address: user?.profile?.address || ''
  });

  const fullName = `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 'Staff Member';
  const roleLabel = user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Staff';

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.patch('/auth/profile', {
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address
      });
      if (response.data.success) {
        setIsEditing(false);
        toast.success('Profile updated successfully');
        // Optionally reload page or update user context
        window.location.reload();
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Hero Banner */}
      <div className="relative bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        <div className="relative flex items-center gap-5 px-8 py-6">
          <ProfileAvatar user={user} defaultIcon={Briefcase} />
          <div className="text-white">
            <h1 className="text-2xl font-black tracking-tight drop-shadow">{fullName}</h1>
            <p className="opacity-90 flex items-center text-sm font-medium mt-1">
              <Shield className="h-3.5 w-3.5 mr-1.5" /> {roleLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="card p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2 text-primary-600" />
            Personal Information
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-600 hover:bg-primary-200 rounded-lg font-medium transition-colors"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        {/* Basic Info Grid - Read Only */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailBox
            label="First Name"
            value={user?.profile?.firstName}
          />
          <DetailBox
            label="Last Name"
            value={user?.profile?.lastName}
          />
          <DetailBox
            label="Email"
            value={user?.email}
          />
          <DetailBox
            label="Phone"
            value={user?.profile?.phone}
          />
        </div>

        {/* Editable Section */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-6 border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(value) => setFormData({ ...formData, dateOfBirth: value })}
              />
              <FormField
                label="Gender"
                disabled={false}
                value={formData.gender}
                onChange={(value) => setFormData({ ...formData, gender: value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 ml-1 block mb-2">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows="3"
                className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none text-sm resize-none"
                placeholder="Enter your address"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Date of Birth & Gender - Read Only */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetailBox
                  label="Date of Birth"
                  value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString() : '—'}
                />
                <DetailBox
                  label="Gender"
                  value={formData.gender || '—'}
                />
              </div>
            </div>

            {/* Address */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary-600" />
                Address
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-gray-700">{formData.address || '—'}</p>
              </div>
            </div>
          </>
        )}

        {/* Account Status */}
        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Activity className="h-4 w-4 mr-2 text-primary-600" />
            Account Status
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailBox
              label="Status"
              value={user?.isActive ? '✓ Active' : '✗ Inactive'}
            />
            <DetailBox
              label="Role"
              value={roleLabel}
            />
          </div>
        </div>
      </div>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-900">Profile Information</p>
          <p className="text-sm text-blue-700 mt-1">
            You can edit your personal information such as date of birth, gender, and address. To update your email, phone number, or role, please contact the hospital administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   SHARED HELPER COMPONENTS
───────────────────────────────────────────── */
const InfoRow = ({ icon, label, value }) => (
  <div>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
    <div className="flex items-center mt-1 text-gray-700 text-sm">
      <span className="text-gray-400 mr-2">{icon}</span>
      <span>{value}</span>
    </div>
  </div>
);

const StatPill = ({ icon, label, value }) => (
  <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2.5">
    <div className="flex items-center space-x-2 opacity-80">
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </div>
    <span className="text-sm font-black">{value}</span>
  </div>
);

const DetailBox = ({ label, value }) => (
  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-gray-800 font-semibold">{value || '—'}</p>
  </div>
);

const FormField = ({ label, disabled, value, onChange, type = 'text' }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-gray-500 ml-1">{label}</label>
    <input
      type={type}
      disabled={disabled}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full p-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 outline-none text-sm"
    />
  </div>
);

/* ─────────────────────────────────────────────
   MAIN EXPORT — role-aware router
───────────────────────────────────────────── */
const Profile = () => {
  const { user } = useAuth();

  if (user?.role === 'doctor') {
    return <DoctorProfile user={user} />;
  }

  if (user?.role === 'patient') {
    return <PatientProfile user={user} />;
  }

  // For staff roles (receptionist, superadmin)
  return <StaffProfile user={user} />;
};

export default Profile;
