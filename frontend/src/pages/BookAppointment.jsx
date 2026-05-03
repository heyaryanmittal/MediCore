import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Calendar, Clock, User, MessageSquare, ChevronRight, ChevronLeft, 
  CheckCircle, Upload, X, FileText, CreditCard, Smartphone, 
  Landmark, ShieldCheck, Wallet, ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, addDays, startOfToday } from 'date-fns';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [consultationType, setConsultationType] = useState('in-person');
  const [bookedSlots, setBookedSlots] = useState([]);
  const [leaveDates, setLeaveDates] = useState([]);
  const [availableDays, setAvailableDays] = useState([]);
  const [patientDocuments, setPatientDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardHolder: '',
    upiId: '',
    bank: 'HDFC'
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailability();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/patient/doctors');
      if (response.data.success) {
        setDoctors(response.data.data.doctors);
      }
    } catch (error) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await api.get(`/patient/doctor/${selectedDoctor._id}/availability`);
      if (response.data.success) {
        const data = response.data.data;
        setAvailableDays(data.availability?.days || []);
        setLeaveDates(data.leaves || []);
        const booked = data.bookedSlots
          .filter(slot => format(new Date(slot.date), 'yyyy-MM-dd') === selectedDate)
          .map(slot => slot.timeSlot.start);
        setBookedSlots(booked);
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    }
  };

  const handleProceedToPayment = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }
    setStep(4);
  };

  const handlePayment = async () => {
    setIsProcessingPayment(true);
    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 1. Create Appointment
      const response = await api.post('/appointments/book', {
        doctorId: selectedDoctor._id,
        date: selectedDate,
        timeSlot: selectedSlot,
        symptoms,
        consultationType,
        patientDocuments
      });

      if (response.data.success) {
        const appointment = response.data.data.appointment;
        
        // 2. Mock payment verification/creation
        // In a real app, we'd send payment details to a gateway. 
        // Here we simulate success and show the final screen.
        setBookingDetails(appointment);
        setStep(5);
        toast.success('Payment successful & Appointment Booked!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => {
        const formData = new FormData();
        formData.append('document', file);
        formData.append('documentType', 'other');
        return api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      });

      const results = await Promise.all(uploadPromises);
      const newDocs = results.map(res => ({
        name: res.data.data.document.name,
        url: res.data.data.document.url,
        documentType: 'report'
      }));

      setPatientDocuments(prev => [...prev, ...newDocs]);
      toast.success('Documents uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (index) => {
    setPatientDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    const days = doctor.availability?.days || [];
    setAvailableDays(days);
    for (let i = 0; i < 28; i++) {
      const d = addDays(startOfToday(), i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const weekDay = format(d, 'EEEE').toLowerCase();
      if (days.includes(weekDay)) {
        setSelectedDate(dateStr);
        break;
      }
    }
    setSelectedSlot(null);
    setStep(2);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-brand-dark font-display tracking-tight leading-none mb-2">
            Book Appointment
          </h1>
          <p className="text-slate-500 font-medium text-lg">Secure your consultation in 5 simple steps</p>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-between px-8 py-6 bg-white rounded-[2rem] border border-slate-100 shadow-premium overflow-x-auto">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center shrink-0">
            <div className={`flex items-center justify-center w-12 h-12 rounded-2xl border-2 transition-all duration-500 ${
              step >= s ? 'bg-brand-dark border-brand-dark text-white shadow-lg' : 'border-slate-100 text-slate-300'
            }`}>
              {step > s ? <CheckCircle className="h-6 w-6" /> : <span className="font-black font-display">{s}</span>}
            </div>
            {s < 5 && (
              <div className={`w-8 sm:w-16 h-1 mx-4 rounded-full transition-all duration-1000 ${
                step > s ? 'bg-brand-teal' : 'bg-slate-100'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Doctor */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-light flex items-center justify-center text-brand-teal">
              <User className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black text-brand-dark font-display">Select Medical Specialist</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {doctors.map((doctor) => (
              <div
                key={doctor._id}
                onClick={() => handleDoctorSelect(doctor)}
                className={`group relative p-6 bg-white rounded-[2.5rem] border-2 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                  selectedDoctor?._id === doctor._id ? 'border-brand-teal bg-teal-50/30 shadow-xl' : 'border-slate-50'
                }`}
              >
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-brand-dark flex items-center justify-center text-white text-xl font-black shadow-lg group-hover:rotate-3 transition-transform">
                    {doctor.userId.profile.firstName[0]}{doctor.userId.profile.lastName[0]}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-brand-dark font-display truncate">
                      Dr. {doctor.userId.profile.firstName} {doctor.userId.profile.lastName}
                    </h3>
                    <p className="text-xs font-black text-brand-teal uppercase tracking-widest">{doctor.specialization}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-400">Consultation Fee:</span>
                      <span className="text-lg font-black text-brand-dark">₹{doctor.consultationFee}</span>
                    </div>
                  </div>
                </div>
                <div className="absolute top-4 right-4 text-slate-200 group-hover:text-brand-teal transition-colors">
                  <ChevronRight className="h-6 w-6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-light flex items-center justify-center text-brand-teal">
                <Calendar className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-brand-dark font-display">Choose Schedule</h2>
            </div>
            <button onClick={() => setStep(1)} className="text-xs font-black text-brand-teal uppercase tracking-widest hover:underline flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" /> Change Doctor
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Select Appointment Date</h3>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                {[...Array(28)].map((_, i) => {
                  const date = addDays(startOfToday(), i);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const weekDay = format(date, 'EEEE').toLowerCase();
                  const isWorking = availableDays.length === 0 || availableDays.includes(weekDay);
                  const isOnLeave = leaveDates.includes(dateStr);
                  const isDisabled = !isWorking || isOnLeave;
                  const isSelected = dateStr === selectedDate;

                  if (!isWorking) return null;

                  return (
                    <button
                      key={i}
                      disabled={isDisabled}
                      onClick={() => { if (!isDisabled) { setSelectedDate(dateStr); setSelectedSlot(null); } }}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                        isOnLeave ? 'bg-rose-50 border-rose-100 opacity-50 cursor-not-allowed' :
                        isSelected ? 'bg-brand-dark border-brand-dark text-white shadow-xl scale-105' :
                        'bg-white border-slate-50 hover:border-brand-teal/30 hover:bg-brand-light/20'
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-70">
                        {format(date, 'EEE')}
                      </span>
                      <span className="text-xl font-black">{format(date, 'd')}</span>
                      {isOnLeave && <span className="text-[8px] font-black text-rose-500 uppercase mt-1">Leave</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slots */}
            <div className="lg:col-span-5 bg-brand-dark p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
              <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.2em] mb-6">Available Time Slots</h3>
              <div className="grid grid-cols-1 gap-3">
                {selectedDoctor?.availability.timeSlots.map((slot, i) => {
                  const isBooked = bookedSlots.includes(slot.start);
                  const isSelected = selectedSlot?.start === slot.start;

                  return (
                    <button
                      key={i}
                      disabled={isBooked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                        isSelected ? 'bg-brand-teal border-brand-teal text-white shadow-lg' :
                        isBooked ? 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed' :
                        'bg-white/10 border-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Clock className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-brand-teal'}`} />
                        <span className="font-bold">{slot.start} - {slot.end}</span>
                      </div>
                      {isSelected && <CheckCircle className="h-5 w-5" />}
                    </button>
                  );
                })}
              </div>
              {selectedDoctor?.availability.timeSlots.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 font-bold italic">No slots for this date</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setStep(3)}
              disabled={!selectedSlot}
              className="btn btn-primary px-12 py-5 text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              Confirm Schedule <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Consultation Details */}
      {step === 3 && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-light flex items-center justify-center text-brand-teal">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-brand-dark font-display">Consultation Details</h2>
            </div>
            <button onClick={() => setStep(2)} className="text-xs font-black text-brand-teal uppercase tracking-widest hover:underline flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" /> Change Schedule
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Primary Symptoms / Reason</label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Tell us how you're feeling..."
                  rows={8}
                  className="w-full p-6 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-brand-teal focus:bg-white outline-none transition-all resize-none text-brand-dark font-medium"
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Medical Documents</label>
                <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center group hover:border-brand-teal transition-colors">
                  <input type="file" className="hidden" id="doc-upload" onChange={handleFileUpload} multiple />
                  <label htmlFor="doc-upload" className="cursor-pointer flex flex-col items-center">
                    <div className="h-16 w-16 bg-brand-light rounded-2xl flex items-center justify-center text-brand-teal mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-black text-brand-dark uppercase tracking-widest">
                      {uploading ? 'Processing...' : 'Upload Reports'}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-1">PDF, JPG, PNG (Max 5MB)</p>
                  </label>
                </div>

                {patientDocuments.length > 0 && (
                  <div className="mt-6 space-y-2">
                    {patientDocuments.map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-brand-teal" />
                          <span className="text-xs font-bold text-brand-dark truncate max-w-[150px]">{doc.name}</span>
                        </div>
                        <button onClick={() => removeDocument(i)} className="text-rose-400 hover:text-rose-600"><X className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-brand-teal/5 p-6 rounded-[2rem] border border-brand-teal/10">
                <h4 className="text-[10px] font-black text-brand-teal uppercase tracking-widest mb-3">Booking Summary</h4>
                <div className="space-y-2">
                  <p className="text-sm font-bold text-brand-dark flex justify-between">
                    <span>Doctor</span>
                    <span>Dr. {selectedDoctor?.userId.profile.firstName} {selectedDoctor?.userId.profile.lastName}</span>
                  </p>
                  <p className="text-sm font-bold text-brand-dark flex justify-between">
                    <span>Date</span>
                    <span>{format(new Date(selectedDate), 'MMMM do, yyyy')}</span>
                  </p>
                  <p className="text-sm font-bold text-brand-dark flex justify-between">
                    <span>Slot</span>
                    <span>{selectedSlot?.start}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleProceedToPayment}
              className="btn btn-primary px-12 py-5 text-lg shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              Proceed to Payment <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Payment System */}
      {step === 4 && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-light flex items-center justify-center text-brand-teal">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-brand-dark font-display">Secure Payment</h2>
            </div>
            <button onClick={() => setStep(3)} className="text-xs font-black text-brand-teal uppercase tracking-widest hover:underline flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" /> Change Details
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Payment Methods */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Payment Options</h3>
              {[
                { id: 'card', label: 'Debit / Credit Card', icon: CreditCard },
                { id: 'upi', label: 'UPI / Scan to Pay', icon: Smartphone },
                { id: 'netbanking', label: 'Net Banking', icon: Landmark },
                { id: 'wallet', label: 'Digital Wallets', icon: Wallet }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all duration-300 ${
                    paymentMethod === method.id ? 'bg-brand-dark border-brand-dark text-white shadow-xl scale-102' : 'bg-white border-slate-50 text-brand-dark hover:border-brand-teal/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <method.icon className={`h-6 w-6 ${paymentMethod === method.id ? 'text-brand-teal' : 'text-slate-400'}`} />
                    <span className="font-black uppercase tracking-widest text-[10px]">{method.label}</span>
                  </div>
                  {paymentMethod === method.id && <div className="h-2 w-2 rounded-full bg-brand-teal animate-pulse"></div>}
                </button>
              ))}
            </div>

            {/* Payment Inputs */}
            <div className="lg:col-span-7 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-premium">
              <div className="mb-10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-brand-dark font-display">Payment Details</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Transaction encrypted via MediShield</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-brand-teal uppercase tracking-widest">Total Payable</p>
                  <p className="text-4xl font-black text-brand-dark font-display">₹{selectedDoctor?.consultationFee}</p>
                </div>
              </div>

              {paymentMethod === 'card' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Card Holder Name</label>
                    <input 
                      type="text" 
                      className="input bg-slate-50 border-transparent focus:bg-white" 
                      placeholder="e.g. ARYAN MITTAL"
                      value={paymentDetails.cardHolder}
                      onChange={(e) => setPaymentDetails({...paymentDetails, cardHolder: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Card Number</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        className="input bg-slate-50 border-transparent focus:bg-white pl-12" 
                        placeholder="0000 0000 0000 0000"
                        value={paymentDetails.cardNumber}
                        onChange={(e) => setPaymentDetails({...paymentDetails, cardNumber: e.target.value})}
                      />
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry Date</label>
                      <input 
                        type="text" 
                        className="input bg-slate-50 border-transparent focus:bg-white" 
                        placeholder="MM / YY"
                        value={paymentDetails.expiry}
                        onChange={(e) => setPaymentDetails({...paymentDetails, expiry: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CVV Code</label>
                      <input 
                        type="password" 
                        className="input bg-slate-50 border-transparent focus:bg-white" 
                        placeholder="***"
                        value={paymentDetails.cvv}
                        onChange={(e) => setPaymentDetails({...paymentDetails, cvv: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter UPI ID</label>
                    <input 
                      type="text" 
                      className="input bg-slate-50 border-transparent focus:bg-white" 
                      placeholder="e.g. aryan@okaxis"
                      value={paymentDetails.upiId}
                      onChange={(e) => setPaymentDetails({...paymentDetails, upiId: e.target.value})}
                    />
                  </div>
                  <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-3xl">
                    <div className="h-32 w-32 bg-slate-50 mx-auto mb-4 flex items-center justify-center rounded-2xl">
                      <Smartphone className="h-16 w-16 text-slate-200" />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scan QR to pay instantly</p>
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="space-y-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Your Bank</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak', 'Others'].map(bank => (
                      <button 
                        key={bank}
                        onClick={() => setPaymentDetails({...paymentDetails, bank})}
                        className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all ${
                          paymentDetails.bank === bank ? 'border-brand-teal bg-teal-50 text-brand-dark' : 'border-slate-50 text-slate-400'
                        }`}
                      >
                        {bank}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                disabled={isProcessingPayment}
                onClick={handlePayment}
                className="btn btn-primary w-full py-5 text-lg shadow-2xl mt-10 flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="loading-spinner h-5 w-5 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{selectedDoctor?.consultationFee}</span>
                    <ShieldCheck className="h-5 w-5" />
                  </>
                )}
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Booking Confirmed */}
      {step === 5 && bookingDetails && (
        <div className="max-w-2xl mx-auto space-y-8 animate-slide-up">
          <div className="bg-white rounded-[3rem] shadow-premium overflow-hidden border border-slate-100">
            <div className="bg-emerald-500 p-12 text-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="h-24 w-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl animate-bounce">
                  <CheckCircle className="h-14 w-14 text-emerald-500" />
                </div>
                <h1 className="text-4xl font-black text-white font-display uppercase tracking-tight">Booking Confirmed!</h1>
                <p className="text-emerald-50 font-bold mt-2 uppercase tracking-widest text-[10px]">Your medical session is locked in</p>
              </div>
            </div>

            <div className="p-12 space-y-10">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Practitioner</h4>
                  <p className="text-lg font-black text-brand-dark font-display">Dr. {selectedDoctor?.userId.profile.firstName} {selectedDoctor?.userId.profile.lastName}</p>
                  <p className="text-xs font-black text-brand-teal uppercase tracking-widest">{selectedDoctor?.specialization}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Appointment ID</h4>
                  <p className="text-lg font-black text-brand-dark font-mono">#{bookingDetails._id.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Schedule</h4>
                  <p className="text-base font-bold text-brand-dark">{format(new Date(selectedDate), 'EEEE, MMMM do')}</p>
                  <div className="flex items-center gap-2 text-brand-teal mt-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-black">{selectedSlot?.start} - {selectedSlot?.end}</span>
                  </div>
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Status</h4>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                    Paid ₹{selectedDoctor?.consultationFee}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-brand-light rounded-xl flex items-center justify-center text-brand-teal shrink-0">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-brand-dark uppercase tracking-widest mb-2">Patient Instructions</h5>
                    <ul className="text-xs font-bold text-slate-500 space-y-2 list-disc pl-4 leading-relaxed">
                      <li>Please arrive 15 minutes before your scheduled slot.</li>
                      <li>Carry your original ID card for physical verification.</li>
                      <li>Digital prescription will be available in your portal after session.</li>
                      <li>For rescheduling, contact the receptionist at least 2 hours prior.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => navigate('/patient/appointments')}
                  className="flex-1 py-5 bg-brand-dark text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs shadow-xl hover:bg-slate-800 transition-all"
                >
                  View Appointments
                </button>
                <button 
                  onClick={() => window.print()}
                  className="flex-1 py-5 bg-white border-2 border-slate-100 text-brand-dark rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
                >
                  Download Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
