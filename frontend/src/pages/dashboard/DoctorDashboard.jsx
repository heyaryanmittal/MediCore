import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, FileText, Clock, AlertCircle, 
  ChevronRight, Activity, Clipboard, Stethoscope 
} from 'lucide-react';
import api from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const DoctorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

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
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="loading-spinner"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Loading Clinical Workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-100 p-12 rounded-[3rem] text-center max-w-2xl mx-auto shadow-2xl animate-scale-in">
        <div className="w-20 h-20 bg-rose-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-3 font-display">{error}</h3>
        <p className="text-slate-500 font-medium mb-8">Synchronisation with the medical records unit failed. Please re-authenticate or contact system administrators.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-200"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { stats, recentInteractions } = data;

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      {/* Clinician Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-[1px] w-8 bg-brand-teal"></span>
            <span className="text-[11px] font-black text-brand-teal uppercase tracking-widest">Medical Practitioner Portal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-brand-dark font-display tracking-tight leading-none mb-2">
            Welcome, <span className="italic text-brand-teal">Dr. {user?.profile?.lastName || 'Practitioner'}</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-md">
            Overseeing patient recovery and clinical workflows for today.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-premium border border-slate-50">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.2em]">Live Connection: Secure</span>
        </div>
      </div>

      {/* Clinical Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="relative group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-teal/5 rounded-bl-[4rem]"></div>
          <div className="relative z-10 flex items-center justify-between h-full">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Today's Schedule</p>
              <p className="text-4xl font-black text-brand-dark font-display">{stats.todayPatients}</p>
              <div className="flex items-center gap-1.5 mt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-teal"></div>
                <span className="text-[9px] font-black text-brand-teal uppercase tracking-widest">Patients Awaiting</span>
              </div>
            </div>
            <div className="p-5 bg-brand-light rounded-[2rem] text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-all shadow-inner">
              <Calendar className="h-8 w-8 stroke-[2.5]" />
            </div>
          </div>
        </div>

        <div className="relative group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[4rem]"></div>
          <div className="relative z-10 flex items-center justify-between h-full">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Patient Network</p>
              <p className="text-4xl font-black text-brand-dark font-display">{stats.totalNetwork}</p>
              <div className="flex items-center gap-1.5 mt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Active Profiles</span>
              </div>
            </div>
            <div className="p-5 bg-blue-50 rounded-[2rem] text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
              <Users className="h-8 w-8 stroke-[2.5]" />
            </div>
          </div>
        </div>

        <div className="relative group bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-premium transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-[4rem]"></div>
          <div className="relative z-10 flex items-center justify-between h-full">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Clinical Assets</p>
              <p className="text-4xl font-black text-brand-dark font-display">{stats.activeScripts}</p>
              <div className="flex items-center gap-1.5 mt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
                <span className="text-[9px] font-black text-violet-500 uppercase tracking-widest">Scripts Issued</span>
              </div>
            </div>
            <div className="p-5 bg-violet-50 rounded-[2rem] text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all shadow-inner">
              <FileText className="h-8 w-8 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Interaction Log */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-premium overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-teal to-brand-dark opacity-50"></div>
          
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-black text-brand-dark font-display">Clinical Timeline</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Verified patient interactions</p>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-brand-dark hover:text-white rounded-full text-[10px] font-black transition-all group">
              ARCHIVE RECORDS
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="space-y-6">
            {recentInteractions.length > 0 ? (
              recentInteractions.map((interaction, i) => (
                <div key={interaction.id} className="flex items-center gap-6 p-6 rounded-[2.5rem] hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group relative">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-brand-light flex-shrink-0 flex items-center justify-center text-brand-dark group-hover:bg-brand-dark group-hover:text-white transition-all shadow-inner">
                    <Stethoscope className="h-7 w-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-black text-brand-dark">Patient Recovery Refinement</p>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase rounded-full tracking-widest italic">Completed</span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium mt-1">
                      Finalized case for <span className="text-brand-dark font-bold font-display">{interaction.patientName}</span>
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Activity className="h-3.5 w-3.5" />
                        {interaction.procedure}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(interaction.time))} ago
                      </div>
                    </div>
                  </div>
                  <button className="p-4 bg-white rounded-[1.25rem] shadow-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-teal hover:text-white hover:shadow-lg hover:-translate-y-0.5">
                    <Clipboard className="h-5 w-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Activity className="h-8 w-8 text-slate-200" />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No clinical logs detected for this cycle</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Launchpad */}
        <div className="space-y-8 flex flex-col">
          <div className="bg-brand-dark rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex-1 group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-teal opacity-10 rounded-full blur-3xl -mr-24 -mt-24 transition-transform duration-1000 group-hover:scale-150"></div>
            
            <div className="relative z-10 flex flex-col h-full">
              <h3 className="text-2xl font-black font-display mb-8">Clinical Actions</h3>
              
              <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] transition-all group">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-brand-teal rounded-xl">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Access Schedule</p>
                      <p className="text-[10px] text-teal-100/40 uppercase tracking-widest font-black">View Queue</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                <button className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] transition-all group">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-blue-500 rounded-xl">
                      <Clipboard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Write Prescription</p>
                      <p className="text-[10px] text-teal-100/40 uppercase tracking-widest font-black">New Entry</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                <button className="w-full flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] transition-all group">
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-3 bg-emerald-500 rounded-xl">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Find Patient Profile</p>
                      <p className="text-[10px] text-teal-100/40 uppercase tracking-widest font-black">Encrypted Search</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>

              <div className="mt-auto pt-10">
                <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-teal-100/40 mb-3">Clinical Note</p>
                  <p className="text-xs text-teal-100/60 leading-relaxed italic">
                    "Ensure all lab reports from the morning cluster are verified before the evening rounds."
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

const ArrowRight = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);

export default DoctorDashboard;

