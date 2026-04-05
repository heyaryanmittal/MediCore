import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Filter, MoreVertical, Eye, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const StaffManagement = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('receptionist');
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/admin/staff');
      if (response.data.success) {
        setStaff(response.data.data.staff);
      }
    } catch (error) {
      toast.error('Failed to fetch staff data');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await api.patch(`/admin/user/${userId}/status`, {
        isActive: !currentStatus
      });

      if (response.data.success) {
        toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchStaff();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.profile.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.profile.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const isReceptionist = member.role === 'receptionist';
    return matchesSearch && isReceptionist;
  });

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'receptionist': return 'bg-green-100 text-green-800';
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
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light text-brand-dark mb-4 border border-brand-dark/5">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">HR & Operations</span>
          </div>
          <h1 className="text-4xl font-extrabold text-brand-dark tracking-tight font-display mb-2">Reception Management</h1>
          <p className="text-slate-500 font-medium text-lg">Manage receptionists</p>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard/create-staff'}
          className="btn btn-primary flex items-center shadow-2xl hover:scale-105 active:scale-95 transition-all"
        >
          <UserPlus className="h-5 w-5 mr-3" />
          Add Staff Member
        </button>
      </div>

      {/* Filters */}
      <div className="card-dark group">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-brand-teal transition-colors" />
            <input
              type="text"
              placeholder="Search staff by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input bg-white/10 border-white/10 text-white placeholder:text-white/40 pl-12 focus:bg-white/20"
            />
          </div>
          <div className="md:w-64">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input bg-white/10 border-white/10 text-white focus:bg-white/20"
              disabled
            >
              <option value="receptionist" className="text-brand-dark">Receptionists</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="card overflow-hidden !p-0 border-slate-100">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Staff Member
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Authority
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Contact
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Status
                </th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Session
                </th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Users className="h-12 w-12 text-slate-200" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                        {searchTerm || filterRole !== 'all'
                          ? 'Search yielded no results'
                          : 'Database empty'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr key={member._id} className="group hover:bg-brand-light transition-colors">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-2xl bg-brand-dark flex items-center justify-center text-white font-black shadow-lg transform group-hover:scale-110 transition-transform">
                          {member.profile.firstName.charAt(0)}{member.profile.lastName.charAt(0)}
                        </div>
                        <div className="ml-5">
                          <div className="text-sm font-black text-brand-dark">
                            {member.profile.firstName} {member.profile.lastName}
                          </div>
                          <div className="text-xs font-medium text-slate-400 tracking-tighter">
                            {member.email?.toLowerCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${member.role === 'doctor' ? 'bg-brand-teal/5 text-brand-teal border-brand-teal/10' :
                        member.role === 'receptionist' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                          'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                        {member.role}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="text-xs font-bold text-slate-600 tracking-tight">
                        {member.profile.phone || '—'}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                          {member.isActive ? 'Active' : 'Locked'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {member.lastLogin
                        ? new Date(member.lastLogin).toLocaleDateString()
                        : 'New'
                      }
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedUser(member);
                            setShowUserModal(true);
                          }}
                          className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 hover:text-brand-teal transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(member._id, member.isActive)}
                          className={`p-2 rounded-lg bg-white shadow-sm border border-slate-100 transition-colors ${member.isActive ? 'text-rose-400 hover:text-rose-600' : 'text-emerald-400 hover:text-emerald-600'
                            }`}
                        >
                          {member.isActive ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal - Stylized */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md animate-fade-in" onClick={() => setShowUserModal(false)}></div>
          <div className="bg-white rounded-[2.5rem] shadow-premium w-full max-w-lg relative animate-slide-up overflow-hidden border border-slate-100">
            <div className="h-32 bg-brand-dark relative">
              <div className="absolute -bottom-10 left-10 h-24 w-24 rounded-[2rem] bg-brand-teal shadow-2xl flex items-center justify-center text-white text-3xl font-black">
                {selectedUser.profile.firstName[0]}
              </div>
            </div>
            <div className="px-10 pt-16 pb-10">
              <div className="mb-8">
                <h2 className="text-3xl font-black font-display text-brand-dark leading-none mb-2">
                  {selectedUser.profile.firstName} {selectedUser.profile.lastName}
                </h2>
                <p className="text-slate-400 font-bold tracking-widest text-xs">{selectedUser.role} • {selectedUser.email?.toLowerCase()}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-10">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone</p>
                  <p className="font-bold text-brand-dark">{selectedUser.profile.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedUser.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    <p className="font-bold text-brand-dark uppercase text-xs">{selectedUser.isActive ? 'Authorized' : 'Restricted'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Member Since</p>
                  <p className="font-bold text-brand-dark">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <button
                onClick={() => setShowUserModal(false)}
                className="btn btn-primary w-full shadow-xl"
              >
                Close Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
