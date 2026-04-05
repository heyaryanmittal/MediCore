import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Mail, Phone, MapPin, Send, Building2, User, ChevronRight, ShieldCheck } from 'lucide-react';

const ContactSales = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        facility: '',
        role: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Need to change the import to handle this manually since api defaults requires auth tokens. Wait, the public api call doesn't need to intercept with a token. I'll import axios directly instead of api to avoid 401s if no token exists, but let's just use fetch or axios. 
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                setIsSuccess(true);
                setFormData({
                    name: '', email: '', phone: '', facility: '', role: '', message: ''
                });
                setTimeout(() => setIsSuccess(false), 5000);
            } else {
                alert('We failed to send your message. Please try again.');
            }
        } catch (error) {
            alert('A network error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-light font-sans selection:bg-brand-dark selection:text-white">
            {/* Header / Navigation */}
            <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between h-20 items-center">
                        <Link to="/" className="flex items-center gap-3 group cursor-pointer">
                            <div className="h-10 w-10 bg-brand-dark rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-black text-brand-dark tracking-tight font-display">MediCore</span>
                        </Link>
                        <div className="flex items-center gap-8">
                            <Link to="/" className="text-slate-600 hover:text-brand-dark font-bold transition-colors">
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-24">
                <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-start">
                    
                    {/* Left Column - Information */}
                    <div className="lg:col-span-5 mb-12 lg:mb-0">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-teal/10 text-brand-teal mb-6 border border-brand-teal/5">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Premium Enterprise Solutions</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight font-display leading-[1.1] text-brand-dark mb-6">
                            Let's transform your <span className="text-brand-teal italic">facility.</span>
                        </h1>
                        <p className="text-lg text-slate-600 font-medium leading-relaxed mb-10">
                            Speak with our experts to discover how MediCore can streamline operations, enhance patient care, and elevate your medical institution's standards.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 group hover:-translate-y-1 transition-transform">
                                <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-dark mb-1">Email Us directly</h3>
                                    <p className="text-slate-500 text-sm font-medium mb-2">Our team usually responds within 2 hours.</p>
                                    <a href="mailto:sales@MediCore.com" className="text-brand-teal font-bold hover:underline">sales@MediCore.com</a>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 group hover:-translate-y-1 transition-transform">
                                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <Phone className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-dark mb-1">Call Sales</h3>
                                    <p className="text-slate-500 text-sm font-medium mb-2">Available Mon-Fri, 9am to 6pm EST.</p>
                                    <a href="tel:+18005550199" className="text-brand-teal font-bold hover:underline">+1 (800) 555-0199</a>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4 p-6 bg-white rounded-3xl shadow-sm border border-slate-100 group hover:-translate-y-1 transition-transform">
                                <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-brand-dark mb-1">Global Headquarters</h3>
                                    <p className="text-slate-500 text-sm font-medium">
                                        100 Innovation Drive,<br/>
                                        Tech District, NY 10001
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Form */}
                    <div className="lg:col-span-7 relative">
                        <div className="absolute inset-0 bg-brand-dark rounded-[3rem] transform translate-x-4 translate-y-4 opacity-5"></div>
                        <div className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-premium border border-slate-100 relative z-10">
                            <h2 className="text-2xl font-black text-brand-dark mb-2 font-display">Contact Sales Team</h2>
                            <p className="text-slate-500 font-medium text-sm mb-8">Fill out the form below and we'll be in touch shortly.</p>
                            
                            {isSuccess ? (
                                <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-3xl text-center animate-fade-in shadow-inner">
                                    <div className="h-16 w-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                                        <ShieldCheck className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-xl font-bold text-emerald-800 mb-2">Message Received!</h3>
                                    <p className="text-emerald-600/80 font-medium text-sm">Thank you for your interest. One of our specialists will contact you very soon.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 block">Full Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    required
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 rounded-xl transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                                                    placeholder="Dr. John Doe"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 block">Email Address</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 rounded-xl transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                                                    placeholder="john@hospital.com"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 block">Facility Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <input
                                                    type="text"
                                                    name="facility"
                                                    required
                                                    value={formData.facility}
                                                    onChange={handleChange}
                                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 rounded-xl transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                                                    placeholder="City General Hospital"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700 block">Your Role</label>
                                            <div className="relative">
                                                <select
                                                    name="role"
                                                    required
                                                    value={formData.role}
                                                    onChange={handleChange}
                                                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 rounded-xl transition-all outline-none font-medium text-slate-800 appearance-none cursor-pointer"
                                                >
                                                    <option value="" disabled>Select your role</option>
                                                    <option value="administrator">Hospital Administrator</option>
                                                    <option value="doctor">Lead Physician</option>
                                                    <option value="it_director">IT Director</option>
                                                    <option value="other">Other</option>
                                                </select>
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                                                    <ChevronRight className="h-5 w-5 rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 block">Phone Number (Optional)</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                                <Phone className="h-5 w-5" />
                                            </div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border-transparent focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 rounded-xl transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                                                placeholder="(555) 123-4567"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 block">How can we help?</label>
                                        <textarea
                                            name="message"
                                            required
                                            value={formData.message}
                                            onChange={handleChange}
                                            rows="4"
                                            className="w-full p-4 bg-slate-50 border-transparent focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 rounded-xl transition-all outline-none font-medium text-slate-800 placeholder-slate-400 resize-none"
                                            placeholder="Tell us about your facility's needs and current challenges..."
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full btn bg-brand-dark text-white rounded-xl py-4 font-bold text-lg hover:bg-brand-teal transition-all shadow-xl hover:-translate-y-1 hover:shadow-brand-teal/30 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <div className="h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                <span>Send Request</span>
                                                <Send className="h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                    <p className="text-center text-xs text-slate-400 font-medium">By submitting, you agree to our <a href="#" className="underline hover:text-brand-dark">Privacy Policy</a>.</p>
                                </form>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ContactSales;
