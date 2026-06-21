import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, FileText, Clock, Award, Calendar, ChevronRight, AlertCircle, 
  Sparkles, CheckCircle2, Lock, Eye, AlertTriangle, BookOpen, Loader2
} from 'lucide-react';
import examService from '../../services/examService';
import submissionService from '../../services/submissionService';
import resultsService from '../../services/resultsService';
import { Card, Button, Input, CardSkeleton } from '../../components/common';
import showToast from '../../utils/toast';

export const StudentExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [results, setResults] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'upcoming' | 'active' | 'completed'

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [examsRes, subsRes, resultsRes] = await Promise.all([
        examService.getExams(),
        submissionService.getMySubmissions(),
        resultsService.getStudentResults()
      ]);
      
      if (examsRes && examsRes.success) {
        setExams(examsRes.data.exams || []);
      } else {
        setError('Failed to fetch published exams list.');
      }

      if (subsRes && subsRes.success) {
        setSubmissions(subsRes.data || []);
      }

      if (resultsRes && resultsRes.success) {
        setResults(resultsRes.data.results || []);
      }
    } catch (err) {
      console.error('Error fetching student exam center data:', err);
      setError('Could not connect to assessment services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Anytime';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const now = new Date();

  // Process and categorize exams
  const categorizedExams = exams.map(exam => {
    const sub = submissions.find(s => s.exam?._id === exam._id || s.exam === exam._id);
    const res = results.find(r => r.exam?._id === exam._id || r.exam === exam._id);
    
    let category = 'active';
    const startTime = new Date(exam.startTime);
    const endTime = exam.endTime ? new Date(exam.endTime) : null;
    
    // Categorize
    if (res || (sub && (sub.status === 'submitted' || sub.status === 'graded'))) {
      category = 'completed';
    } else if (startTime > now) {
      category = 'upcoming';
    } else if (endTime && now > endTime) {
      category = 'completed'; // Missed
    } else {
      category = 'active';
    }

    return {
      ...exam,
      submission: sub,
      result: res,
      category,
      isMissed: category === 'completed' && !res && (!sub || (sub.status !== 'submitted' && sub.status !== 'graded'))
    };
  });

  // Extract unique subjects
  const subjects = ['All', ...new Set(exams.map(e => e.subject))];

  // Filter based on search, subject, and activeTab
  const filteredItems = categorizedExams.filter(item => {
    const matchesTab = item.category === activeTab;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.subject.toLowerCase().includes(search.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(search.toLowerCase()));
    const matchesSubject = selectedSubject === 'All' || item.subject === selectedSubject;
    return matchesTab && matchesSearch && matchesSubject;
  });

  // Counts for overview cards
  const upcomingCount = categorizedExams.filter(item => item.category === 'upcoming').length;
  const activeCount = categorizedExams.filter(item => item.category === 'active').length;
  const completedCount = categorizedExams.filter(item => item.category === 'completed').length;

  return (
    <div className="space-y-6 select-none">
      {/* Title Block */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Student Exam Center
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Access upcoming tests, take active assessments, and review graded reports and transcripts.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-650 rounded-lg text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card hoverable={true} onClick={() => setActiveTab('upcoming')} className={`p-5 flex items-center justify-between cursor-pointer border transition-all ${activeTab === 'upcoming' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Upcoming Exams</span>
            <h3 className="text-2xl font-bold text-neutral-900">{loading ? '...' : upcomingCount}</h3>
          </div>
          <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
        </Card>

        <Card hoverable={true} onClick={() => setActiveTab('active')} className={`p-5 flex items-center justify-between cursor-pointer border transition-all ${activeTab === 'active' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Exams</span>
            <h3 className="text-2xl font-bold text-neutral-900">{loading ? '...' : activeCount}</h3>
          </div>
          <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
        </Card>

        <Card hoverable={true} onClick={() => setActiveTab('completed')} className={`p-5 flex items-center justify-between cursor-pointer border transition-all ${activeTab === 'completed' ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200'}`}>
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completed Exams</span>
            <h3 className="text-2xl font-bold text-neutral-900">{loading ? '...' : completedCount}</h3>
          </div>
          <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Filter and search tools */}
      <Card hoverable={false} className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-8">
            <Input
              placeholder="Search by exam title, subject, or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="sm:col-span-4 flex items-center justify-end">
            <span className="text-xs text-slate-500 font-bold mr-2">Subject:</span>
            <div className="flex flex-wrap gap-1.5">
              {subjects.map(sub => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    selectedSubject === sub
                      ? 'bg-neutral-900 text-white shadow-sm'
                      : 'bg-neutral-50 hover:bg-neutral-100 text-slate-650 border border-neutral-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs navigation */}
      <div className="flex border-b border-neutral-200 gap-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors relative ${
            activeTab === 'active' ? 'text-neutral-900' : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Active Exams ({loading ? '...' : activeCount})</span>
          {activeTab === 'active' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neutral-900 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors relative ${
            activeTab === 'upcoming' ? 'text-neutral-900' : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Upcoming Exams ({loading ? '...' : upcomingCount})</span>
          {activeTab === 'upcoming' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neutral-900 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors relative ${
            activeTab === 'completed' ? 'text-neutral-900' : 'text-slate-450 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Completed Exams ({loading ? '...' : completedCount})</span>
          {activeTab === 'completed' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neutral-900 rounded-full" />
          )}
        </button>
      </div>

      {/* Grid items */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-200 rounded-xl bg-white">
          {activeTab === 'upcoming' && <Calendar className="w-10 h-10 text-neutral-400 mx-auto mb-3" />}
          {activeTab === 'active' && <Sparkles className="w-10 h-10 text-neutral-400 mx-auto mb-3" />}
          {activeTab === 'completed' && <Award className="w-10 h-10 text-neutral-400 mx-auto mb-3" />}
          <h3 className="text-sm font-bold text-neutral-900">
            {activeTab === 'upcoming' ? 'No Upcoming Schedules' : activeTab === 'active' ? 'No Active Assessments' : 'No Completed Reports'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {activeTab === 'upcoming' 
              ? 'There are no future exams scheduled in this period.' 
              : activeTab === 'active' 
              ? 'No active published exams match your directory profiles.' 
              : 'You have not submitted or missed any exams yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((exam) => {
            const isStarted = exam.submission?.status === 'started';
            
            return (
              <Card 
                key={exam._id} 
                hoverable={true} 
                className="p-6 flex flex-col justify-between transition-all group bg-white border border-neutral-200"
              >
                
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border leading-none bg-neutral-100 text-neutral-800 border-neutral-250">
                      {exam.subject}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {exam.duration}m
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-neutral-900 leading-snug group-hover:underline transition-colors">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {exam.description || 'No specific directions given. Read exam guidelines carefully before starting.'}
                  </p>
                </div>

                {/* Footer and Actions */}
                <div className="mt-6 pt-4 border-t border-neutral-200 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs">
                    {activeTab === 'upcoming' && (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Starts At</span>
                        <span className="text-neutral-900 font-semibold mt-0.5">
                          {formatDate(exam.startTime)}
                        </span>
                      </div>
                    )}

                    {activeTab === 'active' && (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase text-slate-450 tracking-wider">Deadline</span>
                        <span className="text-red-600 font-semibold mt-0.5">
                          {exam.endTime ? formatDate(exam.endTime) : 'No Deadline'}
                        </span>
                      </div>
                    )}

                    {activeTab === 'completed' && (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase text-slate-450 tracking-wider">
                          {exam.isMissed ? 'Closed Window' : 'Submitted At'}
                        </span>
                        <span className="text-neutral-900 font-semibold mt-0.5">
                          {exam.isMissed 
                            ? formatDate(exam.endTime) 
                            : formatDate(exam.submission?.submitTime || exam.result?.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Status/Badge */}
                    {activeTab === 'completed' && (
                      <div>
                        {exam.result ? (
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
                            Graded
                          </span>
                        ) : exam.submission?.status === 'submitted' ? (
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded uppercase bg-warning-50 text-warning-600 border border-warning-200">
                            Pending Grading
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-bold rounded uppercase bg-red-50 text-red-600 border border-red-200">
                            Missed
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Completed summary info */}
                  {activeTab === 'completed' && exam.result && (
                    <div className="text-xs font-bold text-neutral-800 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 flex justify-between">
                      <span>Obtained Score:</span>
                      <span className="text-neutral-900">
                        {exam.result.obtainedMarks} / {exam.totalMarks} ({exam.result.percentage}%)
                      </span>
                    </div>
                  )}

                  {/* Buttons Row */}
                  <div className="flex gap-2 w-full pt-1">
                    {activeTab === 'upcoming' && (
                      <Button
                        disabled={true}
                        variant="secondary"
                        icon={Lock}
                        className="w-full text-xs py-2 cursor-not-allowed"
                      >
                        Starts Soon
                      </Button>
                    )}

                    {activeTab === 'active' && (
                      <Button
                        onClick={() => navigate(`/student/exams/${exam._id}/attempt`)}
                        icon={ChevronRight}
                        iconPosition="right"
                        className="w-full text-xs font-bold py-2"
                      >
                        {isStarted ? 'Resume Exam' : 'Start Exam'}
                      </Button>
                    )}

                    {activeTab === 'completed' && (
                      <div className="flex gap-2 w-full">
                        {exam.result && (
                          <Button
                            onClick={() => navigate('/student/results')}
                            variant="secondary"
                            icon={Eye}
                            className="flex-1 text-[11px] py-1.5 font-bold"
                          >
                            View Result
                          </Button>
                        )}
                        
                        {exam.result && exam.allowReview && (
                          <Button
                            onClick={() => navigate(`/student/exams/${exam.submission?._id || exam.result?.submission?._id || exam.result?.submission}/review`)}
                            variant="outline"
                            icon={BookOpen}
                            className="flex-1 text-[11px] py-1.5 font-bold"
                          >
                            Review Exam
                          </Button>
                        )}

                        {exam.submission?.status === 'submitted' && (
                          <Button
                            disabled={true}
                            variant="secondary"
                            className="w-full text-[11px] py-1.5"
                          >
                            Awaiting Evaluation
                          </Button>
                        )}

                        {exam.isMissed && (
                          <Button
                            disabled={true}
                            variant="outline"
                            className="w-full text-[11px] py-1.5"
                          >
                            Exam Expired
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentExams;
