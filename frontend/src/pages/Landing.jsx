import React from 'react';
import { Link } from 'react-router-dom';
import {
    Stethoscope,
    Calendar,
    FileText,
    Activity,
    Users,
    ShieldCheck,
    ArrowRight,
    Heart,
    Award,
    Target,
    Github,
    Linkedin,
    Mail,
    Code,
    Lightbulb,
    Star,
    ExternalLink
} from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-brand-dark selection:text-white">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between h-20 items-center">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="h-10 w-10 bg-brand-dark rounded-xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-2xl font-black text-brand-dark tracking-tight font-display">OrvantaHealth</span>
                        </div>
                        <div className="flex items-center gap-8">
                            <Link to="/login" className="hidden sm:block text-slate-600 hover:text-brand-dark font-bold transition-colors">
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="btn btn-primary px-6 shadow-premium hover:scale-105 active:scale-95"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative bg-brand-light pt-20 pb-32 overflow-hidden selection:bg-brand-dark selection:text-white">
                <div className="absolute top-0 right-0 w-[50%] h-full bg-brand-dark/5 -skew-x-12 transform translate-x-1/4"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
                        <div className="sm:text-center lg:text-left lg:col-span-7">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-teal/10 text-brand-teal mb-6 animate-fade-in shadow-inner border border-brand-teal/5">
                                <ShieldCheck className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Enterprise Grade Security</span>
                            </div>
                            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight font-display leading-[0.95]">
                                <span className="block text-brand-dark">Modern Care,</span>{' '}
                                <span className="relative inline-block mt-2">
                                    <span className="relative z-10 text-brand-teal underline decoration-teal-600/30 decoration-8 underline-offset-[12px]">Unified</span>
                                </span>
                            </h1>
                            <p className="mt-8 text-xl text-slate-500 font-medium leading-relaxed max-w-2xl sm:mx-auto lg:mx-0">
                                The all-in-one hospital ecosystem that empowers medical teams and elevates patient outcomes through intelligent automation.
                            </p>
                            <div className="mt-12 flex flex-col sm:flex-row gap-4 sm:justify-center lg:justify-start">
                                <Link
                                    to="/register"
                                    className="btn btn-primary px-10 py-5 text-lg shadow-2xl hover:scale-105 transition-transform"
                                >
                                    Start Your Transformation
                                </Link>
                                <Link
                                    to="/login"
                                    className="btn btn-secondary px-10 py-5 text-lg"
                                >
                                    Watch Demo
                                </Link>
                            </div>
                            <div className="mt-12 flex items-center gap-6 sm:justify-center lg:justify-start text-slate-400">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                                            <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-sm font-bold tracking-tight">Trusted by 500+ Medical Units</span>
                            </div>
                        </div>
                        <div className="mt-16 lg:mt-0 lg:col-span-5 relative">
                            <div className="bg-white rounded-[3rem] shadow-premium p-4 md:p-8 border border-slate-100 transform lg:rotate-2 skew-y-1 transition-transform duration-500 hover:rotate-0 hover:skew-y-0">
                                <div className="space-y-4">
                                    <div className="w-full h-8 bg-slate-50 rounded-lg animate-pulse"></div>
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-brand-teal/20 rounded-xl"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="w-3/4 h-4 bg-slate-100 rounded"></div>
                                            <div className="w-1/2 h-4 bg-slate-50 rounded"></div>
                                        </div>
                                    </div>
                                    <div className="w-full h-48 bg-brand-dark rounded-2xl flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-brand-teal opacity-20 blur-3xl rounded-full translate-x-1/2"></div>
                                        <Activity className="h-20 w-20 text-white animate-pulse" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        <div className="h-20 bg-emerald-50 rounded-2xl p-4">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 mb-2"></div>
                                            <div className="w-full h-2 bg-emerald-200 rounded"></div>
                                        </div>
                                        <div className="h-20 bg-rose-50 rounded-2xl p-4">
                                            <div className="w-8 h-8 rounded-lg bg-rose-500/20 mb-2"></div>
                                            <div className="w-full h-2 bg-rose-200 rounded"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid - requested "light teal with black" */}
            <section className="py-24 bg-brand-light text-brand-dark selection:bg-brand-dark selection:text-brand-light">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-xs font-black text-brand-teal uppercase tracking-[0.3em] mb-4">The Stack</h2>
                        <p className="text-4xl md:text-5xl font-black font-display tracking-tight text-brand-dark">
                            Built for the next generation.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                name: 'Predictive Scheduling',
                                desc: 'AI-driven queue management to minimize patient wait times by 40%.',
                                icon: Calendar,
                            },
                            {
                                name: 'Secure PHI Storage',
                                desc: 'Fully encrypted, HIPAA-compliant patient dossiers at your fingertips.',
                                icon: FileText,
                            },
                            {
                                name: 'Real-time Vitals',
                                desc: 'Sync health data instantly across patient and doctor dashboards.',
                                icon: Activity,
                            },
                            {
                                name: 'Team Hub',
                                desc: 'Centralized collaboration for doctors, nurses, and administrative staff.',
                                icon: Users,
                            },
                        ].map((f) => (
                            <div key={f.name} className="bg-white p-8 rounded-[2.5rem] shadow-premium hover:shadow-premium-hover transition-all duration-300 border border-slate-50 group hover:-translate-y-2">
                                <div className="w-14 h-14 bg-brand-dark rounded-2xl flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 transition-transform">
                                    <f.icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold font-display mb-3 text-brand-dark">{f.name}</h3>
                                <p className="text-slate-500 font-medium text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-teal/10 text-brand-teal mb-6 border border-brand-teal/5">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Our Mission</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black font-display text-brand-dark mb-8 leading-tight">
                                Redefining the Standard of <span className="text-brand-teal italic">Medical Excellence.</span>
                            </h2>
                            <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
                                OrvantaHealth was born from a simple realization: medical professionals spend too much time on paperwork and not enough time on patients. Our mission is to bridge that gap with a unified operating system that handles the complexity of hospital management, so you can focus on what matters most—saving lives.
                            </p>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-brand-light rounded-lg">
                                            <Heart className="h-5 w-5 text-brand-teal" />
                                        </div>
                                        <span className="font-bold text-brand-dark text-sm">Patient First</span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium tracking-tight">Every feature is designed to enhance the patient journey.</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-brand-light rounded-lg">
                                            <Target className="h-5 w-5 text-brand-teal" />
                                        </div>
                                        <span className="font-bold text-brand-dark text-sm">Precision Care</span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium tracking-tight">Data-driven insights for faster and more accurate diagnostics.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 lg:mt-0 grid grid-cols-2 gap-4">
                            <div className="space-y-4 pt-12">
                                <div className="bg-brand-dark h-48 rounded-[2rem] p-6 flex flex-col justify-end group hover:bg-brand-teal transition-colors duration-500 shadow-xl">
                                    <span className="text-3xl font-black text-white font-display">99.9%</span>
                                    <span className="text-[10px] text-teal-100/50 uppercase font-bold tracking-widest mt-1">Uptime SLA</span>
                                </div>
                                <div className="bg-brand-light h-64 rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                                    <Award className="h-10 w-10 text-brand-teal mb-4" />
                                    <p className="font-black text-brand-dark uppercase tracking-widest text-[10px] mb-2">Industry Standard</p>
                                    <p className="text-slate-600 font-bold text-sm leading-snug">Recognized for medical software innovation 2024.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-brand-light h-64 rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col justify-center">
                                    <div className="flex gap-1 mb-4">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 fill-brand-teal text-brand-teal" />)}
                                    </div>
                                    <p className="italic text-brand-dark font-bold text-lg mb-2 leading-tight">"Revolutionized our workflow."</p>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">— City General Hospital</p>
                                </div>
                                <div className="bg-brand-teal h-48 rounded-[2rem] p-6 flex flex-col justify-end shadow-xl">
                                    <span className="text-3xl font-black text-white font-display">1.2M+</span>
                                    <span className="text-[10px] text-white/50 uppercase font-bold tracking-widest mt-1">Safe Transactions</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section - requested "dark teal with white" */}
            <section className="py-24 bg-brand-dark text-white relative overflow-hidden selection:bg-brand-teal">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-teal/20 via-transparent to-transparent"></div>
                <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
                    <Activity className="h-16 w-16 text-brand-teal mx-auto mb-10 opacity-50" />
                    <h2 className="text-4xl md:text-6xl font-black font-display tracking-tighter mb-8 italic">
                        "Healthcare is complex. OrvantaHealth makes it human."
                    </h2>
                    <p className="text-teal-100/60 text-xl font-medium mb-12 max-w-2xl mx-auto uppercase tracking-widest">
                        Ready to elevate your facility?
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link
                            to="/register"
                            className="btn bg-white text-brand-dark px-12 py-5 text-xl hover:bg-teal-50 shadow-2xl"
                        >
                            Open Free Account
                        </Link>
                        <button className="btn border-2 border-white/20 text-white px-12 py-5 text-xl hover:bg-white/10">
                            Contact Sales
                        </button>
                    </div>
                </div>
            </section>

            {/* Meet the Developer Section */}
            <section className="py-24 bg-brand-light text-brand-dark selection:bg-brand-dark selection:text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-xs font-black text-brand-teal uppercase tracking-[0.3em] mb-4">The Architect</h2>
                        <p className="text-4xl md:text-5xl font-black font-display tracking-tight text-brand-dark">
                            Meet the Creative Force.
                        </p>
                    </div>

                    <div className="max-w-5xl mx-auto bg-white rounded-[3.5rem] p-8 md:p-16 shadow-premium border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-light rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className="w-64 h-64 shrink-0 rounded-[3.5rem] overflow-hidden shadow-2xl transform -rotate-3 group-hover:rotate-0 transition-transform duration-500 bg-brand-dark flex items-center justify-center">
                                <img
                                    src="/developer.jpg"
                                    alt="Ketan Kumar - Lead Developer"
                                    className="w-full h-full object-cover object-top scale-110 group-hover:scale-100 transition-transform duration-700"
                                />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-dark text-white mb-6">
                                    <Code className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Lead Engineer & Visionary</span>
                                </div>
                                <h3 className="text-4xl font-black text-brand-dark font-display mb-6 tracking-tight">Ketan Kumar</h3>
                                <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
                                    Passionate about bridging technology and healthcare. Ketan designed OrvantaHealth as a response to the technical hurdles faced by modern hospitals, focusing on creating a seamless, intuitive experience for both patients and practitioners.
                                </p>
                                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                    <a href="https://github.com/Ksingla1885" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 bg-brand-dark text-white rounded-xl font-bold hover:bg-brand-teal transition-all shadow-lg hover:-translate-y-1">
                                        <Github className="h-5 w-5" />
                                        <span>GitHub</span>
                                    </a>
                                    <a href="www.linkedin.com/in/ketan-kumar1885" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-6 py-3 border-2 border-slate-100 text-brand-dark rounded-xl font-bold hover:bg-slate-50 transition-all hover:-translate-y-1">
                                        <Linkedin className="h-5 w-5 text-blue-600" />
                                        <span>LinkedIn</span>
                                    </a>
                                    <a href="mailto:ketansingla7988@gmail.com" className="flex items-center gap-3 px-6 py-3 bg-brand-teal/10 text-brand-teal rounded-xl font-bold hover:bg-brand-teal hover:text-white transition-all hover:-translate-y-1">
                                        <Mail className="h-5 w-5" />
                                        <span>Contact</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-12 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-3">
                            <Activity className="h-6 w-6 text-brand-teal" />
                            <span className="text-xl font-black font-display tracking-tight text-brand-dark">OrvantaHealth</span>
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                            &copy; 2024 OrvantaHealth OS. Crafted for Excellence.
                        </p>
                        <div className="flex gap-6 text-slate-400">
                            <Github className="h-5 w-5 cursor-pointer hover:text-brand-dark transition-colors" />
                            <Linkedin className="h-5 w-5 cursor-pointer hover:text-brand-dark transition-colors" />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
