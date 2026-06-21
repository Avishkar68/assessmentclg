import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Award, ShieldAlert, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import { Card, Button, CardSkeleton } from '../../components/common';

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getStudentStats();
        if (response && response.success) {
          setStats(response.data);
        } else {
          setError('Failed to load dashboard metrics.');
        }
      } catch (err) {
        console.error('Error fetching student stats:', err);
        setError('Connection to backend statistics failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Format Dates nicely
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="space-y-8 select-none">
        <div>
          <div className="h-8 bg-slate-800/80 rounded w-1/4 animate-pulse"></div>
          <div className="h-4 bg-slate-800/80 rounded w-1/2 mt-2 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <CardSkeleton variant="metric" />
          <CardSkeleton variant="metric" />
          <CardSkeleton variant="metric" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="h-6 bg-slate-800/80 rounded w-1/3 animate-pulse"></div>
            <CardSkeleton variant="list" />
            <CardSkeleton variant="list" />
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-slate-800/80 rounded w-1/3 animate-pulse"></div>
            <CardSkeleton variant="list" />
            <CardSkeleton variant="list" />
          </div>
        </div>
      </div>
    );
  }

  const upcomingCount = stats?.upcomingExams?.length ?? 0;
  const completedCount = stats?.completedExams?.length ?? 0;

  return (
    <div className="space-y-6 select-none">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Student Overview
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Stay on top of upcoming schedules, check previous reports, and monitor average performance metrics.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-650 rounded-lg text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Upcoming Exams Count */}
        <Card hoverable={true} className="p-6 flex items-center justify-between group">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Upcoming Exams
            </p>
            <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
              {upcomingCount}
            </h3>
          </div>
          <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-900 rounded-xl group-hover:scale-105 transition-transform duration-300">
            <Calendar className="w-5 h-5" />
          </div>
        </Card>

        {/* Completed Exams Count */}
        <Card hoverable={true} className="p-6 flex items-center justify-between group">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Completed Exams
            </p>
            <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
              {completedCount}
            </h3>
          </div>
          <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-900 rounded-xl group-hover:scale-105 transition-transform duration-300">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        {/* Average Score Gauge */}
        <Card hoverable={true} className="p-6 flex items-center justify-between group">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Average Score
            </p>
            <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
              {stats?.averageScore ? `${stats.averageScore}%` : 'N/A'}
            </h3>
          </div>
          <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-900 rounded-xl group-hover:scale-105 transition-transform duration-300">
            <Award className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Two Column Grid layout for Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Upcoming Assessments */}
        <Card hoverable={false} className="p-6 flex flex-col">
          <h3 className="text-sm font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span>Upcoming Assessments</span>
          </h3>

          {upcomingCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-neutral-200 rounded-xl bg-neutral-50">
              <Calendar className="w-8 h-8 text-neutral-400 mb-2" />
              <p className="text-xs font-bold text-neutral-750">No scheduled exams</p>
              <p className="text-[11px] text-slate-400 mt-0.5">You are fully caught up with all current classes.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {stats.upcomingExams.map((exam) => (
                <div key={exam._id} className="p-4 bg-neutral-50 border border-neutral-200 hover:border-neutral-350 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-200">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 block">
                      {exam.subject}
                    </span>
                    <h4 className="text-xs font-bold text-neutral-900">{exam.title}</h4>
                    <p className="text-[11px] text-slate-500 truncate max-w-xs">{exam.description}</p>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-[10px] text-slate-450 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exam.duration} mins
                      </span>
                      <span className="text-[10px] text-slate-450">
                        {formatDate(exam.startTime)}
                      </span>
                    </div>
                  </div>
                  {new Date(exam.startTime) > new Date() ? (
                    <Button 
                      disabled={true}
                      size="sm"
                      icon={Lock}
                      variant="secondary"
                      className="w-full sm:w-auto opacity-50 cursor-not-allowed"
                    >
                      Starts Soon
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => navigate(`/student/exams/${exam._id}/attempt`)}
                      size="sm"
                      icon={ChevronRight}
                      iconPosition="right"
                      className="w-full sm:w-auto"
                    >
                      Enter Exam
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Right Column: Completed Exams */}
        <Card hoverable={false} className="p-6 flex flex-col">
          <h3 className="text-sm font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-neutral-500" />
            <span>Graded Reports</span>
          </h3>

          {completedCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-neutral-200 rounded-xl bg-neutral-50">
              <Award className="w-8 h-8 text-neutral-400 mb-2" />
              <p className="text-xs font-bold text-neutral-750">No completed exams yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Submit assessments to view your grading sheets here.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {stats.completedExams.map((exam) => {
                const percentage = Math.round((exam.score / exam.totalPoints) * 100);
                return (
                  <div key={exam.id} className="p-4 bg-neutral-50 border border-neutral-200 hover:border-neutral-350 rounded-xl space-y-3 transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900">{exam.title}</h4>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Taken on: {formatDate(exam.date)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-neutral-900">
                          {exam.score}/{exam.totalPoints}
                        </span>
                        <span className="text-[10px] text-emerald-600 block font-bold">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress score bar */}
                    <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        style={{ width: `${percentage}%` }}
                        className={`h-1.5 rounded-full ${
                          percentage >= 80 
                            ? 'bg-emerald-500' 
                            : percentage >= 60 
                            ? 'bg-neutral-900' 
                            : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
