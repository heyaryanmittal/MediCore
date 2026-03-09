import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Eye, Calendar, Phone, Mail, FileUp, DollarSign, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import LabReportUploadModal from '../../components/LabReportUploadModal';
import BillUploadModal from '../../components/BillUploadModal';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/admin/patients');
      if (response.data.success) {
        setPatients(response.data.data.patients);
      }
    } catch (error) {
      toast.error('Failed to fetch patients data');
    } finally {
      setLoading(false);
    }
  };
  // ... rest of the helper functions unchanged ...
  const filteredPatients = patients.filter(patient => {
    const matchesSearch =
      patient.userId.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.userId.profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.medicalRecordNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    // ... loading spinner remains same ...
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* ... header and search remains same ... */}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light text-brand-dark mb-4 border border-brand-dark/5">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Patient Registry</span>
          </div>
          <h1 className="text-4xl font-extrabold text-brand-dark tracking-tight font-display mb-2">Patient Management</h1>
          <p className="text-slate-500 font-medium text-lg">View and manage all registered patients</p>
        </div>
      </div>

      {/* Search */}
      <div className="card-dark group">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-brand-teal transition-colors" />
          <input
            type="text"
            placeholder="Search patients by name, email, or MRN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input bg-white/10 border-white/10 text-white placeholder:text-white/40 pl-12 focus:bg-white/20"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="card overflow-hidden !p-0 border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Patient Identity
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  MRN Number
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Vital Contact
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Profile
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Blood Group
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Authority
                </th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Explore
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Users className="h-12 w-12 text-slate-200" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No patient records found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient._id} className="group hover:bg-brand-light transition-colors">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-2xl bg-brand-dark flex items-center justify-center text-white font-black shadow-lg transform group-hover:scale-110 transition-transform">
                          {patient.userId.profile.firstName[0]}{patient.userId.profile.lastName[0]}
                        </div>
                        <div className="ml-5">
                          <div className="text-sm font-black text-brand-dark">
                            {patient.userId.profile.firstName} {patient.userId.profile.lastName}
                          </div>
                          <div className="text-xs font-medium text-slate-400 tracking-tighter">
                            {patient.userId.email?.toLowerCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-xs font-mono font-black text-brand-teal bg-brand-teal/5 px-3 py-1 rounded-lg">
                        {patient.medicalRecordNumber || 'UNASSIGNED'}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-600">
                        {patient.userId.profile.phone || '—'}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-600">
                        {getAge(patient.userId.profile.dateOfBirth)}Y • <span className="capitalize">{patient.userId.profile.gender || '—'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-rose-50 text-rose-500 border border-rose-100">
                        {patient.bloodGroup || 'UNK'}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${patient.userId.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                          {patient.userId.isActive ? 'Verified' : 'Flagged'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowPatientModal(true);
                        }}
                        className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-brand-teal opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md animate-fade-in" onClick={() => setShowPatientModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] shadow-premium w-full max-w-2xl relative animate-slide-up overflow-hidden border border-slate-100 max-h-[95vh] flex flex-col">
            <div className="h-32 bg-brand-dark relative shrink-0">
              <div className="absolute top-8 right-10 flex gap-4">
                <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur text-[10px] font-black text-white uppercase tracking-widest border border-white/10">MRN: {selectedPatient.medicalRecordNumber}</div>
              </div>
              <div className="absolute -bottom-10 left-12 h-24 w-24 rounded-[2rem] bg-brand-teal shadow-2xl flex items-center justify-center text-white text-3xl font-black border-4 border-white">
                {selectedPatient.userId.profile.firstName[0]}
              </div>
            </div>

            <div className="px-12 pt-16 pb-12 overflow-y-auto">
              <div className="mb-10">
                <h2 className="text-4xl font-black font-display text-brand-dark mb-1">
                  {selectedPatient.userId.profile.firstName} {selectedPatient.userId.profile.lastName}
                </h2>
                <p className="text-slate-400 font-bold tracking-[0.2em] text-[10px]">{selectedPatient.userId.email?.toLowerCase()}</p>
              </div>

              {/* Service Actions - NEW SECTION */}
              <div className="grid grid-cols-2 gap-4 mb-10">
                <button
                  onClick={() => {
                    setShowPatientModal(false);
                    setShowLabModal(true);
                  }}
                  className="p-4 rounded-2xl bg-brand-dark text-white hover:bg-slate-800 transition-all flex items-center gap-4 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-teal group-hover:scale-110 transition-transform">
                    <FileUp className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Lab Services</p>
                    <p className="font-bold text-sm">Upload Report</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowPatientModal(false);
                    setShowBillModal(true);
                  }}
                  className="p-4 rounded-2xl bg-brand-teal text-white hover:bg-brand-teal/90 transition-all flex items-center gap-4 group"
                >
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Accounts</p>
                    <p className="font-bold text-sm">Generate Bill</p>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="p-5 bg-brand-light rounded-2xl border border-brand-teal/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Age</p>
                  <p className="text-lg font-black text-brand-dark">{getAge(selectedPatient.userId.profile.dateOfBirth)}Y</p>
                </div>
                <div className="p-5 bg-brand-light rounded-2xl border border-brand-teal/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</p>
                  <p className="text-lg font-black text-brand-dark capitalize">{selectedPatient.userId.profile.gender || '—'}</p>
                </div>
                <div className="p-5 bg-brand-light rounded-2xl border border-brand-teal/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Blood</p>
                  <p className="text-lg font-black text-rose-500 uppercase">{selectedPatient.bloodGroup || '??'}</p>
                </div>
                <div className="p-5 bg-brand-light rounded-2xl border border-brand-teal/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-lg font-black text-emerald-500 uppercase text-[10px]">Activated</p>
                </div>
              </div>

              <div className="space-y-6 mb-12">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Residential Address</h4>
                  <p className="text-sm font-bold text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">{selectedPatient.userId.profile.address || 'No primary residence on file'}</p>
                </div>
              </div>

              <button
                onClick={() => setShowPatientModal(false)}
                className="btn btn-primary w-full py-5 text-xl font-display font-black shadow-2xl"
              >
                Close Patient Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modals */}
      <LabReportUploadModal
        isOpen={showLabModal}
        onClose={() => setShowLabModal(false)}
        patient={selectedPatient}
        onSuccess={() => fetchPatients()}
      />

      <BillUploadModal
        isOpen={showBillModal}
        onClose={() => setShowBillModal(false)}
        patient={selectedPatient}
        onSuccess={() => fetchPatients()}
      />
    </div>
  );
};

export default PatientManagement;
