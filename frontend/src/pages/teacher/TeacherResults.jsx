import React, { useState, useEffect } from 'react';
import { 
  Award, Clock, BookOpen, AlertCircle, Loader2, 
  Search, Users, TrendingUp, BarChart, Download, FileSpreadsheet 
} from 'lucide-react';
import resultsService from '../../services/resultsService';
import { Button, Card, Table, Input, Select, Badge, EmptyState } from '../../components/common';
import { exportToCSV, exportToExcel } from '../../utils/exportUtils';

export const TeacherResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const handleExportCSV = () => {
    const headers = [
      'Student Name',
      'Student Email',
      'Exam Title',
      'Subject',
      'Date Graded',
      'Obtained Marks',
      'Total Marks',
      'Percentage',
      'Grade',
      'Rank',
      'Teacher Feedback'
    ];

    const rows = filteredResults.map(res => [
      res.student?.name || 'N/A',
      res.student?.email || 'N/A',
      res.exam?.title || 'N/A',
      res.exam?.subject || 'N/A',
      formatDate(res.createdAt),
      res.obtainedMarks,
      res.exam?.totalMarks || 0,
      `${res.percentage}%`,
      res.grade,
      `#${res.rank}`,
      res.submission?.feedback || 'No comments'
    ]);

    exportToCSV(headers, rows, `Teacher_Results_${Date.now()}`);
  };

  const handleExportExcel = () => {
    const headers = [
      'Student Name',
      'Student Email',
      'Exam Title',
      'Subject',
      'Date Graded',
      'Obtained Marks',
      'Total Marks',
      'Percentage',
      'Grade',
      'Rank',
      'Teacher Feedback'
    ];

    const rows = filteredResults.map(res => [
      res.student?.name || 'N/A',
      res.student?.email || 'N/A',
      res.exam?.title || 'N/A',
      res.exam?.subject || 'N/A',
      formatDate(res.createdAt),
      res.obtainedMarks,
      res.exam?.totalMarks || 0,
      `${res.percentage}%`,
      res.grade,
      `#${res.rank}`,
      res.submission?.feedback || 'No comments'
    ]);

    exportToExcel(headers, rows, `Teacher_Results_${Date.now()}`);
  };

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await resultsService.getTeacherResults();
        if (response && response.success && response.data) {
          setResults(response.data.results || []);
        } else {
          setError('Failed to retrieve student results database.');
        }
      } catch (err) {
        console.error('Failed to fetch teacher results:', err);
        setError('Connection to backend results service failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  // Filter listings
  const filteredResults = results.filter(res => {
    const studentName = res.student?.name || '';
    const examTitle = res.exam?.title || '';
    const matchesSearch = studentName.toLowerCase().includes(search.toLowerCase()) || 
                          examTitle.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === '' || res.exam?.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  // Unique Subjects filter
  const uniqueSubjects = Array.from(new Set(results.map(r => r.exam?.subject).filter(Boolean)));

  // Core metrics for filtered list
  const totalGraded = filteredResults.length;
  
  const classAverage = totalGraded > 0
    ? Math.round(filteredResults.reduce((sum, r) => sum + r.percentage, 0) / totalGraded)
    : 0;

  const passCount = filteredResults.filter(r => r.grade !== 'F').length;
  const passRate = totalGraded > 0 ? Math.round((passCount / totalGraded) * 100) : 0;

  // Grade Counts distribution
  const gradeDistribution = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
  filteredResults.forEach(r => {
    if (gradeDistribution[r.grade] !== undefined) {
      gradeDistribution[r.grade]++;
    }
  });

  const maxGradeCount = Math.max(...Object.values(gradeDistribution), 1);

  const headers = [
    { label: 'Student' },
    { label: 'Exam Title' },
    { label: 'Subject' },
    { label: 'Date Graded' },
    { label: 'Obtained Marks' },
    { label: 'Percentage' },
    { label: 'Grade' },
    { label: 'Class Rank', className: 'text-right' }
  ];

  return (
    <div className="space-y-6 select-none animate-[fadeIn_0.25s_ease-out]">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Student Results Ledger
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor academic standing metrics, grade allocations, and evaluate overall student performance.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Analytics Summary Panels: Metrics & Charts */}
      {loading ? (
        <div className="min-h-[20vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-neutral-950 animate-spin" />
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          title="No graded evaluations"
          description="Academic score charts and standings ledger will be available once student assessments are completed and evaluated."
          icon={Award}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* Left Column: Core Stats Cards */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Total Graded */}
            <Card hoverable={true} className="flex-1">
              <Card.Body className="p-6 flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Submissions Graded</p>
                  <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{totalGraded} Students</h3>
                </div>
                <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </Card.Body>
            </Card>

            {/* Class Average percentage */}
            <Card hoverable={true} className="flex-1">
              <Card.Body className="p-6 flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Class Average</p>
                  <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{classAverage}%</h3>
                </div>
                <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </Card.Body>
            </Card>

            {/* Passing Rate percentage */}
            <Card hoverable={true} className="flex-1">
              <Card.Body className="p-6 flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Passing Rate</p>
                  <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{passRate}%</h3>
                </div>
                <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl">
                  <Award className="w-6 h-6" />
                </div>
              </Card.Body>
            </Card>

          </div>

          {/* Right Column: Grade Distribution CSS Chart */}
          <Card hoverable={false} className="lg:col-span-3">
            <Card.Body className="p-6 flex flex-col justify-between h-full">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-neutral-500" />
                  <span>Grade Allocation Distribution</span>
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Represents grade bounds counts of matching student performances.
                </p>
              </div>

              <div className="mt-4 space-y-3.5 flex-1 flex flex-col justify-center">
                {Object.entries(gradeDistribution).map(([grade, count]) => {
                  const widthPct = Math.max(10, Math.round((count / maxGradeCount) * 100));
                  
                  return (
                    <div key={grade} className="flex items-center gap-4 text-xs font-semibold">
                      <span className="w-6 text-neutral-500">{grade}</span>
                      <div className="flex-1 bg-neutral-100 h-5 rounded-md overflow-hidden relative border border-neutral-200">
                        <div 
                          style={{ width: `${widthPct}%` }}
                          className={`h-full rounded-md transition-all duration-500 ${
                            grade === 'A+' || grade === 'A'
                              ? 'bg-neutral-900'
                              : grade === 'B' || grade === 'C'
                              ? 'bg-neutral-700'
                              : grade === 'D'
                              ? 'bg-neutral-500'
                              : 'bg-neutral-400'
                          }`}
                        />
                      </div>
                      <span className="w-12 text-neutral-600 text-right">{count} Students</span>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>

        </div>
      )}

      {/* Filter and Search Bar controls */}
      {!loading && results.length > 0 && (
        <>
          <Card hoverable={false}>
            <Card.Body className="p-4 flex flex-col md:flex-row items-center gap-4">
              <div className="w-full md:flex-1">
                <Input
                  icon={Search}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by student name or exam title..."
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                <Select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  options={[{ value: '', label: 'All Subjects' }, ...uniqueSubjects.map(s => ({ value: s, label: s }))]}
                  className="w-full md:w-44"
                />

                {(search !== '' || subjectFilter !== '') && (
                  <Button
                    onClick={() => { setSearch(''); setSubjectFilter(''); }}
                    variant="secondary"
                    size="md"
                    className="w-full sm:w-auto"
                  >
                    Clear
                  </Button>
                )}

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleExportCSV}
                    icon={Download}
                    size="md"
                    className="w-full sm:w-auto text-xs py-2 px-3 h-10"
                    title="Export Results CSV"
                  >
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportExcel}
                    icon={FileSpreadsheet}
                    size="md"
                    className="w-full sm:w-auto text-xs py-2 px-3 h-10"
                    title="Export Results Excel"
                  >
                    Excel
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Results Table */}
          <Table
            headers={headers}
            data={filteredResults}
            emptyText="No ledger rows match your current search details."
            emptyIcon={Award}
            renderRow={(res) => (
              <tr key={res._id} className="hover:bg-neutral-50/50 transition-colors">
                <td className="py-4 px-6 font-medium">
                  <div className="space-y-0.5">
                    <span className="font-bold text-neutral-900 block">{res.student?.name}</span>
                    <span className="text-[10px] text-neutral-500 block leading-none">{res.student?.email}</span>
                  </div>
                </td>
                <td className="py-4 px-6 font-semibold text-neutral-900 truncate max-w-xs">{res.exam?.title}</td>
                <td className="py-4 px-6">
                  <Badge variant="neutral">
                    {res.exam?.subject}
                  </Badge>
                </td>
                <td className="py-4 px-6 text-xs text-neutral-500">{formatDate(res.createdAt)}</td>
                <td className="py-4 px-6 text-neutral-805">
                  {res.obtainedMarks} / {res.exam?.totalMarks}
                </td>
                <td className="py-4 px-6 font-semibold">
                  <Badge variant={
                    res.percentage >= 80 
                      ? 'success' 
                      : res.percentage >= 60 
                      ? 'info'
                      : 'warning'
                  }>
                    {res.percentage}%
                  </Badge>
                </td>
                <td className="py-4 px-6">
                  <Badge variant="neutral">
                    {res.grade}
                  </Badge>
                </td>
                <td className="py-4 px-6 text-right font-bold text-neutral-500">
                  #{res.rank}
                </td>
              </tr>
            )}
          />
        </>
      )}
    </div>
  );
};

export default TeacherResults;
