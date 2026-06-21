import React, { useState, useEffect } from 'react';
import { Users, FileText, Database, Activity, ShieldAlert, Award, TrendingUp } from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, PieChart, Pie 
} from 'recharts';
import analyticsService from '../../services/analyticsService';
import { Card, LoadingState } from '../../components/common';

export const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await analyticsService.getAdminAnalytics();
        if (response && response.success) {
          setData(response.data);
        } else {
          setError('Failed to load platform-wide metrics.');
        }
      } catch (err) {
        console.error('Error fetching admin analytics:', err);
        setError('Connection to backend statistics failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingState message="Loading platform analytics..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Platform Analytics</h1>
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const { users = {}, exams = {}, questions = {}, submissions = {} } = data || {};

  // Grayscale palette mappings
  const usersPieData = [
    { name: 'Students', value: users.student || 0, color: '#111111' }, // neutral-900
    { name: 'Teachers', value: users.teacher || 0, color: '#525252' }, // neutral-650
    { name: 'Admins', value: users.admin || 0, color: '#a3a3a3' }     // neutral-400
  ].filter(item => item.value > 0);

  const examsBarData = [
    { name: 'Draft', count: exams.draft || 0, color: '#a3a3a3' },
    { name: 'Published', count: exams.published || 0, color: '#111111' },
    { name: 'Closed', count: exams.closed || 0, color: '#ef4444' } // danger
  ];

  const submissionsBarData = [
    { name: 'Started', count: submissions.started || 0, color: '#a3a3a3' },
    { name: 'Submitted', count: submissions.submitted || 0, color: '#525252' },
    { name: 'Graded', count: submissions.graded || 0, color: '#111111' }
  ];

  const questionDiffData = [
    { name: 'Easy', count: questions.easy || 0, color: '#a3a3a3' },
    { name: 'Medium', count: questions.medium || 0, color: '#525252' },
    { name: 'Hard', count: questions.hard || 0, color: '#111111' }
  ];

  const questionTypeData = [
    { name: 'MCQ', value: questions.mcq || 0, color: '#404040' },
    { name: 'Short Answer', value: questions.shortAnswer || 0, color: '#a3a3a3' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-8 select-none">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Platform Statistics
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Monitor platform users, exams, question database volumes and evaluation statuses in real-time.
        </p>
      </div>

      {/* Overview Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <Card hoverable={true}>
          <Card.Body className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-550">Total Registrations</p>
              <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{users.total || 0}</h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        {/* Total Exams */}
        <Card hoverable={true}>
          <Card.Body className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-550">Total Exams</p>
              <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{exams.total || 0}</h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        {/* Total Questions */}
        <Card hoverable={true}>
          <Card.Body className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-550">Total Questions</p>
              <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{questions.total || 0}</h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        {/* Total Submissions */}
        <Card hoverable={true}>
          <Card.Body className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-550">Total Submissions</p>
              <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{submissions.total || 0}</h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Grid of Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* User Roles distribution Pie Chart */}
        <Card>
          <Card.Body className="p-6 flex flex-col h-full space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-neutral-800" />
              <h3 className="text-base font-semibold text-neutral-900">User Registrations Breakdown</h3>
            </div>
            <div className="h-60 w-full flex-1 flex items-center justify-center relative">
              {usersPieData.length === 0 ? (
                <div className="text-xs text-neutral-500">No users registered yet.</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={usersPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {usersPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [value, 'Users']}
                        contentStyle={{
                          background: '#ffffff',
                          borderColor: '#e5e7eb',
                          borderRadius: '8px',
                          color: '#111827',
                          fontSize: '12px',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-neutral-900">{users.total || 0}</span>
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Total</span>
                  </div>
                </>
              )}
            </div>
            {/* Legends */}
            <div className="flex items-center justify-center gap-6 pt-4 text-xs font-semibold text-neutral-500">
              {usersPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Submissions Activity Stacked Bar Chart */}
        <Card>
          <Card.Body className="p-6 flex flex-col h-full space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-neutral-800" />
              <h3 className="text-base font-semibold text-neutral-900">Assessment Submissions Flow</h3>
            </div>
            <div className="h-60 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={submissionsBarData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(value) => [value, 'Submissions']}
                    contentStyle={{
                      background: '#ffffff',
                      borderColor: '#e5e7eb',
                      borderRadius: '8px',
                      color: '#111827',
                      fontSize: '12px',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {submissionsBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

        {/* Question Bank Details Column */}
        <Card>
          <Card.Body className="p-6 flex flex-col h-full space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-neutral-800" />
              <h3 className="text-base font-semibold text-neutral-900">Question Types & Difficulty Mix</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              {/* Donut Chart: MCQ vs Short Answer */}
              <div className="flex flex-col items-center justify-center relative min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={questionTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {questionTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [value, 'Questions']}
                      contentStyle={{
                        background: '#ffffff',
                        borderColor: '#e5e7eb',
                        borderRadius: '8px',
                        color: '#111827',
                        fontSize: '12px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-bold text-neutral-800">
                    {questions.mcq + questions.shortAnswer || 0}
                  </span>
                  <span className="text-[9px] text-neutral-400 font-semibold uppercase tracking-wider">Type Ratio</span>
                </div>
              </div>

              {/* Difficulty volumes chart */}
              <div className="flex-1 flex flex-col justify-center text-xs space-y-4">
                <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Difficulty Tiers</span>
                {questionDiffData.map((tier) => {
                  const totalDiffs = questions.easy + questions.medium + questions.hard || 1;
                  const ratio = Math.round((tier.count / totalDiffs) * 100);
                  return (
                    <div key={tier.name} className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-neutral-700">
                        <span>{tier.name}</span>
                        <span>{tier.count} ({ratio}%)</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          style={{ width: `${ratio}%`, backgroundColor: tier.color }}
                          className="h-full rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Legend for question types */}
            <div className="flex justify-center gap-4 pt-4 border-t border-neutral-200 mt-4 text-[11px] font-semibold text-neutral-500">
              {questionTypeData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Exams Status breakdown Bar Chart */}
        <Card>
          <Card.Body className="p-6 flex flex-col h-full space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-neutral-800" />
              <h3 className="text-base font-semibold text-neutral-900">Exam Lifecycles Breakdown</h3>
            </div>
            <div className="h-60 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={examsBarData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    formatter={(value) => [value, 'Exams']}
                    contentStyle={{
                      background: '#ffffff',
                      borderColor: '#e5e7eb',
                      borderRadius: '8px',
                      color: '#111827',
                      fontSize: '12px',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={45}>
                    {examsBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card.Body>
        </Card>

      </div>
    </div>
  );
};

export default AdminAnalytics;
