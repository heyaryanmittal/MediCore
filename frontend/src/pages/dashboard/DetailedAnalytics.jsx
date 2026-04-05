import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Users, Calendar, DollarSign, Activity,
  Download, Filter, ChevronDown, X, Layers, Target, Clock, Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

const DetailedAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [chartData, setChartData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState('users');
  const [exportFormat, setExportFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, statsRes, deptRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/system-overview'),
        api.get('/admin/department-stats')
      ]);

      if (overviewRes.data.success) {
        setAnalytics(overviewRes.data.data);
      }

      if (statsRes.data.success) {
        const trends = statsRes.data.data.appointmentTrends || [];
        const revenue = statsRes.data.data.revenueTrends || [];

        const formattedData = trends.map(t => {
          const rev = revenue.find(r => r._id === t._id);
          const date = new Date(t._id);
          return {
            day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            appointments: t.count,
            revenue: rev ? rev.total : 0,
            patients: t.count
          };
        });
        setChartData(formattedData);
      }

      if (deptRes.data.success) {
        const deptStats = deptRes.data.data.departmentStats || [];
        const colors = ['#0F3A3A', '#1E5E5E', '#00CCB4', '#a5cece', '#296767'];
        const formattedDeptData = deptStats.map((dept, index) => ({
          name: dept._id || 'General',
          value: dept.count,
          color: colors[index % colors.length]
        }));
        setDepartmentData(formattedDeptData);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to fetch real-time analytics data');
    } finally {
      setLoading(false);
    }
  };

  const appointmentStatusData = analytics?.appointmentStats?.map(stat => ({
    name: stat._id,
    value: stat.count,
    color: stat._id === 'completed' ? '#00CCB4' :
      stat._id === 'pending' ? '#a5cece' :
        stat._id === 'cancelled' ? '#ef4444' : '#1E5E5E'
  })) || [];

  const handleExport = async (e) => {
    e.preventDefault();
    setExporting(true);
    try {
      const response = await api.get(`/admin/export?type=${exportType}&format=${exportFormat}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${exportType}_report_${new Date().toISOString().split('T')[0]}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setShowExportModal(false);
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8fafa]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#0F3A3A]/20 border-t-[#0F3A3A] rounded-full animate-spin"></div>
          <div className="mt-4 text-[#0F3A3A] font-black tracking-widest text-[10px] uppercase text-center">Initalizing Analytics</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafa] p-8 pb-20 space-y-12">
      {/* Header Section - The Digital Curator Style */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[#c0c8c7]/10 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-[1px] w-8 bg-[#00CCB4]"></span>
            <span className="text-[11px] font-black text-[#00CCB4] uppercase tracking-widest">Medical Intelligence</span>
          </div>
          <h1 className="text-5xl font-black text-[#0F3A3A] font-display tracking-tight leading-none mb-2">
            Clinical Insights
          </h1>
          <p className="text-[#414848] font-medium max-w-md">
            Synthesizing hospital data into a refined editorial experience of facility performance.
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-[2.5rem] shadow-sm">
          <div className="flex bg-[#f2f4f4] rounded-[2rem] p-1">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-6 py-2.5 rounded-[1.5rem] text-xs font-black transition-all ${
                  timeRange === range 
                  ? 'bg-white text-[#0F3A3A] shadow-md' 
                  : 'text-[#717978] hover:text-[#0F3A3A]'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-br from-[#002424] to-[#0F3A3A] text-white rounded-[2rem] text-xs font-black tracking-wider hover:shadow-2xl transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg"
          >
            <Download className="h-4 w-4" />
            EXPORT DATA
          </button>
        </div>
      </div>

      {/* Key Metrics - Layering without Borders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="relative group p-8 rounded-[2.5rem] bg-white shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f2f4f4] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] font-black text-[#717978] uppercase tracking-[0.2em]">Fiscal Pulse</p>
              <div className="p-3 bg-[#f8fafa] rounded-2xl">
                <DollarSign className="h-5 w-5 text-[#0F3A3A]" />
              </div>
            </div>
            <p className="text-4xl font-black text-[#0F3A3A] font-display leading-none mb-3">
              <span className="text-sm font-bold text-[#a5cece] mr-1 italic">₹</span>
              {(analytics?.totalRevenue || 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5 pt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00CCB4]"></div>
              <span className="text-[9px] font-black text-[#00CCB4] uppercase tracking-widest leading-none">Net Verified Revenue</span>
            </div>
          </div>
        </div>

        <div className="relative group p-8 rounded-[2.5rem] bg-white shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f2f4f4] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] font-black text-[#717978] uppercase tracking-[0.2em]">Patient Records</p>
              <div className="p-3 bg-[#f8fafa] rounded-2xl">
                <Users className="h-5 w-5 text-[#0F3A3A]" />
              </div>
            </div>
            <p className="text-4xl font-black text-[#0F3A3A] font-display leading-none mb-3">
              {analytics?.totalPatients || 0}
            </p>
            <div className="flex items-center gap-1.5 pt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1E5E5E]"></div>
              <span className="text-[9px] font-black text-[#1E5E5E] uppercase tracking-widest leading-none">Active Biometric Profiles</span>
            </div>
          </div>
        </div>

        <div className="relative group p-8 rounded-[2.5rem] bg-white shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f2f4f4] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] font-black text-[#717978] uppercase tracking-[0.2em]">Daily Queue</p>
              <div className="p-3 bg-[#f8fafa] rounded-2xl">
                <Calendar className="h-5 w-5 text-[#0F3A3A]" />
              </div>
            </div>
            <p className="text-4xl font-black text-[#0F3A3A] font-display leading-none mb-3">
              {analytics?.todayAppointments || 0}
            </p>
            <div className="flex items-center gap-1.5 pt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest leading-none">In-Process Appointments</span>
            </div>
          </div>
        </div>

        <div className="relative group p-8 rounded-[2.5rem] bg-white shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f2f4f4] rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] font-black text-[#717978] uppercase tracking-[0.2em]">Human Capital</p>
              <div className="p-3 bg-[#f8fafa] rounded-2xl">
                <Target className="h-5 w-5 text-[#0F3A3A]" />
              </div>
            </div>
            <p className="text-4xl font-black text-[#0F3A3A] font-display leading-none mb-3">
              {analytics?.totalReceptionists || 0}
            </p>
            <div className="flex items-center gap-1.5 pt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500"></div>
              <span className="text-[9px] font-black text-violet-600 uppercase tracking-widest leading-none">Administrative Staff</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Trend Analysis - Line Chart with Area fill */}
        <div className="p-10 rounded-[3rem] bg-[#f2f4f4] relative overflow-hidden">
          <div className="flex justify-between items-center mb-10 relative z-10">
            <div>
              <h3 className="text-xl font-black text-[#0F3A3A] font-display">Appointment Velocity</h3>
              <p className="text-[10px] font-bold text-[#717978] uppercase tracking-[0.1em] mt-1">Comparing total vs new intake</p>
            </div>
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm text-[10px] font-black text-[#0F3A3A]">
              TIME VARIANCE ACTIVE
            </div>
          </div>
          
          <div className="h-[400px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F3A3A" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0F3A3A" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00CCB4" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#00CCB4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" stroke="#c0c8c7/20" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#717978', fontSize: 10, fontWeight: 700}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#717978', fontSize: 10, fontWeight: 700}}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  itemStyle={{ fontWeight: 900, fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="appointments" 
                  stroke="#0F3A3A" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorApp)" 
                  name="Appointments"
                />
                <Area 
                  type="monotone" 
                  dataKey="patients" 
                  stroke="#00CCB4" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorPat)" 
                  name="New Patients"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Impact - Bar Chart */}
        <div className="p-10 rounded-[3rem] bg-white shadow-sm relative">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-black text-[#0F3A3A] font-display">Fiscal Trajectory</h3>
              <p className="text-[10px] font-bold text-[#717978] uppercase tracking-[0.1em] mt-1">Aggregated daily revenue in INR</p>
            </div>
            <div className="p-1.5 bg-[#f2f4f4] rounded-full flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0F3A3A]"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#00CCB4]"></div>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="8 8" stroke="#f2f4f4" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#717978', fontSize: 10, fontWeight: 700}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#717978', fontSize: 10, fontWeight: 700}}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafa', radius: 12}}
                  contentStyle={{ borderRadius: '24px', border: 'none', padding: '16px', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#0F3A3A" 
                  radius={[12, 12, 0, 0]} 
                  name="Revenue (₹)" 
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Distribution Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
        <div className="card-soft lg:col-span-1 p-10 rounded-[3rem] bg-white">
          <h3 className="text-lg font-black text-[#0F3A3A] font-display mb-8">Outcomes Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={appointmentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {appointmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center" 
                  iconSize={10} 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-soft lg:col-span-1 p-10 rounded-[3rem] bg-white">
          <h3 className="text-lg font-black text-[#0F3A3A] font-display mb-8">Internal Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  paddingAngle={0}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-dept-${index}`} fill={entry.color} stroke="#fff" strokeWidth={4} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  align="center" 
                  iconSize={10} 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doctor Spotlight - The Digital Curator Style */}
        <div className="lg:col-span-1 bg-gradient-to-br from-[#0F3A3A] to-[#002424] rounded-[3.5rem] p-10 text-white relative overflow-hidden group shadow-2xl">
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#00CCB4]/10 rounded-full blur-3xl -mb-32 -mr-32 group-hover:scale-125 transition-transform duration-700"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                  <Star className="h-4 w-4 text-[#00CCB4] fill-[#00CCB4]" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a5cece]">Clinician of the Term</span>
              </div>
              
              {analytics?.mostConsultedDoctor?.userId?.profile ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 text-3xl font-black text-[#00CCB4]">
                      {analytics.mostConsultedDoctor.userId.profile.firstName?.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-2xl font-black font-display">Dr. {analytics.mostConsultedDoctor.userId.profile.firstName}</h4>
                      <p className="text-[11px] font-bold text-[#a5cece] uppercase tracking-widest">{analytics.mostConsultedDoctor.specialization}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="p-5 rounded-[2rem] bg-white/5 border border-white/5">
                      <p className="text-[9px] font-black text-[#a5cece] uppercase tracking-widest mb-1">Consults</p>
                      <p className="text-2xl font-black leading-none">{analytics.mostConsultedDoctor.consultationFee || 0}</p>
                    </div>
                    <div className="p-5 rounded-[2rem] bg-white/5 border border-white/5">
                      <p className="text-[9px] font-black text-[#a5cece] uppercase tracking-widest mb-1">Ward Unit</p>
                      <div className="flex items-end gap-1">
                        <p className="text-xl font-black leading-none capitalize">{analytics.mostConsultedDoctor.department}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 border border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center bg-white/5">
                  <Activity className="h-10 w-10 text-white/20 mb-4" />
                  <p className="text-sm text-white/40 font-medium">Accumulating Peer Data...</p>
                </div>
              )}
            </div>
            
            <button className="mt-12 w-full py-5 bg-white text-[#0F3A3A] rounded-[2rem] font-black text-xs tracking-widest shadow-xl hover:bg-[#00CCB4] hover:text-white transition-all transform hover:-translate-y-1">
              VIEW CLINICAL PROFILE
            </button>
          </div>
        </div>
      </div>

      {/* Export Modal - Integrated Stitch Design */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#002424]/40 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[4rem] w-full max-w-2xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] animate-scale-in">
            <div className="p-16">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-[#00CCB4]"></div>
                    <span className="text-[10px] font-black text-[#00CCB4] uppercase tracking-widest">Document Export Engine</span>
                  </div>
                  <h3 className="text-4xl font-black text-[#0F3A3A] font-display tracking-tight">Generate Report</h3>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-4 bg-[#f2f4f4] hover:bg-[#eceeee] text-[#0F3A3A] rounded-[2rem] transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleExport} className="space-y-10">
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-[#717978] uppercase tracking-[0.2em] ml-2">
                    Intellectual Category
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {id: 'users', label: 'System Users', icon: Users},
                      {id: 'patients', label: 'Patient Vitality', icon: Activity},
                      {id: 'doctors', label: 'Medical Staff', icon: Target},
                      {id: 'appointments', label: 'Flow History', icon: Calendar},
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setExportType(type.id)}
                        className={`flex items-center p-6 rounded-[2.5rem] border-2 transition-all group ${
                          exportType === type.id
                          ? 'border-[#0F3A3A] bg-[#0F3A3A] text-white'
                          : 'border-[#f2f4f4] text-[#717978] hover:border-[#0F3A3A]/20'
                        }`}
                      >
                        <type.icon className={`h-5 w-5 mr-4 ${exportType === type.id ? 'text-[#00CCB4]' : 'text-[#a5cece]'}`} />
                        <span className="font-bold tracking-tight">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black text-[#717978] uppercase tracking-[0.2em] ml-2">
                    Output Format Architecture
                  </label>
                  <div className="flex gap-4 p-2 bg-[#f2f4f4] rounded-[2.5rem]">
                    {['csv', 'pdf', 'json'].map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setExportFormat(format)}
                        className={`flex-1 py-4 rounded-[2rem] font-black text-xs transition-all tracking-widest ${
                          exportFormat === format
                          ? 'bg-white text-[#0F3A3A] shadow-lg'
                          : 'text-[#717978] hover:text-[#0F3A3A]'
                        }`}
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={exporting}
                    className="w-full py-7 bg-gradient-to-r from-[#0F3A3A] to-[#002424] text-white rounded-[2.5rem] text-sm font-black tracking-[0.25em] shadow-2xl hover:shadow-[#0F3A3A]/40 transition-all hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
                  >
                    {exporting ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-[#00CCB4]/20 border-t-[#00CCB4] rounded-full animate-spin"></div>
                        <span>PROCESSING...</span>
                      </div>
                    ) : (
                      'INITIALIZE DOWNLOAD'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedAnalytics;
