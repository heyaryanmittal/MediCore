import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, Calendar, DollarSign, TrendingUp,
  Activity, ArrowRight, Shield, Zap, Bell, Clock,
  ChevronRight, Database, Globe, Lock, Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const SuperAdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchAnalytics();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics');
      if (response.data.success) {
        setAnalytics(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/admin/export?type=audit&format=pdf', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system_audit_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Audit report downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download audit report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-brand-teal/20 border-t-brand-teal rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-brand-dark uppercase tracking-tighter">
            MediCore
          </div>
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Synchronizing Systems...</p>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Patients',
      value: analytics?.totalPatients || 0,
      icon: Users,
      color: 'from-emerald-400 to-emerald-600',
      shadow: 'shadow-emerald-200',
      label: 'verified profiles'
    },
    {
      name: 'Total Doctors',
      value: analytics?.totalDoctors || 0,
      icon: UserPlus,
      color: 'from-blue-400 to-blue-600',
      shadow: 'shadow-blue-200',
      label: 'medical staff'
    },
    {
      name: "Today's Appointments",
      value: analytics?.todayAppointments || 0,
      icon: Calendar,
      color: 'from-amber-400 to-amber-600',
      shadow: 'shadow-amber-200',
      label: 'active queue'
    },
    {
      name: 'Monthly Revenue',
      value: `₹${(analytics?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'from-rose-400 to-rose-600',
      shadow: 'shadow-rose-200',
      label: 'net earnings'
    },
    {
      name: 'System Health',
      value: '99.9%',
      icon: Activity,
      color: 'from-brand-teal to-brand-dark',
      shadow: 'shadow-teal-100',
      label: 'uptime metrics'
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Premium Welcome Banner */}
      <div className="relative overflow-hidden rounded-[3rem] bg-brand-dark p-8 md:p-12 text-white shadow-2xl group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-teal opacity-10 rounded-full -mr-32 -mt-32 blur-3xl transition-transform duration-1000 group-hover:scale-110"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -ml-24 -mb-24 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-2">
              <Zap className="h-3.5 w-3.5 text-brand-teal fill-brand-teal" />
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-100">System Command Center</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight leading-tight">
              Welcome Back, <span className="text-brand-teal italic">{(user?.profile?.lastName || 'Admin')}</span>
            </h1>
            {/* <p className="text-teal-100/60 font-medium max-w-lg text-sm md:text-base">
              Hospital operations are running optimally. You have <span className="text-white font-bold">{analytics?.todayAppointments || 0} appointments</span> scheduled for today across all departments.
            </p> */}
          </div>

          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-6 px-8 py-5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl">
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-100/40 mb-0.5">Global Cluster Time</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-teal" />
                  <span className="text-2xl font-black font-display tabular-nums">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
              <div className="h-10 w-px bg-white/10 self-center"></div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-100/40 mb-0.5">Date</p>
                <p className="text-sm font-bold">
                  {currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Futuristic Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className={`relative group bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-premium transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden`}>
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-5 rounded-bl-[4rem] group-hover:opacity-10 transition-opacity`}></div>

              <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-center justify-between mb-8">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} ${stat.shadow} shadow-lg text-white`}>
                    <Icon className="h-6 w-6 stroke-[2.5]" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Growth</span>
                    <div className="flex items-center gap-1 text-emerald-500">
                      <TrendingUp className="h-3 w-3" />
                      <span className="text-xs font-black">+12%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-brand-dark font-display leading-none">{stat.value}</p>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 italic mt-2">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Command Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Launchpad Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-premium relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal to-brand-dark"></div>

            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-black text-brand-dark font-display">Mission Control</h2>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Core System Operations</p>
              </div>
              <button
                onClick={() => navigate('/dashboard/analytics')}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-brand-teal hover:text-white rounded-full text-[10px] font-black transition-all group"
              >
                VIEW FULL SYSTEM METRICS
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: 'Staff Deployment',
                  desc: 'Onboard new medical personnel to the facility cluster.',
                  icon: UserPlus,
                  path: '/dashboard/create-staff',
                  color: 'text-brand-teal'
                },
                {
                  title: 'Personnel Matrix',
                  desc: 'Manage existing medical and administrative teams.',
                  icon: Users,
                  path: '/dashboard/staff',
                  color: 'text-brand-dark'
                },
                {
                  title: 'Clinical Database',
                  desc: 'Access encrypted patient records and histories.',
                  icon: Activity,
                  path: '/dashboard/patients',
                  color: 'text-emerald-500'
                },
                {
                  title: 'Neural Analytics',
                  desc: 'Deeper insights into hospital performance indices.',
                  icon: TrendingUp,
                  path: '/dashboard/analytics',
                  color: 'text-blue-500'
                },
              ].map((action) => (
                <button
                  key={action.title}
                  onClick={() => navigate(action.path)}
                  className="group relative flex flex-col items-start p-8 bg-white hover:bg-brand-dark border border-slate-100 rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 text-left"
                >
                  <div className={`p-4 rounded-2xl bg-slate-50 group-hover:bg-white/10 transition-colors mb-6`}>
                    <action.icon className={`h-6 w-6 ${action.color} group-hover:text-brand-teal`} />
                  </div>
                  <h4 className="text-lg font-black text-brand-dark group-hover:text-white transition-colors font-display mb-2">{action.title}</h4>
                  <p className="text-xs text-slate-400 group-hover:text-teal-100/60 leading-relaxed transition-colors mb-6">{action.desc}</p>
                  <div className="mt-auto flex items-center gap-2 text-[10px] font-black text-brand-teal group-hover:text-white uppercase tracking-widest">
                    Initialize Module
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-2 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Infrastructure Layer */}
          <div className="bg-slate-50/50 rounded-[3rem] p-10 border border-slate-200/50">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-1.5 h-8 bg-brand-teal rounded-full"></div>
              <h3 className="text-xl font-black text-brand-dark font-display leading-none">Infrastructure Fidelity</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Database Cluster', status: 'Optimal', icon: Database, color: 'text-emerald-500' },
                { label: 'Cloud Gateway', status: 'Stable', icon: Globe, color: 'text-blue-500' },
                { label: 'Security Layer', status: 'Locked', icon: Lock, color: 'text-brand-teal' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-5 p-6 bg-white rounded-[2rem] shadow-sm border border-slate-100">
                  <div className={`p-3 rounded-xl bg-slate-50 ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-slate-700">{item.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Activity & Status */}
        <div className="space-y-8">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-premium h-full flex flex-col relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-10">
                <h3 className="text-xl font-black text-brand-dark font-display">System Logs</h3>
                <Bell className="h-5 w-5 text-slate-300" />
              </div>

              <div className="space-y-8">
                {[
                  { title: 'Cluster Integrity', desc: 'Mainframe synchronized with regional nodes.', icon: Shield, color: 'bg-emerald-50 text-emerald-600', time: '2m' },
                  { title: 'Patient Inflow', desc: 'Spike in Cardiology department bookings.', icon: TrendingUp, color: 'bg-blue-50 text-blue-600', time: '14m' },
                  { title: 'Security Protocol', desc: 'Automated backup successfully encrypted.', icon: Lock, color: 'bg-brand-light text-brand-dark', time: '45m' },
                  { title: 'Team Update', desc: 'Dr. Sarah Smith shifted to Emergency Tier 1.', icon: Users, color: 'bg-amber-50 text-amber-600', time: '1h' },
                ].map((log, i) => (
                  <div key={i} className="flex gap-5 group relative">
                    {i !== 3 && <div className="absolute left-6 top-12 bottom-[-2rem] w-px bg-slate-100"></div>}
                    <div className={`h-12 w-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${log.color} transition-transform group-hover:scale-110`}>
                      <log.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-black text-brand-dark">{log.title}</p>
                        <span className="text-[9px] font-bold text-slate-300 uppercase">{log.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{log.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-10">
              <div className="p-8 bg-brand-light/50 rounded-[2.5rem] border border-teal-50 text-center relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/5 rounded-full -mr-8 -mt-8 rotate-12 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="relative z-10">
                  <p className="text-xs font-black text-brand-dark mb-4 tracking-tight uppercase">System Audit Engine</p>
                  <p className="text-[10px] text-slate-500 mb-6 leading-relaxed">Generate a comprehensive forensic audit of all system interactions within the last 24 hours.</p>
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="w-full py-4 bg-brand-dark text-white rounded-2xl shadow-xl hover:shadow-brand-dark/20 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {downloading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Finalizing PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Download PDF Report
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

