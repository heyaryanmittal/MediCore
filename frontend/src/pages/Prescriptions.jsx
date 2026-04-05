import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  FileText, Download, User, Calendar, Pill, Search, 
  Activity, AlertCircle, Bookmark, ChevronRight,
  ClipboardList, Clock, Filter, Sparkles, Hash
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

/* ── STAT CARD ─────────────────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, color, delay }) => (
  <div className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all relative overflow-hidden animate-fade-in`} style={{ animationDelay: `${delay}ms` }}>
    <div className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-10 rounded-bl-[3.5rem]`} />
    <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center mb-4 text-white shadow-lg shadow-${color}/20`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
    <p className="text-2xl font-black text-brand-dark font-display">{value}</p>
  </div>
);

const Prescriptions = () => {
  const { user: currentUser } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const endpoint = currentUser.role === 'patient' ? '/patient/prescriptions' : '/doctor/prescriptions';
      const response = await api.get(endpoint);
      if (response.data.success) {
        let data = response.data.data.prescriptions;
        if (currentUser.role === 'doctor') {
          data = data.map(p => ({
            ...p,
            medications: p.medicines,
            instructions: p.advice
          }));
        }
        setPrescriptions(data);
      }
    } catch (error) {
      console.error('Failed to fetch prescriptions:', error);
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const response = await api.get(`/documents/download/prescription/${id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prescription_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download prescription');
    }
  };

  const prescriptionsToSource = prescriptions.map(p => ({
    ...p,
    meds: p.medications || p.medicines || [],
    adviceText: p.instructions || p.advice || ''
  }));

  const filteredPrescriptions = prescriptionsToSource.filter(p => {
    const search = searchTerm.toLowerCase();
    const doctorName = `${p.doctorId?.userId?.profile?.firstName || ''} ${p.doctorId?.userId?.profile?.lastName || ''}`.toLowerCase();
    const patientName = `${p.patientId?.userId?.profile?.firstName || ''} ${p.patientId?.userId?.profile?.lastName || ''}`.toLowerCase();
    const diagnosis = p.diagnosis?.toLowerCase() || '';
    const matchSearch = doctorName.includes(search) || patientName.includes(search) || diagnosis.includes(search);
    
    if (activeFilter === 'recent') {
      const isRecent = new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return matchSearch && isRecent;
    }
    return matchSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="loading-spinner"></div>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Syncing Medical Records...</p>
      </div>
    );
  }

  const stats = {
    total: prescriptions.length,
    recent: prescriptions.filter(p => new Date(p.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    medsCount: prescriptionsToSource.reduce((acc, p) => acc + (p.meds.length), 0)
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light border border-brand-teal/10 mb-3">
            <ClipboardList className="h-3.5 w-3.5 text-brand-teal" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark">Medical Registry</span>
          </div>
          <h1 className="text-4xl font-black text-brand-dark font-display tracking-tight leading-none mb-2">
            {currentUser.role === 'patient' ? 'My Prescriptions' : 'Issued Prescriptions'}
          </h1>
          <p className="text-slate-500 font-medium">
            {currentUser.role === 'patient'
              ? 'Comprehensive history of your clinical prescriptions and advice'
              : 'Detailed archive of prescriptions issued to your patients'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by diagnosis or doctor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-3 rounded-2xl border-2 border-slate-100 focus:border-brand-teal outline-none w-full sm:w-72 text-sm font-semibold text-brand-dark transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={FileText} label="Total Records" value={stats.total} color="bg-brand-dark" delay={0} />
        <StatCard icon={Clock} label="Recent (7d)" value={stats.recent} color="bg-brand-teal" delay={100} />
        <StatCard icon={Pill} label="Total Medications" value={stats.medsCount} color="bg-violet-500" delay={200} />
      </div>

      {/* ── FILTERS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button 
          onClick={() => setActiveFilter('all')}
          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'all' ? 'bg-brand-dark text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-brand-teal/30 hover:text-brand-teal'}`}
        >
          All Records
        </button>
        <button 
          onClick={() => setActiveFilter('recent')}
          className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === 'recent' ? 'bg-brand-dark text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:border-brand-teal/30 hover:text-brand-teal'}`}
        >
          Recently Updated
        </button>
      </div>

      {/* ── PRESCRIPTION FEED ── */}
      <div className="space-y-6">
        {filteredPrescriptions.length > 0 ? (
          filteredPrescriptions.map((p, idx) => (
            <div key={p._id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
              {/* Top Accent Bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-brand-dark via-brand-teal to-brand-light" />
              
              <div className="p-6 md:p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Left Column: Doctor & Diagnosis */}
                  <div className="lg:w-1/3 xl:w-1/4 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-brand-dark flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform shrink-0">
                        <User className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Attending Physician</p>
                        <h3 className="font-black text-brand-dark font-display leading-tight text-lg">
                          {currentUser.role === 'patient'
                            ? `Dr. ${p.doctorId?.userId?.profile?.firstName || ''} ${p.doctorId?.userId?.profile?.lastName || 'Expert'}`
                            : `Patient: ${p.patientId?.userId?.profile?.firstName || ''} ${p.patientId?.userId?.profile?.lastName || 'Unknown'}`}
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                        <Calendar className="h-3.5 w-3.5 text-brand-teal" />
                        <span className="text-xs font-bold text-slate-600">
                          {format(new Date(p.createdAt), 'PPP')}
                        </span>
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-brand-light/40 border border-brand-teal/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-3.5 w-3.5 text-brand-teal" />
                          <span className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Diagnosis & Case</span>
                        </div>
                        <p className="text-sm font-black text-brand-dark leading-snug">
                          {p.diagnosis || 'Clinical Investigation'}
                        </p>
                      </div>
                    </div>

                    {p.followUpDate && (
                      <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                        <div className="h-8 w-8 rounded-lg bg-violet-500 flex items-center justify-center text-white shrink-0">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest">Follow-up Due</p>
                          <p className="text-[10px] font-bold text-violet-700">{format(new Date(p.followUpDate), 'dd MMM yyyy')}</p>
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={() => handleDownload(p._id)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                      >
                        <Download className="h-3.5 w-3.5" /> Official Copy
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Medications & Details */}
                  <div className="flex-1 space-y-6">
                    {/* Medications Section */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="inline-flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          <Pill className="h-3.5 w-3.5 text-brand-teal" /> Prescribed Medications
                        </h4>
                        <span className="text-[9px] font-black bg-brand-teal text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                          {p.meds?.length || 0} ITEMS
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {p.meds?.map((med, mIdx) => (
                          <div key={mIdx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex gap-4 hover:border-brand-teal/20 transition-colors">
                            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                              <Sparkles className="h-5 w-5 text-brand-teal" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="text-sm font-black text-brand-dark truncate">{med.name}</h5>
                              <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1">
                                <span className="text-[10px] font-bold text-slate-400">{med.dosage}</span>
                                <span className="text-[10px] font-bold text-slate-400">•</span>
                                <span className="text-[10px] font-bold text-brand-teal">{med.frequency}</span>
                                <span className="text-[10px] font-bold text-slate-400">•</span>
                                <span className="text-[10px] font-bold text-slate-400">{med.duration}</span>
                              </div>
                              {med.instructions && (
                                <p className="text-[10px] italic text-slate-400 mt-1.5 leading-relaxed bg-brand-light/50 px-2 py-1 rounded-lg">
                                  {med.instructions}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        {(!p.meds || p.meds.length === 0) && (
                          <div className="col-span-full py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
                             <Pill className="h-5 w-5 opacity-20" />
                             <p className="text-xs font-bold uppercase tracking-widest">No medications listed</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tests & Advice in Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {/* Diagnostic Tests */}
                      {p.tests && p.tests.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Activity className="h-3.5 w-3.5 text-amber-500" /> Prescribed Tests
                          </h4>
                          <div className="space-y-2">
                            {p.tests.map((test, tIdx) => (
                              <div key={tIdx} className="flex items-center gap-3 p-3 bg-white border-2 border-slate-50 rounded-xl hover:border-amber-100 transition-all">
                                <div className="h-2 w-2 rounded-full bg-amber-400" />
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-brand-dark leading-none">{test.name}</p>
                                  {test.instructions && <p className="text-[10px] font-medium text-slate-400 mt-1">{test.instructions}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Doctor's Advice */}
                      {p.adviceText && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <AlertCircle className="h-3.5 w-3.5 text-blue-500" /> Clinical Advice
                          </h4>
                          <div className="relative group/advice">
                            <div className="absolute inset-0 bg-blue-50/50 rounded-2xl -m-1 opacity-0 group-hover/advice:opacity-100 transition-opacity" />
                            <div className="relative p-5 rounded-2xl bg-blue-50/20 border-2 border-blue-100/50">
                              <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                                "{p.adviceText}"
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <div className="h-20 w-20 rounded-3xl bg-brand-light flex items-center justify-center mb-6">
              <ClipboardList className="h-10 w-10 text-brand-teal/40" />
            </div>
            <h3 className="text-xl font-black text-brand-dark mb-2 font-display">No Clinical Records</h3>
            <p className="text-sm text-slate-400 font-medium text-center max-w-xs mb-8">
              {searchTerm ? "No results matched your clinical search criteria." : "You don't have any prescriptions registered in the system yet."}
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="px-8 py-3 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
              >
                Reset Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER NOTICE ── */}
      <div className="p-6 bg-brand-dark rounded-[2rem] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Bookmark className="h-5 w-5 text-brand-teal" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black uppercase tracking-widest">Usage Information</p>
            <p className="text-xs text-white/60 leading-relaxed max-w-2xl">
              These prescriptions are official clinical documents issued by registered medical professionals at MediCore. 
              Always consult with your doctor before altering any prescribed medication regimen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prescriptions;
