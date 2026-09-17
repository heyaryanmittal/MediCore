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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
            
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl relative animate-scale-in flex flex-col h-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
                
                {/* ── HEADER ── */}
                <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-brand-light flex items-center justify-center text-brand-teal">
                            <Clipboard className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-brand-dark leading-tight">
                                {isEditing ? 'Update Prescription' : 'Issue Prescription'}
                            </h2>
                            <p className="text-xs font-semibold text-slate-500 mt-0.5">
                                Patient: <span className="text-brand-dark font-bold">{appointment.patientId?.userId?.profile?.firstName} {appointment.patientId?.userId?.profile?.lastName}</span>
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* ── FORM CONTENT ── */}
                <form id="rx-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8 space-y-8 custom-scrollbar">
                    
                    {/* 1. Clinical Investigation */}
                    <section className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Activity className="h-4 w-4 text-brand-teal" />
                            <h3 className="font-bold text-brand-dark text-sm">Clinical Investigation & Diagnosis</h3>
                        </div>
                        <textarea
                            value={formData.diagnosis}
                            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                            className="w-full min-h-[100px] rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10 transition-all p-4 text-sm outline-none resize-y"
                            placeholder="Document clinical findings, symptoms, and diagnosis..."
                            required
                        />
                    </section>

                    {/* 2. Medications Segment */}
                    <section className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                            <div className="flex items-center gap-2">
                                <Pill className="h-4 w-4 text-violet-500" />
                                <h3 className="font-bold text-brand-dark text-sm">Medication Plan</h3>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddMedicine}
                                className="flex items-center gap-1.5 px-4 py-2 bg-brand-light text-brand-teal rounded-lg text-xs font-bold hover:bg-brand-teal/20 transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" /> 
                                Add Medication
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.medicines.map((med, index) => (
                                <div key={index} className="relative bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-slate-500">#{index + 1}</span>
                                        {formData.medicines.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveMedicine(index)}
                                                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                        {/* Row 1 */}
                                        <div className="md:col-span-12 lg:col-span-6">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Pharmaceutical Name*</label>
                                            {otherModes[index] ? (
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={med.name}
                                                        onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                                        placeholder="Custom medicine name..."
                                                        className="flex-1 bg-white border border-slate-200 rounded-lg focus:border-brand-teal text-sm px-3 h-10 outline-none transition-all"
                                                        autoFocus
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleBackToSelect(index)}
                                                        className="px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <select
                                                        value={med.name}
                                                        onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                                        className="w-full bg-white border border-slate-200 rounded-lg focus:border-brand-teal text-sm px-3 appearance-none h-10 outline-none transition-all cursor-pointer"
                                                        required
                                                    >
                                                        <option value="" disabled>Select medicine...</option>
                                                        {COMMON_MEDICINES.map((m) => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))}
                                                    </select>
                                                    <Plus className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400 rotate-45 pointer-events-none" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-6 lg:col-span-3">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Dosage*</label>
                                            <div className="flex items-center bg-white border border-slate-200 rounded-lg h-10 overflow-hidden focus-within:border-brand-teal transition-all">
                                                <input
                                                    type="number"
                                                    value={med.dosageValue}
                                                    onChange={(e) => handleMedicineChange(index, 'dosageValue', e.target.value)}
                                                    placeholder="650"
                                                    className="flex-[1.5] w-full min-w-0 bg-transparent h-full px-3 text-sm font-semibold outline-none border-r border-slate-200"
                                                    required
                                                />
                                                <select
                                                    value={med.dosageUnit}
                                                    onChange={(e) => handleMedicineChange(index, 'dosageUnit', e.target.value)}
                                                    className="flex-1 w-full min-w-0 bg-transparent h-full px-2 text-[10px] font-bold text-slate-600 outline-none cursor-pointer"
                                                    required
                                                >
                                                    {COMMON_DOSAGE_UNITS.map(unit => (
                                                        <option key={unit} value={unit}>{unit}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="md:col-span-6 lg:col-span-3">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Frequency*</label>
                                            <input
                                                type="text"
                                                value={med.frequency}
                                                onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                                                placeholder="1-0-1"
                                                className="w-full bg-white border border-slate-200 rounded-lg focus:border-brand-teal text-sm px-3 h-10 outline-none transition-all"
                                                required
                                            />
                                        </div>

                                        {/* Row 2 */}
                                        <div className="md:col-span-6 lg:col-span-4">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Duration*</label>
                                            <div className="flex items-center bg-white border border-slate-200 rounded-lg h-10 overflow-hidden focus-within:border-brand-teal transition-all">
                                                <input
                                                    type="number"
                                                    value={med.durationValue}
                                                    onChange={(e) => handleMedicineChange(index, 'durationValue', e.target.value)}
                                                    placeholder="5"
                                                    className="flex-1 w-full min-w-0 bg-transparent h-full px-3 text-sm font-semibold outline-none border-r border-slate-200"
                                                    required
                                                />
                                                <select
                                                    value={med.durationUnit}
                                                    onChange={(e) => handleMedicineChange(index, 'durationUnit', e.target.value)}
                                                    className="flex-[1.5] w-full min-w-0 bg-transparent h-full px-2 text-[10px] font-bold text-slate-600 outline-none cursor-pointer"
                                                    required
                                                >
                                                    {COMMON_DURATION_UNITS.map(unit => (
                                                        <option key={unit} value={unit}>{unit}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="md:col-span-6 lg:col-span-8">
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Special Instructions</label>
                                            <input
                                                type="text"
                                                value={med.instructions}
                                                onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                                                placeholder="e.g. Take after meals"
                                                className="w-full bg-white border border-slate-200 rounded-lg focus:border-brand-teal text-sm px-3 h-10 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 3. Diagnostics & Results */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Diagnostic Tests */}
                        <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-amber-500" />
                                    <h3 className="font-bold text-brand-dark text-sm">Clinical Tests</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddTest}
                                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                >
                                    + Add Test
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.tests.length === 0 ? (
                                    <div className="py-8 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs">
                                        No lab tests recommended
                                    </div>
                                ) : (
                                    formData.tests.map((test, index) => (
                                        <div key={index} className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    type="text"
                                                    value={test.name}
                                                    onChange={(e) => handleTestChange(index, 'name', e.target.value)}
                                                    placeholder="Test Name"
                                                    className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-amber-400 transition-colors"
                                                />
                                                <input
                                                    type="text"
                                                    value={test.instructions}
                                                    onChange={(e) => handleTestChange(index, 'instructions', e.target.value)}
                                                    placeholder="Instructions (optional)"
                                                    className="w-full bg-transparent border-b border-dashed border-slate-300 text-xs px-1 pb-1 outline-none focus:border-amber-400 transition-colors"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveTest(index)}
                                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Advice & Follow-up */}
                        <section className="space-y-6">
                            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-[calc(100%-80px)]">
                                <div className="flex items-center gap-2 mb-4">
                                    <AlertCircle className="h-4 w-4 text-blue-500" />
                                    <h3 className="font-bold text-brand-dark text-sm">Clinical Advice</h3>
                                </div>
                                <textarea
                                    value={formData.advice}
                                    onChange={(e) => setFormData({ ...formData, advice: e.target.value })}
                                    className="w-full h-[calc(100%-35px)] min-h-[100px] rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-400 transition-all p-3 text-sm outline-none resize-none"
                                    placeholder="Lifestyle, diet, and recovery recommendations..."
                                />
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm font-bold text-brand-dark">Follow-up Due</span>
                                </div>
                                <input
                                    type="date"
                                    value={formData.followUpDate}
                                    onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:border-brand-teal transition-colors cursor-pointer"
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </section>
                    </div>
                </form>

                {/* ── FOOTER ACTIONS ── */}
                <div className="shrink-0 px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        form="rx-form"
                        disabled={loading}
                        className="px-6 py-2.5 bg-brand-dark text-white rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            <div className="loading-spinner h-4 w-4 border-white/30 border-t-white"></div>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                {isEditing ? 'Update Prescription' : 'Finalize & Issue'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrescriptionModal;
