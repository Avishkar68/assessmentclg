import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Award, ShieldAlert, CheckCircle2, 
  HelpCircle, ChevronRight, MessageSquare, BookOpen, 
  Lock, Eye, AlertTriangle 
} from 'lucide-react';
import submissionService from '../../services/submissionService';
import { Card, Button, PageLoader } from '../../components/common';
import showToast from '../../utils/toast';

export const ExamReview = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmissionDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await submissionService.getSubmissionById(submissionId);
        if (response && response.success && response.data) {
          setSubmission(response.data);
        } else {
          setError('Failed to retrieve attempt review ledger.');
        }
      } catch (err) {
        console.error('Error loading submission details:', err);
        // Handle specific 403 error for review restricted
        if (err.includes?.('disabled') || err.message?.includes?.('disabled')) {
          setError('Review Access Disabled: The instructor has restricted review privileges for this exam.');
        } else {
          setError(err || 'Failed to connect to review services.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionDetails();
  }, [submissionId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  if (loading) {
    return <PageLoader message="Loading exam review data..." />;
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center select-none">
        <Card hoverable={false} className="max-w-md w-full border-red-500/20">
          <Card.Body className="p-8 flex flex-col items-center gap-4">
            <Lock className="w-12 h-12 text-red-400" />
            <h3 className="text-lg font-bold text-slate-200">Access Restricted</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
            <Button
              onClick={() => navigate('/student/results')}
              variant="secondary"
              size="sm"
              className="mt-2"
            >
              Back to Results
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const { exam, student, answers = [], score = 0, status, feedback, tabSwitchCount, fullscreenExitCount, copyPasteAttempts } = submission;
  const isPendingGrading = status === 'submitted';
  const totalQuestions = answers.length;
  const examTotalMarks = exam?.totalMarks || 1;
  const scorePercentage = Math.round((score / examTotalMarks) * 100);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 select-none">
      
      {/* Back button and page title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-neutral-200 pb-5">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/student/results')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-neutral-900 cursor-pointer font-semibold mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Results
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 font-heading">
            Review Attempt: {exam?.title}
          </h1>
          <p className="text-xs text-slate-500 capitalize font-medium">
            Subject: {exam?.subject} • Completed on {formatDate(submission.submitTime)}
          </p>
        </div>

        {/* Dynamic Badge summary based on grading status */}
        {!isPendingGrading ? (
          <div className="flex items-center gap-3.5 bg-neutral-50 border border-neutral-200 p-3 rounded-xl">
            <div className="p-2 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-lg">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Total Score</span>
              <strong className="text-neutral-900 text-sm font-bold">
                {score} <span className="text-xs text-slate-500 font-normal">/ {examTotalMarks}</span>
              </strong>
              <span className="text-[11px] font-bold text-emerald-600 ml-2 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                {scorePercentage}%
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-600 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <strong className="font-bold block uppercase tracking-wide text-[10px]">Grading Pending</strong>
              <span>Manual short answer grading in progress.</span>
            </div>
          </div>
        )}
      </div>

      {/* Security Logs Metrics */}
      <Card hoverable={false} className="p-4 bg-white border border-neutral-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span>Tab switches tracked: <strong className="text-neutral-900">{tabSwitchCount}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span>Fullscreen exits logged: <strong className="text-neutral-900">{fullscreenExitCount}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span>Copy-Paste attempts: <strong className="text-neutral-900">{copyPasteAttempts}</strong></span>
          </div>
        </div>
      </Card>

      {/* Main Review Section: list of questions */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Question Review Summary</h2>
        
        {answers.map((ans, idx) => {
          const q = ans.question;
          const isCorrect = ans.isCorrect;
          const isPendingEvaluation = ans.evaluationStatus === 'pending';

          // Determine color for the card's header border
          let borderStyle = 'border-l-neutral-200';
          let statusText = 'Not Evaluated';
          let statusColor = 'text-slate-500 bg-neutral-100 border-neutral-200';

          if (!isPendingEvaluation) {
            if (isCorrect) {
              borderStyle = 'border-l-emerald-500';
              statusText = 'Correct';
              statusColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
            } else {
              borderStyle = 'border-l-red-500';
              statusText = 'Incorrect';
              statusColor = 'text-red-600 bg-red-50 border-red-200';
            }
          } else {
            statusText = 'Pending Grading';
            statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
          }

          return (
            <Card hoverable={false} key={ans._id || idx} className={`border-l-4 ${borderStyle} overflow-hidden bg-white border border-neutral-200`}>
              <div className="p-6 space-y-6">
                
                {/* Header: Question metadata index and score details */}
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-neutral-100 border border-neutral-200 text-neutral-800 px-2 py-0.5 rounded">
                      Question {idx + 1}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-3 uppercase tracking-wider font-semibold">
                      Difficulty: <strong className="text-slate-500 font-bold">{q?.difficulty || 'N/A'}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border leading-none ${statusColor}`}>
                      {statusText}
                    </span>
                    {!isPendingEvaluation && (
                      <span className="text-xs font-bold text-neutral-900">
                        {ans.marksObtained} / {q?.marks} Marks
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text content */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-neutral-900 leading-relaxed whitespace-pre-line pr-4">
                    {q?.questionText}
                  </h3>

                  {/* Question Image if exists */}
                  {q?.questionImage && (
                    <div className="border border-neutral-200 rounded-xl overflow-hidden max-w-sm bg-neutral-50 p-2">
                      <img 
                        src={q.questionImage} 
                        alt="Question graphic" 
                        className="rounded-lg max-h-[160px] object-contain"
                      />
                    </div>
                  )}
                </div>

                {/* Answers Evaluation Display */}
                <div className="pt-4 border-t border-neutral-200 space-y-4">
                  
                  {q?.type === 'MCQ' ? (
                    /* MCQ list options options and selected status overlays */
                    <div className="space-y-2.5">
                      {q.options && q.options.map((opt, oIdx) => {
                        const isStudentSelection = ans.answerText === opt;
                        const isCorrectAnswer = q.correctAnswer === opt;
                        
                        let optStyle = 'border-neutral-200 bg-neutral-50 text-slate-600';
                        if (isCorrectAnswer) {
                          optStyle = 'border-emerald-200 bg-emerald-50 text-emerald-600 font-semibold';
                        } else if (isStudentSelection && !isCorrectAnswer) {
                          optStyle = 'border-red-200 bg-red-50 text-red-600 font-semibold';
                        }

                        return (
                          <div 
                            key={oIdx}
                            className={`p-3 border rounded-xl flex items-center justify-between gap-3 text-xs ${optStyle}`}
                          >
                            <span className="truncate pr-4">{opt}</span>
                            <div className="flex items-center gap-2 shrink-0 select-none">
                              {isCorrectAnswer && (
                                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Correct Answer
                                </span>
                              )}
                              {isStudentSelection && (
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                  isCorrectAnswer 
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                    : 'bg-red-50 border-red-200 text-red-600'
                                }`}>
                                  Your Choice
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Short Answer texts */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      
                      {/* Candidate response box */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                          Your Answer:
                        </span>
                        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl leading-relaxed text-neutral-800 min-h-[60px] whitespace-pre-line select-text">
                          {ans.answerText || <span className="italic text-slate-400">No response entered.</span>}
                        </div>
                      </div>

                      {/* Grading Expected Response reference (only if graded / review available) */}
                      {!isPendingEvaluation && (
                        <div className="space-y-1.5 animate-[fadeIn_0.15s_ease-out]">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            Expected Answer / Key:
                          </span>
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl leading-relaxed text-emerald-600 min-h-[60px] whitespace-pre-line select-text">
                            {q?.expectedAnswer || q?.correctAnswer || <span className="italic text-slate-400">No key provided.</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Individual feedback comment notes (if present) */}
                  {ans.feedback && (
                    <div className="mt-4 p-3.5 bg-neutral-50 border border-neutral-200 rounded-xl flex gap-3 text-xs">
                      <MessageSquare className="w-4.5 h-4.5 text-neutral-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-500 block tracking-wide mb-1">
                          Teacher Comments Remarks:
                        </span>
                        <p className="text-neutral-700 leading-relaxed select-text italic">
                          "{ans.feedback}"
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Bottom Overall Teacher feedback remarks card */}
      {feedback && (
        <Card hoverable={false} className="border-l-4 border-neutral-900 bg-white border border-neutral-200">
          <Card.Header>
            <Card.Title icon={MessageSquare}>Evaluation Feedback Comments</Card.Title>
          </Card.Header>
          <Card.Body className="p-6">
            <p className="text-xs text-neutral-700 leading-relaxed italic select-text whitespace-pre-line">
              "{feedback}"
            </p>
          </Card.Body>
        </Card>
      )}

    </div>
  );
};

export default ExamReview;
