import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Pill, Activity, AlertCircle, Save, Clipboard, Calendar, FileText, Sparkles, Clock, Beaker } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const COMMON_MEDICINES = [
    "Paracetamol (Dolo 650)",
    "Amoxicillin (Augmentin 625 Duo)",
    "Ibuprofen (Combiflam)",
    "Cetirizine (Okacet)",
    "Omeprazole (Omez)",
    "Azithromycin (Azee 500)",
    "Metformin (Glycomet)",
    "Atorvastatin (Lipvas)",
    "Pantoprazole (Pan 40)",
    "Montelukast (Montek LC)",
    "Amlodipine (Amlong)",
    "Telmisartan (Telma 40)",
    "Domperidone (Domstal)",
    "Vitamin C (Limcee)",
    "Multivitamin (Zincovit)",
    "Other"
];

const COMMON_DOSAGE_UNITS = [
    "mg",
    "pieces",
    "drops",
    "ml",
    "mcg",
    "tab",
    "cap",
    "unit"
];

const COMMON_DURATION_UNITS = [
    "Days",
    "Weeks",
    "Months",
    "Years"
];

const parseDosage = (dosageStr) => {
    if (!dosageStr) return { value: '', unit: 'mg' };
    const match = dosageStr.match(/^(\d*(?:\.\d+)?)\s*(.*)$/);
    if (match) {
        const value = match[1] || '';
        const unit = match[2]?.trim() || 'mg';
        return { 
            value, 
            unit: COMMON_DOSAGE_UNITS.includes(unit) ? unit : (unit ? unit : 'mg') 
        };
    }
    return { value: dosageStr, unit: 'mg' };
};

const parseDuration = (durationStr) => {
    if (!durationStr) return { value: '', unit: 'Days' };
    const match = durationStr.match(/^(\d*(?:\.\d+)?)\s*(.*)$/);
    if (match) {
        const value = match[1] || '';
        const unit = match[2]?.trim() || 'Days';
        // Capitalize for consistency
        const capUnit = unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase();
        return { 
            value, 
            unit: COMMON_DURATION_UNITS.includes(capUnit) ? capUnit : (capUnit ? capUnit : 'Days')
        };
    }
    return { value: durationStr, unit: 'Days' };
};

