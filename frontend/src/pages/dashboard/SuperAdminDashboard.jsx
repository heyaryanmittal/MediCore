import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Calendar, DollarSign, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const SuperAdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Total Patients',
      value: analytics?.totalPatients || 0,
      icon: Users,
      color: 'bg-primary-500',
    },
    {
      name: 'Total Doctors',
      value: analytics?.totalDoctors || 0,
      icon: UserPlus,
      color: 'bg-green-500',
    },
    {
      name: "Today's Appointments",
      value: analytics?.todayAppointments || 0,
      icon: Calendar,
      color: 'bg-yellow-500',
    },
    {
      name: 'Total Revenue',
      value: `₹${(analytics?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight font-display mb-1">
            System Overview
          </h1>
          <p className="text-slate-500 font-medium">
            Monitor and manage your medical facility operations
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-premium border border-slate-50">
          <Activity className="h-4 w-4 text-brand-teal" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">System Status: </span>
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Healthy</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-dark/5 rounded-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.color.replace('bg-', 'bg-opacity-10 text-').replace('primary-500', 'brand-dark').replace('green-500', 'emerald-600').replace('purple-500', 'violet-600').replace('yellow-500', 'amber-600').replace('red-500', 'rose-600')} bg-current`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 group-hover:text-brand-dark transition-colors">#{index + 1}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.1em] mb-1">{stat.name}</p>
                  <p className="text-2xl font-black text-brand-dark font-display">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="card-dark relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-6 font-display">Command Center</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/dashboard/create-staff')}
                  className="flex items-center justify-between p-5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all duration-300 group shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl">
                      <UserPlus className="h-5 w-5 text-brand-dark" />
                    </div>
                    <span className="font-bold text-white">Create Staff</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/50 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => navigate('/dashboard/staff')}
                  className="flex items-center justify-between p-5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all duration-300 group shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl">
                      <Users className="h-5 w-5 text-brand-dark" />
                    </div>
                    <span className="font-bold text-white">Manage Team</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/50 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => navigate('/dashboard/patients')}
                  className="flex items-center justify-between p-5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all duration-300 group shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl">
                      <Activity className="h-5 w-5 text-brand-dark" />
                    </div>
                    <span className="font-bold text-white">Patient Records</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/50 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => navigate('/dashboard/analytics')}
                  className="flex items-center justify-between p-5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all duration-300 group shadow-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl">
                      <TrendingUp className="h-5 w-5 text-brand-dark" />
                    </div>
                    <span className="font-bold text-white">Deep Analytics</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/50 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

          {/* System Health Info */}
          <div className="card">
            <h2 className="text-xl font-bold text-brand-dark mb-6 font-display flex items-center gap-2">
              <div className="w-2 h-6 bg-brand-teal rounded-full"></div>
              Infrastructure Health
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Database</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <p className="font-bold text-slate-700">Protected</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">API Node</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <p className="font-bold text-slate-700">Responsive</p>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Backup Sync</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  <p className="font-bold text-slate-700">2h Ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="card h-full">
            <h2 className="text-xl font-bold text-brand-dark mb-6 font-display">System logs</h2>
            <div className="space-y-6">
              <div className="flex gap-4 group">
                <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors h-fit">
                  <Activity className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Operational Integrity</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">All hospital services are operating within normal latency parameters.</p>
                </div>
              </div>
              <div className="flex gap-4 group border-t border-slate-50 pt-6">
                <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors h-fit">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Growth Metric</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">Patient onboarding velocity is maintaining a consistent upward trajectory.</p>
                </div>
              </div>
              <div className="flex gap-4 group border-t border-slate-50 pt-6">
                <div className="p-3 bg-brand-light rounded-xl group-hover:bg-brand-teal/10 transition-colors h-fit">
                  <Users className="h-5 w-5 text-brand-dark" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Team Update</p>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">Medical professionals and receptionists have been successfully synchronized.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-5 bg-brand-light rounded-[2rem] border border-teal-50 text-center">
              <p className="text-sm font-bold text-brand-dark mb-4 tracking-tight">Need a full audit report?</p>
              <button className="btn btn-primary w-full shadow-lg font-display">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
