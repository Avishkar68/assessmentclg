import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Award, CheckCircle2, ShieldAlert, 
  HelpCircle, Check, AlertTriangle 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, 
  YAxis, CartesianGrid, Tooltip 
} from 'recharts';
import analyticsService from '../../services/analyticsService';
import { Card } from '../../components/common';

export const StudentAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await analyticsService.getStudentAnalytics();
        if (response && response.success) {
          setData(response.data);
        } else {
          setError('Failed to load performance metrics.');
        }
      } catch (err) {
        console.error('Error fetching student analytics:', err);
        setError('Connection to backend statistics failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Format Dates nicely
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-neutral-200 border-t-neutral-900 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Performance Analytics</h1>
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const { strongTopics = [], weakTopics = [], progressGraphData = [] } = data || {};

  // Compute overall stats
  const totalCompleted = progressGraphData.length;
  const averagePercentage = totalCompleted > 0
    ? Math.round(progressGraphData.reduce((acc, curr) => acc + curr.percentage, 0) / totalCompleted)
    : 0;

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const details = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-neutral-200 text-xs space-y-1.5 max-w-xs">
          <p className="font-bold text-neutral-900">{details.examTitle}</p>
          <div className="flex justify-between gap-6 text-slate-500">
            <span>Subject:</span>
            <span className="font-semibold text-neutral-900">{details.subject}</span>
          </div>
          <div className="flex justify-between gap-6 text-slate-500">
            <span>Marks:</span>
            <span className="font-semibold text-neutral-900">{details.obtainedMarks} / {details.totalMarks}</span>
          </div>
          <div className="flex justify-between gap-6 text-slate-500">
            <span>Score:</span>
            <span className="font-bold text-neutral-900">{details.percentage}%</span>
          </div>
          <div className="flex justify-between gap-6 text-slate-500 pt-1 border-t border-neutral-200">
            <span>Date:</span>
            <span className="text-slate-400">{formatDate(details.date)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 select-none">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Performance Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Assess your strong subjects, track percentage progress and analyze improvement areas.
        </p>
      </div>

      {totalCompleted === 0 ? (
        /* Empty State */
        <div className="bg-white border border-dashed border-neutral-200 rounded-xl p-10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-8">
          <TrendingUp className="w-12 h-12 text-slate-400 mb-4 stroke-[1.5]" />
          <h3 className="text-sm font-bold text-neutral-900">No Analytics Available Yet</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-sm">
            You haven't completed any graded examinations. Once your exams are graded by a teacher, 
            interactive progress curves and subject breakdowns will activate here automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hoverable={true} className="p-6 flex items-center justify-between group">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Exams Completed</p>
                <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{totalCompleted}</h3>
              </div>
              <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-900 rounded-xl">
                <Award className="w-5 h-5" />
              </div>
            </Card>

            <Card hoverable={true} className="p-6 flex items-center justify-between group">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Average Percentage</p>
                <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{averagePercentage}%</h3>
              </div>
              <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-900 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </Card>

            <Card hoverable={true} className="p-6 flex items-center justify-between group">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Strong Subjects</p>
                <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{strongTopics.length}</h3>
              </div>
              <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-900 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </Card>

            <Card hoverable={true} className="p-6 flex items-center justify-between group">
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Subjects to Improve</p>
                <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{weakTopics.length}</h3>
              </div>
              <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-900 rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </Card>
          </div>

          {/* Progress Graph Panel */}
          <Card hoverable={false} className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Card.Title icon={TrendingUp}>Progress Trend</Card.Title>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={progressGraphData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#111111" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#111111" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="examTitle" 
                    stroke="#9CA3AF" 
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 15)}...` : val}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    stroke="#9CA3AF" 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#111111" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPercentage)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Strong vs Weak Subject breakdown columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Strong Areas Card */}
            <Card hoverable={false} className="p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-neutral-900">Strong Areas (≥ 70%)</h3>
                </div>
                <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Exceling
                </span>
              </div>

              {strongTopics.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-200 rounded-xl bg-neutral-50 min-h-[160px]">
                  <HelpCircle className="w-8 h-8 text-neutral-400 mb-2" />
                  <p className="text-xs font-bold text-neutral-800">No subjects above 70% average score yet.</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Keep studying and push scores higher to list them here!</p>
                </div>
              ) : (
                <div className="space-y-5 flex-1">
                  {strongTopics.map((topic, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-neutral-800 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {topic.subject}
                        </span>
                        <span className="font-bold text-emerald-600">{topic.averagePercentage}%</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                        <div 
                          style={{ width: `${topic.averagePercentage}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Weak Areas Card */}
            <Card hoverable={false} className="p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-neutral-900">Areas for Improvement (&lt; 60%)</h3>
                </div>
                <span className="text-[10px] bg-amber-50 border border-amber-200 text-amber-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Attention Required
                </span>
              </div>

              {weakTopics.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-200 rounded-xl bg-neutral-50 min-h-[160px]">
                  <Check className="w-8 h-8 text-emerald-600 mb-2" />
                  <p className="text-xs font-bold text-neutral-800">Awesome! No subjects average below 60%.</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Your general level across all modules is solid!</p>
                </div>
              ) : (
                <div className="space-y-5 flex-1">
                  {weakTopics.map((topic, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-neutral-800 flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          {topic.subject}
                        </span>
                        <span className="font-bold text-amber-600">{topic.averagePercentage}%</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                        <div 
                          style={{ width: `${topic.averagePercentage}%` }}
                          className="h-full bg-red-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentAnalytics;
