import React from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { CheckCircle, Download, ArrowLeft, Camera, ExternalLink, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

const PaymentSuccess = () => {
    const location = useLocation();
    const { bill, paymentId } = location.state || {};

    if (!bill) {
        return <Navigate to="/patient/bills" replace />;
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-[40px] shadow-2xl shadow-emerald-100 overflow-hidden border border-emerald-50">
                    {/* Success Header */}
                    <div className="bg-emerald-500 p-10 text-center relative overflow-hidden">
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
                                <CheckCircle className="h-16 w-16 text-emerald-500" />
                            </div>
                            <h1 className="text-3xl font-black text-white font-display uppercase tracking-wider">Payment Successful!</h1>
                            <p className="text-emerald-50 font-medium mt-2">Your transaction has been processed securely</p>
                        </div>

                        {/* Abstract Background Shapes */}
                        <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-400/30 rounded-full blur-3xl"></div>
                    </div>

                    <div className="p-10 space-y-8">
                        {/* Payment Details Card */}
                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Invoice Number</span>
                                    <p className="text-xl font-black text-slate-900 font-display">#{bill.billNumber || bill._id.slice(-6).toUpperCase()}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Transaction ID</span>
                                    <p className="text-sm font-bold text-slate-700 break-all bg-white px-3 py-1 rounded-lg border border-slate-100 inline-block font-mono">
                                        {paymentId}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Amount Paid</span>
                                    <p className="text-3xl font-black text-emerald-600 font-display">₹{bill.total}</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-2">Payment Date</span>
                                    <p className="text-slate-700 font-bold">{format(new Date(), 'PPP p')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Instructions Section */}
                        <div className="flex items-start gap-4 p-6 bg-amber-50 rounded-2xl border border-amber-100">
                            <div className="bg-amber-100 p-3 rounded-xl block">
                                <Camera className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="text-amber-900 font-black text-sm uppercase tracking-widest mb-1">Important Instruction</h4>
                                <p className="text-amber-800 text-sm font-medium leading-relaxed">
                                    Please <span className="underline decoration-2">take a screenshot</span> or save this page for your records.
                                    This confirmation serves as your digital receipt until the official PDF is processed.
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/patient/bills"
                                className="flex-1 py-4 bg-brand-dark text-white rounded-2xl font-black font-display uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Bills
                            </Link>
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black font-display uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                            >
                                <Download className="h-4 w-4" />
                                Print Receipt
                            </button>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted & Verified Transaction</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;
