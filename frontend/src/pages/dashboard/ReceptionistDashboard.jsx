import React, { useState, useEffect } from 'react';
import { Calendar, Users, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const ReceptionistDashboard = () => {
  const [stats, setStats] = useState({
    todaysAppointments: 0,
    newPatients: 0,
    pendingBills: 0,
    labReports: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      const startOfDay = new Date(today);
      const endOfDay = new Date(today);
      endOfDay.setDate(endOfDay.getDate() + 1);

      // Fetch appointments for today
      const appointmentsRes = await api.get('/receptionist/appointments', {
        params: { date: today }
      });
      const todaysAppointments = appointmentsRes.data.data?.appointments?.length || 0;

      // Fetch bills to count pending ones
      const billsRes = await api.get('/receptionist/bills');
      const pendingBills = billsRes.data.data?.bills?.filter(b => b.status === 'pending')?.length || 0;

      // Fetch lab reports
      const labReportsRes = await api.get('/receptionist/lab-reports');
      const labReports = labReportsRes.data.data?.labReports?.length || 0;

      // For new patients, we'll use a count from available data
      // Since there's no dedicated "new patients" endpoint, we'll show total patients
      // or you could filter by createdAt date if needed
      const newPatients = 0; // This would require a dedicated endpoint or filtering

      setStats({
        todaysAppointments,
        newPatients,
        pendingBills,
        labReports
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Receptionist Dashboard</h1>
        <p className="text-gray-600">Manage appointments and patient services</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="bg-primary-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todaysAppointments}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Bills</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingBills}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lab Reports</p>
              <p className="text-2xl font-bold text-gray-900">{stats.labReports}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Stats</p>
              <button
                onClick={fetchDashboardStats}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium mt-1"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Doctor Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="/doctors" className="btn btn-primary text-left">
            View Doctors
          </a>
          <a href="/receptionist/doctor-availability" className="btn btn-primary text-left">
            Manage Availability
          </a>
        </div>
      </div>

      <div className="card p-4 border-l-4 border-blue-500 bg-blue-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900">Live Data</h3>
            <p className="text-sm text-blue-700 mt-1">
              All statistics are fetched from the database in real-time. Use the "Refresh Data" button to update the statistics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
