import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, KeyRound, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setMessage('Password reset code sent to your email! Check your inbox.');
        setStep(2);
      } else {
        setError(res.data.message || 'Failed to send reset code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error requesting password reset');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post('/auth/reset-password', {
        email,
        resetToken,
        newPassword
      });

      if (res.data.success) {
        setMessage('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(res.data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code or password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light font-sans flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-6 group">
          <div className="h-12 w-12 bg-brand-dark rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <span className="text-3xl font-black text-brand-dark tracking-tight font-display">MediCore</span>
        </Link>
        <h2 className="text-center text-3xl font-black text-brand-dark font-display">
          {step === 1 ? 'Reset your password' : 'Enter reset code'}
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-500">
          {step === 1 
            ? 'Enter your account email to receive a 6-digit verification code' 
            : `Enter the code sent to ${email} and your new password`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-premium rounded-[2.5rem] border border-slate-100 sm:px-10">
          
          {message && (
            <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-2xl text-sm font-medium flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-2xl text-sm font-medium flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 rounded-xl transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn bg-brand-dark text-white rounded-xl py-4 font-bold text-base hover:bg-brand-teal transition-all shadow-xl hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center"
              >
                {loading ? 'Sending Code...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    maxLength="6"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 rounded-xl transition-all outline-none font-mono font-bold text-lg text-slate-800 placeholder-slate-400 tracking-widest"
                    placeholder="123456"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 rounded-xl transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                    placeholder="Minimum 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength="6"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent focus:bg-white focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 rounded-xl transition-all outline-none font-medium text-slate-800 placeholder-slate-400"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn bg-brand-dark text-white rounded-xl py-4 font-bold text-base hover:bg-brand-teal transition-all shadow-xl hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center"
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-xs font-bold text-slate-500 hover:text-brand-dark transition-colors text-center"
              >
                ← Request a new code
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-brand-dark transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
