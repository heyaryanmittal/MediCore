import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, Clock, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

const DoctorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/doctor/dashboard-stats');
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loading-spinner h-12 w-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 p-8 rounded-[2rem] text-center">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">{error}</h3>
        <p className="text-slate-500">Please try refreshing the page or contact support.</p>
      </div>
    );
  }

  const { stats, recentInteractions } = data;

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-brand-dark tracking-tight font-display mb-1">
            Doctor Dashboard
          </h1>
          <p className="text-slate-500 font-medium tracking-wide">
            Manage your medical appointments and patient care
          </p>
        </div>
        <div className="bg-white px-5 py-2.5 rounded-2xl shadow-premium border border-slate-50 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Live Updates Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card group hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center">
            <div className="bg-brand-teal/10 p-4 rounded-2xl group-hover:bg-brand-teal/20 transition-colors">
              <Calendar className="h-7 w-7 text-brand-teal" />
            </div>
            <div className="ml-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Today's Schedule</p>
              <p className="text-3xl font-black text-brand-dark font-display">{stats.todayPatients} Patients</p>
            </div>
          </div>
        </div>

        <div className="card group hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center">
            <div className="bg-blue-50 p-4 rounded-2xl group-hover:bg-blue-100 transition-colors">
              <Users className="h-7 w-7 text-blue-600" />
            </div>
            <div className="ml-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Network</p>
              <p className="text-3xl font-black text-brand-dark font-display">{stats.totalNetwork} Patients</p>
            </div>
          </div>
        </div>

        <div className="card group hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center">
            <div className="bg-violet-50 p-4 rounded-2xl group-hover:bg-violet-100 transition-colors">
              <FileText className="h-7 w-7 text-violet-600" />
            </div>
            <div className="ml-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Active Scripts</p>
              <p className="text-3xl font-black text-brand-dark font-display">{stats.activeScripts} Issued</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light rounded-full -mr-16 -mt-16"></div>
        <h2 className="text-xl font-bold text-brand-dark mb-8 font-display flex items-center gap-3">
          <Clock className="h-5 w-5 text-brand-teal" />
          Recent Interactions
        </h2>
        <div className="space-y-6">
          {recentInteractions.length > 0 ? (
            recentInteractions.map((interaction) => (
              <div key={interaction.id} className="flex items-center gap-5 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group">
                <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-dark group-hover:text-white transition-all">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">Appointment finalized with <span className="text-brand-teal">{interaction.patientName}</span></p>
                  <p className="text-xs text-slate-500 mt-1">Procedure: {interaction.procedure} • {formatDistanceToNow(new Date(interaction.time))} ago</p>
                </div>
                <button className="text-xs font-bold text-brand-teal uppercase tracking-widest hover:underline">View Case</button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No recent completed interactions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
