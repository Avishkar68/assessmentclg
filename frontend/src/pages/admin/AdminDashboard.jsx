import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, FileText, Database, ShieldAlert, BarChart3 } from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import { Card, CardSkeleton } from '../../components/common';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getAdminStats();
        if (response && response.success) {
          setStats(response.data);
        } else {
          setError('Failed to load dashboard metrics.');
        }
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError('Connection to backend statistics failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 select-none">
        <div>
          <div className="h-8 bg-neutral-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2 mt-2 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton variant="metric" />
          <CardSkeleton variant="metric" />
          <CardSkeleton variant="metric" />
          <CardSkeleton variant="metric" />
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 animate-pulse h-72">
          <div className="h-5 bg-neutral-200 rounded w-1/3 mb-8"></div>
          <div className="h-44 bg-neutral-50 border border-neutral-100 rounded-lg flex items-end p-4 gap-4">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx} className="flex-1 bg-neutral-250 rounded-t h-2/3"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Admin Overview
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Monitor platform performance, user registrations, and assessment databases.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students Card */}
        <Card hoverable={true}>
          <Card.Body className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Total Students
              </p>
              <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">
                {stats?.totalStudents ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        {/* Total Teachers Card */}
        <Card hoverable={true}>
          <Card.Body className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Total Teachers
              </p>
              <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">
                {stats?.totalTeachers ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        {/* Total Exams Card */}
        <Card hoverable={true}>
          <Card.Body className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Total Exams
              </p>
              <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">
                {stats?.totalExams ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        {/* Total Questions Card */}
        <Card hoverable={true}>
          <Card.Body className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Total Questions
              </p>
              <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">
                {stats?.totalQuestions ?? 0}
              </h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Activity Chart Card */}
      <Card>
        <Card.Body className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-neutral-800" />
              <h3 className="text-lg font-semibold text-neutral-900">Platform Registration Analytics</h3>
            </div>
            <span className="text-xs font-medium text-neutral-400">Last 7 Days</span>
          </div>

          {/* Custom CSS Bar Chart Layout */}
          <div className="h-64 flex items-end gap-3 sm:gap-6 border-b border-neutral-200 pb-2 px-2">
            {[
              { day: 'Mon', value: 35 },
              { day: 'Tue', value: 50 },
              { day: 'Wed', value: 45 },
              { day: 'Thu', value: 80 },
              { day: 'Fri', value: 65 },
              { day: 'Sat', value: 30 },
              { day: 'Sun', value: 95 }
            ].map((bar, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                {/* Tooltip */}
                <span className="text-[10px] font-bold text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {bar.value}
                </span>
                {/* Bar Fill */}
                <div 
                  style={{ height: `${bar.value}%` }} 
                  className="w-full bg-neutral-900 hover:bg-neutral-800 rounded-t-md cursor-pointer transition-all duration-300"
                />
                {/* Label */}
                <span className="text-xs font-semibold text-neutral-450 group-hover:text-neutral-800 transition-colors">
                  {bar.day}
                </span>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminDashboard;
