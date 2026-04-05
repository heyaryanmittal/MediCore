import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  TestTube, Download, Calendar, Activity, CheckCircle, 
  Clock, Plus, Filter, Search, FileText, Bookmark, 
  ChevronRight, TrendingUp, FlaskConical, ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

/* ── STAT CARD ─────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <div className={`bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden animate-fade-in`} style={{ animationDelay: `${delay}ms` }}>
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-10 rounded-bl-[4rem]`} />
    <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center mb-4 text-white shadow-lg`}>
      <Icon className="h-6 w-6" />
    </div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
    <p className="text-3xl font-black text-brand-dark font-display">{value}</p>
  </div>
);

const LabReports = () => {
  const { user: currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const endpoint = currentUser.role === 'patient' ? '/patient/lab-reports' : '/receptionist/lab-reports';
      const response = await api.get(endpoint);
      if (response.data.success) {
        setReports(response.data.data.labReports);
      }
    } catch (error) {
      console.error('Failed to fetch lab reports:', error);
      toast.error('Failed to load lab reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const response = await api.get(`/documents/download/lab-report/${id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lab_report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report');
    }
  };

  const filteredReports = reports.filter(r => {
    const search = searchTerm.toLowerCase();
    const testMatch = r.testName?.toLowerCase().includes(search);
    const status = r.status || 'completed';
    
    if (activeTab === 'completed') return testMatch && status === 'completed';
    if (activeTab === 'pending') return testMatch && status !== 'completed';
    return testMatch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="loading-spinner"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Retrieving Laboratory Records...</p>
      </div>
    );
  }

  const stats = {
    total: reports.length,
    completed: reports.filter(r => (r.status || 'completed') === 'completed').length,
    pending: reports.filter(r => (r.status || 'completed') !== 'completed').length,
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-4">

          <h1 className="text-4xl lg:text-5xl font-black text-brand-dark font-display leading-tight tracking-tight">
            Lab Reports
          </h1>
          <p className="text-slate-500 font-medium max-w-lg">
            Track your diagnostic history, download verified laboratory results, and monitor your clinical progress over time.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-brand-teal" />
            <input
              type="text"
              placeholder="Search by test name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 focus:border-brand-teal focus:ring-0 outline-none w-full sm:w-64 text-sm font-semibold text-brand-dark transition-all shadow-sm"
            />
          </div>
          {currentUser?.role === 'receptionist' && (
            <Link
              to="/dashboard/patients"
              className="flex items-center justify-center gap-2 px-6 py-4 bg-brand-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95"
            >
              <Plus className="h-4 w-4" /> Import New File
            </Link>
          )}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard icon={FileText} label="Total Reports" value={stats.total} color="bg-brand-dark" delay={0} />
        <StatCard icon={CheckCircle} label="Verified" value={stats.completed} color="bg-brand-teal" delay={100} />
        <StatCard icon={Clock} label="Pending Recognition" value={stats.pending} color="bg-amber-500" delay={200} />
      </div>

      {/* ── TABS ── */}
      <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl w-fit">
        {['all', 'completed', 'pending'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-brand-dark shadow-sm' : 'text-slate-400 hover:text-brand-dark'}`}
          >
            {tab} Records
          </button>
        ))}
      </div>

      {/* ── REPORT GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredReports.length > 0 ? (
          filteredReports.map((report, idx) => (
            <div 
              key={report._id} 
              className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden animate-slide-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex">
                {/* Left Side: Status / Color Bar */}
                <div className={`w-3 ${ (report.status || 'completed') === 'completed' ? 'bg-brand-teal' : 'bg-amber-400' } group-hover:w-5 transition-all duration-500`} />
                
                <div className="flex-1 p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform ${ (report.status || 'completed') === 'completed' ? 'bg-brand-light text-brand-teal shadow-brand-teal/10' : 'bg-amber-50 text-amber-500 shadow-amber-500/10' }`}>
                         <TestTube className="h-8 w-8" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center ${ (report.status || 'completed') === 'completed' ? 'bg-brand-teal/10 text-brand-teal' : 'bg-amber-100 text-amber-700' }`}>
                            { (report.status || 'completed') === 'completed' ? <ShieldCheck className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" /> }
                            {report.status || 'Completed'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-300">ID: #{report._id?.toString().slice(-6).toUpperCase()}</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-brand-dark font-display leading-tight truncate">
                          {report.testName}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                       <button
                        onClick={() => handleDownload(report._id)}
                        className="p-3 bg-brand-dark text-white rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all hover:scale-110 active:scale-95"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100 group-hover:bg-brand-light/20 group-hover:border-brand-teal/10 transition-all">
                      <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <Calendar className="h-3 w-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Report Date</span>
                      </div>
                      <p className="text-xs font-black text-brand-dark">{format(new Date(report.reportDate), 'dd MMM yyyy')}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                       <div className="flex items-center gap-2 mb-2 text-slate-400">
                        <Activity className="h-3 w-3" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Referring Clinician</span>
                      </div>
                      <p className="text-xs font-black text-brand-dark truncate">
                        {report.doctorId?.userId?.profile ? `Dr. ${report.doctorId.userId.profile.lastName}` : 'General Referral'}
                      </p>
                    </div>
                  </div>

                  {currentUser?.role === 'receptionist' && report.patientId?.userId?.profile && (
                    <div className="mt-4 p-4 rounded-2xl bg-brand-dark text-white shadow-xl flex items-center justify-between group-hover:translate-x-2 transition-transform">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">Assigned Patient</p>
                          <p className="text-[10px] font-black">{report.patientId.userId.profile.firstName} {report.patientId.userId.profile.lastName}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/30" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
            <div className="h-24 w-24 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 text-slate-300">
              <FlaskConical className="h-10 w-10" />
            </div>
            <h3 className="text-2xl font-black text-brand-dark font-display mb-2">No Reports Found</h3>
            <p className="text-slate-400 font-medium text-center max-w-xs mb-8">
              We couldn't find any diagnostic reports matching your current selection.
            </p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="px-8 py-3 bg-brand-teal text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-lg shadow-brand-teal/20">
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER NOTICE ── */}
      <div className="bg-brand-dark rounded-[2.5rem] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-light opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="flex items-start gap-4 max-w-2xl">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <Bookmark className="h-6 w-6 text-brand-teal" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase tracking-widest">Medical Disclaimer</h4>
              <p className="text-xs text-brand-light/60 leading-relaxed font-medium">
                These laboratory results represent specific diagnostic parameters at the time of testing. 
                Interpretation depends on a variety of individual clinical factors. Always review these results 
                under the supervision of your attending physician for proper clinical context.
              </p>
            </div>
          </div>
          <div className="shrink-0">
             <div className="bg-brand-teal/10 border border-brand-teal/20 p-4 rounded-2xl flex items-center gap-3">
               <TrendingUp className="h-5 w-5 text-brand-teal" />
               <span className="text-[10px] font-black uppercase tracking-tighter">Verified Results Registry</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Dummy User icon replacement since it was missing in imports */
const User = ({className}) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

export default LabReports;
