import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle2, 
  Loader2, Maximize2, AlertTriangle, Info, Check 
} from 'lucide-react';
import submissionService from '../../services/submissionService';
import { Button, Card, Modal, PageLoader } from '../../components/common';

const shuffleArraySeeded = (array, seedString) => {
  const arr = [...array];
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed += seedString.charCodeAt(i);
  }
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const ExamAttempt = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  // Submission States
  const [submission, setSubmission] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Answers states: maps questionId to answerText
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState([]);
  const [savingStatus, setSavingStatus] = useState('saved'); // 'saved', 'saving', 'error'

  // Security violation states
  const [violations, setViolations] = useState({
    tabSwitchCount: 0,
    fullscreenExitCount: 0,
    copyPasteAttempts: 0
  });

  // UI States
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(true); // show start portal page first
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [apiError, setApiError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null); // in seconds
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [instructionsRead, setInstructionsRead] = useState(false);

  // Refs for tracking local states inside event listeners without closure issues
  const submissionIdRef = useRef(null);
  const violationsRef = useRef({ tabSwitchCount: 0, fullscreenExitCount: 0, copyPasteAttempts: 0 });

  // On mount: start or resume attempt
  useEffect(() => {
    const initExamAttempt = async () => {
      setLoading(true);
      setApiError('');
      try {
        const response = await submissionService.startExam(examId);
        if (response && response.success && response.data) {
          const sub = response.data;
          
          if (sub.status === 'submitted' || sub.status === 'graded') {
            setApiError('This assessment has already been finalized and submitted.');
            setLoading(false);
            return;
          }

          setSubmission(sub);
          setExam(sub.exam);
          const rawQuestions = sub.exam.questions || [];
          const processedQuestions = sub.exam.shuffleQuestions 
            ? shuffleArraySeeded(rawQuestions, sub._id) 
            : rawQuestions;
          setQuestions(processedQuestions);
          submissionIdRef.current = sub._id;

          // Hydrate previous answers if resuming
          const initialAnswers = {};
          if (sub.answers && sub.answers.length > 0) {
            sub.answers.forEach(ans => {
              initialAnswers[ans.question] = ans.answerText || '';
            });
          }
          setAnswers(initialAnswers);

          // Restore violation counts if resuming
          const initialViolations = {
            tabSwitchCount: sub.tabSwitchCount || 0,
            fullscreenExitCount: sub.fullscreenExitCount || 0,
            copyPasteAttempts: sub.copyPasteAttempts || 0
          };
          setViolations(initialViolations);
          violationsRef.current = initialViolations;

          // Calculate time remaining
          const startMs = new Date(sub.startTime).getTime();
          const durationMs = sub.exam.duration * 60 * 1000;
          const endMs = new Date(sub.exam.endTime).getTime();
          
          // Allocated time boundary is either startTime+duration or hard exam endTime
          const targetEndMs = Math.min(startMs + durationMs, endMs);
          const remainingSecs = Math.max(0, Math.floor((targetEndMs - Date.now()) / 1000));
          
          setTimeLeft(remainingSecs);
          if (remainingSecs <= 0) {
            // Already expired
            handleSubmitExam(true);
          }
        }
      } catch (err) {
        console.error('Failed to load attempt details:', err);
        setApiError(err?.response?.data?.message || err?.message || (typeof err === 'string' ? err : '') || 'Failed to start the assessment. Ensure it is currently open.');
      } finally {
        setLoading(false);
      }
    };

    initExamAttempt();
  }, [examId]);

  // Countdown timer effect
  useEffect(() => {
    if (starting || timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out (if autoSubmit !== false)
          if (exam?.autoSubmit !== false) {
            handleSubmitExam(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [starting, timeLeft, exam]);

  // Security violations event hooks
  useEffect(() => {
    if (starting || !submissionIdRef.current) return;

    // Visibility (Tab Switching) trigger
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        const nextViolations = {
          ...violationsRef.current,
          tabSwitchCount: violationsRef.current.tabSwitchCount + 1
        };
        violationsRef.current = nextViolations;
        setViolations(nextViolations);

        // Sync with database
        try {
          await submissionService.updateViolations(submissionIdRef.current, { 
            tabSwitchCount: nextViolations.tabSwitchCount 
          });
        } catch (err) {
          console.error('Syncing tab switch violation failed:', err);
        }
      }
    };

    // Fullscreen exit trigger
    const handleFullscreenChange = async () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);

      if (!isFull && !starting) {
        const nextViolations = {
          ...violationsRef.current,
          fullscreenExitCount: violationsRef.current.fullscreenExitCount + 1
        };
        violationsRef.current = nextViolations;
        setViolations(nextViolations);

        // Sync with database
        try {
          await submissionService.updateViolations(submissionIdRef.current, { 
            fullscreenExitCount: nextViolations.fullscreenExitCount 
          });
        } catch (err) {
          console.error('Syncing fullscreen exit violation failed:', err);
        }
      }
    };

    // Copy / Paste block trigger
    const handleCopyPaste = async (e) => {
      e.preventDefault();
      const nextViolations = {
        ...violationsRef.current,
        copyPasteAttempts: violationsRef.current.copyPasteAttempts + 1
      };
      violationsRef.current = nextViolations;
      setViolations(nextViolations);

      // Sync with database
      try {
        await submissionService.updateViolations(submissionIdRef.current, { 
          copyPasteAttempts: nextViolations.copyPasteAttempts 
        });
      } catch (err) {
        console.error('Syncing copy paste violation failed:', err);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
    };
  }, [starting]);

  // Request Fullscreen and start Exam
  const handleStartExam = async () => {
    setApiError('');
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      setStarting(false);
    } catch (err) {
      console.warn('Fullscreen request blocked or failed:', err);
      // Proceed even if fullscreen fails (e.g. browser security policy or iframe)
      setStarting(false);
    }
  };

  // Re-request Fullscreen helper
  const handleReturnFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error('Failed to restore fullscreen:', err);
    }
  };

  // Save specific answer to backend
  const saveActiveAnswer = async (qId, ansText) => {
    if (!submissionIdRef.current) return;
    setSavingStatus('saving');
    try {
      await submissionService.saveAnswer(submissionIdRef.current, qId, ansText);
      setSavingStatus('saved');
    } catch (err) {
      console.error('Auto-saving answer failed:', err);
      setSavingStatus('error');
    }
  };

  // Seeded option shuffler
  const getProcessedOptions = (question) => {
    if (!question || !question.options) return [];
    if (exam?.shuffleOptions && submission?._id) {
      return shuffleArraySeeded(question.options, submission._id + question._id);
    }
    return question.options;
  };

  // Handle option checklist/radio change (MCQ)
  const handleMCQChange = (qId, optionText) => {
    setAnswers(prev => ({ ...prev, [qId]: optionText }));
    saveActiveAnswer(qId, optionText);
  };

  // Handle text input blur (Short Answer)
  const handleShortAnswerBlur = (qId, textVal) => {
    saveActiveAnswer(qId, textVal);
  };

  // Handle text input change
  const handleShortAnswerChange = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  // Toggle flag for review
  const handleToggleReview = (qId) => {
    setMarkedForReview(prev => {
      if (prev.includes(qId)) {
        return prev.filter(id => id !== qId);
      }
      return [...prev, qId];
    });
  };

  // Final Exam submission trigger
  const handleSubmitExam = async (isAuto = false) => {
    if (!submissionIdRef.current || submitting) return;
    setSubmitting(true);
    setApiError('');
    try {
      // Exit fullscreen mode if active
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(err => console.warn('Exit fullscreen failed:', err));
      }

      const response = await submissionService.submitExam(submissionIdRef.current);
      if (response && response.success) {
        setShowSubmitModal(false);
        navigate('/student/dashboard');
      }
    } catch (err) {
      console.error('Submission failed:', err);
      setApiError(err?.response?.data?.message || err?.message || (typeof err === 'string' ? err : '') || 'Failed to submit exam attempt.');
      setSubmitting(false);
    }
  };

  // Helper formats
  const formatTime = (seconds) => {
    if (seconds <= 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    const minStr = mins < 10 ? `0${mins}` : mins;
    const secStr = secs < 10 ? `0${secs}` : secs;

    if (hrs > 0) {
      return `${hrs}:${minStr}:${secStr}`;
    }
    return `${minStr}:${secStr}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center">
        <PageLoader message="Initializing testing environment..." />
      </div>
    );
  }

  if (apiError && starting) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center p-6 text-center select-none">
        <Card hoverable={false} className="max-w-md w-full border-neutral-200">
          <Card.Body className="p-8 flex flex-col items-center gap-4">
            <ShieldAlert className="w-12 h-12 text-red-500" />
            <h3 className="text-lg font-bold text-neutral-900">Access Restricted</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{apiError}</p>
            <Button
              onClick={() => navigate('/student/dashboard')}
              variant="secondary"
              size="sm"
              className="mt-2"
            >
              Back to Dashboard
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // PORTAL START WIZARD Screen (Instructions Page)
  if (starting) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center p-6 select-none animate-[fadeIn_0.2s_ease-out]">
        <Card hoverable={false} className="max-w-2xl w-full">
          <Card.Body className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-neutral-100 text-neutral-805 border border-neutral-200 rounded">
                {exam?.subject}
              </span>
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">{exam?.title}</h2>
              {exam?.description && <p className="text-xs text-slate-500 leading-relaxed mt-2">{exam.description}</p>}
            </div>

            {/* Exam Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-y border-neutral-200 py-5">
              <div className="flex flex-col items-center p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-center">
                <Clock className="w-5 h-5 text-neutral-900 mb-1.5" />
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Duration</span>
                <strong className="text-neutral-900 text-sm font-bold mt-0.5">{exam?.duration} Minutes</strong>
              </div>
              <div className="flex flex-col items-center p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-center">
                <Info className="w-5 h-5 text-neutral-900 mb-1.5" />
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Questions</span>
                <strong className="text-neutral-900 text-sm font-bold mt-0.5">{questions.length} Items</strong>
              </div>
              <div className="flex flex-col items-center p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-center">
                <Check className="w-5 h-5 text-neutral-900 mb-1.5" />
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Total Marks</span>
                <strong className="text-neutral-900 text-sm font-bold mt-0.5">{exam?.totalMarks} Marks</strong>
              </div>
            </div>

            {/* Detailed Guidelines and Rules */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">Exam Rules & Guidelines</h3>
              <ul className="list-disc pl-5 space-y-2 text-xs text-slate-500">
                <li>This is a continuous, time-bound testing environment. Once started, the timer cannot be paused.</li>
                <li><strong>Fullscreen Mode</strong> is strictly mandatory. You must stay inside fullscreen mode for the entire duration.</li>
                <li>Exiting fullscreen, opening new tabs, or switching applications is flagged as a <strong>security violation</strong>.</li>
                <li>Copying text from the page or pasting external content into answer boxes is strictly monitored and blocked.</li>
                <li>If your security violations exceed the system safety threshold, your exam attempt will be <strong>automatically terminated and submitted</strong>.</li>
                <li>Ensure you have a reliable internet connection. Answers are automatically saved to the server as you type.</li>
              </ul>
            </div>

            <div className="bg-warning-50 border border-warning-200 text-warning-600 p-4 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wide">Security Agreement</h4>
                <p className="text-[10px] leading-relaxed text-warning-600">
                  By starting this test, you consent to automated monitoring of browser focus switches, tab changes, and fullscreen exits. Violations are logged and reported to the system admin and the evaluating teacher.
                </p>
              </div>
            </div>

            {/* Checkbox confirmation */}
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 rounded-xl transition-colors select-none">
              <input
                type="checkbox"
                checked={instructionsRead}
                onChange={(e) => setInstructionsRead(e.target.checked)}
                className="w-4.5 h-4.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900 bg-white accent-neutral-900 cursor-pointer mt-0.5"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-neutral-900">I have read all instructions</span>
                <p className="text-[10px] text-slate-450 leading-normal">
                  I understand the guidelines and agree to run the exam in distraction-free fullscreen mode.
                </p>
              </div>
            </label>

            {/* Start Button */}
            <Button
              onClick={handleStartExam}
              variant="primary"
              icon={Maximize2}
              disabled={!instructionsRead}
              className="w-full py-3.5 flex items-center justify-center gap-2 text-sm"
            >
              Enter Full Screen & Start Test
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // RESTRICTION Screen if student exits fullscreen
  if (!isFullscreen) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex flex-col items-center justify-center p-6 text-center select-none z-50 animate-[fadeIn_0.15s_ease-out]">
        <Card hoverable={false} className="max-w-md w-full border-warning-200">
          <Card.Body className="p-8 flex flex-col items-center gap-4">
            <ShieldAlert className="w-12 h-12 text-warning-500 animate-pulse" />
            <h3 className="text-lg font-bold text-neutral-900">Security Warning</h3>
            <p className="text-xs text-slate-550 leading-relaxed">
              Distraction-free Fullscreen mode has been deactivated. Please re-enter fullscreen immediately to resume your exam. Exits are tracked.
            </p>
            <div className="text-[11px] text-slate-550">
              Fullscreen Exits Recorded: <strong className="text-red-600 font-bold">{violations.fullscreenExitCount}</strong>
            </div>
            <Button
              onClick={handleReturnFullscreen}
              variant="primary"
              className="w-full mt-2"
            >
              Re-enter Full Screen
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // CORE TESTING Interface
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isAnswered = answers[currentQuestion?._id] !== undefined && answers[currentQuestion?._id] !== '';
  const isMarked = markedForReview.includes(currentQuestion?._id);

  // Stats calculate for Submit Confirm Modal
  const answeredCount = Object.keys(answers).filter(key => answers[key] !== '').length;
  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-neutral-900 flex flex-col select-none">
      
      {/* 1. Header Row */}
      <header className="h-[72px] border-b border-neutral-200 px-6 flex justify-between items-center bg-white sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 text-[10px] text-neutral-800 rounded font-bold uppercase shrink-0">
            {exam?.subject}
          </span>
          <h1 className="text-sm font-bold text-neutral-900 truncate pr-4">
            {exam?.title}
          </h1>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          {/* Real-time saving status badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold">
            {savingStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-neutral-900 animate-spin" />
                <span className="text-slate-500">Auto-saving...</span>
              </>
            ) : savingStatus === 'error' ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                <span className="text-red-500">Save Error</span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span className="text-slate-500">All answers saved</span>
              </>
            )}
          </div>

          {/* Countdown Clock Display */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-sm font-bold ${
            timeLeft < 300 
              ? 'bg-red-50 border-red-200 text-red-650 animate-pulse' 
              : 'bg-neutral-900 border-neutral-950 text-white'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <Button
            onClick={() => setShowSubmitModal(true)}
            variant="danger"
            size="sm"
          >
            Submit Test
          </Button>
        </div>
      </header>

      {/* 2. Workspace Body layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-4.5rem)]">
        
        {/* Left Side: Question navigation Grid */}
        <aside className="w-full md:w-64 border-r border-neutral-200 bg-white flex flex-col p-5 space-y-6">
          
          {/* Progress tracker */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500 font-semibold">
              <span>Progress:</span>
              <span>{answeredCount} / {totalQuestions} Answered</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
              <div 
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                className="h-1.5 bg-neutral-900 rounded-full transition-all duration-300"
              />
            </div>
          </div>

          {/* Nav Grid */}
          <div className="flex-1">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Questions list</p>
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const ans = answers[q._id];
                const hasAns = ans !== undefined && ans !== '';
                const isRvw = markedForReview.includes(q._id);
                const isCurrent = idx === currentIndex;
                const isBackDisabled = exam?.allowBackNavigation === false && idx < currentIndex;

                return (
                  <button
                    key={q._id}
                    disabled={isBackDisabled}
                    onClick={() => {
                      if (isBackDisabled) return;
                      setCurrentIndex(idx);
                    }}
                    className={`w-9.5 h-9.5 rounded-lg text-xs font-bold border transition-all flex items-center justify-center ${
                      isBackDisabled
                        ? 'opacity-45 cursor-not-allowed border-neutral-100 text-neutral-300 bg-neutral-50'
                        : 'cursor-pointer'
                    } ${
                      isCurrent
                        ? 'border-neutral-900 bg-neutral-900 text-white font-bold shadow-sm'
                        : isRvw
                        ? 'border-warning-200 bg-warning-50 text-warning-605'
                        : hasAns
                        ? 'border-emerald-250 bg-emerald-50 text-emerald-600'
                        : 'border-neutral-200 bg-neutral-50 text-slate-500 hover:border-neutral-350'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Guides list */}
          <div className="border-t border-neutral-200 pt-4 space-y-2 text-[10px] text-slate-500 font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-emerald-50 border border-emerald-200"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-warning-50 border border-warning-200"></div>
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-md bg-neutral-50 border border-neutral-200"></div>
              <span>Unvisited</span>
            </div>
          </div>
        </aside>

        {/* Center: Main Question display panel */}
        <main className="flex-1 flex flex-col p-6 sm:p-8 space-y-6">
          {/* Question Index metadata */}
          <div className="flex justify-between items-center gap-4 border-b border-neutral-200 pb-3.5">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wide bg-neutral-100 text-neutral-800 border border-neutral-200 px-2 py-0.5 rounded">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span className="text-xs text-slate-650 block sm:inline sm:ml-3">
                Value: <strong>{currentQuestion?.marks} Marks</strong>
              </span>
            </div>

            <Button
              onClick={() => handleToggleReview(currentQuestion?._id)}
              variant={isMarked ? 'outline' : 'secondary'}
              size="sm"
              className={isMarked ? 'bg-warning-50 border-warning-200 text-warning-605 hover:bg-warning-100' : ''}
            >
              {isMarked ? 'Marked for Review' : 'Mark for Review'}
            </Button>
          </div>

          {/* Display content layout */}
          <div className="flex-1 space-y-6 max-w-3xl">
            {/* Question Text */}
            <h3 className="text-base font-semibold text-neutral-900 leading-relaxed pr-6 select-text whitespace-pre-line">
              {currentQuestion?.questionText}
            </h3>

            {/* Question Image if present */}
            {currentQuestion?.questionImage && (
              <div className="border border-neutral-200 rounded-xl overflow-hidden max-w-md bg-white p-2 select-none shadow-sm">
                <img 
                  src={currentQuestion.questionImage} 
                  alt="Question graphic" 
                  className="rounded-lg max-h-[220px] w-full object-contain"
                />
              </div>
            )}

            {/* Interactive Answer Box */}
            <div className="pt-6 border-t border-neutral-200">
              {currentQuestion?.type === 'MCQ' ? (
                /* MCQ layout options */
                <div className="space-y-3.5">
                  {getProcessedOptions(currentQuestion).map((opt, i) => {
                    const isSelected = answers[currentQuestion._id] === opt;
                    const isReadOnly = timeLeft !== null && timeLeft <= 0;
                    return (
                      <div 
                        key={i}
                        onClick={() => {
                          if (isReadOnly) return;
                          handleMCQChange(currentQuestion._id, opt);
                        }}
                        className={`p-4 border rounded-xl flex items-center gap-3.5 transition-all ${
                          isReadOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isSelected
                            ? 'bg-neutral-900 border-neutral-900 text-white font-semibold'
                            : 'bg-white border-neutral-205 hover:border-neutral-350 text-slate-700 hover:text-neutral-900'
                        }`}
                      >
                        <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-white border-white text-neutral-900' : 'border-neutral-300 bg-white'
                        }`}>
                           {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-neutral-900"></div>}
                        </div>
                        <span className="text-xs">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Short Answer text area input */
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-bold uppercase tracking-wide">Type your response below</label>
                  <textarea
                    value={answers[currentQuestion?._id] || ''}
                    disabled={timeLeft !== null && timeLeft <= 0}
                    onChange={(e) => handleShortAnswerChange(currentQuestion._id, e.target.value)}
                    onBlur={(e) => handleShortAnswerBlur(currentQuestion._id, e.target.value)}
                    placeholder={timeLeft !== null && timeLeft <= 0 ? "Time has expired." : "Enter your detailed answer here. Changes are auto-saved on click-away."}
                    rows={6}
                    className={`w-full p-4 bg-white border border-neutral-200 focus:border-neutral-900 rounded-xl text-neutral-900 placeholder-slate-400 focus:outline-none text-xs leading-relaxed select-text ${
                      timeLeft !== null && timeLeft <= 0 ? 'opacity-65 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Stepper footer buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-neutral-200 max-w-3xl">
            {exam?.allowBackNavigation !== false ? (
              <Button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                variant="secondary"
                size="sm"
                icon={ArrowLeft}
                iconPosition="left"
              >
                Previous
              </Button>
            ) : (
              <span className="text-xs text-slate-500 font-semibold italic">
                Back navigation disabled
              </span>
            )}

            <Button
              onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
              disabled={currentIndex === totalQuestions - 1}
              variant="secondary"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
            >
              Next
            </Button>
          </div>
        </main>
      </div>

      {/* 3. Submit confirmation modal overlay */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Exam Assessment?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowSubmitModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleSubmitExam(false)}
              isLoading={submitting}
            >
              Submit Exam
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-sm font-semibold text-neutral-900">Confirm final submission</p>
          </div>
          
          <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Total Questions:</span>
              <strong className="text-neutral-900">{totalQuestions}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Answered Questions:</span>
              <strong className="text-emerald-600">{answeredCount}</strong>
            </div>
            {unansweredCount > 0 && (
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-warning-600 font-semibold">
                <span>Unanswered Questions:</span>
                <span>{unansweredCount} Left</span>
              </div>
            )}
          </div>
          
          <p className="text-[11px] leading-relaxed text-slate-500">
            Are you sure you want to submit? After finalization, you will lose access to editing answers and scores will be auto-graded where possible.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ExamAttempt;

