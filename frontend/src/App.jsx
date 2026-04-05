import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ChatbotProvider } from './context/ChatbotContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './layouts/Layout';

// Loading Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-brand-light">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal"></div>
  </div>
);

// Auth Pages
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Landing = lazy(() => import('./pages/Landing'));
const ContactSales = lazy(() => import('./pages/ContactSales'));

// Dashboard Pages
const SuperAdminDashboard = lazy(() => import('./pages/dashboard/SuperAdminDashboard'));
const DoctorDashboard = lazy(() => import('./pages/dashboard/DoctorDashboard'));
const ReceptionistDashboard = lazy(() => import('./pages/dashboard/ReceptionistDashboard'));
const DoctorAvailability = lazy(() => import('./pages/dashboard/DoctorAvailability'));
const PatientDashboard = lazy(() => import('./pages/dashboard/PatientDashboard'));

// Super Admin Pages
const CreateStaff = lazy(() => import('./pages/dashboard/CreateStaff'));
const StaffManagement = lazy(() => import('./pages/dashboard/StaffManagement'));
const PatientManagement = lazy(() => import('./pages/dashboard/PatientManagement'));
const DoctorsManagement = lazy(() => import('./pages/dashboard/DoctorsManagement'));
const DetailedAnalytics = lazy(() => import('./pages/dashboard/DetailedAnalytics'));
const ContactMessages = lazy(() => import('./pages/dashboard/ContactMessages'));

// Other Pages
const Doctors = lazy(() => import('./pages/Doctors'));
const BookAppointment = lazy(() => import('./pages/BookAppointment'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Bills = lazy(() => import('./pages/Bills'));
const Prescriptions = lazy(() => import('./pages/Prescriptions'));
const LabReports = lazy(() => import('./pages/LabReports'));
const Profile = lazy(() => import('./pages/Profile'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));

// Components
import Chatbot from './components/Chatbot';

function App() {
  return (
    <AuthProvider>
      <ChatbotProvider>
        <Router>
          <div className="App">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#0f766e',
                  color: '#fff',
                },
              }}
            />

            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/contact-sales" element={<ContactSales />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/doctors" element={<Doctors />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  {/* Super Admin Routes */}
                  <Route path="/dashboard" element={<ProtectedRoute roles={['superadmin']}><SuperAdminDashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/create-staff" element={<ProtectedRoute roles={['superadmin']}><CreateStaff /></ProtectedRoute>} />
                  <Route path="/dashboard/doctors" element={<ProtectedRoute roles={['superadmin']}><DoctorsManagement /></ProtectedRoute>} />
                  <Route path="/dashboard/staff" element={<ProtectedRoute roles={['superadmin']}><StaffManagement /></ProtectedRoute>} />
                  <Route path="/dashboard/patients" element={<ProtectedRoute roles={['superadmin', 'receptionist']}><PatientManagement /></ProtectedRoute>} />
                  <Route path="/dashboard/analytics" element={<ProtectedRoute roles={['superadmin']}><DetailedAnalytics /></ProtectedRoute>} />
                  <Route path="/dashboard/contact-messages" element={<ProtectedRoute roles={['superadmin']}><ContactMessages /></ProtectedRoute>} />

                  {/* Doctor Routes */}
                  <Route path="doctor/dashboard" element={<ProtectedRoute roles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
                  <Route path="doctor/appointments" element={<ProtectedRoute roles={['doctor']}><Appointments /></ProtectedRoute>} />
                  <Route path="doctor/prescriptions" element={<ProtectedRoute roles={['doctor']}><Prescriptions /></ProtectedRoute>} />
                  <Route path="doctor/profile" element={<ProtectedRoute roles={['doctor']}><Profile /></ProtectedRoute>} />

                  {/* Receptionist Routes */}
                  <Route path="receptionist/dashboard" element={<ProtectedRoute roles={['receptionist']}><ReceptionistDashboard /></ProtectedRoute>} />
                  <Route path="receptionist/appointments" element={<ProtectedRoute roles={['receptionist']}><Appointments /></ProtectedRoute>} />
                  <Route path="receptionist/bills" element={<ProtectedRoute roles={['receptionist']}><Bills /></ProtectedRoute>} />
                  <Route path="receptionist/lab-reports" element={<ProtectedRoute roles={['receptionist']}><LabReports /></ProtectedRoute>} />
                  <Route path="receptionist/doctor-availability" element={<ProtectedRoute roles={['receptionist']}><DoctorAvailability /></ProtectedRoute>} />
                  <Route path="receptionist/profile" element={<ProtectedRoute roles={['receptionist']}><Profile /></ProtectedRoute>} />

                  {/* Patient Routes */}
                  <Route path="patient/dashboard" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
                  <Route path="patient/book-appointment" element={<ProtectedRoute roles={['patient']}><BookAppointment /></ProtectedRoute>} />
                  <Route path="patient/appointments" element={<ProtectedRoute roles={['patient']}><Appointments /></ProtectedRoute>} />
                  <Route path="patient/bills" element={<ProtectedRoute roles={['patient']}><Bills /></ProtectedRoute>} />
                  <Route path="patient/prescriptions" element={<ProtectedRoute roles={['patient']}><Prescriptions /></ProtectedRoute>} />
                  <Route path="patient/lab-reports" element={<ProtectedRoute roles={['patient']}><LabReports /></ProtectedRoute>} />
                  <Route path="patient/profile" element={<ProtectedRoute roles={['patient']}><Profile /></ProtectedRoute>} />
                  <Route path="patient/payment-success" element={<ProtectedRoute roles={['patient']}><PaymentSuccess /></ProtectedRoute>} />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>

            {/* Chatbot - Available on all pages */}
            <Chatbot />
          </div>
        </Router>
      </ChatbotProvider>
    </AuthProvider>
  );
}

export default App;

