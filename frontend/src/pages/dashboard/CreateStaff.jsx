import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    UserPlus, Eye, EyeOff, ShieldCheck, Mail, Phone,
    Stethoscope, Briefcase, Award, CreditCard, Landmark,
    ChevronRight, ArrowLeft, Save, Sparkles, UserCircle, XCircle, Plus
} from 'lucide-react';
import api from '../../services/api';

const CreateStaff = () => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showQualDropdown, setShowQualDropdown] = useState(false);
    const [customQual, setCustomQual] = useState('');

    const COMMON_QUALIFICATIONS = [
        'MBBS', 'MD', 'MS', 'DNB', 'DM', 'MCH',
        'BDS', 'MDS', 'BHMS', 'BAMS', 'PhD', 'Fellowship'
    ];

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
        setValue
    } = useForm({
        defaultValues: {
            role: 'doctor',
            email: '',
            firstName: '',
            lastName: '',
            password: '',
            phone: ''
        }
    });

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const editId = searchParams.get('edit');
    const isEditMode = !!editId;

    useEffect(() => {
        if (isEditMode) {
            fetchStaffDetails();
        }
    }, [editId]);

    const fetchStaffDetails = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/admin/staff/${editId}`);
            if (response.data.success) {
                const staff = response.data.data;
                reset({
                    role: staff.role,
                    email: staff.email,
                    firstName: staff.profile.firstName,
                    lastName: staff.profile.lastName,
                    phone: staff.profile.phone || '',
                    specialization: staff.specialization || '',
                    qualifications: staff.qualifications || '',
                    experience: staff.experience || '',
                    licenseNumber: staff.licenseNumber || '',
                    consultationFee: staff.consultationFee || '',
                    department: staff.department || ''
                });
            }
        } catch (error) {
            toast.error('Failed to fetch staff details');
        } finally {
            setLoading(false);
        }
    };

    const qualifications = watch('qualifications') || '';
    const selectedQuals = qualifications ? qualifications.split(', ').filter(Boolean) : [];

    const toggleQualification = (qual) => {
        let newQuals;
        if (selectedQuals.includes(qual)) {
            newQuals = selectedQuals.filter(q => q !== qual);
        } else {
            newQuals = [...selectedQuals, qual];
        }
        setValue('qualifications', newQuals.join(', '), { shouldValidate: true });
    };

    const addCustomQualification = () => {
        if (customQual && !selectedQuals.includes(customQual)) {
            const newQuals = [...selectedQuals, customQual];
            setValue('qualifications', newQuals.join(', '), { shouldValidate: true });
            setCustomQual('');
        }
    };

    const role = watch('role');
    const firstName = watch('firstName');
    const lastName = watch('lastName');

    useEffect(() => {
        if (!isEditMode && firstName && lastName) {
            const domain = role === 'doctor' ? '@medicore.doc' : '@medicore.rec';
            const generatedEmail = `${firstName.toLowerCase()}${lastName ? '.' + lastName.toLowerCase() : ''}${domain}`;
            setValue('email', generatedEmail, { shouldValidate: true });
        }
    }, [firstName, lastName, role, isEditMode, setValue]);

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            let response;
            if (isEditMode) {
                response = await api.patch(`/admin/update-staff/${editId}`, data);
            } else {
                response = await api.post('/admin/create-staff', data);
            }

            if (response.data.success) {
                toast.success(isEditMode
                    ? 'Staff account updated successfully'
                    : `${data.role.charAt(0).toUpperCase() + data.role.slice(1)} account created successfully`
                );

                if (isEditMode) {
                    navigate(data.role === 'doctor' ? '/dashboard/doctors' : '/dashboard/staff');
                } else {
                    reset();
                }
            }
        } catch (error) {
            const errorData = error.response?.data;
            if (errorData?.errors) {
                const errorMsg = errorData.errors.map(err => err.msg || err.message).join(', ');
                toast.error(`Validation failed: ${errorMsg}`);
            } else {
                toast.error(errorData?.message || 'Failed to process staff account');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-fade-in px-4 md:px-0">
            {/* Navigation Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-brand-teal transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        Return to Matrix
                    </button>
                    <h1 className="text-4xl md:text-5xl font-black text-brand-dark font-display tracking-tight leading-none mt-2">
                        {isEditMode ? 'Update' : 'Onboard'} <span className="text-brand-teal italic">Staff</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-premium border border-slate-50">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Administrative Authorization Active</span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                {/* Profile & Role Left Column */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-premium relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-[2rem] bg-brand-light flex items-center justify-center mb-6 shadow-inner text-brand-teal">
                                <UserCircle className="h-12 w-12" />
                            </div>
                            <h3 className="text-2xl font-black text-brand-dark font-display mb-1">
                                {watch('firstName') || 'Staff'} {watch('lastName') || 'Profile'}
                            </h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Verification in progress</p>

                            <div className="w-full space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">Security Clearance</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        disabled={isEditMode}
                                        onClick={() => setValue('role', 'doctor')}
                                        className={`p-4 rounded-2xl border transition-all duration-300 text-left ${role === 'doctor'
                                            ? 'bg-brand-dark border-brand-dark text-white shadow-xl'
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-brand-teal/30 hover:bg-slate-50'
                                            } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Stethoscope className={`h-5 w-5 mb-3 ${role === 'doctor' ? 'text-brand-teal' : 'text-slate-300'}`} />
                                        <p className="text-xs font-black uppercase tracking-widest">Doctor</p>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isEditMode}
                                        onClick={() => setValue('role', 'receptionist')}
                                        className={`p-4 rounded-2xl border transition-all duration-300 text-left ${role === 'receptionist'
                                            ? 'bg-brand-dark border-brand-dark text-white shadow-xl'
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-brand-teal/30 hover:bg-slate-50'
                                            } ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <Briefcase className={`h-5 w-5 mb-3 ${role === 'receptionist' ? 'text-brand-teal' : 'text-slate-300'}`} />
                                        <p className="text-xs font-black uppercase tracking-widest">Staff</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-brand-teal rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16"></div>
                        <div className="relative z-10">
                            <h4 className="text-xl font-black font-display mb-4">Onboarding Note</h4>
                            <p className="text-xs text-teal-50 font-medium leading-relaxed opacity-80 italic">
                                "Ensure all corporate credentials follow the internal security protocol.
                                Passwords must be randomized for initial access."
                            </p>
                            <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-3">
                                <Sparkles className="h-5 w-4 text-teal-200" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-100">MediCore Sentinel AI</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Main Body Right Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[3rem] p-10 md:p-14 border border-slate-100 shadow-premium relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal to-brand-dark opacity-50"></div>

                        <div className="space-y-12">
                            {/* Identities Section */}
                            <div className="space-y-8">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-8 w-1 bg-brand-teal rounded-full"></div>
                                    <h3 className="text-xl font-black text-brand-dark font-display">Identities & Security</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                                                <input
                                                    type="text"
                                                    {...register('firstName', { required: 'Required' })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-brand-dark focus:ring-0 focus:border-brand-teal transition-all placeholder:text-slate-300"
                                                    placeholder="Enter name"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                                                <input
                                                    type="text"
                                                    {...register('lastName', { required: 'Required' })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-brand-dark focus:ring-0 focus:border-brand-teal transition-all placeholder:text-slate-300"
                                                    placeholder="Enter name"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email address</label>
                                            <div className="relative group">
                                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-brand-teal transition-colors" />
                                                    <input
                                                        type="email"
                                                        {...register('email', {
                                                            required: 'Required',
                                                            validate: (value) => {
                                                                const expectedDomain = role === 'doctor' ? '@medicore.doc' : '@medicore.rec';
                                                                return value.endsWith(expectedDomain) || `Must end with ${expectedDomain}`;
                                                            }
                                                        })}
                                                        className={`w-full bg-slate-50 border ${errors.email ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-100'} rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-brand-dark focus:ring-0 focus:border-brand-teal transition-all placeholder:text-slate-300`}
                                                        placeholder={role === 'doctor' ? 'name@medicore.doc' : 'name@medicore.rec'}
                                                        readOnly={isEditMode}
                                                    />
                                            </div>
                                            {errors.email && <p className="text-[10px] text-rose-500 font-black mt-1 ml-1 uppercase">{errors.email.message}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Authentication Key</label>
                                            <div className="relative group">
                                                <Eye className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-brand-teal transition-colors" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    {...register('password', {
                                                        required: !isEditMode && 'Password required',
                                                        minLength: { value: 6, message: 'Min 6 characters' }
                                                    })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-12 py-4 text-sm font-bold text-brand-dark focus:ring-0 focus:border-brand-teal transition-all placeholder:text-slate-300 font-mono"
                                                    placeholder={isEditMode ? '••••••••' : 'Set password'}
                                                    disabled={isEditMode}
                                                />
                                                {!isEditMode && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-teal transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-brand-teal transition-colors" />
                                                <input
                                                    type="tel"
                                                    {...register('phone')}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-brand-dark focus:ring-0 focus:border-brand-teal transition-all placeholder:text-slate-300"
                                                    placeholder="+91 00000 00000"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Specialization Section (Conditional) */}
                            {role === 'doctor' && (
                                <div className="space-y-8 animate-slide-up">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-8 w-1 bg-brand-teal rounded-full"></div>
                                        <h3 className="text-xl font-black text-brand-dark font-display">Clinical Specialization</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Specialization Focus</label>
                                                <div className="relative group">
                                                    <Stethoscope className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-brand-teal transition-colors" />
                                                    <input
                                                        type="text"
                                                        {...register('specialization', { required: role === 'doctor' })}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-brand-dark focus:ring-0 focus:border-brand-teal transition-all placeholder:text-slate-300"
                                                        placeholder="e.g. Cardiology"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2 relative">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Credentials</label>
                                                <div className="relative group">
                                                    <Award className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-brand-teal transition-colors" />
                                                    <div
                                                        onClick={() => setShowQualDropdown(!showQualDropdown)}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-brand-dark cursor-pointer min-h-[54px] flex flex-wrap gap-2 items-center"
                                                    >
                                                        {selectedQuals.length > 0 ? (
                                                            selectedQuals.map(q => (
                                                                <span key={q} className="bg-brand-teal/10 text-brand-teal px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                                                                    {q}
                                                                    <XCircle className="h-3 w-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleQualification(q); }} />
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-300">Select Qualifications</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {showQualDropdown && (
                                                    <div className="absolute z-50 mt-2 w-full bg-white border border-slate-100 rounded-3xl shadow-premium p-4 animate-slide-up">
                                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                                            {COMMON_QUALIFICATIONS.map(qual => (
                                                                <button
                                                                    key={qual}
                                                                    type="button"
                                                                    onClick={() => toggleQualification(qual)}
                                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedQuals.includes(qual)
                                                                            ? 'bg-brand-dark border-brand-dark text-white'
                                                                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-brand-teal'
                                                                        }`}
                                                                >
                                                                    {qual}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={customQual}
                                                                onChange={(e) => setCustomQual(e.target.value)}
                                                                placeholder="Other qualification..."
                                                                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-brand-dark outline-none focus:border-brand-teal"
                                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomQualification(); } }}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={addCustomQualification}
                                                                className="bg-brand-teal text-white p-2 rounded-xl"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                <input type="hidden" {...register('qualifications', { required: role === 'doctor' })} />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Exp. Indices (Yrs)</label>
                                                <div className="relative group">
                                                    <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-brand-teal transition-colors" />
                                                    <input
                                                        type="number"
                                                        {...register('experience', { required: role === 'doctor' })}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-brand-dark focus:ring-0 focus:border-brand-teal transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Consultation Fee (₹)</label>
                                                <div className="relative group">
                                                    <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-brand-teal transition-colors" />
                                                    <input
                                                        type="number"
                                                        {...register('consultationFee', { required: role === 'doctor' })}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-brand-dark focus:ring-0 focus:border-brand-teal transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="md:col-span-2 space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Medical License ID</label>
                                                <input
                                                    type="text"
                                                    {...register('licenseNumber', { required: role === 'doctor' })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-brand-dark focus:ring-0 focus:border-brand-teal transition-all"
                                                    placeholder="LIC-000000"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Allocated Diagnostic Unit</label>
                                            <div className="relative group">
                                                <Landmark className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-brand-teal transition-colors" />
                                                <select
                                                    {...register('department', { required: role === 'doctor' })}
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-brand-dark focus:ring-0 focus:border-brand-teal transition-all flex appearance-none"
                                                >
                                                    <option value="">Select Department Node</option>
                                                    <option value="cardiology">Cardiology Unit</option>
                                                    <option value="neurology">Neurology Ward</option>
                                                    <option value="orthopedics">Orthopedics Dept</option>
                                                    <option value="pediatrics">Pediatrics Wing</option>
                                                    <option value="gynecology">Gynecology Dept</option>
                                                    <option value="dermatology">Dermatology Unit</option>
                                                    <option value="general">General Medicine</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submission Area */}
                            <div className="pt-12 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-8">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest max-w-xs text-center md:text-left leading-relaxed">
                                    By proceeding, you verify that all credential information is accurate and adheres to the facility cluster security guidelines.
                                </p>

                                <div className="flex gap-4 w-full md:w-auto">
                                    <button
                                        type="button"
                                        onClick={() => reset()}
                                        className="h-13 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-teal bg-slate-50 hover:bg-white border border-transparent hover:border-slate-100 transition-all"
                                    >
                                        Flush Form
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="h-13 flex-1 md:flex-none px-10 rounded-[1.25rem] bg-brand-dark text-white font-display font-black text-xs tracking-tight shadow-2xl hover:shadow-brand-dark/20 transition-all hover:-translate-y-1 flex items-center justify-center gap-3 overflow-hidden relative group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-brand-teal to-brand-dark opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="relative z-10 flex items-center gap-3">
                                            {loading ? (
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <>
                                                    {isEditMode ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                                                    {isEditMode ? 'PERSIST CHANGES' : 'INITIALIZE ONBOARDING'}
                                                </>
                                            )}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateStaff;

