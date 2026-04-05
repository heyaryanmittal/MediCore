import React, { useState } from 'react';
import { X, Upload, FileText, Calendar, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const LabReportUploadModal = ({ isOpen, onClose, patient, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [formData, setFormData] = useState({
        testName: '',
        testType: '',
        reportDate: new Date().toISOString().split('T')[0],
        conclusion: '',
        recommendations: ''
    });

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 10 * 1024 * 1024) {
                toast.error('File size exceeds 10MB limit');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            return toast.error('Please select a report file');
        }

        try {
            setLoading(true);
            const data = new FormData();
            data.append('patientId', patient._id);
            data.append('testName', formData.testName);
            data.append('testType', formData.testType);
            data.append('reportDate', formData.reportDate);
            data.append('conclusion', formData.conclusion);
            data.append('recommendations', formData.recommendations);
            data.append('reportFile', file);

            const response = await api.post('/receptionist/lab-report', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                toast.success('Lab report uploaded successfully');
                onSuccess && onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Failed to upload lab report');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
            <div className="bg-white rounded-[2.5rem] shadow-premium w-full max-w-2xl relative animate-slide-up overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 bg-brand-dark flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-black font-display text-white">Upload Lab Report</h2>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
                            For Patient: {patient.userId.profile.firstName} {patient.userId.profile.lastName}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-8 space-y-8">
                    {/* File Upload Area */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-brand-dark">
                            <Upload className="h-5 w-5" />
                            <h3 className="font-black font-display text-lg">Report Document</h3>
                        </div>
                        <div className={`relative border-2 border-dashed rounded-3xl p-10 transition-all group ${file ? 'border-brand-teal bg-brand-teal/5' : 'border-slate-200 hover:border-brand-teal hover:bg-slate-50'
                            }`}>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <div className="flex flex-col items-center text-center">
                                {file ? (
                                    <>
                                        <CheckCircle className="h-12 w-12 text-brand-teal mb-4" />
                                        <p className="text-brand-dark font-black tracking-tight">{file.name}</p>
                                        <p className="text-slate-400 text-xs mt-1 font-bold">{(file.size / 1024 / 1024).toFixed(2)} MB • Click to change</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-16 w-16 rounded-2xl bg-brand-light flex items-center justify-center text-brand-dark mb-4 transform group-hover:scale-110 transition-transform">
                                            <FileText className="h-8 w-8" />
                                        </div>
                                        <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Drop your report or click to browse</p>
                                        <p className="text-slate-400 text-[10px] mt-2 italic font-medium">Supports PDF, JPG, PNG (Max 10MB)</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Name*</label>
                            <input
                                type="text"
                                value={formData.testName}
                                onChange={(e) => setFormData({ ...formData, testName: e.target.value })}
                                placeholder="e.g. Complete Blood Count (CBC)"
                                className="input"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Date*</label>
                            <input
                                type="date"
                                value={formData.reportDate}
                                onChange={(e) => setFormData({ ...formData, reportDate: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Category / Type*</label>
                        <input
                            type="text"
                            value={formData.testType}
                            onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                            placeholder="e.g. Hematology, Biochemistry"
                            className="input"
                            required
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-brand-dark">
                            <Activity className="h-5 w-5" />
                            <h3 className="font-black font-display text-lg">Clinical Findings</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brief Conclusion</label>
                                <textarea
                                    value={formData.conclusion}
                                    onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                                    className="input min-h-[100px]"
                                    placeholder="Summary of test results..."
                                ></textarea>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommendations</label>
                                <textarea
                                    value={formData.recommendations}
                                    onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                                    className="input min-h-[100px]"
                                    placeholder="Next steps or doctor referrals..."
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-4 shadow-[0_-10px_10px_-10px_rgba(0,0,0,0.05)]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-[2] py-4 bg-brand-dark text-white rounded-2xl font-black font-display flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="loading-spinner h-5 w-5 border-white/30 border-t-white"></div>
                            ) : (
                                <>
                                    <Upload className="h-5 w-5" />
                                    UPLOAD REPORT
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LabReportUploadModal;
