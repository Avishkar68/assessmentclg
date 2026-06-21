import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Calendar, BookOpen, AlertCircle, 
  CheckCircle2, Loader2, Search, Sparkles, Check, RefreshCw 
} from 'lucide-react';
import examService from '../../services/examService';
import questionService from '../../services/questionService';
import adminService from '../../services/adminService';
import { Button, Card, Input, Select, Textarea, PageLoader, Badge } from '../../components/common';
import showToast from '../../utils/toast';

export const ExamForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  // Form Field states
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    cohort: '',
    duration: 60,
    startTime: '',
    endTime: '',
    totalMarks: 50,
    questions: [] // Array of question IDs
  });

  // UI/API States
  const [subjectsList, setSubjectsList] = useState([]);
  const [cohortsList, setCohortsList] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState('');
  
  // Question Selector states
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');

  // Local helper to convert ISO string to YYYY-MM-DDTHH:MM for datetime-local inputs
  const toDatetimeLocal = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  // Fetch Exam if in Edit Mode
  useEffect(() => {
    if (!isEdit) return;

    const fetchExam = async () => {
      setLoading(true);
      setApiError('');
      try {
        const response = await examService.getExamById(id);
        if (response && response.success && response.data) {
          const exam = response.data;
          
          // Verify status restriction (cannot edit published/closed exams)
          if (exam.status !== 'draft') {
            setApiError(`This exam is ${exam.status} and cannot be modified.`);
            setLoading(false);
            return;
          }

          setFormData({
            title: exam.title || '',
            description: exam.description || '',
            subject: exam.subject || '',
            cohort: exam.cohort || '',
            duration: exam.duration || 60,
            startTime: toDatetimeLocal(exam.startTime),
            endTime: toDatetimeLocal(exam.endTime),
            totalMarks: exam.totalMarks || 50,
            questions: exam.questions ? exam.questions.map(q => q._id || q) : []
          });
        }
      } catch (err) {
        console.error('Error loading exam:', err);
        setApiError(err?.response?.data?.message || err?.message || (typeof err === 'string' ? err : '') || 'Failed to retrieve exam details.');
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id, isEdit]);

  // Fetch subjects and classes dropdown lists
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [subjsRes, cohortsRes] = await Promise.all([
          adminService.getSubjects(),
          adminService.getClassRooms()
        ]);
        if (subjsRes && subjsRes.success) {
          setSubjectsList(subjsRes.data || []);
        }
        if (cohortsRes && cohortsRes.success) {
          setCohortsList(cohortsRes.data || []);
        }
      } catch (err) {
        console.error('Error fetching dropdowns in ExamForm:', err);
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch Questions when subject changes
  useEffect(() => {
    if (!formData.subject) {
      setAvailableQuestions([]);
      return;
    }

    const fetchSubjectQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const response = await questionService.getQuestions({ 
          subject: formData.subject,
          limit: 100 
        });
        if (response && response.success && response.data) {
          setAvailableQuestions(response.data.results || []);
        }
      } catch (err) {
        console.error('Error fetching questions for subject:', err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchSubjectQuestions();
  }, [formData.subject]);

  // Checkbox toggle handler
  const handleToggleQuestion = (qId) => {
    setFormData(prev => {
      const questionsCopy = [...prev.questions];
      const index = questionsCopy.indexOf(qId);
      if (index > -1) {
        questionsCopy.splice(index, 1); // remove
      } else {
        questionsCopy.push(qId); // add
      }
      return { ...prev, questions: questionsCopy };
    });
  };

  // Calculate sum of marks of currently selected questions
  const selectedQuestionsMarks = availableQuestions
    .filter(q => formData.questions.includes(q._id))
    .reduce((sum, q) => sum + (q.marks || 0), 0);

  // Sync marks action
  const handleSyncMarks = () => {
    setFormData(prev => ({ ...prev, totalMarks: selectedQuestionsMarks }));
  };

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'totalMarks' ? Number(value) : value
    }));
    
    // Clear field-level error
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Subject change: clear question list
  const handleSubjectChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      subject: val,
      questions: [] // Reset question list on subject switch
    }));
    
    if (formErrors.subject) {
      setFormErrors(prev => ({ ...prev, subject: '' }));
    }
  };

  // Form Validation checks
  const validateForm = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Exam title is required.';
    if (!formData.subject) errs.subject = 'Please choose a subject.';
    if (!formData.cohort) errs.cohort = 'Please choose a class/cohort target.';
    
    const dur = parseInt(formData.duration, 10);
    if (isNaN(dur) || dur < 1) {
      errs.duration = 'Duration must be at least 1 minute.';
    }

    if (!formData.startTime) {
      errs.startTime = 'Start time is required.';
    }

    if (!formData.endTime) {
      errs.endTime = 'End time is required.';
    }

    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (end <= start) {
        errs.endTime = 'End time must be later than start time.';
      }
    }

    const marks = parseInt(formData.totalMarks, 10);
    if (isNaN(marks) || marks < 1) {
      errs.totalMarks = 'Total marks must be a positive number of at least 1.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setApiError('');
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject: formData.subject,
        cohort: formData.cohort,
        duration: Number(formData.duration),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        totalMarks: Number(formData.totalMarks),
        questions: formData.questions
      };

      if (isEdit) {
        await examService.updateExam(id, payload);
        showToast.success('Exam updated successfully!');
      } else {
        await examService.createExam(payload);
        showToast.success('Exam created successfully!');
      }

      navigate('/teacher/exams');
    } catch (err) {
      console.error('Error saving exam:', err);
      setApiError(err?.response?.data?.message || err?.message || (typeof err === 'string' ? err : '') || 'Failed to save the exam. Check form requirements.');
    } finally {
      setSaving(false);
    }
  };

  // Local filter for loaded questions list
  const filteredQuestions = availableQuestions.filter(q => 
    q.questionText.toLowerCase().includes(questionSearch.toLowerCase())
  );

  if (loading) {
    return <PageLoader message="Loading assessment profile..." />;
  }

  if (isEdit && apiError && apiError.includes('cannot be modified')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate('/teacher/exams')}
            variant="secondary"
            size="sm"
            icon={ArrowLeft}
            className="p-2"
          />
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Edit Exam</h1>
        </div>
        <Card hoverable={false} className="max-w-lg mx-auto border-red-200">
          <Card.Body className="p-8 flex flex-col items-center justify-center text-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h3 className="text-base font-bold text-neutral-900">Action Restricted</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {apiError} Only exams in "draft" status can be edited or modified.
            </p>
            <Button
              onClick={() => navigate('/teacher/exams')}
              variant="secondary"
              size="sm"
              className="mt-2"
            >
              Back to Exams
            </Button>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none animate-[fadeIn_0.25s_ease-out]">
      {/* Title Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate('/teacher/exams')}
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          className="p-2"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {isEdit ? 'Edit Assessment' : 'Create Assessment'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isEdit ? 'Update exam properties and manually adjust questions.' : 'Fill in the details to schedule a new student exam.'}
          </p>
        </div>
      </div>

      {apiError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Main Split Layout: Form Details (Left), Question Bank Select (Right) */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left: General Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card hoverable={false}>
            <Card.Body className="p-6 space-y-5">
              <h3 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-2">
                Exam Details
              </h3>

              <Input
                label="Exam Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                error={formErrors.title}
                placeholder="e.g. Midterm Programming Exam"
              />

              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief directions or criteria for students..."
                rows={3}
              />

              <Select
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleSubjectChange}
                error={formErrors.subject}
                disabled={isEdit}
                options={[
                  { value: '', label: 'Select Subject' },
                  ...subjectsList.map(sub => sub.name)
                ]}
              />

              <Select
                label="Class/Cohort Target"
                name="cohort"
                value={formData.cohort}
                onChange={handleInputChange}
                error={formErrors.cohort}
                disabled={isEdit}
                options={[
                  { value: '', label: 'Select Class/Cohort' },
                  ...cohortsList.map(c => c.name)
                ]}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Duration (mins)"
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  error={formErrors.duration}
                  min="1"
                />
                <Input
                  label="Total Marks"
                  type="number"
                  name="totalMarks"
                  value={formData.totalMarks}
                  onChange={handleInputChange}
                  error={formErrors.totalMarks}
                  min="1"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="datetime-local"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleInputChange}
                  error={formErrors.startTime}
                />
                <Input
                  label="End Time"
                  type="datetime-local"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleInputChange}
                  error={formErrors.endTime}
                />
              </div>
            </Card.Body>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              onClick={() => navigate('/teacher/exams')}
              variant="secondary"
              className="flex-1 py-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              isLoading={saving}
              variant="primary"
              className="flex-1 py-3"
            >
              {isEdit ? 'Save Changes' : 'Create Exam'}
            </Button>
          </div>
        </div>

        {/* Right: Question Selector Panel */}
        <div className="lg:col-span-3 space-y-6">
          <Card hoverable={false} className="h-full min-h-[450px]">
            <Card.Body className="p-6 flex flex-col h-full">
              <h3 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-2">
                Manual Question Selection
              </h3>

              {!formData.subject ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-400">
                  <BookOpen className="w-12 h-12 text-neutral-300 mb-3" />
                  <p className="text-xs">Please choose a Subject on the left side to load matching bank questions.</p>
                </div>
              ) : (
                <div className="mt-4 flex-1 flex flex-col space-y-4">
                  {/* Search in Question list */}
                  <div className="w-full">
                    <Input
                      icon={Search}
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      placeholder="Search loaded questions by text..."
                    />
                  </div>

                  {/* Question Checklist Box */}
                  {loadingQuestions ? (
                    <div className="flex-1 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-neutral-950 animate-spin" />
                    </div>
                  ) : filteredQuestions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-neutral-400">
                      <AlertCircle className="w-10 h-10 text-neutral-350 mb-2" />
                      <p className="text-xs">No questions matching "{formData.subject}" were found in your library.</p>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto max-h-[350px] pr-2 space-y-3">
                      {filteredQuestions.map((q) => {
                        const isChecked = formData.questions.includes(q._id);
                        return (
                          <div 
                            key={q._id}
                            onClick={() => handleToggleQuestion(q._id)}
                            className={`p-3.5 border rounded-lg flex items-start gap-3 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-neutral-900/[0.02] border-neutral-900 text-neutral-900'
                                : 'bg-white border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            <div className={`mt-0.5 shrink-0 w-4.5 h-4.5 rounded border flex items-center justify-center transition-colors ${
                              isChecked ? 'bg-neutral-900 border-neutral-900 text-white' : 'border-neutral-300 bg-white'
                            }`}>
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            
                            <div className="flex-1 space-y-1.5 min-w-0">
                              <p className="text-xs font-semibold leading-relaxed break-words text-neutral-800">
                                {q.questionText}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="neutral" className="uppercase">
                                  {q.type}
                                </Badge>
                                <Badge variant={
                                  q.difficulty === 'Easy'
                                    ? 'success'
                                    : q.difficulty === 'Medium'
                                    ? 'warning'
                                    : 'danger'
                                  } className="uppercase">
                                  {q.difficulty}
                                </Badge>
                                <span className="text-[11px] text-neutral-400">{q.chapter}</span>
                                <span className="text-[11px] text-neutral-600 font-semibold">{q.marks} Marks</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Selector Summary Drawer Footer */}
                  <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="text-xs space-y-1">
                      <div className="text-neutral-600">
                        Selected Questions: <strong className="text-neutral-900 font-bold">{formData.questions.length}</strong>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-600">
                        <span>Selected Marks Sum:</span>
                        <strong className={`font-bold ${
                          selectedQuestionsMarks === formData.totalMarks
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        }`}>
                          {selectedQuestionsMarks} Marks
                        </strong>
                        {selectedQuestionsMarks !== formData.totalMarks && (
                          <Badge variant="warning">
                            Mismatch
                          </Badge>
                        )}
                      </div>
                    </div>

                    {selectedQuestionsMarks !== formData.totalMarks && selectedQuestionsMarks > 0 && (
                      <Button
                        onClick={handleSyncMarks}
                        variant="secondary"
                        size="sm"
                        icon={RefreshCw}
                      >
                        Sync Total Marks
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

      </form>
    </div>
  );
};

export default ExamForm;
