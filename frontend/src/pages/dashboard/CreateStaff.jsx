import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import api from '../../services/api';

const CreateStaff = () => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch
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

    const role = watch('role');

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const response = await api.post('/admin/create-staff', data);

            if (response.data.success) {
                toast.success(`${data.role.charAt(0).toUpperCase() + data.role.slice(1)} account created successfully`);
                reset();
            }
        } catch (error) {
            const errorData = error.response?.data;
            if (errorData?.errors) {
                const errorMsg = errorData.errors.map(err => err.msg || err.message).join(', ');
                toast.error(`Validation failed: ${errorMsg}`);
            } else {
                toast.error(errorData?.message || 'Failed to create staff account');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
            <div className="mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal/10 text-brand-teal mb-4 border border-brand-teal/5">
                    <UserPlus className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Administrative Panel</span>
                </div>
                <h1 className="text-4xl font-extrabold text-brand-dark tracking-tight font-display mb-2">
                    Create Staff Account
                </h1>
                <p className="text-slate-500 font-medium text-lg">
                    Add a new doctor or receptionist to the system
                </p>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-premium p-8 md:p-12 border border-slate-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-brand-light rounded-full -mr-20 -mt-20 transition-transform group-hover:scale-110 duration-700"></div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 relative z-10">
                    {/* Role Selection */}
                    <div className="max-w-md">
                        <label className="label">
                            Role Authority *
                        </label>
                        <select
                            {...register('role', { required: 'Role is required' })}
                            className="input text-lg font-bold"
                        >
                            <option value="doctor">Doctor</option>
                            <option value="receptionist">Receptionist</option>
                        </select>
                        {errors.role && (
                            <p className="mt-2 text-xs font-bold text-rose-500 uppercase tracking-tighter">{errors.role.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Personal Information */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest border-l-4 border-brand-teal pl-3">Identities</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">First Name *</label>
                                    <input
                                        type="text"
                                        {...register('firstName', { required: 'First name is required' })}
                                        className="input"
                                        placeholder="John"
                                    />
                                    {errors.firstName && (
                                        <p className="mt-2 text-xs font-bold text-rose-500 uppercase tracking-tighter">{errors.firstName.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="label">Last Name *</label>
                                    <input
                                        type="text"
                                        {...register('lastName', { required: 'Last name is required' })}
                                        className="input"
                                        placeholder="Doe"
                                    />
                                    {errors.lastName && (
                                        <p className="mt-2 text-xs font-bold text-rose-500 uppercase tracking-tighter">{errors.lastName.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Security */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest border-l-4 border-brand-teal pl-3">Security</h3>
                            <div>
                                <label className="label">Initial Access Password *</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password', {
                                            required: 'Password is required',
                                            minLength: {
                                                value: 6,
                                                message: 'Password must be at least 6 characters'
                                            }
                                        })}
                                        className="input pr-12 font-mono"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-brand-teal transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-xs font-bold text-rose-500 uppercase tracking-tighter">{errors.password.message}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-black text-brand-dark uppercase tracking-widest border-l-4 border-brand-teal pl-3">Contact Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="label">Corporate Email Address *</label>
                                <input
                                    type="email"
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@orvanta\.com$/i,
                                            message: 'Email must end with @orvanta.com'
                                        }
                                    })}
                                    className="input"
                                    placeholder="name@orvanta.com"
                                />
                                {errors.email && (
                                    <p className="mt-2 text-xs font-bold text-rose-500 uppercase tracking-tighter">{errors.email.message}</p>
                                )}
                                <p className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Verification: @orvanta.com domain required</p>
                            </div>

                            <div>
                                <label className="label">Mobile Phone Number</label>
                                <input
                                    type="tel"
                                    {...register('phone')}
                                    className="input"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Doctor-specific fields */}
                    {role === 'doctor' && (
                        <div className="p-8 bg-brand-light rounded-[2rem] border border-brand-teal/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-brand-teal/5 px-6 py-2 rounded-bl-2xl font-black text-[10px] uppercase tracking-widest text-brand-dark">Clinical Validation</div>
                            <h3 className="text-xl font-black text-brand-dark font-display mb-8">Doctor Specialization Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="label">Medical Specialization *</label>
                                        <input
                                            type="text"
                                            {...register('specialization', { required: 'Specialization is required' })}
                                            className="input bg-white"
                                            placeholder="e.g., Cardiology"
                                        />
                                    </div>

                                    <div>
                                        <label className="label">Academic Qualifications *</label>
                                        <input
                                            type="text"
                                            {...register('qualifications', { required: 'Qualifications are required' })}
                                            className="input bg-white"
                                            placeholder="MBBS, MD, FRCS"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Exp. (Years) *</label>
                                            <input
                                                type="number"
                                                {...register('experience', { required: true })}
                                                className="input bg-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Fee (₹) *</label>
                                            <input
                                                type="number"
                                                {...register('consultationFee', { required: true })}
                                                className="input bg-white"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="label">Medical License Number *</label>
                                        <input
                                            type="text"
                                            {...register('licenseNumber', { required: true })}
                                            className="input bg-white"
                                            placeholder="LIC-9988-77"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <label className="label">Assigned Department *</label>
                                <select
                                    {...register('department', { required: true })}
                                    className="input bg-white font-bold"
                                >
                                    <option value="">Choose Unit</option>
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
                    )}

                    {/* Submit Action Container */}
                    <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3 text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Double check information before submission</span>
                        </div>
                        <div className="flex gap-4 w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => reset()}
                                className="btn btn-secondary flex-1 sm:flex-none uppercase tracking-widest text-[10px] font-black"
                            >
                                Reset Form
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 shadow-2xl"
                            >
                                {loading ? (
                                    <div className="loading-spinner h-5 w-5"></div>
                                ) : (
                                    <>
                                        <UserPlus className="h-5 w-5" />
                                        <span className="font-display font-black tracking-tight">Generate Profile</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateStaff;
