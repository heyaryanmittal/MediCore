import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, FileText, TestTube, User, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalBills: 0,
    prescriptions: 0,
    labReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientStats();
  }, []);

  const fetchPatientStats = async () => {
    try {
      const [appointmentsRes, billsRes, prescriptionsRes, labReportsRes] = await Promise.all([
        api.get('/patient/appointments'),
        api.get('/patient/bills'),
        api.get('/patient/prescriptions'),
        api.get('/patient/lab-reports'),
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      setStats({
        upcomingAppointments: appointmentsRes.data.data.appointments.filter(
          apt => new Date(apt.date) >= today && apt.status !== 'cancelled'
        ).length,
        totalBills: billsRes.data.data.bills.filter(bill => bill.status !== 'paid').length,
        prescriptions: prescriptionsRes.data.data.prescriptions.length,
        labReports: labReportsRes.data.data.labReports.length,
      });
    } catch (error) {
      console.error('Failed to fetch patient stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      name: 'Book Appointment',
      description: 'Schedule a new appointment with a doctor',
      icon: Calendar,
      href: '/patient/book-appointment',
      color: 'bg-primary-500',
    },
    {
      name: 'My Appointments',
      description: 'View and manage your appointments',
      icon: Clock,
      href: '/patient/appointments',
      color: 'bg-green-500',
    },
    {
      name: 'Bills & Payments',
      description: 'View your bills and make payments',
      icon: DollarSign,
      href: '/patient/bills',
      color: 'bg-yellow-500',
    },
    {
      name: 'Prescriptions',
      description: 'Access your medical prescriptions',
      icon: FileText,
      href: '/patient/prescriptions',
      color: 'bg-purple-500',
    },
    {
      name: 'Lab Reports',
      description: 'View your laboratory test results',
      icon: TestTube,
      href: '/patient/lab-reports',
      color: 'bg-red-500',
    },
    {
      name: 'Profile',
      description: 'Update your personal information',
      icon: User,
      href: '/patient/profile',
      color: 'bg-indigo-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.profile?.firstName || 'Patient'}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 p-3 rounded-lg shrink-0">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.upcomingAppointments}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 p-3 rounded-lg shrink-0">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Bills</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBills}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg shrink-0">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.prescriptions}</p>
            </div>
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-red-100 p-3 rounded-lg shrink-0">
              <TestTube className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Lab Reports</p>
              <p className="text-2xl font-bold text-gray-900">{stats.labReports}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                to={action.href}
                className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className={`${action.color} p-2 rounded-lg shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-600 transition-colors break-words">
                    {action.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Welcome Message */}
      <div className="card bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
        <h2 className="text-lg font-semibold text-primary-900 mb-2">Welcome to MediCore!</h2>
        <p className="text-primary-700">
          Your health is our priority. Book appointments, access your medical records,
          and manage your healthcare journey all in one place. Our AI-powered chatbot
          is available 24/7 to answer your health-related questions.
        </p>
      </div>
    </div>
  );
};

export default PatientDashboard;
