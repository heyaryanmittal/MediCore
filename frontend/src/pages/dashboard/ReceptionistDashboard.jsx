import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, DollarSign, FileText, AlertCircle, 
  ChevronRight, ArrowRight, Activity, CreditCard, Clipboard 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ReceptionistDashboard = () => {
  const [stats, setStats] = useState({
    todaysAppointments: 0,
    newPatients: 0,
    pendingBills: 0,
    labReports: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      // Fetch data in parallel for efficiency
      const [appointmentsRes, billsRes, labReportsRes] = await Promise.all([
        api.get('/receptionist/appointments', { params: { date: today } }),
        api.get('/receptionist/bills'),
        api.get('/receptionist/lab-reports')
      ]);

      const todaysAppointments = appointmentsRes.data.data?.appointments?.length || 0;
      const pendingBills = billsRes.data.data?.bills?.filter(b => b.status === 'pending')?.length || 0;
      const labReports = labReportsRes.data.data?.labReports?.length || 0;

      setStats({
        todaysAppointments,
        newPatients: 0, // Simplified for now
        pendingBills,
        labReports
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="loading-spinner"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Initializing Controller...</p>
      </div>
    );
  }

  const metrics = [
    { label: "Today's Queue", value: stats.todaysAppointments, icon: Calendar, color: "text-brand-teal", bg: "bg-brand-light", border: "border-brand-teal/20" },
    { label: "Pending Dues", value: stats.pendingBills, icon: DollarSign, iconColor: "text-rose-500", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    { label: "Lab Analytics", value: stats.labReports, icon: Activity, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
    { label: "System Status", value: "Active", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
  ];

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Front Desk Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-[1px] w-8 bg-brand-teal"></span>
            <span className="text-[11px] font-black text-brand-teal uppercase tracking-widest">Front Desk Operations</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-brand-dark font-display tracking-tight leading-none mb-2">
            Reception <span className="italic text-brand-teal">Portal</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-md">
            Management of patient intake, billing, and clinical scheduling.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-premium border border-slate-50">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Operational Integrity: 98%</span>
        </div>
      </div>

      {/* Reception Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, i) => (
          <div key={i} className={`relative group bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-premium transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-24 h-24 ${metric.bg} opacity-30 rounded-bl-[4rem]`}></div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className={`p-4 rounded-2xl ${metric.bg} ${metric.color} shadow-inner`}>
                  <metric.icon className="h-6 w-6 stroke-[2.5]" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{metric.label}</p>
                <p className={`text-3xl font-black ${metric.color} font-display leading-none`}>{metric.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Center & Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-premium relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal to-brand-dark opacity-50"></div>
            
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-black text-brand-dark font-display">Command & Control</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time facility management</p>
              </div>
              <button 
                onClick={fetchDashboardStats}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-brand-teal hover:text-white rounded-full text-[10px] font-black transition-all group"
              >
                SYNCHRONIZE DATA
                <Activity className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { title: 'Appointments', desc: 'Secure patient bookings and scheduling.', icon: Calendar, path: '/receptionist/appointments', color: 'text-brand-teal', bg: 'bg-brand-light' },
                { title: 'Billing Center', desc: 'Process invoices and revenue collection.', icon: DollarSign, path: '/receptionist/bills', color: 'text-rose-500', bg: 'bg-rose-50' },
                { title: 'Lab Reports', desc: 'Clinical result distribution and tracking.', icon: FileText, path: '/receptionist/lab-reports', color: 'text-blue-500', bg: 'bg-blue-50' },
                { title: 'Staff Mapping', desc: 'Clinician availability and ward shifts.', icon: Users, path: '/receptionist/doctor-availability', color: 'text-violet-500', bg: 'bg-violet-50' },
              ].map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  className="group relative flex flex-col items-start p-8 bg-white hover:bg-brand-dark border border-slate-100 rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 text-left"
                >
                  <div className={`p-4 rounded-2xl ${action.bg} group-hover:bg-white/10 transition-colors mb-6`}>
                    <action.icon className={`h-6 w-6 ${action.color} group-hover:text-brand-teal`} />
                  </div>
                  <h4 className="text-lg font-black text-brand-dark group-hover:text-white transition-colors font-display mb-2">{action.title}</h4>
                  <p className="text-xs text-slate-400 group-hover:text-teal-100/60 leading-relaxed transition-colors mb-6">{action.desc}</p>
                  <div className="mt-auto flex items-center gap-2 text-[10px] font-black text-brand-teal group-hover:text-white uppercase tracking-widest">
                    Open Module
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-2 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Launch & Status Sidebar */}
        <div className="space-y-8 flex flex-col">
          <div className="bg-brand-dark rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex-1 group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-teal opacity-10 rounded-full blur-3xl -mr-24 -mt-24 transition-transform duration-1000 group-hover:scale-150"></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-2xl font-black font-display mb-8">Rapid Actions</h3>
              
              <div className="space-y-4">
                <button 
                  onClick={() => navigate('/dashboard/patients')}
                  className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] transition-all group"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-brand-teal rounded-xl">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Find Patient</p>
                      <p className="text-[10px] text-teal-100/40 uppercase tracking-widest font-black">Search Records</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                <button 
                  onClick={() => navigate('/receptionist/bills')}
                  className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] transition-all group"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-rose-500 rounded-xl">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">New Invoice</p>
                      <p className="text-[10px] text-teal-100/40 uppercase tracking-widest font-black">Create Billing</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                <button 
                  onClick={() => navigate('/receptionist/appointments')}
                  className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] transition-all group"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-blue-500 rounded-xl">
                      <Clipboard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">View Doctors</p>
                      <p className="text-[10px] text-teal-100/40 uppercase tracking-widest font-black">Shift Roster</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              <div className="mt-auto pt-10">
                <div className="p-6 bg-emerald-500/10 rounded-[2.5rem] border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-emerald-400" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Front Desk Note</p>
                  </div>
                  <p className="text-xs text-teal-100/60 leading-relaxed">
                    "Maintain priority queue for emergency ward intake during the morning rush."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;

