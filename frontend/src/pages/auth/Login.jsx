import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Building } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        toast.success('Login successful!');

        // Redirect based on role
        const user = JSON.parse(localStorage.getItem('user'));
        switch (user.role) {
          case 'superadmin':
            navigate('/dashboard');
            break;
          case 'doctor':
            navigate('/doctor/dashboard');
            break;
          case 'receptionist':
            navigate('/receptionist/dashboard');
            break;
          case 'patient':
            navigate('/patient/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      } else {
        toast.error(result.message || 'Login failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light py-12 px-4 sm:px-6 lg:px-8 selection:bg-brand-dark selection:text-white">
      <div className="max-w-md w-full animate-fade-in">
        <div className="text-center mb-10">
          <div className="mx-auto h-20 w-20 bg-brand-dark rounded-[2rem] flex items-center justify-center shadow-premium transform hover:rotate-12 transition-transform duration-300">
            <Building className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-8 text-4xl font-extrabold text-brand-dark tracking-tight font-display">
            Welcome Back
          </h2>
          <p className="mt-3 text-slate-500 font-medium tracking-wide">
            Login to access your OrvantaHealth portal
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-premium p-10 border border-slate-50 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-2 bg-brand-dark opacity-10 group-hover:opacity-100 transition-opacity duration-500"></div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input pr-12"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-brand-dark transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-brand-dark focus:ring-brand-teal border-slate-300 rounded-md transition-all cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 font-medium cursor-pointer">
                  Keep me signed in
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  className="font-semibold text-brand-teal hover:text-brand-dark transition-colors"
                  onClick={() => toast.error('Forgot password functionality not implemented yet')}
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-4 text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="loading-spinner mr-3 border-white/30 border-t-white"></div>
                    Authenticating...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                <span className="px-3 bg-white text-slate-400">or join us</span>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                to="/register"
                className="text-brand-dark font-bold hover:underline decoration-brand-teal decoration-2 underline-offset-4 transition-all"
              >
                Create a new account
              </Link>
            </div>
          </div>

          {/* Super Admin Credentials Info - Simplified for Professional look */}
          <div className="mt-8 p-6 bg-brand-light rounded-2xl border border-teal-50/50">
            <h4 className="text-xs font-bold text-brand-dark uppercase tracking-widest mb-3 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mr-2"></span>
              Demo Access
            </h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-500 mb-0.5">Admin Email</p>
                <p className="font-semibold text-brand-dark">admin@orvantahealth.com</p>
              </div>
              <div>
                <p className="text-slate-500 mb-0.5">Password</p>
                <p className="font-semibold text-brand-dark">Welcomeadmin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
