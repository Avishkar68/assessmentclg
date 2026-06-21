import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, Loader2, Settings, ShieldAlert } from 'lucide-react';
import examService from '../../services/examService';
import { Card, Button, PageLoader, Badge } from '../../components/common';
import showToast from '../../utils/toast';

export const ExamSettings = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Settings State
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form Fields
  const [settings, setSettings] = useState({
    shuffleQuestions: false,
    shuffleOptions: false,
    allowBackNavigation: true,
    allowReview: true,
    autoSubmit: true,
    showResultsImmediately: true
  });

  // Fetch Exam configuration details
  useEffect(() => {
    const fetchExamDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await examService.getExamById(id);
        if (response && response.success && response.data) {
          const examData = response.data;
          setExam(examData);
          setSettings({
            shuffleQuestions: !!examData.shuffleQuestions,
            shuffleOptions: !!examData.shuffleOptions,
            allowBackNavigation: examData.allowBackNavigation !== false,
            allowReview: examData.allowReview !== false,
            autoSubmit: examData.autoSubmit !== false,
            showResultsImmediately: examData.showResultsImmediately !== false
          });
        } else {
          setError('Failed to retrieve exam configurations.');
        }
      } catch (err) {
        console.error('Failed to load exam:', err);
        setError(err || 'Failed to connect to exam configuration services.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [id]);

  const handleToggle = (key) => {
    if (exam?.status === 'published' || exam?.status === 'closed') {
      showToast.error(`Cannot change settings for a ${exam.status} exam.`);
      return;
    }
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (exam?.status === 'published' || exam?.status === 'closed') {
      showToast.error(`Cannot save settings for a ${exam.status} exam.`);
      return;
    }

    setSaving(true);
    setError('');
    try {
      // Keep existing exam details and merge new settings parameters
      const updatedData = {
        title: exam.title,
        subject: exam.subject,
        duration: exam.duration,
        startTime: exam.startTime,
        endTime: exam.endTime,
        totalMarks: exam.totalMarks,
        questions: exam.questions ? exam.questions.map((q) => q._id || q) : [],
        description: exam.description,
        ...settings
      };

      const response = await examService.updateExam(id, updatedData);
      if (response && response.success) {
        showToast.success('Exam settings saved successfully!');
        navigate('/teacher/exams');
      } else {
        setError('Failed to save settings changes.');
      }
    } catch (err) {
      console.error('Error saving exam settings:', err);
      setError(err || 'Failed to update exam settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageLoader message="Loading exam settings..." />
      </div>
    );
  }

  const isLocked = exam?.status === 'published' || exam?.status === 'closed';

  return (
    <div className="max-w-3xl mx-auto space-y-6 select-none animate-[fadeIn_0.25s_ease-out]">
      {/* Title Header */}
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/teacher/exams')}
            icon={ArrowLeft}
            className="!p-2.5 rounded-lg border-neutral-200"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-neutral-500" />
              Exam Settings
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure parameters for: <strong className="text-neutral-800">{exam?.title}</strong>
            </p>
          </div>
        </div>

        <Badge variant={
          exam?.status === 'published' 
            ? 'success'
            : exam?.status === 'closed'
            ? 'danger'
            : 'warning'
        }>
          {exam?.status}
        </Badge>
      </div>

      {isLocked && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-250 text-amber-850 rounded-lg text-xs leading-relaxed">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <span>
            This exam is currently <strong>{exam?.status}</strong>. Settings are locked and read-only. Editing settings requires draft status.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Settings Panel */}
      <form onSubmit={handleSave} className="space-y-6">
        <Card hoverable={false} className="divide-y divide-neutral-100 overflow-hidden">
          
          {/* Shuffle Questions */}
          <div className="p-6 flex items-start justify-between gap-6 hover:bg-neutral-50/50 transition-colors">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900">Shuffle Questions</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Randomize the order in which questions are presented differently for every student candidate.
              </p>
            </div>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleToggle('shuffleQuestions')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none shrink-0 ${
                settings.shuffleQuestions ? 'bg-neutral-900' : 'bg-neutral-200'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  settings.shuffleQuestions ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Shuffle Options */}
          <div className="p-6 flex items-start justify-between gap-6 hover:bg-neutral-50/50 transition-colors">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900">Shuffle Options</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Randomize the multiple choice option answers order per question to prevent peer copy attempts.
              </p>
            </div>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleToggle('shuffleOptions')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none shrink-0 ${
                settings.shuffleOptions ? 'bg-neutral-900' : 'bg-neutral-200'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  settings.shuffleOptions ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Allow Back Navigation */}
          <div className="p-6 flex items-start justify-between gap-6 hover:bg-neutral-50/50 transition-colors">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900">Allow Back Navigation</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Permit students to navigate backward to review and revise previously answered questions during the test.
              </p>
            </div>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleToggle('allowBackNavigation')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none shrink-0 ${
                settings.allowBackNavigation ? 'bg-neutral-900' : 'bg-neutral-200'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  settings.allowBackNavigation ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Allow Review */}
          <div className="p-6 flex items-start justify-between gap-6 hover:bg-neutral-50/50 transition-colors">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900">Allow Review</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Let students inspect incorrect/correct answers and view teacher feedback evaluations after grades are compiled.
              </p>
            </div>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleToggle('allowReview')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none shrink-0 ${
                settings.allowReview ? 'bg-neutral-900' : 'bg-neutral-200'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  settings.allowReview ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto Submit */}
          <div className="p-6 flex items-start justify-between gap-6 hover:bg-neutral-50/50 transition-colors">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900">Auto Submit</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Automatically lock and submit the assessment on behalf of the student when the countdown clock timer hits zero.
              </p>
            </div>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleToggle('autoSubmit')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none shrink-0 ${
                settings.autoSubmit ? 'bg-neutral-900' : 'bg-neutral-200'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                  settings.autoSubmit ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Show Results Immediately */}
          <div className="p-6 flex items-start justify-between gap-6 hover:bg-neutral-50/50 transition-colors">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-neutral-900">Show Results Immediately</h3>
              <p className="text-xs text-slate-500 leading-normal">
                Instantly make score cards, grades and ratings visible to the student candidate on their reports log dashboard.
              </p>
            </div>
            <button
              type="button"
              disabled={isLocked}
              onClick={() => handleToggle('showResultsImmediately')}
              className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none shrink-0 ${
                settings.showResultsImmediately ? 'bg-neutral-900' : 'bg-neutral-200'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div
                className={`bg-white w-4.5 h-4.5 rounded-full shadow-md transform transition-transform duration-300 ${
                  settings.showResultsImmediately ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </Card>

        {/* Action button row */}
        {!isLocked && (
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/teacher/exams')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={saving}
              icon={Save}
            >
              Save Settings
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ExamSettings;
