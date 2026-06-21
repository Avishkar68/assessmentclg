import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Settings, BookOpen, Users, Clock, Award, 
  Calendar, ShieldAlert, HelpCircle, Mail
} from 'lucide-react';
import examService from '../../services/examService';
import resultsService from '../../services/resultsService';
import submissionService from '../../services/submissionService';
import { Card, Table, Button, Badge, LoadingState } from '../../components/common';

export const AdminExamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchExamData = async () => {
      setLoading(true);
      setError('');
      try {
        const examResponse = await examService.getExamById(id);
        if (examResponse && examResponse.success) {
          setExam(examResponse.data);
        } else {
          setError('Failed to retrieve exam configurations.');
          setLoading(false);
          return;
        }

        const resultsResponse = await resultsService.getAdminResults();
        const gradedAttempts = resultsResponse?.success 
          ? (resultsResponse.data || []).filter(r => r.exam?._id === id)
          : [];

        let pendingAttempts = [];
        try {
          const pendingResponse = await submissionService.getPendingSubmissions();
          if (pendingResponse && pendingResponse.success) {
            const list = pendingResponse.data?.submissions || pendingResponse.data || [];
            pendingAttempts = list.filter(s => s.exam?._id === id || s.exam === id);
          }
        } catch (err) {
          console.warn('Skipping pending submissions fetch:', err);
        }

        const combinedAttempts = [
          ...gradedAttempts.map(g => ({
            id: g._id,
            studentName: g.student?.name || 'Unknown Student',
            studentEmail: g.student?.email || 'N/A',
            status: 'graded',
            score: `${g.obtainedMarks}/${g.exam?.totalMarks || examResponse.data.totalMarks}`,
            percentage: g.percentage,
            grade: g.grade,
            rank: g.rank,
            date: g.createdAt
          })),
          ...pendingAttempts.map(p => ({
            id: p._id,
            studentName: p.student?.name || 'Unknown Student',
            studentEmail: p.student?.email || 'N/A',
            status: 'pending',
            score: 'Pending Evaluation',
            percentage: null,
            grade: '-',
            rank: '-',
            date: p.submittedAt || p.updatedAt
          }))
        ];

        setAttempts(combinedAttempts);
      } catch (err) {
        console.error('Error fetching exam overview data:', err);
        setError('Could not connect to the database assessment records.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamData();
  }, [id]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'neutral',
      published: 'success',
      closed: 'danger'
    };
    return (
      <Badge variant={variants[status] || 'neutral'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return <LoadingState message="Fetching exam specifications..." />;
  }

  if (error || !exam) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4 select-none">
        <ShieldAlert className="w-12 h-12 text-red-650 mx-auto" />
        <h3 className="text-lg font-semibold text-neutral-900 font-bold">Error Occurred</h3>
        <p className="text-sm text-neutral-500">{error || 'Unable to load exam.'}</p>
        <Button onClick={() => navigate('/admin/exams')} icon={ArrowLeft}>
          Back to Exams
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none animate-[fadeIn_0.25s_ease-out]">
      {/* Go Back & Title block */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/exams')}
            className="p-2 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-xl cursor-pointer transition-colors text-neutral-500 hover:text-neutral-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                {exam.title}
              </h1>
              {getStatusBadge(exam.status)}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Course Subject: <span className="font-semibold text-neutral-800">{exam.subject}</span> • Set by: <span className="font-semibold text-neutral-700">{exam.createdBy?.name || 'Instructor'}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick stats metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <Card.Body className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-450 block">Duration</span>
              <div className="text-lg font-bold text-neutral-900">{exam.duration} mins</div>
            </div>
            <Clock className="w-5 h-5 text-neutral-400" />
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-450 block">Total Marks</span>
              <div className="text-lg font-bold text-neutral-900">{exam.totalMarks} Points</div>
            </div>
            <Award className="w-5 h-5 text-neutral-400" />
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-450 block">Question Bank</span>
              <div className="text-lg font-bold text-neutral-900">{exam.questions?.length || 0} items</div>
            </div>
            <FileText className="w-5 h-5 text-neutral-400" />
          </Card.Body>
        </Card>

        <Card>
          <Card.Body className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-450 block">Submissions</span>
              <div className="text-lg font-bold text-neutral-900">{attempts.length} attempts</div>
            </div>
            <Users className="w-5 h-5 text-neutral-400" />
          </Card.Body>
        </Card>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-neutral-200 gap-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors relative ${
            activeTab === 'overview' ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuration Overview</span>
          {activeTab === 'overview' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neutral-900 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors relative ${
            activeTab === 'questions' ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Question Pool ({exam.questions?.length || 0})</span>
          {activeTab === 'questions' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neutral-900 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors relative ${
            activeTab === 'results' ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Candidates & Scores ({attempts.length})</span>
          {activeTab === 'results' && (
            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-neutral-900 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {/* Panel 1: Configuration Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 space-y-6">
              {/* Description Card */}
              <Card>
                <Card.Body className="p-6 space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-905">Exam Instructions / Criteria</h3>
                  <p className="text-xs text-neutral-550 leading-relaxed whitespace-pre-wrap">
                    {exam.description || 'No instructions provided.'}
                  </p>
                </Card.Body>
              </Card>

              {/* Security parameters */}
              <Card>
                <Card.Body className="p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-905">Integrity & Rules Configurations</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Shuffle questions */}
                    <div className="flex justify-between items-center p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-850">Shuffle Questions</h4>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Randomize question order per student.</p>
                      </div>
                      <Badge variant={exam.shuffleQuestions ? 'success' : 'neutral'}>
                        {exam.shuffleQuestions ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    {/* Shuffle options */}
                    <div className="flex justify-between items-center p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-850">Shuffle Choices</h4>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Randomize MCQ options list order.</p>
                      </div>
                      <Badge variant={exam.shuffleOptions ? 'success' : 'neutral'}>
                        {exam.shuffleOptions ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    {/* Back nav */}
                    <div className="flex justify-between items-center p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-850">Allow Back Navigation</h4>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Students can return to past questions.</p>
                      </div>
                      <Badge variant={exam.allowBackNavigation ? 'success' : 'neutral'}>
                        {exam.allowBackNavigation ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    {/* Auto submit */}
                    <div className="flex justify-between items-center p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl">
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-850">Auto Submit</h4>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Automatically commit on timer expiry.</p>
                      </div>
                      <Badge variant={exam.autoSubmit ? 'success' : 'neutral'}>
                        {exam.autoSubmit ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    {/* Show results immediately */}
                    <div className="flex justify-between items-center p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl col-span-1 sm:col-span-2">
                      <div>
                        <h4 className="text-xs font-semibold text-neutral-850">Release Results Immediately</h4>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Students see graded sheets right away.</p>
                      </div>
                      <Badge variant={exam.showResultsImmediately ? 'success' : 'neutral'}>
                        {exam.showResultsImmediately ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>

            <div className="md:col-span-4 space-y-6">
              {/* Creator details */}
              <Card>
                <Card.Body className="p-5 space-y-3.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-450">Exam Author</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center font-semibold text-sm shadow-2xs">
                      {exam.createdBy?.name ? exam.createdBy.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'T'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">
                        {exam.createdBy?.name || 'Instructor'}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {exam.createdBy?.email || 'N/A'}
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Time window details */}
              <Card>
                <Card.Body className="p-5 space-y-3.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-450">Scheduling Window</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <div>
                        <span className="text-[10px] text-neutral-450 block">Start Time</span>
                        <span className="text-xs font-semibold text-neutral-700">{formatDate(exam.startTime)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <div>
                        <span className="text-[10px] text-neutral-450 block">End Time</span>
                        <span className="text-xs font-semibold text-neutral-700">{formatDate(exam.endTime)}</span>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        )}

        {/* Panel 2: Question Pool */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {(!exam.questions || exam.questions.length === 0) ? (
              <div className="text-center py-12 border border-dashed border-neutral-200 rounded-xl bg-white">
                <HelpCircle className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-neutral-700">No Questions Added</h4>
                <p className="text-xs text-neutral-500 mt-1">This exam does not contain any questions yet.</p>
              </div>
            ) : (
              exam.questions.map((q, idx) => (
                <Card key={q._id}>
                  <Card.Body className="p-5 space-y-4">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <span className="text-xs font-semibold text-neutral-450">Question {idx + 1}</span>
                      <div className="flex gap-2">
                        <Badge variant="neutral">
                          {q.type}
                        </Badge>
                        <Badge variant="neutral">
                          {q.difficulty}
                        </Badge>
                        <Badge variant="success">
                          {q.marks} Points
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-neutral-900 leading-relaxed">{q.questionText}</p>

                    {/* MCQ choices */}
                    {q.type === 'MCQ' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4">
                        {q.options.map((opt, oIdx) => (
                          <div 
                            key={oIdx} 
                            className={`p-3 text-xs rounded-xl border font-medium flex items-center gap-2 ${
                              opt === q.correctAnswer 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-neutral-50 border-neutral-200 text-neutral-500'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                              opt === q.correctAnswer 
                                ? 'bg-emerald-200 text-emerald-850'
                                : 'bg-neutral-200 text-neutral-500'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Short answer expected answer model */}
                    {q.type === 'Short Answer' && (
                      <div className="pl-4 border-l-2 border-neutral-900 py-1.5 space-y-1">
                        <span className="text-[10px] font-semibold uppercase text-neutral-500 tracking-wider">Model Expected Answer</span>
                        <p className="text-xs text-neutral-700 font-medium leading-relaxed">
                          {q.expectedAnswer || 'N/A'}
                        </p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Panel 3: Participant Results */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            <Table
              headers={[
                { label: 'Candidate' },
                { label: 'Date Submitted' },
                { label: 'Score Summary' },
                { label: 'Grade' },
                { label: 'Rank' },
                { label: 'Status' }
              ]}
              data={attempts}
              isLoading={false}
              emptyText="No candidates have attempted this assessment yet."
              renderRow={(attempt) => (
                <tr key={attempt.id} className="hover:bg-neutral-50/80 transition-colors border-b border-neutral-100 last:border-0">
                  {/* Candidate Info */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">
                        {attempt.studentName}
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                        {attempt.studentEmail}
                      </div>
                    </div>
                  </td>

                  {/* Submission date */}
                  <td className="py-4 px-6 text-xs text-neutral-500 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      {formatDate(attempt.date)}
                    </div>
                  </td>

                  {/* Score obtained */}
                  <td className="py-4 px-6 text-sm text-neutral-800 font-semibold whitespace-nowrap">
                    {attempt.score}
                  </td>

                  {/* Grade */}
                  <td className="py-4 px-6 text-xs font-semibold whitespace-nowrap">
                    <Badge variant={attempt.grade === 'F' ? 'danger' : attempt.grade !== '-' ? 'success' : 'neutral'}>
                      {attempt.grade}
                    </Badge>
                  </td>

                  {/* Rank */}
                  <td className="py-4 px-6 text-sm font-semibold text-neutral-850 whitespace-nowrap">
                    {attempt.rank}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    <Badge variant={attempt.status === 'graded' ? 'success' : 'warning'}>
                      {attempt.status === 'graded' ? 'Graded' : 'Pending'}
                    </Badge>
                  </td>
                </tr>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminExamDetails;
