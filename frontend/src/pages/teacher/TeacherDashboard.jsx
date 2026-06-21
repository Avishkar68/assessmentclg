import React, { useState, useEffect } from 'react';
import { Database, FileText, CheckSquare, ShieldAlert, BarChart3 } from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import { Card, CardSkeleton } from '../../components/common';

export const TeacherDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getTeacherStats();
        if (response && response.success) {
          setStats(response.data);
        } else {
          setError('Failed to load dashboard metrics.');
        }
      } catch (err) {
        console.error('Error fetching teacher stats:', err);
        setError('Connection to backend statistics failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 select-none">
        <div>
          <div className="h-8 bg-neutral-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2 mt-2 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <CardSkeleton variant="metric" />
          <CardSkeleton variant="metric" />
          <CardSkeleton variant="metric" />
        </div>

        <div className="glass-card rounded-xl p-6 sm:p-8 animate-pulse border border-neutral-200 h-72">
          <div className="h-5 bg-neutral-200 rounded w-1/3 mb-8"></div>
          <div className="h-44 bg-neutral-50 border border-neutral-200 rounded-lg flex items-end p-4 gap-4">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div key={idx} className="flex-1 bg-neutral-200 rounded-t h-2/3"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Teacher Overview
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your question banks, schedule exams, and grade pending student responses.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-650 rounded-lg text-sm">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Questions Card */}
        <Card hoverable={true}>
          <Card.Body className="p-6 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Questions Created
              </p>
              <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
                {stats?.totalQuestionsCreated ?? 0}
              </h3>
            </div>
            <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        {/* Total Exams Card */}
        <Card hoverable={true}>
          <Card.Body className="p-6 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Exams Created
              </p>
              <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
                {stats?.totalExamsCreated ?? 0}
              </h3>
            </div>
            <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        {/* Submissions Pending Evaluation Card */}
        <Card hoverable={true}>
          <Card.Body className="p-6 flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Pending Evaluations
              </p>
              <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
                {stats?.totalSubmissionsPendingEvaluation ?? 0}
              </h3>
            </div>
            <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl">
              <CheckSquare className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Class Score Distribution Chart Placeholder */}
      <Card hoverable={false}>
        <Card.Body className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-neutral-500" />
              <h3 className="text-sm font-bold text-neutral-900">
                Class Score Distributions
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">All Active Cohorts</span>
          </div>

          {/* Custom CSS Bar Chart Layout */}
          <div className="h-64 flex items-end gap-3 sm:gap-6 border-b border-neutral-200 pb-2 px-2">
            {[
              { grade: 'F (<50%)', count: 12 },
              { grade: 'D (50-60%)', count: 25 },
              { grade: 'C (60-70%)', count: 48 },
              { grade: 'B (70-80%)', count: 85 },
              { grade: 'A (80-90%)', count: 60 },
              { grade: 'A+ (>90%)', count: 32 }
            ].map((bar, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                {/* Tooltip */}
                <span className="text-[10px] font-bold text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {bar.count} students
                </span>
                {/* Bar Fill */}
                <div 
                  style={{ height: `${(bar.count / 85) * 100}%` }} 
                  className="w-full bg-neutral-900 rounded-t-md hover:bg-neutral-800 cursor-pointer transition-all duration-300"
                />
                {/* Label */}
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 group-hover:text-neutral-900 transition-colors text-center truncate w-full">
                  {bar.grade}
                </span>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
