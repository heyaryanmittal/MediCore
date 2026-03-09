import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { FileText, Download, CheckCircle, Clock, AlertCircle, Plus, Info, ShieldCheck, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

const Bills = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMockModal, setShowMockModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [mockLoading, setMockLoading] = useState(false);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const endpoint = currentUser.role === 'patient' ? '/patient/bills' : '/receptionist/bills';
      const response = await api.get(endpoint);
      if (response.data.success) {
        setBills(response.data.data.bills);
      }
    } catch (error) {
      console.error('Failed to fetch bills:', error);
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (billId) => {
    try {
      const response = await api.get(`/documents/download/bill/${billId}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bill_${billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download bill');
    }
  };

  const handleMarkAsPaid = async (billId) => {
    try {
      const response = await api.patch(`/receptionist/bill/${billId}/mark-paid`);
      if (response.data.success) {
        toast.success('Bill marked as paid');
        fetchBills();
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Failed to update bill status');
    }
  };

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayNow = async (bill) => {
    try {
      // 1. Create order on backend
      const orderResponse = await api.post('/payments/create-bill-order', {
        billId: bill._id
      });

      if (!orderResponse.data.success) {
        toast.error(orderResponse.data.message);
        return;
      }

      const { orderId, amount, currency, keyId } = orderResponse.data.data;

      // Handle Mock Mode
      if (orderResponse.data.isMock) {
        setSelectedBill({ ...bill, mockOrder: orderResponse.data.data });
        setShowMockModal(true);
        return;
      }

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        toast.error('Razorpay SDK failed to load. Are you online?');
        return;
      }

      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'OrvantaHealth',
        description: `Payment for Invoice #${bill.billNumber || bill._id.slice(-6).toUpperCase()}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            // 2. Verify payment on backend
            const verifyRes = await api.post('/payments/verify-bill', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              billId: bill._id
            });

            if (verifyRes.data.success) {
              toast.success('Payment successful!');
              navigate('/patient/payment-success', {
                state: {
                  bill: bill,
                  paymentId: response.razorpay_payment_id
                }
              });
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Error verifying payment');
          }
        },
        prefill: {
          name: `${currentUser?.profile?.firstName || ''} ${currentUser?.profile?.lastName || ''}`,
          email: currentUser?.email || '',
          contact: currentUser?.profile?.phone || '',
        },
        theme: {
          color: '#0d9488',
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
    }
  };

  const handleMockPayment = async () => {
    if (!selectedBill || !selectedBill.mockOrder) return;
    setMockLoading(true);
    try {
      // Small delay to simulate processing
      await new Promise(r => setTimeout(r, 2000));

      const verifyRes = await api.post('/payments/verify-bill', {
        razorpay_order_id: selectedBill.mockOrder.orderId,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: 'mock_signature',
        billId: selectedBill._id
      });

      if (verifyRes.data.success) {
        toast.success('Payment successful (Demo Mode)!');
        setShowMockModal(false);
        navigate('/patient/payment-success', {
          state: {
            bill: selectedBill,
            paymentId: `pay_mock_${Date.now()}`
          }
        });
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error) {
      console.error('Mock payment error:', error);
      toast.error('Error processing mock payment');
    } finally {
      setMockLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border border-green-200';
      case 'unpaid': return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'overdue': return 'bg-red-100 text-red-800 border border-red-200';
      case 'partially_paid': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'draft': return 'bg-slate-100 text-slate-800 border border-slate-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Bills & Payments</h1>
          <p className="text-gray-600 font-medium tracking-tight">View and manage medical invoices</p>
        </div>
        {currentUser?.role === 'receptionist' && (
          <Link
            to="/dashboard/patients"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-teal text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-teal/20 hover:bg-brand-teal/90 transition-all font-display"
          >
            <Plus className="h-4 w-4" />
            Create New Bill
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {bills.length > 0 ? (
          bills.map((bill) => (
            <div key={bill._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-brand-light h-12 w-12 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-brand-teal font-black text-xl">₹</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Invoice #{bill.billNumber || bill._id.slice(-6).toUpperCase()}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-brand-dark font-display tracking-tight">
                          ₹{Number(bill.total).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">total due</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Date: {format(new Date(bill.createdAt), 'PPP')}
                      </div>
                      <div className="flex items-center font-bold text-brand-teal">
                        <FileText className="h-4 w-4 mr-2" />
                        Status: {bill.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end md:self-center">
                  {bill.status !== 'paid' && currentUser?.role === 'patient' && (
                    <button
                      onClick={() => handlePayNow(bill)}
                      className="px-6 py-2 bg-brand-teal text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20"
                    >
                      Pay Now
                    </button>
                  )}

                  {bill.status !== 'paid' && currentUser?.role === 'receptionist' && (
                    <button
                      onClick={() => handleMarkAsPaid(bill._id)}
                      className="px-6 py-2 bg-brand-dark text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all shadow-lg"
                    >
                      Mark as Paid
                    </button>
                  )}

                  <button
                    onClick={() => handleDownload(bill._id)}
                    className="p-3 text-slate-400 hover:text-brand-teal hover:bg-brand-teal/5 rounded-xl transition-all"
                    title="Download PDF"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-12 text-center border-dashed">
            <span className="block text-5xl text-gray-300 mx-auto mb-4 font-black">₹</span>
            <h3 className="text-lg font-medium text-gray-900">No bills found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              You don't have any medical bills at the moment.
            </p>
          </div>
        )}
      </div>

      {/* Payment Information Card */}
      <div className="card bg-primary-50 border-primary-100 p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-6 w-6 text-primary-600" />
          <div>
            <h4 className="text-sm font-semibold text-primary-900">Payment Information</h4>
            <p className="text-sm text-primary-800 mt-1">
              All transactions are secure and encrypted. If you have any questions regarding your bill,
              please contact the hospital billing department at <span className="font-semibold">+1 (555) 000-1111</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Mock Payment Modal */}
      {showMockModal && selectedBill && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setShowMockModal(false)}
        >
          <div
            className="bg-white rounded-[32px] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-8 bg-brand-teal text-white overflow-hidden">
              <div className="absolute top-0 right-0 p-4 z-20">
                <button
                  onClick={() => setShowMockModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  type="button"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="h-16 w-16 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center">
                  <ShieldCheck className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black font-display uppercase tracking-wider">Secure Payment</h2>
                  <p className="text-white/80 font-medium text-sm">OrvantaHealth Demo Portal</p>
                </div>
              </div>

              {/* Abstract Background Shapes */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-dark/20 rounded-full blur-3xl"></div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Reference</span>
                  <span className="text-slate-900 font-black font-display">#{selectedBill.billNumber || selectedBill._id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px] block mb-1">Total Amount</span>
                    <span className="text-4xl font-black text-slate-900 font-display">₹{selectedBill.total}</span>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-emerald-100">
                    <Info className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Demo Mode</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-xs">VISA</div>
                  <div className="text-sm font-bold truncate">•••• •••• •••• 4242</div>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                  <div className="h-8 w-8 bg-white border border-slate-100 rounded-lg flex items-center justify-center"><Clock className="h-4 w-4" /></div>
                  <div className="text-xs font-medium">Auto-testing enabled for this transaction</div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  disabled={mockLoading}
                  onClick={handleMockPayment}
                  className={`w-full py-5 rounded-2xl text-white font-black font-display uppercase tracking-widest text-sm shadow-xl transition-all active:scale-[0.98] ${mockLoading ? 'bg-slate-300' : 'bg-brand-dark hover:bg-slate-800 shadow-slate-200'
                    }`}
                >
                  {mockLoading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </div>
                  ) : 'Complete Dummy Payment'}
                </button>
                <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-relaxed px-4">
                  This is a simulated transaction. No real money will be charged.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;
