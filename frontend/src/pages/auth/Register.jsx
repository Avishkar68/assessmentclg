import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldAlert, Briefcase } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { Input, Select, Button } from '../../components/common';
import showToast from '../../utils/toast';

export const Register = () => {
  const { user, register, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (!name.trim()) {
      tempErrors.name = 'Full name is required.';
    }

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

    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Please confirm your password.';
    } else if (confirmPassword !== password) {
      tempErrors.confirmPassword = 'Passwords do not match.';
    }

    if (!role) {
      tempErrors.role = 'Role is required.';
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
      await register(name, email, password, role);
      showToast.success('Account created successfully!');
      // Redirection is handled by the useEffect above upon user state updates
    } catch (err) {
      setApiError(err?.response?.data?.message || err?.message || (typeof err === 'string' ? err : '') || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] px-6 py-12 relative overflow-hidden select-none">
      <div className="glass-card max-w-md w-full p-8 sm:p-10 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Create Account
          </h2>
          <p className="text-slate-500 text-xs mt-1.5">
            Get started by registering a new platform account
          </p>
        </div>

        {apiError && (
          <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-650 rounded-lg text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name field */}
          <Input
            type="text"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            error={errors.name}
            icon={User}
          />

          {/* Email field */}
          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            error={errors.email}
            icon={Mail}
          />

          {/* Role select field */}
          <Select
            label="Platform Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            error={errors.role}
            icon={Briefcase}
            options={[
              { value: 'student', label: 'Student' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'admin', label: 'Admin' }
            ]}
          />

          {/* Password field */}
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

          {/* Confirm Password field */}
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            error={errors.confirmPassword}
            icon={Lock}
            suffix={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            }
          />

          <Button
            type="submit"
            isLoading={loading}
            className="w-full mt-2 group py-3"
          >
            <span>Sign Up</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform shrink-0" />
          </Button>
        </form>

        <div className="mt-8 text-center border-t border-neutral-200 pt-6">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-neutral-900 hover:underline font-semibold transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
