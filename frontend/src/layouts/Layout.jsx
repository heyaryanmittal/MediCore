import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Menu,
  X,
  Home,
  Users,
  Calendar,
  FileText,
  TestTube,
  User,
  LogOut,
  Building,
  UserPlus,
  BarChart3
} from 'lucide-react';

// Rupee icon as a component so it works like any lucide icon in the sidebar
const RupeeIcon = ({ className }) => (
  <span className={`inline-flex items-center justify-center font-black leading-none ${className}`}
    style={{ fontSize: '1.1em' }}
  >
    ₹
  </span>
);

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavigationItems = () => {
    const role = user?.role;

    const baseItems = [
      {
        name: 'Dashboard',
        href: role === 'superadmin' ? '/dashboard' : `/${role}/dashboard`,
        icon: Home,
        current: location.pathname.includes('/dashboard'),
      },
    ];

    switch (role) {
      case 'superadmin':
        return [
          ...baseItems,
          {
            name: 'Create Staff',
            href: '/dashboard/create-staff',
            icon: UserPlus,
            current: location.pathname.includes('/create-staff'),
          },
          {
            name: 'Doctors',
            href: '/dashboard/doctors',
            icon: Users,
            current: location.pathname.includes('/doctors'),
          },
          {
            name: 'Patients',
            href: '/dashboard/patients',
            icon: Users,
            current: location.pathname.includes('/patients'),
          },
          {
            name: 'Receptionists',
            href: '/dashboard/staff',
            icon: Users,
            current: location.pathname.includes('/staff'),
          },
          {
            name: 'Analytics',
            href: '/dashboard/analytics',
            icon: BarChart3,
            current: location.pathname.includes('/analytics'),
          },
        ];

      case 'doctor':
        return [
          ...baseItems,
          {
            name: 'Appointments',
            href: '/doctor/appointments',
            icon: Calendar,
            current: location.pathname.includes('/appointments'),
          },
          {
            name: 'Prescriptions',
            href: '/doctor/prescriptions',
            icon: FileText,
            current: location.pathname.includes('/prescriptions'),
          },
          {
            name: 'Profile',
            href: '/doctor/profile',
            icon: User,
            current: location.pathname.includes('/profile'),
          },
        ];

      case 'receptionist':
        return [
          ...baseItems,
          {
            name: 'Appointments',
            href: '/receptionist/appointments',
            icon: Calendar,
            current: location.pathname.includes('/appointments'),
          },
          {
            name: 'Patients',
            href: '/dashboard/patients',
            icon: Users,
            current: location.pathname.includes('/patients'),
          },
          {
            name: 'Doctor Availability',
            href: '/receptionist/doctor-availability',
            icon: Calendar,
            current: location.pathname.includes('/doctor-availability'),
          },
          {
            name: 'Bills',
            href: '/receptionist/bills',
            icon: RupeeIcon,
            current: location.pathname.includes('/bills'),
          },
          {
            name: 'Lab Reports',
            href: '/receptionist/lab-reports',
            icon: TestTube,
            current: location.pathname.includes('/lab-reports'),
          },
          {
            name: 'Profile',
            href: '/receptionist/profile',
            icon: User,
            current: location.pathname.includes('/profile'),
          },
        ];

      case 'patient':
        return [
          ...baseItems,
          {
            name: 'Book Appointment',
            href: '/patient/book-appointment',
            icon: Calendar,
            current: location.pathname.includes('/book-appointment'),
          },
          {
            name: 'My Appointments',
            href: '/patient/appointments',
            icon: Calendar,
            current: location.pathname.includes('/appointments'),
          },
          {
            name: 'Bills',
            href: '/patient/bills',
            icon: RupeeIcon,
            current: location.pathname.includes('/bills'),
          },
          {
            name: 'Prescriptions',
            href: '/patient/prescriptions',
            icon: FileText,
            current: location.pathname.includes('/prescriptions'),
          },
          {
            name: 'Lab Reports',
            href: '/patient/lab-reports',
            icon: TestTube,
            current: location.pathname.includes('/lab-reports'),
          },
          {
            name: 'Profile',
            href: '/patient/profile',
            icon: User,
            current: location.pathname.includes('/profile'),
          },
        ];

      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-brand-light flex font-sans selection:bg-brand-dark selection:text-white">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar-container w-72 h-screen z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}>
        {/* Logo Section */}
        <div className="p-8 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
              <Building className="h-6 w-6 text-brand-dark" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-display">
              OrvantaHealth
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4 text-[10px] font-bold text-teal-100/40 uppercase tracking-[0.2em]">
            Menu
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`sidebar-item ${item.current ? 'active' : ''}`}
                onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 ${item.current ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout Section */}
        <div className="p-6 mt-auto border-t border-white/10 bg-white/5">
          <div className="flex items-center gap-4 mb-6 px-2">
            <div className="h-10 w-10 bg-brand-teal rounded-xl flex items-center justify-center shadow-inner border border-white/20">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">
                {user?.profile?.firstName} {user?.profile?.lastName}
              </p>
              <p className="text-xs text-teal-100/60 capitalize font-medium">
                {user?.role} Portal
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="group w-full flex items-center gap-3 px-4 py-3 text-teal-100/70 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl transition-all duration-200 font-semibold"
          >
            <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72 bg-brand-light">
        {/* Top bar - Professional and Minimal */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden lg:block">
                <h1 className="text-xl font-bold text-brand-dark font-display tracking-tight capitalize">
                  {navigationItems.find(item => item.current)?.name || 'Dashboard'}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <span>OrvantaHealth</span>
                  <span>/</span>
                  <span className="text-brand-teal">{navigationItems.find(item => item.current)?.name || 'Home'}</span>
                </div>
              </div>

              {/* Mobile Page Title */}
              <h1 className="lg:hidden text-lg font-bold text-brand-dark">
                {navigationItems.find(item => item.current)?.name || 'OrvantaHealth'}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Login Session</span>
                <span className="text-sm font-semibold text-brand-dark">
                  {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="w-10 h-10 bg-brand-light rounded-xl border border-slate-100 flex items-center justify-center text-brand-dark shadow-sm">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          <div className="animate-slide-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
