import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Award, FileText, Database, Search, 
  Filter, SlidersHorizontal, Info, ShieldAlert, 
  HelpCircle, ArrowUpDown 
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, Line, BarChart, 
  Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, PieChart, Pie 
} from 'recharts';
import analyticsService from '../../services/analyticsService';
import { 
  Button, Card, Table, Input, Select, Badge, EmptyState, LoadingState 
} from '../../components/common';

export const TeacherAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search, Filter, Sort for Question Accuracy
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('lowest'); // 'lowest' or 'highest'

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await analyticsService.getTeacherAnalytics();
        if (response && response.success) {
          setData(response.data);
        } else {
          setError('Failed to load analytical reports.');
        }
      } catch (err) {
        console.error('Error fetching teacher analytics:', err);
        setError('Connection to backend statistics failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingState message="Loading analytical reports..." />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">Analytics Dashboard</h1>
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-650 rounded-lg text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }

  const { questionAccuracy = [], difficultyAnalysis = [], examPerformance = [] } = data || {};

  // Compute Overall Averages
  const totalExams = examPerformance.length;
  const totalQuestions = questionAccuracy.length;
  
  const avgExamScore = totalExams > 0
    ? Math.round(examPerformance.reduce((acc, curr) => acc + curr.averageScore, 0) / totalExams)
    : 0;

  const avgQuestionAccuracy = totalQuestions > 0
    ? Math.round(questionAccuracy.reduce((acc, curr) => acc + curr.accuracy, 0) / totalQuestions)
    : 0;

  // Filter & Sort Question Accuracy data
  const filteredQuestions = questionAccuracy
    .filter((q) => {
      const matchSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDiff = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
      return matchSearch && matchDiff;
    })
    .sort((a, b) => {
      if (sortOrder === 'lowest') {
        return a.accuracy - b.accuracy;
      } else {
        return b.accuracy - a.accuracy;
      }
    });

  // Grayscale difficulty palette
  const COLORS = {
    Easy: '#737373',   // neutral-500
    Medium: '#404040', // neutral-700
    Hard: '#171717'    // neutral-900
  };

  const pieData = difficultyAnalysis.map((item) => ({
    name: item.difficulty,
    value: item.questionCount
  })).filter(item => item.value > 0);

  const headers = [
    { label: 'Question Text' },
    { label: 'Type' },
    { label: 'Difficulty' },
    { label: 'Attempts', className: 'text-center' },
    { label: 'Accuracy Rate', className: 'text-right' }
  ];

  return (
    <div className="space-y-8 select-none">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Teacher Analytics
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Review examination results, verify question success metrics and inspect difficulty curves.
        </p>
      </div>

      {totalExams === 0 && totalQuestions === 0 ? (
        <EmptyState
          title="No Historical Records"
          description="You haven't created any exams or questions that have generated submission data yet. Once students start attempts on your published exams, charts will generate analytics."
          icon={Database}
        />
      ) : (
        <>
          {/* Dashboard Stats Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hoverable={true}>
              <Card.Body className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Exams Supervised</p>
                  <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{totalExams}</h3>
                </div>
                <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
              </Card.Body>
            </Card>

            <Card hoverable={true}>
              <Card.Body className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Questions</p>
                  <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{totalQuestions}</h3>
                </div>
                <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
                  <Database className="w-5 h-5" />
                </div>
              </Card.Body>
            </Card>

            <Card hoverable={true}>
              <Card.Body className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Average Score</p>
                  <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{avgExamScore}%</h3>
                </div>
                <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
              </Card.Body>
            </Card>

            <Card hoverable={true}>
              <Card.Body className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Accuracy Rate</p>
                  <h3 className="text-3xl font-bold text-neutral-900 tracking-tight">{avgQuestionAccuracy}%</h3>
                </div>
                <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Exam Performance Line Chart */}
          {totalExams > 0 && (
            <Card>
              <Card.Body className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-5 h-5 text-neutral-800" />
                  <h3 className="text-lg font-semibold text-neutral-900">Exam Performance Comparison</h3>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={examPerformance}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="title" 
                        stroke="#6b7280" 
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(val) => val.length > 15 ? `${val.substring(0, 15)}...` : val}
                      />
                      <YAxis 
                        stroke="#6b7280" 
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{
                          background: '#ffffff',
                          borderColor: '#e5e7eb',
                          borderRadius: '8px',
                          color: '#111827',
                          fontSize: '12px',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Line 
                        type="monotone" 
                        name="Highest Score" 
                        dataKey="highestScore" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        activeDot={{ r: 6 }} 
                      />
                      <Line 
                        type="monotone" 
                        name="Average Score" 
                        dataKey="averageScore" 
                        stroke="#111111" 
                        strokeWidth={2.5}
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        name="Lowest Score" 
                        dataKey="lowestScore" 
                        stroke="#ef4444" 
                        strokeWidth={2}
                        activeDot={{ r: 6 }} 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Difficulty breakdown charts split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Average Accuracy Bar Chart */}
            <Card className="flex flex-col">
              <Card.Body className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-5 h-5 text-neutral-800" />
                  <h3 className="text-base font-semibold text-neutral-900">Average Accuracy by Difficulty</h3>
                </div>
                <div className="h-60 w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={difficultyAnalysis}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="difficulty" stroke="#6b7280" fontSize={11} tickLine={false} />
                      <YAxis 
                        domain={[0, 100]} 
                        stroke="#6b7280" 
                        fontSize={11} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Average Accuracy']}
                        contentStyle={{
                          background: '#ffffff',
                          borderColor: '#e5e7eb',
                          borderRadius: '8px',
                          color: '#111827',
                          fontSize: '12px',
                          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Bar dataKey="averageAccuracy" radius={[4, 4, 0, 0]} maxBarSize={45}>
                        {difficultyAnalysis.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.difficulty] || '#111111'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card.Body>
            </Card>

            {/* Questions volume Pie Chart */}
            <Card className="flex flex-col">
              <Card.Body className="p-6 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                  <Database className="w-5 h-5 text-neutral-800" />
                  <h3 className="text-base font-semibold text-neutral-900">Question Distribution by Difficulty</h3>
                </div>
                <div className="h-60 w-full flex-1 flex items-center justify-center relative">
                  {pieData.length === 0 ? (
                    <div className="text-xs text-neutral-500">No questions mapped.</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={80}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
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
                        <span className="text-2xl font-bold text-neutral-900">{totalQuestions}</span>
                        <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">Questions</span>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Legends Row */}
                <div className="flex items-center justify-center gap-6 pt-4 text-xs font-medium text-neutral-600">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: COLORS[item.name] }}
                      />
                      <span>{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Question Accuracy matrix section */}
          <Card>
            <Card.Body className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-neutral-800" />
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-semibold text-neutral-900">Question Accuracy List</h3>
                    <p className="text-xs text-neutral-500">Analyze accuracy percentages to spot problematic, flawed, or outstanding question units.</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 text-xs font-medium">
                  <Info className="w-4 h-4 shrink-0 text-neutral-500" />
                  <span>Sort by lowest accuracy to identify questions needing review.</span>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
                <div className="flex-1 max-w-md">
                  <Input
                    icon={Search}
                    placeholder="Search questions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* Difficulty Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-neutral-550" />
                    <Select
                      value={difficultyFilter}
                      onChange={(e) => setDifficultyFilter(e.target.value)}
                      options={[
                        { value: 'All', label: 'All Difficulties' },
                        { value: 'Easy', label: 'Easy' },
                        { value: 'Medium', label: 'Medium' },
                        { value: 'Hard', label: 'Hard' }
                      ]}
                      className="w-auto"
                    />
                  </div>

                  {/* Sort order toggle */}
                  <Button
                    onClick={() => setSortOrder(prev => prev === 'lowest' ? 'highest' : 'lowest')}
                    variant="secondary"
                    size="sm"
                    icon={ArrowUpDown}
                    className="font-medium text-neutral-700"
                  >
                    Accuracy: {sortOrder === 'lowest' ? 'Lowest First' : 'Highest First'}
                  </Button>
                </div>
              </div>

              {/* Questions Table */}
              <Table
                headers={headers}
                data={filteredQuestions}
                emptyText="No matching questions found."
                emptyIcon={HelpCircle}
                renderRow={(q) => {
                  return (
                    <tr key={q.questionId} className="hover:bg-neutral-50/80 transition-colors border-b border-neutral-100 last:border-0">
                      <td className="py-4 px-6 font-semibold text-neutral-805 max-w-sm truncate" title={q.questionText}>
                        {q.questionText}
                      </td>
                      <td className="py-4 px-6 text-neutral-500 font-medium">
                        {q.type}
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={
                          q.difficulty === 'Easy' 
                            ? 'neutral' 
                            : q.difficulty === 'Medium' 
                            ? 'info' 
                            : 'warning'
                        }>
                          {q.difficulty}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-neutral-600">
                        {q.totalAttempts}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="w-24 bg-neutral-100 rounded-full h-1.5 overflow-hidden hidden sm:block">
                            <div 
                              style={{ width: `${q.accuracy}%` }}
                              className={`h-full rounded-full ${
                                q.accuracy >= 75 
                                  ? 'bg-emerald-500' 
                                  : q.accuracy >= 50 
                                  ? 'bg-neutral-800' 
                                  : 'bg-amber-500'
                              }`}
                            />
                          </div>
                          <span className={`font-semibold ${
                            q.accuracy >= 75 
                              ? 'text-emerald-600' 
                              : q.accuracy >= 50 
                              ? 'text-neutral-850' 
                              : 'text-amber-600'
                          }`}>
                            {q.accuracy}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                }}
              />
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
};

export default TeacherAnalytics;
