import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Clock, Calendar, BookOpen, AlertCircle, 
  CheckCircle2, Loader2, Sparkles, Check, FileText 
} from 'lucide-react';
import examService from '../../services/examService';
import adminService from '../../services/adminService';
import { Button, Card, Input, Select, Textarea, Badge } from '../../components/common';
import showToast from '../../utils/toast';

export const ExamGenerate = () => {
  const navigate = useNavigate();

  // Subjects List state
  const [subjectsList, setSubjectsList] = useState([]);
  // Cohorts List state
  const [cohortsList, setCohortsList] = useState([]);

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
    easyCount: 2,
    mediumCount: 2,
    hardCount: 1
  });

  // UI / Status States
  const [formErrors, setFormErrors] = useState({});
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [generatedExam, setGeneratedExam] = useState(null);

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
        console.error('Error fetching dropdowns in ExamGenerate:', err);
      }
    };
    fetchDropdowns();
  }, []);

  // Input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'totalMarks' || name.endsWith('Count') ? Number(value) : value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
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

    const easy = parseInt(formData.easyCount, 10);
    const med = parseInt(formData.mediumCount, 10);
    const hard = parseInt(formData.hardCount, 10);
    
    if (isNaN(easy) || easy < 0) errs.easyCount = 'Must be 0 or more.';
    if (isNaN(med) || med < 0) errs.mediumCount = 'Must be 0 or more.';
    if (isNaN(hard) || hard < 0) errs.hardCount = 'Must be 0 or more.';

    if (!errs.easyCount && !errs.mediumCount && !errs.hardCount) {
      if (easy + med + hard < 1) {
        errs.easyCount = 'Total requested questions must be at least 1.';
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Generate Exam Submission
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (generating) return;
    setApiError('');
    setSuccessMsg('');
    if (!validateForm()) return;

    setGenerating(true);
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
        easyCount: Number(formData.easyCount),
        mediumCount: Number(formData.mediumCount),
        hardCount: Number(formData.hardCount)
      };

      const response = await examService.generateExam(payload);
      if (response && response.success && response.data) {
        setGeneratedExam(response.data);
        showToast.success('Exam generated successfully!');
        setSuccessMsg('Exam generated successfully! Below is a preview of the automatically selected questions.');
      } else {
        setApiError('Failed to automatically generate questions.');
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setApiError(err?.response?.data?.message || err?.message || (typeof err === 'string' ? err : '') || 'Failed to generate exam. Verify there are enough questions of this subject/difficulty in the bank.');
    } finally {
      setGenerating(false);
    }
  };

  // Publish newly generated exam
  const handlePublish = async () => {
    if (!generatedExam || publishing) return;
    setPublishing(true);
    setApiError('');
    setSuccessMsg('');
    try {
      const response = await examService.publishExam(generatedExam._id);
      if (response && response.success) {
        showToast.success('Exam published successfully!');
        setSuccessMsg('Assessment published successfully! Students can now access and attempt it.');
        setGeneratedExam(prev => ({ ...prev, status: 'published' }));
        setTimeout(() => {
          navigate('/teacher/exams');
        }, 2500);
      }
    } catch (err) {
      console.error('Publishing failed:', err);
      setApiError(err?.response?.data?.message || err?.message || (typeof err === 'string' ? err : '') || 'Failed to publish assessment.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6 select-none animate-[fadeIn_0.25s_ease-out]">
      {/* Page Title */}
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
            Automatic Exam Generation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Specify question counts by difficulty to generate a balanced assessment dynamically.
          </p>
        </div>
      </div>

      {apiError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {!generatedExam ? (
        /* Setup generation Form */
        <form onSubmit={handleGenerate} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main settings inputs */}
          <div className="lg:col-span-2 space-y-6">
            <Card hoverable={false}>
              <Card.Body className="p-6 space-y-5">
                <h3 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-neutral-500" />
                  <span>Exam Attributes</span>
                </h3>

                <Input
                  label="Exam Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  error={formErrors.title}
                  placeholder="e.g. Algorithmic Automation Quiz"
                />

                <Textarea
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Core guidelines or exam descriptions..."
                  rows={3}
                />

                <Select
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  error={formErrors.subject}
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
          </div>

          {/* Difficulty counts column */}
          <div className="space-y-6">
            <Card hoverable={false}>
              <Card.Body className="p-6 space-y-6">
                <h3 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-neutral-800" />
                  <span>Question Distribution</span>
                </h3>

                <p className="text-xs text-neutral-500 leading-relaxed">
                  Specify the exact quantity of questions to retrieve from each difficulty tier. Make sure your question bank has sufficient queries.
                </p>

                <div className="space-y-4">
                  <Input
                    label="Easy Questions Count"
                    type="number"
                    name="easyCount"
                    value={formData.easyCount}
                    onChange={handleInputChange}
                    error={formErrors.easyCount}
                    min="0"
                  />

                  <Input
                    label="Medium Questions Count"
                    type="number"
                    name="mediumCount"
                    value={formData.mediumCount}
                    onChange={handleInputChange}
                    error={formErrors.mediumCount}
                    min="0"
                  />

                  <Input
                    label="Hard Questions Count"
                    type="number"
                    name="hardCount"
                    value={formData.hardCount}
                    onChange={handleInputChange}
                    error={formErrors.hardCount}
                    min="0"
                  />
                </div>

                <div className="pt-2 border-t border-neutral-150 text-xs text-neutral-550 flex justify-between font-semibold">
                  <span>Total Questions:</span>
                  <span className="text-neutral-800 font-bold">
                    {Number(formData.easyCount) + Number(formData.mediumCount) + Number(formData.hardCount)} Questions
                  </span>
                </div>
              </Card.Body>
            </Card>

            <Button
              type="submit"
              disabled={generating}
              isLoading={generating}
              variant="primary"
              className="w-full py-3.5 flex items-center justify-center gap-2.5 text-sm"
              icon={Sparkles}
            >
              Generate Exam
            </Button>
          </div>
        </form>
      ) : (
        /* Preview Success Page */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Exam Summary */}
            <Card hoverable={false} className="h-fit">
              <Card.Body className="p-6 space-y-4">
                <h3 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-2">
                  Exam Overview
                </h3>
                
                <div className="space-y-3.5 text-xs text-neutral-600">
                  <div className="flex justify-between items-center">
                    <span>Title:</span>
                    <strong className="text-neutral-900 truncate max-w-[150px]">{generatedExam.title}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Subject:</span>
                    <strong className="text-neutral-900">{generatedExam.subject}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Duration:</span>
                    <strong className="text-neutral-900">{generatedExam.duration} Mins</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Marks:</span>
                    <strong className="text-neutral-900">{generatedExam.totalMarks} Marks</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Questions Selected:</span>
                    <strong className="text-neutral-900">{generatedExam.questions?.length || 0} Questions</strong>
                  </div>
                  <div className="flex justify-between items-center border-t border-neutral-100 pt-3">
                    <span>Status:</span>
                    <Badge variant={generatedExam.status === 'published' ? 'success' : 'warning'}>
                      {generatedExam.status}
                    </Badge>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Right: Questions list preview */}
            <Card hoverable={false} className="lg:col-span-2 min-h-[350px]">
              <Card.Body className="p-6 flex flex-col h-full">
                <h3 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-neutral-500" />
                  <span>Selected Questions Preview</span>
                </h3>

                <div className="mt-4 flex-1 overflow-y-auto max-h-[400px] pr-2 space-y-3">
                  {generatedExam.questions && generatedExam.questions.map((q, idx) => (
                    <div key={q._id || idx} className="p-3.5 bg-white border border-neutral-200 rounded-lg space-y-2">
                      <div className="flex justify-between items-center gap-2">
                        <Badge variant="neutral">
                          Q{idx + 1}
                        </Badge>
                        <div className="flex gap-2">
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
                          <span className="text-[11px] text-neutral-600 font-semibold">{q.marks} Marks</span>
                        </div>
                      </div>
                      <p className="text-xs text-neutral-800 leading-relaxed font-semibold">
                        {q.questionText}
                      </p>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

          </div>

          {/* Bottom actions footer */}
          <div className="flex gap-4 max-w-lg">
            <Button
              onClick={() => navigate('/teacher/exams')}
              variant="secondary"
              className="flex-1 py-3"
            >
              Back to Exams
            </Button>
            {generatedExam.status === 'draft' && (
              <Button
                onClick={handlePublish}
                disabled={publishing}
                isLoading={publishing}
                variant="primary"
                className="flex-1 py-3"
                icon={Check}
              >
                Publish Exam
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamGenerate;