const PrescriptionModal = ({ isOpen, onClose, appointment, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    // Track which medicines are in 'Other' mode
    const [otherModes, setOtherModes] = useState({});

    const [formData, setFormData] = useState({
        diagnosis: '',
        medicines: [{ name: '', dosageValue: '', dosageUnit: 'mg', frequency: '', durationValue: '', durationUnit: 'Days', instructions: '' }],
        tests: [],
        advice: '',
        followUpDate: ''
    });

    const isEditing = !!appointment.prescription;

    useEffect(() => {
        if (isOpen && appointment.prescription) {
            const p = typeof appointment.prescription === 'object' ? appointment.prescription : null;
            if (p) {
                const initialMeds = (p.medicines?.length > 0 ? p.medicines : [{ name: '', dosageValue: '', dosageUnit: 'mg', frequency: '', durationValue: '', durationUnit: 'Days', instructions: '' }]).map(m => {
                    const { value: dVal, unit: dUnit } = parseDosage(m.dosage || '');
                    const { value: durVal, unit: durUnit } = parseDuration(m.duration || '');
                    return {
                        ...m,
                        dosageValue: dVal,
                        dosageUnit: dUnit,
                        durationValue: durVal,
                        durationUnit: durUnit
                    };
                });
                
                // Determine which meds have custom names not in our common list
                const initialOtherModes = {};
                initialMeds.forEach((m, idx) => {
                    if (m.name && !COMMON_MEDICINES.includes(m.name)) {
                        initialOtherModes[idx] = true;
                    }
                });
                setOtherModes(initialOtherModes);

                setFormData({
                    diagnosis: p.diagnosis || '',
                    medicines: initialMeds,
                    tests: p.tests || [],
                    advice: p.advice || '',
                    followUpDate: p.followUpDate ? new Date(p.followUpDate).toISOString().split('T')[0] : ''
                });
            } else {
                fetchPrescription();
            }
        } else if (isOpen) {
            setFormData({
                diagnosis: '',
                medicines: [{ name: '', dosageValue: '', dosageUnit: 'mg', frequency: '', durationValue: '', durationUnit: 'Days', instructions: '' }],
                tests: [],
                advice: '',
                followUpDate: ''
            });
            setOtherModes({});
        }
    }, [isOpen, appointment.prescription]);

    const fetchPrescription = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/doctor/prescription/appointment/${appointment._id}`);
            if (response.data.success) {
                const p = response.data.data.prescription;
                const initialMeds = (p.medicines?.length > 0 ? p.medicines : [{ name: '', dosageValue: '', dosageUnit: 'mg', frequency: '', durationValue: '', durationUnit: 'Days', instructions: '' }]).map(m => {
                    const { value: dVal, unit: dUnit } = parseDosage(m.dosage || '');
                    const { value: durVal, unit: durUnit } = parseDuration(m.duration || '');
                    return {
                        ...m,
                        dosageValue: dVal,
                        dosageUnit: dUnit,
                        durationValue: durVal,
                        durationUnit: durUnit
                    };
                });
                
                const initialOtherModes = {};
                initialMeds.forEach((m, idx) => {
                    if (m.name && !COMMON_MEDICINES.includes(m.name)) {
                        initialOtherModes[idx] = true;
                    }
                });
                setOtherModes(initialOtherModes);

                setFormData({
                    diagnosis: p.diagnosis || '',
                    medicines: initialMeds,
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
            medicines: [...formData.medicines, { name: '', dosageValue: '', dosageUnit: 'mg', frequency: '', durationValue: '', durationUnit: 'Days', instructions: '' }]
        });
    };

    const handleRemoveMedicine = (index) => {
        const newMedicines = formData.medicines.filter((_, i) => i !== index);
        setFormData({ ...formData, medicines: newMedicines });
        
        // Clean up otherModes for the removed index and shift others
        const newOtherModes = {};
        Object.keys(otherModes).forEach(k => {
            const key = parseInt(k);
            if (key < index) newOtherModes[key] = otherModes[key];
            if (key > index) newOtherModes[key - 1] = otherModes[key];
        });
        setOtherModes(newOtherModes);
    };

    const handleMedicineChange = (index, field, value) => {
        const newMedicines = [...formData.medicines];
        
        if (field === 'name') {
            if (value === 'Other') {
                setOtherModes({ ...otherModes, [index]: true });
                newMedicines[index][field] = ''; // Clear for user input
            } else {
                // If switching from 'Other' back to a selection
                if (otherModes[index]) {
                    const { [index]: removed, ...rest } = otherModes;
                    setOtherModes(rest);
                }
                newMedicines[index][field] = value;
            }
        } else {
            newMedicines[index][field] = value;
        }

        setFormData({ ...formData, medicines: newMedicines });
    };

    const handleBackToSelect = (index) => {
        const { [index]: removed, ...rest } = otherModes;
        setOtherModes(rest);
        const newMedicines = [...formData.medicines];
        newMedicines[index].name = '';
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

        if (!formData.diagnosis.trim()) {
            return toast.error('Diagnosis is required');
        }

        const validMedicines = formData.medicines
            .filter(m => m.name.trim())
            .map(m => ({
                ...m,
                dosage: `${m.dosageValue} ${m.dosageUnit}`.trim(),
                duration: `${m.durationValue} ${m.durationUnit}`.trim()
            }));

        if (validMedicines.length === 0) {
            return toast.error('At least one medicine is required');
        }

        if (validMedicines.some(m => !m.dosageValue)) {
            return toast.error('Dosage quantity is required for all medicines');
        }

        if (validMedicines.some(m => !m.durationValue)) {
            return toast.error('Duration value is required for all medicines');
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
            
            <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] w-full max-w-5xl relative animate-scale-in overflow-hidden border border-slate-100 flex flex-col h-full max-h-[90vh]">
                
                {/* ── HEADER SECTION ── */}
                <div className="relative shrink-0 overflow-hidden">
                    <div className="absolute inset-0 bg-premium-gradient" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative z-10 px-8 py-8 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                <Clipboard className="h-8 w-8 text-brand-teal" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="h-4 w-4 text-brand-teal animate-pulse" />
                                    <span className="text-[10px] font-black text-brand-teal uppercase tracking-[0.25em]">Clinical Module</span>
                                </div>
                                <h2 className="text-3xl font-black font-display text-white tracking-tight leading-none">
                                    {isEditing ? 'Update Prescription' : 'Issue Prescription'}
                                </h2>
                                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />
                                    Patient: <span className="text-white">{appointment.patientId?.userId?.profile?.firstName} {appointment.patientId?.userId?.profile?.lastName}</span>
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="p-3 rounded-2xl bg-white/5 text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all border border-white/10"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* ── FORM CONTENT ── */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-8 md:p-10 space-y-12">
                        
                        {/* 1. Clinical Investigation */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-brand-light flex items-center justify-center text-brand-dark">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-black font-display text-xl text-brand-dark">Clinical Investigation</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary complaints & Diagnosis</p>
                                </div>
                            </div>
                            
                            <div className="group relative">
                                <div className="absolute inset-0 bg-brand-teal/5 rounded-[2rem] -m-1.5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <textarea
                                    value={formData.diagnosis}
                                    onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                    className="input min-h-[140px] rounded-[1.5rem] bg-slate-50/50 border-2 border-slate-100 focus:bg-white focus:shadow-xl transition-all relative z-10 p-6 text-lg font-medium"
                                    placeholder="Precisely document clinical findings and diagnosis..."
                                    required
                                />
                            </div>
                        </section>

                        {/* 2. Medications Segment */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                                        <Pill className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-black font-display text-xl text-brand-dark">Medication Plan</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prescribed Therapeutic Regimen</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddMedicine}
                                    className="group flex items-center gap-2 px-5 py-2.5 bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                                >
                                    <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" /> 
                                    <span>Add Medication</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {formData.medicines.map((med, index) => (
                                    <div key={index} className="relative group/card">
                                        {/* Accent side bar */}
                                        <div className="absolute left-0 top-6 bottom-6 w-1 bg-brand-teal rounded-full opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                        
                                        <div className="bg-white border-2 border-slate-50 rounded-[2rem] p-6 md:p-8 hover:border-brand-teal/20 hover:shadow-xl transition-all duration-300">
                                            {formData.medicines.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMedicine(index)}
                                                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            )}
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                                {/* Med info - Row 1 */}
                                                <div className="md:col-span-12 lg:col-span-7 space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Pharmaceutical Name*</label>
                                                    <div className="relative">
                                                        {otherModes[index] ? (
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <input
                                                                        type="text"
                                                                        value={med.name}
                                                                        onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                                                        placeholder="Enter custom medicine name..."
                                                                        className="input bg-slate-50/50 border-slate-100 focus:bg-white text-base font-bold pl-11 !h-[58px]"
                                                                        autoFocus
                                                                        required
                                                                    />
                                                                    <Beaker className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-teal" />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleBackToSelect(index)}
                                                                    className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-[1.25rem] transition-all"
                                                                    title="Select from common medicines"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <select
                                                                    value={med.name}
                                                                    onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                                                    className="input bg-slate-50/50 border-slate-100 focus:bg-white text-base font-bold pl-11 appearance-none cursor-pointer !h-[58px]"
                                                                    required
                                                                >
                                                                    <option value="" disabled>Select pharmaceutical name...</option>
                                                                    {COMMON_MEDICINES.map((m) => (
                                                                        <option key={m} value={m}>{m}</option>
                                                                    ))}
                                                                </select>
                                                                <Beaker className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-teal pointer-events-none" />
                                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                                    <Plus className="h-4 w-4 rotate-45 transform" />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="md:col-span-12 lg:col-span-5 space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Dosage*</label>
                                                    <div className="flex items-center bg-slate-50/50 border border-slate-100 rounded-[1.25rem] focus-within:bg-white focus-within:border-brand-teal focus-within:ring-2 focus-within:ring-brand-teal/10 transition-all h-[58px] overflow-hidden">
                                                        <input
                                                            type="number"
                                                            value={med.dosageValue}
                                                            onChange={(e) => handleMedicineChange(index, 'dosageValue', e.target.value)}
                                                            placeholder="650"
                                                            className="flex-[1.5] min-w-0 bg-transparent h-full px-5 text-xl font-black outline-none"
                                                            required
                                                        />
                                                        <div className="w-px h-8 bg-slate-200/50" />
                                                        <select
                                                            value={med.dosageUnit}
                                                            onChange={(e) => handleMedicineChange(index, 'dosageUnit', e.target.value)}
                                                            className="flex-1 min-w-0 bg-transparent h-full px-3 text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer text-center"
                                                            required
                                                        >
                                                            {COMMON_DOSAGE_UNITS.map(unit => (
                                                                <option key={unit} value={unit} className="bg-white text-brand-dark uppercase font-bold">{unit}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Med info - Row 2 */}
                                                <div className="md:col-span-6 lg:col-span-6 space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Frequency*</label>
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={med.frequency}
                                                            onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                                                            placeholder="e.g. 1-0-1 (Morning-Afternoon-Night)"
                                                            className="input bg-slate-50/50 border-slate-100 focus:bg-white text-base font-bold pl-11 !h-[58px] rounded-[1.25rem]"
                                                            required
                                                        />
                                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-violet-400" />
                                                    </div>
                                                </div>

                                                <div className="md:col-span-6 lg:col-span-6 space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Duration*</label>
                                                    <div className="flex items-center bg-slate-50/50 border border-slate-100 rounded-[1.25rem] focus-within:bg-white focus-within:border-brand-teal focus-within:ring-2 focus-within:ring-brand-teal/10 transition-all h-[58px] overflow-hidden">
                                                        <input
                                                            type="number"
                                                            value={med.durationValue}
                                                            onChange={(e) => handleMedicineChange(index, 'durationValue', e.target.value)}
                                                            placeholder="5"
                                                            className="flex-[1.5] min-w-0 bg-transparent h-full px-5 text-xl font-black outline-none"
                                                            required
                                                        />
                                                        <div className="w-px h-8 bg-slate-200/50" />
                                                        <select
                                                            value={med.durationUnit}
                                                            onChange={(e) => handleMedicineChange(index, 'durationUnit', e.target.value)}
                                                            className="flex-1 min-w-0 bg-transparent h-full px-3 text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer text-center"
                                                            required
                                                        >
                                                            {COMMON_DURATION_UNITS.map(unit => (
                                                                <option key={unit} value={unit} className="bg-white text-brand-dark uppercase font-bold">{unit}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="md:col-span-12 space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Special Instructions</label>
                                                    <input
                                                        type="text"
                                                        value={med.instructions}
                                                        onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                                                        placeholder="e.g. Take with warm water after lunch"
                                                        className="input bg-slate-50/50 border-slate-100 focus:bg-white text-sm italic py-2.5"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* 3. Diagnostics & Results */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Diagnostic Tests */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-black font-display text-xl text-brand-dark">Clinical Tests</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Required Investigations</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddTest}
                                        className="h-9 px-4 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> <span>Add Test</span>
                                    </button>
                                </div>

                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {formData.tests.length === 0 ? (
                                        <div className="py-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300 gap-3">
                                            <Activity className="h-8 w-8 opacity-20" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No tests recommended</p>
                                        </div>
                                    ) : (
                                        formData.tests.map((test, index) => (
                                            <div key={index} className="p-5 rounded-2xl bg-white border-2 border-slate-50 group/test relative hover:border-amber-100 transition-all">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTest(index)}
                                                    className="absolute -top-2 -right-2 h-7 w-7 bg-white text-rose-500 rounded-full shadow-lg border border-slate-100 flex items-center justify-center opacity-0 group-hover/test:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={test.name}
                                                        onChange={(e) => handleTestChange(index, 'name', e.target.value)}
                                                        placeholder="Laboratory Test Name..."
                                                        className="w-full bg-slate-50/50 border-none rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-amber-100 focus:bg-white outline-none transition-all"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={test.instructions}
                                                        onChange={(e) => handleTestChange(index, 'instructions', e.target.value)}
                                                        placeholder="Specific instructions..."
                                                        className="w-full bg-white border-b border-dashed border-slate-100 text-[11px] font-medium text-slate-400 pb-1 outline-none focus:border-amber-200 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>

                            {/* Disposition & Follow-up */}
                            <section className="space-y-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                                            <AlertCircle className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-black font-display text-xl text-brand-dark">Clinical Advice</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Additional recommendations</p>
                                        </div>
                                    </div>
                                    <textarea
                                        value={formData.advice}
                                        onChange={(e) => setFormData({ ...formData, advice: e.target.value })}
                                        className="input min-h-[140px] rounded-3xl bg-slate-50/50 border-2 border-slate-100 focus:bg-white transition-all p-5 text-sm font-medium leading-relaxed"
                                        placeholder="Enter diet, lifestyle, and general recovery advice..."
                                    />
                                </div>

                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-brand-teal" />
                                            <span className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Follow-up Due</span>
                                        </div>
                                        <input
                                            type="date"
                                            value={formData.followUpDate}
                                            onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                            className="bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs font-black text-brand-dark outline-none focus:ring-2 focus:ring-brand-teal/20"
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-brand-teal/5 rounded-2xl">
                                        <div className="h-4 w-4 rounded-full bg-brand-teal flex items-center justify-center shrink-0 mt-0.5">
                                            <Plus className="h-2.5 w-2.5 text-white" />
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-500 leading-normal uppercase tracking-widest">
                                            {isEditing 
                                                ? "Submitting updates will not modify encounter status." 
                                                : "Issuing this prescription will formally close this clinical encounter."}
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </form>

                {/* ── STICKY FOOTER ACTIONS ── */}
                <div className="shrink-0 p-8 pt-0 flex gap-4 animate-slide-up">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-4 px-6 border-2 border-slate-100 rounded-2xl font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
                    >
                        Discard
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[2.5] py-4 px-8 bg-brand-dark text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 shadow-[0_20px_40px_-12px_rgba(10,54,48,0.3)] hover:bg-[#0c4038] hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 group"
                    >
                        {loading ? (
                            <div className="loading-spinner h-5 w-5 border-white/30 border-t-white"></div>
                        ) : (
                            <>
                                <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                <span>{isEditing ? 'Sync Changes to DB' : 'Finalize & Issue Prescription'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionModal;

