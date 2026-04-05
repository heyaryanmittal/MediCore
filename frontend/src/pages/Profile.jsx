import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  User, Mail, Phone, MapPin, Shield, Activity, Save, Edit2, AlertCircle,
  Stethoscope, Award, Clock, DollarSign, Calendar, CheckCircle, XCircle,
  Briefcase, Hash, Building2, Camera
} from 'lucide-react';
import { toast } from 'react-hot-toast';

/* ─────────────────────────────────────────────
   PROFILE AVATAR (shared)
   ───────────────────────────────────────────── */
const ProfileAvatar = ({ user, defaultIcon: DefaultIcon }) => {
  const [uploading, setUploading] = useState(false);
  const avatarUrl = user?.profile?.avatar;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('File size exceeds 5MB limit'); return; }
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.post('/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        toast.success('Profile picture updated');
        const currentUser = JSON.parse(localStorage.getItem('user'));
        currentUser.profile.avatar = res.data.data.avatar;
        localStorage.setItem('user', JSON.stringify(currentUser));
        window.location.reload();
      }
    } catch (err) {
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
        if (res.data.success) setDoctor(res.data.data.doctor);
      } catch (err) {
        toast.error('Failed to load doctor profile');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctorProfile();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="loading-spinner" /></div>;

  const fullName = `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 'Doctor';
  const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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
        <div className="space-y-5 lg:col-span-1">
          <div className="card p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Contact &amp; Identity</h2>
            <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email} />
            <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={user?.profile?.phone || 'Not provided'} />
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Address" value={user?.profile?.address || 'Not specified'} />
            <InfoRow icon={<Hash className="h-4 w-4" />} label="License No." value={doctor?.licenseNumber || '—'} />
            <InfoRow icon={<Building2 className="h-4 w-4" />} label="Department" value={doctor?.department || '—'} />
          </div>
          <div className="card p-5 bg-gradient-to-br from-primary-900 to-primary-800 text-white space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest opacity-75">Career Snapshot</h3>
            <StatPill icon={<Briefcase className="h-4 w-4" />} label="Experience" value={`${doctor?.experience || 0} yrs`} />
            <StatPill icon={<DollarSign className="h-4 w-4" />} label="Consultation" value={`₹${doctor?.consultationFee || 0}`} />
            <StatPill
              icon={doctor?.isAvailable ? <CheckCircle className="h-4 w-4 text-green-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
              label="Status"
              value={doctor?.isAvailable ? 'Available' : 'Not Available'}
            />
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-primary-600" /> Qualifications &amp; Specialization
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailBox label="Specialization" value={doctor?.specialization} />
              <DetailBox label="Qualifications" value={doctor?.qualifications} />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-primary-600" /> Weekly Availability
            </h2>
            <div className="grid grid-cols-7 gap-1.5 mb-5">
              {ALL_DAYS.map(day => {
                const active = doctor?.availability?.days?.includes(day);
                return (
                  <div key={day} className={`rounded-xl p-2 text-center text-xs font-bold transition-all ${active ? 'bg-primary-600 text-white shadow-md shadow-primary-200' : 'bg-gray-100 text-gray-400'}`}>
                    {DAY_LABELS[day]}
                  </div>
                );
              })}
            </div>
            {doctor?.availability?.timeSlots?.length > 0 ? (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Time Slots</p>
                <div className="flex flex-wrap gap-2">
                  {doctor.availability.timeSlots.map((slot, i) => (
                    <span key={i} className="flex items-center bg-primary-50 text-primary-700 border border-primary-100 rounded-lg px-3 py-1.5 text-sm font-semibold">
                      <Clock className="h-3.5 w-3.5 mr-1.5" />{slot.start} – {slot.end}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No time slots configured.</p>
            )}
          </div>

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
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="loading-spinner" /></div>;

  const fullName = `${user?.profile?.firstName || ''} ${user?.profile?.lastName || ''}`.trim() || 'Patient';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="relative bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-lg overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        <div className="relative flex items-center gap-5 px-8 py-6">
          <ProfileAvatar user={user} defaultIcon={User} />
          <div className="text-white">
            <h1 className="text-2xl font-black tracking-tight drop-shadow">{fullName}</h1>
            <p className="opacity-90 flex items-center text-sm font-medium mt-1">
              <Shield className="h-3.5 w-3.5 mr-1.5" /> MediCore Member
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <div className="lg:col-span-2 space-y-5">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900">Medical Information</h2>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg transition-all">
                  <Edit2 className="h-4 w-4 mr-1.5" /> Edit Profile
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button onClick={() => setIsEditing(false)} className="text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center btn-primary px-4 py-1.5 text-sm">
                    {saving ? 'Saving...' : <><Save className="h-4 w-4 mr-1.5" /> Save Changes</>}
                  </button>
                </div>
              )}
            </div>

            <form className="space-y-8">
              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Contact Name" disabled={!isEditing} value={formData.emergencyContact.name}
                    onChange={v => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: v } })} />
                  <FormField label="Phone Number" disabled={!isEditing} value={formData.emergencyContact.phone}
                    onChange={v => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: v } })} />
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Insurance Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Provider" disabled={!isEditing} value={formData.insuranceInfo.provider}
                    onChange={v => setFormData({ ...formData, insuranceInfo: { ...formData.insuranceInfo, provider: v } })} />
                  <FormField label="Policy Number" disabled={!isEditing} value={formData.insuranceInfo.policyNumber}
                    onChange={v => setFormData({ ...formData, insuranceInfo: { ...formData.insuranceInfo, policyNumber: v } })} />
                  <FormField label="Expiry Date" disabled={!isEditing} type="date" value={formData.insuranceInfo.expiryDate?.split('T')[0]}
                    onChange={v => setFormData({ ...formData, insuranceInfo: { ...formData.insuranceInfo, expiryDate: v } })} />
                </div>
              </section>

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
                          <button type="button" onClick={() => setFormData({ ...formData, allergies: formData.allergies.filter((_, i) => i !== idx) })}
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
   STAFF PROFILE VIEW — Premium Redesign
   (Receptionist, SuperAdmin, etc)
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
  const initials = `${user?.profile?.firstName?.[0] || ''}${user?.profile?.lastName?.[0] || ''}`.toUpperCase();

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
        window.location.reload();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">

      {/* ── HERO BANNER ── */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-brand-dark shadow-2xl">
        {/* Decorative orbs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand-teal opacity-15 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-rose-500 opacity-10 blur-2xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 800 200" fill="none">
          <circle cx="700" cy="30" r="120" stroke="white" strokeWidth="1"/>
          <circle cx="700" cy="30" r="75" stroke="white" strokeWidth="0.5"/>
          <line x1="0" y1="130" x2="800" y2="100" stroke="white" strokeWidth="0.5"/>
        </svg>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 px-10 py-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-[1.5rem] bg-brand-teal opacity-25 blur-lg scale-110" />
            <div className="relative h-24 w-24 rounded-[1.5rem] bg-gradient-to-br from-brand-teal to-brand-dark border-4 border-white/20 shadow-2xl flex items-center justify-center">
              {user?.profile?.avatar ? (
                <img src={user.profile.avatar} alt="Avatar" className="h-full w-full object-cover rounded-[1.2rem]" />
              ) : (
                <span className="text-white text-3xl font-black tracking-tighter">{initials || '?'}</span>
              )}
            </div>
            {/* Camera upload */}
            <label className="absolute -bottom-2 -right-2 h-8 w-8 rounded-xl bg-brand-teal border-2 border-brand-dark flex items-center justify-center cursor-pointer hover:bg-teal-500 transition-colors shadow-lg">
              <Camera className="h-4 w-4 text-white" />
              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return; }
                const fd = new FormData();
                fd.append('avatar', file);
                try {
                  const res = await api.post('/auth/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                  if (res.data.success) {
                    toast.success('Avatar updated');
                    const u = JSON.parse(localStorage.getItem('user'));
                    u.profile.avatar = res.data.data.avatar;
                    localStorage.setItem('user', JSON.stringify(u));
                    window.location.reload();
                  }
                } catch { toast.error('Upload failed'); }
              }} />
            </label>
          </div>

          {/* Name + role */}
          <div className="flex-1 min-w-0">

            <h1 className="text-3xl md:text-4xl font-black text-white font-display tracking-tight leading-none mb-2">{fullName}</h1>
            <p className="text-sm font-medium text-teal-100/60">{user?.email}</p>
          </div>

          {/* Status badge */}
          <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-50 border border-emerald-100 shadow-lg">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">
              {user?.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* ── IDENTITY GRID ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'First Name', value: user?.profile?.firstName, icon: <User className="h-4 w-4 text-brand-teal" />, bg: 'bg-brand-teal/10' },
          { label: 'Last Name',  value: user?.profile?.lastName,  icon: <User className="h-4 w-4 text-violet-500" />, bg: 'bg-violet-50' },
          { label: 'Phone',      value: user?.profile?.phone || '—', icon: <Phone className="h-4 w-4 text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'Role',       value: roleLabel,                icon: <Briefcase className="h-4 w-4 text-rose-500" />, bg: 'bg-rose-50' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col gap-3">
            <div className={`h-9 w-9 rounded-xl ${item.bg} flex items-center justify-center`}>{item.icon}</div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-sm font-bold text-brand-dark mt-0.5 truncate">{item.value || '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN CARD — Personal Details ── */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-premium overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
          <div>
            <h2 className="text-xl font-black text-brand-dark font-display">Personal Details</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Editable clinical identity</p>
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-light border border-brand-teal/10 text-brand-dark hover:bg-brand-teal hover:text-white transition-all font-black text-xs uppercase tracking-widest"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-brand-dark border border-slate-100 hover:border-slate-200 transition-all">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-teal text-white text-xs font-black uppercase tracking-widest hover:bg-teal-600 transition-all disabled:opacity-60 shadow-lg">
                <Save className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className="px-8 py-8 space-y-8">
          {/* Date of Birth + Gender */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* DOB */}
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</p>
              {isEditing ? (
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-teal" />
                  <input type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-100 focus:border-brand-teal outline-none text-sm font-semibold text-brand-dark bg-slate-50 focus:bg-white transition-all" />
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  <Calendar className="h-4 w-4 text-brand-teal shrink-0" />
                  <span className="text-sm font-bold text-brand-dark">
                    {formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                  </span>
                </div>
              )}
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gender</p>
              {isEditing ? (
                <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-brand-teal outline-none text-sm font-semibold text-brand-dark bg-slate-50 focus:bg-white transition-all">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              ) : (
                <div className="flex items-center gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                  <User className="h-4 w-4 text-brand-teal shrink-0" />
                  <span className="text-sm font-bold text-brand-dark capitalize">{formData.gender || '—'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Residential Address</p>
            {isEditing ? (
              <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                rows={3} placeholder="Enter your address..."
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-brand-teal outline-none text-sm font-semibold text-brand-dark bg-slate-50 focus:bg-white transition-all resize-none" />
            ) : (
              <div className="flex items-start gap-3 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                <MapPin className="h-4 w-4 text-brand-teal shrink-0 mt-0.5" />
                <span className="text-sm font-bold text-slate-600 leading-relaxed">{formData.address || '—'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── INFO BANNER ── */}
      <div className="flex items-start gap-4 p-5 bg-brand-light rounded-2xl border border-brand-teal/10">
        <div className="h-9 w-9 rounded-xl bg-brand-teal/10 flex items-center justify-center shrink-0">
          <Shield className="h-4 w-4 text-brand-teal" />
        </div>
        <div>
          <p className="text-sm font-black text-brand-dark">Profile Access Notice</p>
          <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
            You can edit your personal information such as date of birth, gender, and address.
            To update your email, phone number, or role, please contact the hospital administrator.
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
  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
    <div className="h-8 w-8 rounded-lg bg-brand-teal/10 flex items-center justify-center text-brand-teal shrink-0">{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-bold text-brand-dark mt-0.5">{value || '—'}</p>
    </div>
  </div>
);

const StatPill = ({ icon, label, value }) => (
  <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2.5">
    <div className="flex items-center gap-2 opacity-80">
      {icon}
      <span className="text-xs font-semibold">{label}</span>
    </div>
    <span className="text-sm font-black">{value}</span>
  </div>
);

const DetailBox = ({ label, value }) => (
  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-brand-dark font-semibold">{value || '—'}</p>
  </div>
);

const FormField = ({ label, disabled, value, onChange, type = 'text' }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-slate-500 ml-1">{label}</label>
    <input
      type={type}
      disabled={disabled}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-brand-teal outline-none text-sm font-semibold text-brand-dark bg-slate-50 focus:bg-white disabled:bg-slate-50 transition-all"
    />
  </div>
);

/* ─────────────────────────────────────────────
   MAIN EXPORT — role-aware router
   ───────────────────────────────────────────── */
const Profile = () => {
  const { user } = useAuth();

  if (user?.role === 'doctor') return <DoctorProfile user={user} />;
  if (user?.role === 'patient') return <PatientProfile user={user} />;
  return <StaffProfile user={user} />;
};

export default Profile;
