import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Calendar, BookOpen, AlertCircle, 
  CheckCircle2, Loader2, Award, Shield, Info, User, Check 
} from 'lucide-react';
import submissionService from '../../services/submissionService';
import { Button, Card, Input, Textarea, PageLoader, Badge } from '../../components/common';
import showToast from '../../utils/toast';

export const EvaluationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data states
  const [submission, setSubmission] = useState(null);
  const [exam, setExam] = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Grading form states
  const [evaluations, setEvaluations] = useState({}); // maps questionId to { marksObtained: number, feedback: string }
  const [overallFeedback, setOverallFeedback] = useState('');
  
  // UI states
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    const fetchSubmission = async () => {
      setLoading(true);
      setApiError('');
      try {
        const response = await submissionService.getSubmissionById(id);
        if (response && response.success && response.data) {
          const sub = response.data;
          setSubmission(sub);
          setExam(sub.exam);
          setStudent(sub.student);
          setOverallFeedback(sub.feedback || '');

          // Populate initial evaluations state
          const initialEvals = {};
          if (sub.answers && sub.answers.length > 0) {
            sub.answers.forEach(ans => {
              const qId = ans.question?._id || ans.question;
              initialEvals[qId] = {
                marksObtained: ans.marksObtained !== undefined ? ans.marksObtained : 0,
                feedback: ans.feedback || ''
              };
            });
          }
          setEvaluations(initialEvals);
        }
      } catch (err) {
        console.error('Failed to load submission details:', err);
        setApiError(err?.response?.data?.message || err?.message || (typeof err === 'string' ? err : '') || 'Failed to retrieve exam attempt data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id]);

  const handleMarksChange = (qId, val, maxMarks) => {
    const numericVal = val === '' ? '' : Number(val);
    setEvaluations(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        marksObtained: numericVal
      }
    }));

    if (formErrors[qId]) {
      setFormErrors(prev => ({ ...prev, [qId]: '' }));
    }
  };

  const handleFeedbackChange = (qId, val) => {
    setEvaluations(prev => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        feedback: val
      }
    }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // We validate marks obtained for each pending/Short Answer question
    submission.answers.forEach(ans => {
      const q = ans.question;
      if (q.type === 'Short Answer') {
        const evalItem = evaluations[q._id];
        const marks = evalItem?.marksObtained;
        const maxMarks = q.marks || 1;

        if (marks === undefined || marks === '') {
          errors[q._id] = 'Marks obtained is required.';
          isValid = false;
        } else if (isNaN(marks) || marks < 0) {
          errors[q._id] = 'Marks must be 0 or positive.';
          isValid = false;
        } else if (marks > maxMarks) {
          errors[q._id] = `Marks cannot exceed the max question limit of ${maxMarks} marks.`;
          isValid = false;
        }
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setApiError('');
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payloadEvaluations = submission.answers
        .filter(ans => ans.question?.type === 'Short Answer')
        .map(ans => {
          const qId = ans.question?._id || ans.question;
          const evalItem = evaluations[qId];
          return {
            questionId: qId,
            marksObtained: Number(evalItem.marksObtained),
            feedback: evalItem.feedback.trim()
          };
        });

      const payload = {
        evaluations: payloadEvaluations,
        overallFeedback: overallFeedback.trim()
      };

      const response = await submissionService.evaluateSubmission(id, payload);
      if (response && response.success) {
        showToast.success('Evaluation submitted successfully!');
        navigate('/teacher/evaluation');
      }
    } catch (err) {
      console.error('Manual evaluation failed:', err);
      setApiError(err?.response?.data?.message || err?.message || (typeof err === 'string' ? err : '') || 'Failed to submit evaluation details.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  if (loading) {
    return <PageLoader message="Retrieving student answers and metadata..." />;
  }

  const answersList = submission?.answers || [];
  const mcqAnswers = answersList.filter(ans => ans.question?.type === 'MCQ');
  const shortAnswerAnswers = answersList.filter(ans => ans.question?.type === 'Short Answer');

  const hasSecurityViolations = 
    (submission.tabSwitchCount || 0) > 0 || 
    (submission.fullscreenExitCount || 0) > 0 || 
    (submission.copyPasteAttempts || 0) > 0;

  return (
    <div className="space-y-6 select-none animate-[fadeIn_0.25s_ease-out]">
      
      {/* Title Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate('/teacher/evaluation')}
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          className="p-2"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Review Submission
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Grade short answer queries and review automatic MCQ scoring profiles.
          </p>
        </div>
      </div>

      {apiError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Metadata Profile & Security Violations summary split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Candidate Detail Card */}
        <Card hoverable={false}>
          <Card.Body className="p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Information</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-neutral-500" />
                <span className="text-xs font-semibold text-neutral-800">{student?.name}</span>
              </div>
              <div className="text-[10px] text-neutral-500 pl-6 leading-relaxed">
                Email: {student?.email}<br />
                Exam: {exam?.title}<br />
                Subject: {exam?.subject}
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Schedule Detail Card */}
        <Card hoverable={false}>
          <Card.Body className="p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attempt Timestamps</h4>
            <div className="space-y-2 text-[10px] text-neutral-500 leading-relaxed">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-neutral-450" />
                <span><strong>Submitted:</strong> {formatDate(submission.submitTime)}</span>
              </div>
              <div className="pl-6 space-y-1">
                <div>Started: {formatDate(submission.startTime)}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span>Status:</span>
                  <Badge variant="warning" className="uppercase text-[9px] font-bold">
                    {submission.status}
                  </Badge>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Security Logs Card */}
        <Card hoverable={false} className={hasSecurityViolations ? 'border-amber-250 bg-amber-50/[0.15]' : 'border-neutral-200'}>
          <Card.Body className="p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Proctoring Security logs</h4>
            <div className="space-y-1.5 text-[10px] leading-relaxed text-neutral-550">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-neutral-400" /> Tab Switches:</span>
                <strong className={submission.tabSwitchCount > 0 ? 'text-amber-600 font-bold' : 'text-neutral-800'}>
                  {submission.tabSwitchCount || 0} Exits
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-neutral-400" /> Fullscreen Exits:</span>
                <strong className={submission.fullscreenExitCount > 0 ? 'text-amber-600 font-bold' : 'text-neutral-800'}>
                  {submission.fullscreenExitCount || 0} Exits
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-neutral-400" /> Copy/Paste block:</span>
                <strong className={submission.copyPasteAttempts > 0 ? 'text-amber-600 font-bold' : 'text-neutral-800'}>
                  {submission.copyPasteAttempts || 0} Tries
                </strong>
              </div>
            </div>
          </Card.Body>
        </Card>

      </div>

      {/* Manual Grading Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Short Answer Questions Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-neutral-500" />
            <span>Short Answer Questions Manual Grading</span>
          </h3>

          {shortAnswerAnswers.length === 0 ? (
            <Card hoverable={false}>
              <Card.Body className="p-6 text-center text-xs text-neutral-500">
                No short answer questions exist in this exam.
              </Card.Body>
            </Card>
          ) : (
            <div className="space-y-6">
              {shortAnswerAnswers.map((ans, idx) => {
                const q = ans.question;
                const evalItem = evaluations[q._id] || { marksObtained: 0, feedback: '' };
                const error = formErrors[q._id];
                
                return (
                  <Card key={q._id} hoverable={false} className="border border-neutral-200">
                    {/* Header */}
                    <Card.Header className="bg-neutral-50 border-b border-neutral-100 p-4 flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <Badge variant="neutral">
                          Question {idx + 1}
                        </Badge>
                        <span className="text-xs text-neutral-500 font-bold block sm:inline sm:ml-3">
                          Short Answer
                        </span>
                      </div>
                      <span className="text-xs font-bold text-neutral-500">
                        Max Limit: <strong className="text-neutral-900">{q.marks} Marks</strong>
                      </span>
                    </Card.Header>

                    {/* Question and Answers Comparison grid */}
                    <Card.Body className="p-5 space-y-4">
                      {/* Text */}
                      <p className="text-xs font-semibold text-neutral-800 leading-relaxed whitespace-pre-line select-text">
                        {q.questionText}
                      </p>

                      {/* Image if present */}
                      {q.questionImage && (
                        <div className="max-w-xs border border-neutral-250 rounded bg-neutral-50 p-1">
                          <img src={q.questionImage} alt="Question helper" className="max-h-[140px] rounded object-contain" />
                        </div>
                      )}

                      {/* Student and Model answers comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-neutral-200 text-xs">
                        
                        {/* Student Answer */}
                        <div className="space-y-1.5 p-4 bg-neutral-50 border border-neutral-150 rounded-lg">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Student Response:</span>
                          <p className="text-xs leading-relaxed text-neutral-800 select-text whitespace-pre-wrap font-medium">
                            {ans.answerText || <em className="text-neutral-400">No response submitted.</em>}
                          </p>
                        </div>

                        {/* Expected Answer */}
                        <div className="space-y-1.5 p-4 bg-neutral-50 border border-neutral-150 rounded-lg">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Expected Model Answer:</span>
                          <p className="text-xs leading-relaxed text-neutral-800 select-text whitespace-pre-wrap font-medium">
                            {q.expectedAnswer || <em className="text-neutral-400">No model answer provided.</em>}
                          </p>
                        </div>
                      </div>

                      {/* Score inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-200 items-start">
                        
                        {/* Marks Assigned */}
                        <div className="sm:col-span-1">
                          <Input
                            label="Assign Marks"
                            type="number"
                            value={evalItem.marksObtained}
                            onChange={(e) => handleMarksChange(q._id, e.target.value, q.marks)}
                            placeholder="0"
                            min="0"
                            max={q.marks}
                            step="any"
                            error={error}
                          />
                        </div>

                        {/* Individual Feedback comment */}
                        <div className="sm:col-span-3">
                          <Input
                            label="Question Feedback Comments"
                            type="text"
                            value={evalItem.feedback}
                            onChange={(e) => handleFeedbackChange(q._id, e.target.value)}
                            placeholder="e.g. Great definition, covered all criteria."
                          />
                        </div>

                      </div>

                    </Card.Body>

                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Read-only MCQ Questions Section */}
        {mcqAnswers.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Auto-Graded Multiple Choice Questions (MCQ)</span>
            </h3>

            <div className="space-y-4">
              {mcqAnswers.map((ans, idx) => {
                const q = ans.question;
                return (
                  <Card key={q._id} hoverable={false} className="border border-neutral-200 bg-neutral-50/50">
                    <Card.Body className="p-5 space-y-3.5">
                      <div className="flex justify-between items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <Badge variant="neutral">
                            MCQ {idx + 1}
                          </Badge>
                          <span className="text-[10px] text-neutral-500 font-semibold">
                            Correct Choice: <strong className="text-neutral-850 font-bold">{q.correctAnswer}</strong>
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={ans.isCorrect ? 'success' : 'danger'}>
                            {ans.isCorrect ? 'Correct' : 'Incorrect'}
                          </Badge>
                          <span className="text-[11px] text-neutral-700 font-bold">
                            {ans.marksObtained} / {q.marks} Marks
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-800 font-medium select-text">{q.questionText}</p>
                      
                      <div className="text-xs p-3 bg-white border border-neutral-200 rounded text-neutral-600">
                        Student Choice: <strong className={ans.isCorrect ? 'text-emerald-600 font-bold' : 'text-red-650 font-bold'}>{ans.answerText || 'Unanswered'}</strong>
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Overall Exam Feedback */}
        <Card hoverable={false} className="border border-neutral-200">
          <Card.Body className="p-6 space-y-3">
            <h4 className="text-sm font-bold text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-2">
              <Info className="w-4 h-4 text-neutral-500" />
              <span>Overall Assessment Evaluation Feedback</span>
            </h4>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              Provide general feedback comments and summaries regarding the student's attempt performance. This will be shown on their graded report card.
            </p>
            <Textarea
              value={overallFeedback}
              onChange={(e) => setOverallFeedback(e.target.value)}
              placeholder="Type overall remarks here..."
              rows={3}
            />
          </Card.Body>
        </Card>

        {/* Action Triggers */}
        <div className="flex gap-4 max-w-md pt-2">
          <Button
            type="button"
            onClick={() => navigate('/teacher/evaluation')}
            disabled={submitting}
            variant="secondary"
            className="flex-1 py-3"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            isLoading={submitting}
            variant="primary"
            icon={Check}
            className="flex-1 py-3"
          >
            Submit Evaluation
          </Button>
        </div>

      </form>
    </div>
  );
};

export default EvaluationForm;
