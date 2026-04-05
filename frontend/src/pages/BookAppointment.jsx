import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Calendar, Clock, User, MessageSquare, ChevronRight, ChevronLeft, CheckCircle, Upload, X, FileText } from 'lucide-react';
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
  const [availableDays, setAvailableDays] = useState([]); // e.g. ['monday', 'wednesday']
  const [patientDocuments, setPatientDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

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
      console.error('Failed to fetch doctors:', error);
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
        // Store doctor's available weekdays
        setAvailableDays(data.availability?.days || []);
        setLeaveDates(data.leaves || []);

        // Filter already-booked slots for the currently selected date
        const booked = data.bookedSlots
          .filter(slot => format(new Date(slot.date), 'yyyy-MM-dd') === selectedDate)
          .map(slot => slot.timeSlot.start);
        setBookedSlots(booked);
      }
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBook = async () => {
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      setLoading(true);
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
        const appointmentId = response.data.data.appointment._id;

        // 2. Create Payment Order
        const orderResponse = await api.post('/payments/create-order', {
          appointmentId
        });

        if (orderResponse.data.success) {
          const { orderId, amount, currency, keyId } = orderResponse.data.data;

          if (orderResponse.data.isMock) {
            // 4. Verify Payment (Mock)
            try {
              const verifyResponse = await api.post('/payments/verify', {
                razorpay_order_id: orderId,
                razorpay_payment_id: 'mock_payment_' + Date.now(),
                razorpay_signature: 'mock_signature',
                appointmentId
              });

              if (verifyResponse.data.success) {
                toast.success('Payment successful (Mock)!');
                navigate('/patient/payment-success', {
                  state: {
                    bill: verifyResponse.data.data.bill,
                    paymentId: verifyResponse.data.data.paymentId
                  }
                });
              }
            } catch (error) {
              console.error('Mock verification error:', error);
              toast.error('Payment verification failed');
              navigate('/patient/appointments');
            }
            return;
          }

          // 3. Load Razorpay and Open
          const isLoaded = await loadRazorpayScript();
          if (!isLoaded) {
            toast.error('Razorpay SDK failed to load. Are you online?');
            return;
          }

          const options = {
            key: keyId,
            amount: amount,
            currency: currency,
            name: 'MediCore',
            description: `Consultation with Dr. ${selectedDoctor.userId.profile.firstName} ${selectedDoctor.userId.profile.lastName}`,
            order_id: orderId,
            handler: async (response) => {
              try {
                // 4. Verify Payment
                const verifyResponse = await api.post('/payments/verify', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  appointmentId
                });

                if (verifyResponse.data.success) {
                  toast.success('Payment successful!');
                  navigate('/patient/payment-success', {
                    state: {
                      bill: verifyResponse.data.data.bill,
                      paymentId: response.razorpay_payment_id
                    }
                  });
                }
              } catch (error) {
                console.error('Verification error:', error);
                toast.error('Payment verification failed');
                navigate('/patient/appointments');
              }
            },
            prefill: {
              name: '', // Optionally get from auth context
              email: '',
              contact: ''
            },
            theme: {
              color: '#0d9488'
            }
          };

          const paymentObject = new window.Razorpay(options);
          paymentObject.open();
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to book appointment';
      const detailMsg = error.response?.data?.errors ? ` (${error.response.data.errors[0].msg})` : '';
      toast.error(errorMsg + detailMsg);
    } finally {
      setLoading(false);
    }
  };

  // Helper: check if a date string falls on a doctor's working day and is not a leave
  const isDateAvailable = (dateStr) => {
    if (!availableDays.length) return true; // no filter until doctor is selected
    const weekDay = format(new Date(dateStr), 'EEEE').toLowerCase();
    return availableDays.includes(weekDay) && !leaveDates.includes(dateStr);
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
      toast.success('Documents uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload some documents');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (index) => {
    setPatientDocuments(prev => prev.filter((_, i) => i !== index));
  };

  // When doctor is picked, jump to Step 2 and auto-select the first valid date
  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
    const days = doctor.availability?.days || [];
    setAvailableDays(days);
    // Find first valid date in next 28 days
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
    nextStep();
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book Appointment</h1>
        <p className="text-gray-600">Follow the steps to schedule your visit</p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-between px-4 py-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${step >= s ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 text-gray-500'
              }`}>
              {step > s ? <CheckCircle className="h-5 w-5" /> : s}
            </div>
            {s < 3 && <div className={`w-12 sm:w-24 h-0.5 mx-2 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Doctor */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Select a Doctor</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {doctors.map((doctor) => (
              <div
                key={doctor._id}
                onClick={() => handleDoctorSelect(doctor)}
                className={`card p-4 cursor-pointer hover:border-primary-500 border-2 transition-all ${selectedDoctor?._id === doctor._id ? 'border-primary-500 bg-primary-50' : 'border-transparent'
                  }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Dr. {doctor.userId.profile.firstName} {doctor.userId.profile.lastName}</h3>
                    <p className="text-sm text-gray-600">{doctor.specialization}</p>
                    <p className="mt-2 text-sm font-bold text-brand-teal">
                      Fee: ₹{doctor.consultationFee || '500'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Select Date & Time</h2>
            <button onClick={prevStep} className="text-sm text-primary-600 flex items-center hover:underline">
              <ChevronLeft className="h-4 w-4 mr-1" /> Change Doctor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Date Selection */}
            <div className="card p-4">
              <h3 className="font-medium mb-1 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary-600" /> Choose Date
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                Only Dr. {selectedDoctor?.userId?.profile?.firstName}'s working days are selectable.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[...Array(28)].map((_, i) => {
                  const date = addDays(startOfToday(), i);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const weekDay = format(date, 'EEEE').toLowerCase();
                  const isWorking = availableDays.length === 0 || availableDays.includes(weekDay);
                  const isOnLeave = leaveDates.includes(dateStr);
                  const isDisabled = !isWorking || isOnLeave;
                  const isSelected = dateStr === selectedDate;
                  const dayName = format(date, 'EEE');
                  const dayNum = format(date, 'd');

                  // Hide non-working days entirely — keeps the grid clean
                  if (!isWorking) return null;

                  return (
                    <button
                      key={i}
                      disabled={isDisabled}
                      onClick={() => { if (!isDisabled) { setSelectedDate(dateStr); setSelectedSlot(null); } }}
                      className={`flex flex-col items-center p-3 rounded-lg border transition-all ${isOnLeave
                        ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed opacity-70'
                        : isSelected
                          ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                          : 'bg-white border-gray-200 text-gray-900 hover:border-primary-400 hover:shadow'
                        }`}
                      title={isOnLeave ? 'Doctor is on leave' : ''}
                    >
                      <span className="text-xs uppercase opacity-75">{dayName}</span>
                      <span className="text-lg font-bold">{dayNum}</span>
                      {isOnLeave && <span className="text-[8px] font-bold text-red-400 mt-0.5 leading-tight">Leave</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="card p-4">
              <h3 className="font-medium mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary-600" /> Available Slots
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {selectedDoctor?.availability.timeSlots.map((slot, i) => {
                  const isBooked = bookedSlots.includes(slot.start);
                  const isSelected = selectedSlot?.start === slot.start;

                  return (
                    <button
                      key={i}
                      disabled={isBooked}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 text-sm rounded-lg border transition-all ${isSelected
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : isBooked
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-200 text-gray-900 hover:border-primary-400'
                        }`}
                    >
                      {slot.start} - {slot.end}
                    </button>
                  );
                })}
              </div>
              {selectedDoctor?.availability.timeSlots.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No slots available for this day.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={nextStep}
              disabled={!selectedSlot}
              className="btn-primary flex items-center px-8"
            >
              Continue <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Details & Confirmation */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Final Details</h2>
            <button onClick={prevStep} className="text-sm text-primary-600 flex items-center hover:underline">
              <ChevronLeft className="h-4 w-4 mr-1" /> Change Schedule
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="card p-4 bg-gray-50 border-dashed">
                <h3 className="font-medium mb-3 flex items-center text-gray-700">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-600" /> Booking Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-500">Doctor:</span>
                    <span className="font-medium">Dr. {selectedDoctor?.userId.profile.firstName} {selectedDoctor?.userId.profile.lastName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium">{format(new Date(selectedDate), 'MMMM do, yyyy')}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-500">Time:</span>
                    <span className="font-medium">{selectedSlot?.start} - {selectedSlot?.end}</span>
                  </p>
                  <div className="pt-2 mt-2 border-t border-gray-200 flex justify-between items-center text-brand-dark">
                    <span className="font-bold text-[10px] uppercase tracking-widest">Payable Amount</span>
                    <span className="text-xl font-black">₹{selectedDoctor?.consultationFee || '500'}</span>
                  </div>
                </div>
              </div>

              <div>
                {/* <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Type</label> */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setConsultationType('in-person')}
                    className={`p-3 text-sm rounded-lg border text-center transition-all ${consultationType === 'in-person' ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white'
                      }`}
                  >
                    In-Person
                  </button>
                  {/* <button
                    onClick={() => setConsultationType('video')}
                    className={`p-3 text-sm rounded-lg border text-center transition-all ${consultationType === 'video' ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white'
                      }`}
                  >
                    Video Call
                  </button> */}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="h-4 w-4 inline mr-1" /> Symptoms / Reason (Optional)
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe how you're feeling or the reason for your visit..."
                  rows={6}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              {/* Document Upload Section */}
              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Upload className="h-4 w-4 mr-2 text-primary-600" /> Medical Documents (Reports/Previous Prescriptions)
                </label>

                <div className="space-y-4">
                  <div className="flex border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-primary-400 transition-colors">
                    <label className="flex flex-col items-center justify-center w-full cursor-pointer">
                      <div className="flex flex-col items-center justify-center pt-2 pb-2">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                          {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        multiple
                        accept=".pdf,.png,.jpg,.jpeg"
                        disabled={uploading}
                      />
                    </label>
                  </div>

                  {patientDocuments.length > 0 && (
                    <div className="grid grid-cols-1 gap-2">
                      {patientDocuments.map((doc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-brand-light rounded-xl border border-brand-teal/5">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-brand-teal" />
                            <span className="text-xs font-black text-brand-dark truncate max-w-[200px]">{doc.name}</span>
                          </div>
                          <button
                            onClick={() => removeDocument(idx)}
                            className="p-1 hover:bg-white rounded-full text-red-400 transition-all"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleBook}
                  className="w-full py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all active:scale-[0.98]"
                >
                  Confirm Booking
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
