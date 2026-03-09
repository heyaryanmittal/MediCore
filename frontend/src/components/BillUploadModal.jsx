import React, { useState, useEffect } from 'react';
import { X, Upload, DollarSign, Plus, Trash2, FileText, CheckCircle, Pill, ClipboardList, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const BillUploadModal = ({ isOpen, onClose, patient, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [items, setItems] = useState([
        { description: '', quantity: 1, unitPrice: 0 }
    ]);
    const [dueDate, setDueDate] = useState(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [prescriptions, setPrescriptions] = useState([]);
    const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && patient?._id) {
            fetchPrescriptions();
        }
    }, [isOpen, patient?._id]);

    const fetchPrescriptions = async () => {
        try {
            setPrescriptionsLoading(true);
            const res = await api.get(`/receptionist/patient/${patient._id}/prescriptions`);
            if (res.data.success) {
                setPrescriptions(res.data.data.prescriptions);
            }
        } catch (err) {
            console.error('Failed to fetch prescriptions:', err);
        } finally {
            setPrescriptionsLoading(false);
        }
    };

    const addMedicineToBill = (medicine) => {
        const newItem = { description: `Medicine: ${medicine.name}`, quantity: 1, unitPrice: 0 };
        // If the first item is empty, replace it
        if (items.length === 1 && !items[0].description) {
            setItems([newItem]);
        } else {
            setItems([...items, newItem]);
        }
        toast.success(`${medicine.name} added to bill. Set the price.`);
    };

    const calculateTotal = () => {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const tax = subtotal * 0.18;
        return (subtotal + tax).toFixed(2);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = field === 'description' ? value : parseFloat(value) || 0;
        setItems(newItems);
    };

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

        // Validate items
        const validItems = items.filter(item => item.description.trim());
        if (validItems.length === 0) {
            return toast.error('Please add at least one line item');
        }

        try {
            setLoading(true);

            // 1. Create the bill entry
            const billData = {
                patientId: patient._id,
                items: validItems,
                dueDate: dueDate
            };

            const billResponse = await api.post('/receptionist/bill', billData);

            if (billResponse.data.success) {
                const billId = billResponse.data.data.bill._id;

                // 2. If a file is selected, upload it as receipt
                if (file) {
                    const fileData = new FormData();
                    fileData.append('receipt', file);
                    await api.post(`/receptionist/bill/${billId}/receipt`, fileData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }

                toast.success(file ? 'Bill created and receipt uploaded' : 'Bill created successfully');
                onSuccess && onSuccess();
                onClose();
            }
        } catch (error) {
            console.error('Bill generation error:', error);
            toast.error(error.response?.data?.message || 'Failed to process bill');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
            <div className="bg-white rounded-[2.5rem] shadow-premium w-full max-w-6xl relative animate-slide-up overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 bg-brand-dark flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-2xl font-black font-display text-white">Generate Invoice & Bill</h2>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
                            For Patient: {patient.userId.profile.firstName} {patient.userId.profile.lastName}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                    {/* Left Column: Billing Form */}
                    <form onSubmit={handleSubmit} className="lg:col-span-8 overflow-y-auto p-8 border-r border-slate-100 space-y-8 custom-scrollbar">
                        {/* Bill Items Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-brand-dark">
                                    <DollarSign className="h-5 w-5" />
                                    <h3 className="font-black font-display text-lg">Billing Line Items</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-light text-brand-dark rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-teal/10 transition-colors"
                                >
                                    <Plus className="h-4 w-4" /> Add Item
                                </button>
                            </div>

                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 relative group animate-fade-in">
                                        <div className="md:col-span-6 space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Description*</label>
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                placeholder="e.g. Consultation Fee, Lab Test"
                                                className="input bg-white"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Qty*</label>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                min="1"
                                                className="input bg-white"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-3 space-y-1">
                                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Unit Price (₹)*</label>
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                                                min="0"
                                                className="input bg-white"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-1 flex items-end justify-end pb-1">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                disabled={items.length === 1}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                            {/* Upload Receipt */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-brand-dark">
                                    <Upload className="h-5 w-5" />
                                    <h3 className="font-black font-display text-lg tracking-tight">PDF Receipt</h3>
                                </div>
                                <div className={`relative border-2 border-dashed rounded-3xl p-6 transition-all group ${file ? 'border-brand-teal bg-brand-teal/5' : 'border-slate-200 hover:border-brand-teal hover:bg-slate-50'
                                    }`}>
                                    <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png" />
                                    <div className="flex flex-col items-center text-center">
                                        {file ? (
                                            <>
                                                <CheckCircle className="h-8 w-8 text-brand-teal mb-2" />
                                                <p className="text-brand-dark text-[10px] font-black truncate max-w-full px-4">{file.name}</p>
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="h-8 w-8 text-slate-300 mb-2" />
                                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">Upload Invoice</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Totals Section */}
                            <div className="bg-brand-dark rounded-3xl p-8 text-white space-y-4 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <DollarSign className="h-20 w-20" />
                                </div>
                                <div className="space-y-3 relative z-10 text-sm">
                                    <div className="flex justify-between items-center text-white/60">
                                        <span className="font-bold uppercase tracking-widest text-[8px]">Selection Total</span>
                                        <span className="font-bold">₹{(calculateTotal() / 1.18).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-white/60 border-b border-white/10 pb-3">
                                        <span className="font-bold uppercase tracking-widest text-[8px]">Tax (GST 18%)</span>
                                        <span className="font-bold">₹{(calculateTotal() * 0.18 / 1.18).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="font-black uppercase tracking-[0.2em] text-brand-teal text-[10px]">Net Payable</span>
                                        <span className="text-2xl font-black font-display">₹{calculateTotal()}</span>
                                    </div>
                                    <div className="pt-2">
                                        <label className="text-[8px] font-black text-white/40 uppercase tracking-widest block mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="w-full bg-white/10 border-white/20 rounded-xl px-4 py-2 text-sm font-bold text-white focus:outline-none focus:bg-white/20 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex gap-4 pt-6 sticky bottom-0 bg-white pb-2 shadow-[0_-10px_10px_-10px_rgba(0,0,0,0.05)] z-20">
                            <button type="button" onClick={onClose} className="flex-1 py-4 border border-slate-200 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-[2] py-4 bg-brand-dark text-white rounded-2xl font-black font-display flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50"
                            >
                                {loading ? <div className="loading-spinner h-5 w-5 border-white/30 border-t-white"></div> : <><DollarSign className="h-5 w-5" /> GENERATE INVOICE</>}
                            </button>
                        </div>
                    </form>

                    {/* Right Column: Prescriptions Sidebar */}
                    <div className="lg:col-span-4 bg-slate-50 overflow-y-auto p-8 custom-scrollbar border-l border-slate-100">
                        <div className="flex items-center gap-2 text-brand-dark mb-6">
                            <ClipboardList className="h-5 w-5" />
                            <h3 className="font-black font-display text-lg tracking-tight">Recent Prescriptions</h3>
                        </div>

                        {prescriptionsLoading ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                                <div className="loading-spinner h-8 w-8 border-brand-teal" />
                                <p className="text-[8px] font-black uppercase tracking-widest">Loading Records...</p>
                            </div>
                        ) : prescriptions.length > 0 ? (
                            <div className="space-y-6">
                                {prescriptions.map((p) => (
                                    <div key={p._id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 animate-fade-in group hover:border-brand-teal/30 transition-all">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-xl bg-brand-teal/10 flex items-center justify-center text-brand-teal font-black text-xs">
                                                    Dr.
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-brand-dark">Dr. {p.doctorId.userId.profile.lastName}</p>
                                                    <p className="text-[8px] font-bold text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Medicines Prescribed:</p>
                                            {p.medicines.map((m, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    onClick={() => addMedicineToBill(m)}
                                                    className="w-full flex items-center justify-between text-left p-3 rounded-xl bg-slate-50 hover:bg-brand-teal/5 hover:border-brand-teal/20 border border-transparent transition-all group/item"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Pill className="h-4 w-4 text-brand-teal" />
                                                        <div>
                                                            <p className="text-[10px] font-black text-brand-dark">{m.name}</p>
                                                            <p className="text-[8px] font-bold text-slate-400">{m.dosage} | {m.duration}</p>
                                                        </div>
                                                    </div>
                                                    <Plus className="h-3 w-3 text-slate-300 group-hover/item:text-brand-teal group-hover/item:scale-125 transition-all" />
                                                </button>
                                            ))}
                                        </div>

                                        {p.tests?.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-50">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Tests Requested:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {p.tests.map((t, tidx) => (
                                                        <span key={tidx} className="px-2 py-1 rounded-lg bg-rose-50 text-rose-500 text-[8px] font-black uppercase tracking-widest border border-rose-100">
                                                            {t.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                                <ClipboardList className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">No Recent Prescriptions</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BillUploadModal;
