import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Pill, Activity, AlertCircle, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const PrescriptionModal = ({ isOpen, onClose, appointment, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        diagnosis: '',
        medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
        tests: [],
        advice: '',
        followUpDate: ''
    });

    const isEditing = !!appointment.prescription;

    useEffect(() => {
        if (isOpen && appointment.prescription) {
            const p = typeof appointment.prescription === 'object' ? appointment.prescription : null;
            if (p) {
                setFormData({
                    diagnosis: p.diagnosis || '',
                    medicines: p.medicines?.length > 0 ? p.medicines : [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
                    tests: p.tests || [],
                    advice: p.advice || '',
                    followUpDate: p.followUpDate ? new Date(p.followUpDate).toISOString().split('T')[0] : ''
                });
            } else {
                // Fetch if it's just an ID
                fetchPrescription();
            }
        } else if (isOpen) {
            // Reset for new prescription
            setFormData({
                diagnosis: '',
                medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
                tests: [],
                advice: '',
                followUpDate: ''
            });
        }
    }, [isOpen, appointment.prescription]);

    const fetchPrescription = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/doctor/prescription/appointment/${appointment._id}`);
            if (response.data.success) {
                const p = response.data.data.prescription;
                setFormData({
                    diagnosis: p.diagnosis || '',
                    medicines: p.medicines?.length > 0 ? p.medicines : [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
                    tests: p.tests || [],
                    advice: p.advice || '',
                    followUpDate: p.followUpDate ? new Date(p.followUpDate).toISOString().split('T')[0] : ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch prescription:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMedicine = () => {
        setFormData({
            ...formData,
            medicines: [...formData.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
        });
    };

    const handleRemoveMedicine = (index) => {
        const newMedicines = formData.medicines.filter((_, i) => i !== index);
        setFormData({ ...formData, medicines: newMedicines });
    };

    const handleMedicineChange = (index, field, value) => {
        const newMedicines = [...formData.medicines];
        newMedicines[index][field] = value;
        setFormData({ ...formData, medicines: newMedicines });
    };

    const handleAddTest = () => {
        setFormData({
            ...formData,
            tests: [...formData.tests, { name: '', instructions: '' }]
        });
    };

    const handleRemoveTest = (index) => {
        const newTests = formData.tests.filter((_, i) => i !== index);
        setFormData({ ...formData, tests: newTests });
    };

    const handleTestChange = (index, field, value) => {
        const newTests = [...formData.tests];
        newTests[index][field] = value;
        setFormData({ ...formData, tests: newTests });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.diagnosis.trim()) {
            return toast.error('Diagnosis is required');
        }

        const validMedicines = formData.medicines.filter(m => m.name.trim());
        if (validMedicines.length === 0) {
            return toast.error('At least one medicine is required');
        }

        try {
            setLoading(true);
            const payload = {
                appointmentId: appointment._id,
                diagnosis: formData.diagnosis,
                medicines: validMedicines,
                tests: formData.tests.filter(t => t.name.trim()),
                advice: formData.advice,
                followUpDate: formData.followUpDate || undefined
            };

            let response;
            if (isEditing) {
                const pId = typeof appointment.prescription === 'object' ? appointment.prescription._id : appointment.prescription;
                response = await api.patch(`/doctor/prescription/${pId}`, payload);
            } else {
                response = await api.post('/doctor/prescription', payload);
            }

            if (response.data.success) {
                toast.success(isEditing ? 'Prescription updated successfully' : 'Prescription issued successfully');
                onSuccess && onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Prescription submission error:', error);
            toast.error(error.response?.data?.message || 'Failed to submit prescription');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
            <div className="bg-white rounded-[2.5rem] shadow-premium w-full max-w-4xl relative animate-slide-up overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 bg-brand-dark flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-black font-display text-white">
                            {isEditing ? 'Update Prescription' : 'Issue Prescription'}
                        </h2>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
                            Patient: {appointment.patientId?.userId?.profile?.firstName} {appointment.patientId?.userId?.profile?.lastName}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto p-8 space-y-8">
                    {/* Diagnosis Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-brand-dark">
                            <Activity className="h-5 w-5" />
                            <h3 className="font-black font-display text-lg">Clinical Diagnosis</h3>
                        </div>
                        <textarea
                            value={formData.diagnosis}
                            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                            className="input min-h-[100px]"
                            placeholder="Enter clinical diagnosis and primary complaints..."
                            required
                        ></textarea>
                    </div>

                    {/* Medicines Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-brand-dark">
                                <Pill className="h-5 w-5" />
                                <h3 className="font-black font-display text-lg">Medications</h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddMedicine}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-light text-brand-dark rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-teal/10 transition-colors"
                            >
                                <Plus className="h-4 w-4" /> Add Medication
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.medicines.map((med, index) => (
                                <div key={index} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 relative group">
                                    {formData.medicines.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMedicine(index)}
                                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="space-y-1 lg:col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicine Name*</label>
                                            <input
                                                type="text"
                                                value={med.name}
                                                onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                                placeholder="e.g. Paracetamol"
                                                className="input bg-white"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dosage*</label>
                                            <input
                                                type="text"
                                                value={med.dosage}
                                                onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                                                placeholder="e.g. 500mg"
                                                className="input bg-white"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequency*</label>
                                            <input
                                                type="text"
                                                value={med.frequency}
                                                onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                                                placeholder="e.g. 1-0-1 (BD)"
                                                className="input bg-white"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration*</label>
                                            <input
                                                type="text"
                                                value={med.duration}
                                                onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                                                placeholder="e.g. 5 days"
                                                className="input bg-white"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1 lg:col-span-3">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instructions (Optional)</label>
                                            <input
                                                type="text"
                                                value={med.instructions}
                                                onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                                                placeholder="e.g. After meal"
                                                className="input bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tests Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-brand-dark">
                                <AlertCircle className="h-5 w-5" />
                                <h3 className="font-black font-display text-lg">Diagnostic Tests</h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddTest}
                                className="flex items-center gap-2 px-4 py-2 bg-brand-light text-brand-dark rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-teal/10 transition-colors"
                            >
                                <Plus className="h-4 w-4" /> Add Test
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.tests.map((test, index) => (
                                <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex gap-4">
                                    <div className="flex-1 space-y-3">
                                        <input
                                            type="text"
                                            value={test.name}
                                            onChange={(e) => handleTestChange(index, 'name', e.target.value)}
                                            placeholder="Test Name (e.g. CBC)"
                                            className="input bg-white py-2"
                                        />
                                        <input
                                            type="text"
                                            value={test.instructions}
                                            onChange={(e) => handleTestChange(index, 'instructions', e.target.value)}
                                            placeholder="Special instructions..."
                                            className="input bg-white py-2"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveTest(index)}
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors h-fit"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Advice Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-brand-dark">
                                <h3 className="font-black font-display text-lg">General Advice</h3>
                            </div>
                            <textarea
                                value={formData.advice}
                                onChange={(e) => setFormData({ ...formData, advice: e.target.value })}
                                className="input min-h-[120px]"
                                placeholder="Dietary advice, lifestyle changes, etc..."
                            ></textarea>
                        </div>

                        {/* Follow-up Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-brand-dark">
                                <h3 className="font-black font-display text-lg">Follow-up Date</h3>
                            </div>
                            <input
                                type="date"
                                value={formData.followUpDate}
                                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                className="input"
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <div className="p-4 rounded-2xl bg-brand-light border border-brand-teal/5">
                                <p className="text-[10px] font-bold text-slate-500 italic">
                                    {isEditing ? "* Updating this prescription will not change the appointment status." : "* Issuing this prescription will automatically mark the appointment as completed."}
                                </p>
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
                                    <Save className="h-5 w-5" />
                                    {isEditing ? 'UPDATE PRESCRIPTION' : 'ISSUE PRESCRIPTION'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PrescriptionModal;
