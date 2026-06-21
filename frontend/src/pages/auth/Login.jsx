import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldAlert } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { Input, Button } from '../../components/common';
import showToast from '../../utils/toast';

export const Login = () => {
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // UI states
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  // If user is already authenticated, redirect them
  useEffect(() => {
    if (user && !authLoading) {
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
        else if (user.role === 'teacher') navigate('/teacher/dashboard', { replace: true });
        else if (user.role === 'student') navigate('/student/dashboard', { replace: true });
      }
    }
  }, [user, authLoading, navigate, location]);

  // Client-side validations
  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      tempErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email)) {
      tempErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      tempErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setApiError('');
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email, password);
      showToast.success('Logged in successfully!');
      // Redirection is handled by the useEffect above upon user state updates
    } catch (err) {
      setApiError(err || 'Failed to authenticate. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] px-6 py-12 relative overflow-hidden select-none">
      <div className="glass-card max-w-md w-full p-8 sm:p-10 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Welcome Back
          </h2>
          <p className="text-slate-500 text-xs mt-1.5">
            Sign in to access your dashboard and assessments
          </p>
        </div>

        {apiError && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-650 rounded-lg text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input field */}
          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            error={errors.email}
            icon={Mail}
          />

          {/* Password input field */}
          <Input
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            error={errors.password}
            icon={Lock}
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            }
          />

          <Button
            type="submit"
            isLoading={loading}
            className="w-full group py-3"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-neutral-200 pt-6">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-neutral-900 hover:underline font-semibold transition-colors"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
