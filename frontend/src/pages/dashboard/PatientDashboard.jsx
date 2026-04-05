import React, { useState, useEffect } from 'react';
import {
  Calendar, DollarSign, FileText, TestTube, User, Clock,
  ChevronRight, ArrowRight, Activity, Shield, Heart, Search
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PatientDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalBills: 0,
    prescriptions: 0,
    labReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientStats();
  }, []);

  const fetchPatientStats = async () => {
    try {
      const [appointmentsRes, billsRes, prescriptionsRes, labReportsRes] = await Promise.all([
        api.get('/patient/appointments'),
        api.get('/patient/bills'),
        api.get('/patient/prescriptions'),
        api.get('/patient/lab-reports'),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      setStats({
        upcomingAppointments: appointmentsRes.data.data.appointments.filter(
          apt => new Date(apt.date) >= today && apt.status !== 'cancelled'
        ).length,
        totalBills: billsRes.data.data.bills.filter(
          bill => !['paid', 'refunded', 'cancelled'].includes(bill.status)
        ).length,
        prescriptions: prescriptionsRes.data.data.prescriptions.length,
        labReports: labReportsRes.data.data.labReports.length,
      });
    } catch (error) {
      console.error('Failed to fetch patient stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      name: 'Book Appointment',
      description: 'Schedule a new clinical consultation',
      icon: Calendar,
      href: '/patient/book-appointment',
      color: 'text-brand-teal',
      bg: 'bg-brand-light'
    },
    {
      name: 'My Appointments',
      description: 'Manage your active medical queue',
      icon: Clock,
      href: '/patient/appointments',
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      name: 'Bills & Payments',
      description: 'Review and settle pending dues',
      icon: DollarSign,
      href: '/patient/bills',
      color: 'text-rose-500',
      bg: 'bg-rose-50'
    },
    {
      name: 'Prescriptions',
      description: 'Access your issued digital scripts',
      icon: FileText,
      href: '/patient/prescriptions',
      color: 'text-violet-500',
      bg: 'bg-violet-50'
    },
    {
      name: 'Lab Reports',
      description: 'Review your laboratory diagnostics',
      icon: TestTube,
      href: '/patient/lab-reports',
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    },
    {
      name: 'Profile',
      description: 'Manage clinical identity & records',
      icon: User,
      href: '/patient/profile',
      color: 'text-brand-dark',
      bg: 'bg-slate-100'
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="loading-spinner"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Personalizing Your Health Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Patient Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500 animate-pulse" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Personal Health Hub</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-brand-dark font-display tracking-tight leading-none mb-2">
            Hello, <span className="italic text-brand-teal">{user?.profile?.firstName || 'Back'}</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-md">
            Your comprehensive medical journey, centralized and secure.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-premium border border-slate-50">
          <Shield className="h-4 w-4 text-emerald-500" />
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Data Privacy: Encrypted</span>
        </div>
      </div>

      {/* Vital Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Queue", value: stats.upcomingAppointments, icon: Calendar, color: "text-brand-teal", bg: "bg-brand-light" },
          { label: "Pending Bills", value: stats.totalBills, icon: DollarSign, color: "text-rose-500", bg: "bg-rose-50" },
          { label: "Digital Scripts", value: stats.prescriptions, icon: FileText, color: "text-violet-500", bg: "bg-violet-50" },
          { label: "Lab Reports", value: stats.labReports, icon: TestTube, color: "text-blue-500", bg: "bg-blue-50" },
        ].map((metric, i) => (
          <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium group hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 ${metric.bg} opacity-30 rounded-bl-[4rem]`}></div>
            <div className="relative z-10">
              <div className={`p-4 rounded-2xl ${metric.bg} ${metric.color} w-fit mb-6 shadow-inner`}>
                <metric.icon className="h-6 w-6 stroke-[2.5]" />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{metric.label}</p>
              <p className={`text-4xl font-black ${metric.color} font-display leading-none`}>{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Launchpad */}
      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-premium relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal to-rose-400 opacity-50"></div>

        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl font-black text-brand-dark font-display">Medical Actions</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Navigate your clinical workspace</p>
          </div>
          {/* <div className="flex bg-slate-50 p-1.5 rounded-full border border-slate-100">
            <button className="px-5 py-2 bg-white shadow-sm rounded-full text-[10px] font-black text-brand-dark transition-all">GRID VIEW</button>
            <button className="px-5 py-2 text-[10px] font-black text-slate-400 hover:text-brand-dark transition-all">LIST VIEW</button>
          </div> */}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="group relative flex flex-col items-start p-8 bg-white hover:bg-brand-dark border border-slate-100 rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className={`p-4 rounded-2xl ${action.bg} group-hover:bg-white/10 transition-colors mb-6 shadow-inner`}>
                <action.icon className={`h-6 w-6 ${action.color} group-hover:text-brand-teal stroke-[2.2]`} />
              </div>
              <h4 className="text-lg font-black text-brand-dark group-hover:text-white transition-colors font-display mb-2">{action.name}</h4>
              <p className="text-xs text-slate-400 group-hover:text-teal-100/60 leading-relaxed transition-colors mb-6">{action.description}</p>

              <div className="mt-auto flex items-center gap-2 text-[10px] font-black text-brand-teal group-hover:text-white uppercase tracking-widest">
                Initialize Action
                <ArrowRight className="h-3 w-3 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Wellness Insight Banner */}
      <div className="relative overflow-hidden rounded-[3rem] bg-brand-dark p-10 md:p-14 text-white shadow-2xl group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal opacity-10 rounded-full -mr-32 -mt-32 blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500 opacity-5 rounded-full -ml-24 -mb-24 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
          <div className="space-y-6">

            <h2 className="text-3xl md:text-4xl font-black font-display tracking-tight leading-tight">
              Empowering Your <span className="text-brand-teal italic">Health Journey</span>
            </h2>
            <p className="text-teal-100/60 font-medium max-w-xl text-sm leading-relaxed">
              Your health isn't just a priority—it's our obsession. Access and manage your medical records,
              consult with the world's best clinicians, and let our AI-powered diagnostics assist you
              every step of the way. All within a secured, high-fidelity environment.
            </p>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() => navigate('/patient/book-appointment')}
              className="px-10 py-6 bg-brand-teal hover:bg-white hover:text-brand-dark text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.25em] shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0"
            >
              Book Consultation Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;

