import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Search, MapPin, Star, Calendar, User, Filter, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Doctors = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('all');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      // For public route, we might need a different endpoint, 
      // but let's assume we can use the patient one or a general one.
      const response = await api.get('/patient/doctors');
      if (response.data.success) {
        setDoctors(response.data.data.doctors);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const specializations = ['all', ...new Set(doctors.map(d => d.specialization))];

  const filteredDoctors = doctors.filter(doctor => {
    const fullName = `${doctor.userId.profile.firstName} ${doctor.userId.profile.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialization = specialization === 'all' || doctor.specialization === specialization;
    return matchesSearch && matchesSpecialization;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Back Button */}
      <div className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-primary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">Find Your Doctor</h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            Search and book appointments with top-rated medical specialists at MediCore.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, specialization, or hospital..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-primary-500 outline-none appearance-none capitalize"
              >
                {specializations.map(s => (
                  <option key={s} value={s}>{s === 'all' ? 'All Specializations' : s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredDoctors.length} Doctors Available
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDoctors.map((doctor) => (
            <div key={doctor._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <User className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                      Dr. {doctor.userId.profile.firstName} {doctor.userId.profile.lastName}
                    </h3>
                    <p className="text-primary-600 font-medium text-sm">{doctor.specialization}</p>
                    <div className="flex items-center mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < Math.floor(doctor.rating.average) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`} />
                      ))}
                      <span className="text-xs text-gray-500 ml-2">({doctor.rating.count} Reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <p className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" /> MediCore General Hospital
                  </p>
                  <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" /> {doctor.availability?.days?.length || 0} days per week
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Consultation Fee</p>
                  <p className="text-lg font-bold text-gray-900">₹{doctor.consultationFee || '500'}</p>
                </div>
                {user?.role === 'receptionist' ? (
                  <Link
                    to="/receptionist/doctor-availability"
                    className="inline-flex items-center px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                  >
                    Edit Availability <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                ) : (
                  <Link
                    to={`/patient/book-appointment`}
                    className="inline-flex items-center px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-md shadow-primary-200"
                  >
                    Book Now <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                )}
              </div>
            </div>
          ))}

          {filteredDoctors.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900">No doctors found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your search filters to find what you're looking for.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Doctors;
