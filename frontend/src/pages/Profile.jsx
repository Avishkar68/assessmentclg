import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, User, Lock, Mail, Calendar, Shield, Eye, EyeOff, Loader2,
  BarChart2, CheckCircle2, XCircle, BookOpen, TrendingUp, Award
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import authService from '../services/authService';
import resultsService from '../services/resultsService';
import { Card, Button, Input } from '../components/common';
import showToast from '../utils/toast';

export const Profile = () => {
  const { user, updateUserLocalState } = useAuth();
  
  // File Upload states
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  // Edit Profile Form states
  const [name, setName] = useState(user?.name || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Change Password Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation states
  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  // Student statistics state
  const [results, setResults] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState({
    totalAttempts: 0,
    passedCount: 0,
    failedCount: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
  });
  const [subjectBreakdown, setSubjectBreakdown] = useState({});

  useEffect(() => {
    if (user?.role !== 'student') return;

    const fetchStudentStats = async () => {
      setLoadingStats(true);
      try {
        const response = await resultsService.getStudentResults();
        if (response && response.success && response.data) {
          const list = response.data.results || [];
          setResults(list);
          
          if (list.length > 0) {
            const total = list.length;
            const passed = list.filter(r => r.grade !== 'F').length;
            const failed = list.filter(r => r.grade === 'F').length;
            
            const percentages = list.map(r => r.percentage || 0);
            const avg = Math.round(percentages.reduce((sum, val) => sum + val, 0) / total);
            const high = Math.max(...percentages);
            const low = Math.min(...percentages);
            
            setStats({
              totalAttempts: total,
              passedCount: passed,
              failedCount: failed,
              averageScore: avg,
              highestScore: high,
              lowestScore: low
            });

            // Group by subject
            const subjectsObj = {};
            list.forEach(r => {
              const subj = r.exam?.subject || 'Other';
              if (!subjectsObj[subj]) {
                subjectsObj[subj] = [];
              }
              subjectsObj[subj].push(r.percentage || 0);
            });

            const breakdown = {};
            Object.keys(subjectsObj).forEach(subj => {
              const scores = subjectsObj[subj];
              breakdown[subj] = Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length);
            });
            setSubjectBreakdown(breakdown);
          }
        }
      } catch (err) {
        console.error('Error fetching student stats for profile:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStudentStats();
  }, [user]);

  const getInitials = (userName) => {
    if (!userName) return 'U';
    return userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleAvatarClick = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      showToast.error('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    // Validate size (2MB limit)
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      showToast.error('Image size must be less than 2MB.');
      return;
    }

    setUploading(true);
    try {
      const response = await authService.uploadProfilePicture(file);
      if (response && response.success && response.data?.user) {
        updateUserLocalState(response.data.user);
        showToast.success('Profile picture updated successfully.');
      } else {
        showToast.error('Failed to update profile picture.');
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      showToast.error(err || 'Failed to upload profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (updatingProfile) return;
    
    // Validate
    if (!name.trim()) {
      setProfileErrors({ name: 'Display name cannot be empty.' });
      return;
    }
    setProfileErrors({});

    setUpdatingProfile(true);
    try {
      const response = await authService.updateProfile(name);
      if (response && response.success && response.data?.user) {
        updateUserLocalState(response.data.user);
        showToast.success('Profile details updated successfully.');
      } else {
        showToast.error('Failed to save profile changes.');
      }
    } catch (err) {
      console.error('Error saving profile changes:', err);
      showToast.error(err || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (updatingPassword) return;

    // Validate
    const tempErrors = {};
    if (!currentPassword) {
      tempErrors.currentPassword = 'Current password is required.';
    }
    if (!newPassword) {
      tempErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 6) {
      tempErrors.newPassword = 'New password must be at least 6 characters.';
    }
    if (!confirmPassword) {
      tempErrors.confirmPassword = 'Confirmation password is required.';
    } else if (newPassword !== confirmPassword) {
      tempErrors.confirmPassword = 'New passwords do not match.';
    }

    if (Object.keys(tempErrors).length > 0) {
      setPasswordErrors(tempErrors);
      return;
    }
    setPasswordErrors({});

    setUpdatingPassword(true);
    try {
      const response = await authService.updatePassword(currentPassword, newPassword);
      if (response && response.success) {
        showToast.success('Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast.error('Failed to update password.');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      showToast.error(err || 'Failed to change password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Left Column - User Avatar & Overview */}
        <div className="lg:col-span-1 space-y-6">
          <Card hoverable={false} className="p-6 text-center flex flex-col items-center">
            {/* Avatar Section */}
            <div className="relative group cursor-pointer mb-6" onClick={handleAvatarClick}>
              <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-neutral-200 group-hover:border-neutral-400 shadow-sm transition-all duration-300 relative flex items-center justify-center bg-neutral-50">
                {uploading ? (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
                  </div>
                ) : user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-4xl font-bold text-white">
                    {getInitials(user?.name)}
                  </div>
                )}

                {/* Hover overlay (only when not uploading) */}
                {!uploading && (
                  <div className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity duration-300">
                    <Camera className="w-6 h-6 mb-1 text-white" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-200">
                      Change Photo
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Hidden Input File */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* Username and Role info */}
            <h3 className="text-lg font-bold text-neutral-900 mb-1">{user?.name}</h3>
            <p className="text-xs text-slate-500 mb-4">{user?.email}</p>
            <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-md">
              {user?.role}
            </span>

            {/* Meta summary stats info */}
            <div className="w-full border-t border-neutral-200 mt-6 pt-6 text-left space-y-4">
              <div className="flex items-center gap-3 text-slate-600 text-xs">
                <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-semibold block text-[10px]">
                    Role Privileges
                  </span>
                  <span className="text-neutral-900 font-medium capitalize">{user?.role}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-600 text-xs">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-semibold block text-[10px]">
                    Member Since
                  </span>
                  <span className="text-neutral-900 font-medium">{formatDate(user?.createdAt)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - User details form and Security Form */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Card: Personal Information */}
          <Card hoverable={false}>
            <Card.Header>
              <Card.Title icon={User}>Personal Details</Card.Title>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Email Read-only Field */}
                  <Input
                    label="Email Address (read-only)"
                    type="email"
                    value={user?.email || ''}
                    disabled={true}
                    icon={Mail}
                    className="cursor-not-allowed opacity-60"
                  />

                  {/* Display Name editable field */}
                  <Input
                    label="Display Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    icon={User}
                    error={profileErrors.name}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    isLoading={updatingProfile}
                    className="w-full sm:w-auto"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>

          {/* Card: Security Check / Password change */}
          <Card hoverable={false}>
            <Card.Header>
              <Card.Title icon={Lock}>Change Password</Card.Title>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current password field */}
                  <Input
                    label="Current Password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={Lock}
                    error={passwordErrors.currentPassword}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="text-slate-500 hover:text-slate-350 cursor-pointer focus:outline-none"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <div className="hidden md:block"></div> {/* layout aligner */}

                  {/* New password field */}
                  <Input
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={Lock}
                    error={passwordErrors.newPassword}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-slate-500 hover:text-slate-350 cursor-pointer focus:outline-none"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {/* Confirm password field */}
                  <Input
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={Lock}
                    error={passwordErrors.confirmPassword}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-slate-500 hover:text-slate-350 cursor-pointer focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    isLoading={updatingPassword}
                    variant="primary"
                    className="w-full sm:w-auto"
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>

          {user?.role === 'student' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* Card: Exam Statistics */}
              <Card hoverable={false}>
                <Card.Header>
                  <Card.Title icon={BarChart2}>Exam Statistics</Card.Title>
                </Card.Header>
                <Card.Body>
                  {loadingStats ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                      <span className="text-xs text-slate-500">Loading academic stats...</span>
                    </div>
                  ) : stats.totalAttempts === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      No exams completed yet. Take an exam to see your statistics.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Total Attempts */}
                      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-lg">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Total Attempts</span>
                          <span className="text-lg font-bold text-neutral-900">{stats.totalAttempts}</span>
                        </div>
                      </div>

                      {/* Passed Exams */}
                      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Passed</span>
                          <span className="text-lg font-bold text-emerald-600">{stats.passedCount}</span>
                        </div>
                      </div>

                      {/* Failed Exams */}
                      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-red-50 border border-red-200 text-red-650 rounded-lg">
                          <XCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Failed</span>
                          <span className="text-lg font-bold text-red-600">{stats.failedCount}</span>
                        </div>
                      </div>

                      {/* Pass Rate */}
                      <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-3">
                        <div className="p-2 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-lg">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Pass Rate</span>
                          <span className="text-lg font-bold text-neutral-900">
                            {Math.round((stats.passedCount / stats.totalAttempts) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>

              {/* Card: Performance Summary */}
              <Card hoverable={false}>
                <Card.Header>
                  <Card.Title icon={TrendingUp}>Performance Summary</Card.Title>
                </Card.Header>
                <Card.Body>
                  {loadingStats ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                      <Loader2 className="w-8 h-8 text-neutral-900 animate-spin" />
                      <span className="text-xs text-slate-500">Loading details...</span>
                    </div>
                  ) : stats.totalAttempts === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-xs">
                      No performance history available yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Overall Average */}
                      <div className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                        <div>
                          <h4 className="text-xs font-bold text-neutral-900">Average Percentage</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Across all attempted exams</p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-bold rounded-lg ${
                          stats.averageScore >= 80 
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                            : stats.averageScore >= 60 
                            ? 'bg-neutral-100 text-neutral-900 border border-neutral-200' 
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}>
                          {stats.averageScore}%
                        </span>
                      </div>

                      {/* Highest & Lowest scores */}
                      <div className="flex justify-between items-center text-[11px] text-slate-500 px-1">
                        <span>Lowest: <strong className="text-neutral-900">{stats.lowestScore}%</strong></span>
                        <span>Highest: <strong className="text-neutral-900">{stats.highestScore}%</strong></span>
                      </div>

                      {/* Subject Breakdown progress bars */}
                      <div className="space-y-3 pt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Subject Average Score</span>
                        <div className="max-h-[140px] overflow-y-auto space-y-3 pr-1">
                          {Object.keys(subjectBreakdown).map(subj => {
                            const val = subjectBreakdown[subj];
                            return (
                              <div key={subj} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="text-neutral-750">{subj}</span>
                                  <span className="text-neutral-905">{val}%</span>
                                </div>
                                <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                                  <div 
                                    style={{ width: `${val}%` }}
                                    className={`h-full rounded-full ${
                                      val >= 80 
                                        ? 'bg-emerald-500' 
                                        : val >= 60 
                                        ? 'bg-neutral-900' 
                                        : 'bg-red-500'
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};

export default Profile;
