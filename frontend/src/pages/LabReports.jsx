import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { TestTube, Download, Calendar, Activity, CheckCircle, Clock, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const LabReports = () => {
  const { user: currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const endpoint = currentUser.role === 'patient' ? '/patient/lab-reports' : '/receptionist/lab-reports';
      const response = await api.get(endpoint);
      if (response.data.success) {
        setReports(response.data.data.labReports);
      }
    } catch (error) {
      console.error('Failed to fetch lab reports:', error);
      toast.error('Failed to load lab reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id) => {
    try {
      const response = await api.get(`/documents/download/lab-report/${id}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lab_report_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);

      // Try to parse the error message if the response is a blob (JSON error returned as blob)
      if (error.response?.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            toast.error(errorData.message || 'Failed to download report');
          } catch (e) {
            toast.error('Failed to download report');
          }
        };
        reader.readAsText(error.response.data);
      } else {
        toast.error(error.response?.data?.message || 'Failed to download report');
      }
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
          <h1 className="text-2xl font-bold text-gray-900 font-display">Lab Reports</h1>
          <p className="text-gray-600 font-medium tracking-tight">View and track laboratory test results</p>
        </div>
        {currentUser?.role === 'receptionist' && (
          <Link
            to="/dashboard/patients"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-teal text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-teal/20 hover:bg-brand-teal/90 transition-all font-display"
          >
            <Plus className="h-4 w-4" />
            Upload New Report
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.length > 0 ? (
          reports.map((report) => (
            <div key={report._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="bg-red-100 p-3 rounded-xl shrink-0">
                  <TestTube className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {report.testName}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center ${(report.status || 'completed') === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {(report.status || 'completed') === 'completed' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                      {(report.status || 'Completed').charAt(0).toUpperCase() + (report.status || 'Completed').slice(1)}
                    </span>
                  </div>

                  <div className="mt-2 space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2 text-brand-teal" />
                      <span className="font-bold">Date:</span>&nbsp;{format(new Date(report.reportDate), 'PPP')}
                    </div>

                    {currentUser?.role === 'receptionist' && report.patientId?.userId?.profile && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Activity className="h-4 w-4 mr-2 text-brand-teal" />
                        <span className="font-bold">Patient:</span>&nbsp;
                        {report.patientId.userId.profile.firstName} {report.patientId.userId.profile.lastName}
                      </div>
                    )}

                    {report.doctorId?.userId?.profile && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Activity className="h-4 w-4 mr-2 text-brand-teal" />
                        <span className="font-bold">Ref. by:</span>&nbsp;
                        Dr. {report.doctorId.userId.profile.lastName}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                      REF ID: {report._id?.toString().slice(-8).toUpperCase()}
                    </p>
                    <button
                      onClick={() => handleDownload(report._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-light text-brand-dark rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-teal/10 transition-colors"
                    >
                      <Download className="h-4 w-4" /> Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full card p-12 text-center border-dashed">
            <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No lab reports found</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-2">
              Your test results will appear here once they are available from the laboratory.
            </p>
          </div>
        )}
      </div>

      {/* Note Card */}
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-1 flex items-center">
          <Activity className="h-4 w-4 mr-2" /> Medical Note
        </h4>
        <p className="text-sm text-blue-800 opacity-80">
          Always consult with your physician to discuss the interpretation of your laboratory results.
          Normal ranges can vary between different clinical labs.
        </p>
      </div>
    </div>
  );
};

export default LabReports;
