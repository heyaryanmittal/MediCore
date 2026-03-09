import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ChatbotProvider } from './context/ChatbotContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './layouts/Layout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Landing from './pages/Landing';

// Dashboard Pages
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import ReceptionistDashboard from './pages/dashboard/ReceptionistDashboard';
import DoctorAvailability from './pages/dashboard/DoctorAvailability';
import PatientDashboard from './pages/dashboard/PatientDashboard';

// Super Admin Pages
import CreateStaff from './pages/dashboard/CreateStaff';
import StaffManagement from './pages/dashboard/StaffManagement';
import PatientManagement from './pages/dashboard/PatientManagement';
import DoctorsManagement from './pages/dashboard/DoctorsManagement';
import DetailedAnalytics from './pages/dashboard/DetailedAnalytics';

// Other Pages
import Doctors from './pages/Doctors';
import BookAppointment from './pages/BookAppointment';
import Appointments from './pages/Appointments';
import Bills from './pages/Bills';
import Prescriptions from './pages/Prescriptions';
import LabReports from './pages/LabReports';
import Profile from './pages/Profile';
import PaymentSuccess from './pages/PaymentSuccess';

// Components
import Chatbot from './components/Chatbot';

import Placeholder from './components/Placeholder';
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

            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
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

            {/* Chatbot - Available on all pages */}
            <Chatbot />
          </div>
        </Router>
      </ChatbotProvider>
    </AuthProvider>
  );
}

export default App;
