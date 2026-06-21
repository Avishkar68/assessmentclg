import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Edit, Trash2, Image as ImageIcon, 
  PlusCircle, Trash, ShieldAlert, Database, FileSpreadsheet
} from 'lucide-react';
import questionService from '../../services/questionService';
import adminService from '../../services/adminService';
import { Button, Card, Modal, Pagination, Input, Select, Textarea, CardSkeleton, Badge, EmptyState } from '../../components/common';
import showToast from '../../utils/toast';

export const QuestionBank = () => {
  const navigate = useNavigate();

  // Dynamic Subjects List from backend
  const [subjectsList, setSubjectsList] = useState([]);

  // Listing states
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination & Filter states
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');

  // Form / Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null means creating
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  
  // Delete confirm modal state
  const [deleteId, setDeleteId] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    type: 'MCQ',
    questionText: '',
    questionImage: '',
    subject: '',
    chapter: '',
    difficulty: 'Medium',
    marks: 5,
    options: ['', ''],
    correctAnswer: '',
    expectedAnswer: '',
  });

  const [formErrors, setFormErrors] = useState({});

  // Load questions
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 8,
        search: search.trim() || undefined,
        subject: subject || undefined,
        difficulty: difficulty || undefined,
      };
      
      const response = await questionService.getQuestions(params);
      if (response && response.success && response.data) {
        setQuestions(response.data.results || []);
        setPages(response.data.pages || 1);
      } else {
        setError('Failed to retrieve question library listings.');
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Connection to backend question service failed.');
    } finally {
      setLoading(false);
    }
  }, [page, search, subject, difficulty]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Fetch subjects from database
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await adminService.getSubjects();
        if (response && response.success) {
          setSubjectsList(response.data || []);
        }
      } catch (err) {
        console.error('Error fetching subjects in QuestionBank:', err);
      }
    };
    fetchSubjects();
  }, []);

  // Reset filter helpers
  const handleClearFilters = () => {
    setSearch('');
    setSubject('');
    setDifficulty('');
    setPage(1);
  };

  // Drawer toggles
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormErrors({});
    setFormData({
      type: 'MCQ',
      questionText: '',
      questionImage: '',
      subject: '',
      chapter: '',
      difficulty: 'Medium',
      marks: 5,
      options: ['', ''],
      correctAnswer: '',
      expectedAnswer: '',
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (q) => {
    setEditingId(q._id);
    setFormErrors({});
    setFormData({
      type: q.type,
      questionText: q.questionText || '',
      questionImage: q.questionImage || '',
      subject: q.subject || '',
      chapter: q.chapter || '',
      difficulty: q.difficulty || 'Medium',
      marks: q.marks || 5,
      options: q.options && q.options.length ? [...q.options] : ['', ''],
      correctAnswer: q.correctAnswer || '',
      expectedAnswer: q.expectedAnswer || '',
    });
    setDrawerOpen(true);
  };

  // Image Upload Action
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    setApiFormError('');

    try {
      const response = await questionService.uploadQuestionImage(file);
      if (response && response.success && response.data?.imageUrl) {
        setFormData((prev) => ({ ...prev, questionImage: response.data.imageUrl }));
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      setApiFormError(err || 'Failed to upload image. Max file size: 2MB.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, questionImage: '' }));
  };

  // Dynamic Options Modifiers
  const handleOptionChange = (index, value) => {
    setFormData((prev) => {
      const updatedOpts = [...prev.options];
      updatedOpts[index] = value;
      return { ...prev, options: updatedOpts };
    });
  };

  const handleAddOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, ''],
    }));
  };

  const handleRemoveOption = (index) => {
    setFormData((prev) => {
      if (prev.options.length <= 2) return prev; // Keep at least 2 options
      const updatedOpts = prev.options.filter((_, i) => i !== index);
      
      // Reset correct answer selection if the deleted index was correct
      let correct = prev.correctAnswer;
      if (prev.correctAnswer === prev.options[index]) {
        correct = '';
      }

      return {
        ...prev,
        options: updatedOpts,
        correctAnswer: correct,
      };
    });
  };

  // Client validations
  const [apiFormError, setApiFormError] = useState('');
  
  const validateForm = () => {
    const errs = {};
    if (!formData.questionText.trim()) errs.questionText = 'Question text is required.';
    if (!formData.subject.trim()) errs.subject = 'Subject classification is required.';
    if (!formData.chapter.trim()) errs.chapter = 'Chapter designation is required.';
    if (formData.marks <= 0) errs.marks = 'Marks must be greater than zero.';
    
    if (formData.type === 'MCQ') {
      const filteredOptions = formData.options.filter((o) => o.trim() !== '');
      if (filteredOptions.length < 2) {
        errs.options = 'At least 2 non-empty options are required for MCQ.';
      }
      if (!formData.correctAnswer.trim()) {
        errs.correctAnswer = 'Please specify the correct answer.';
      } else if (!formData.options.includes(formData.correctAnswer)) {
        errs.correctAnswer = 'Correct answer must match one of the options.';
      }
    } else {
      if (!formData.expectedAnswer.trim()) {
        errs.expectedAnswer = 'Expected model answer is required for evaluation.';
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submitting) return;
    setApiFormError('');

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        type: formData.type,
        questionText: formData.questionText,
        questionImage: formData.questionImage || undefined,
        subject: formData.subject,
        chapter: formData.chapter,
        difficulty: formData.difficulty,
        marks: Number(formData.marks),
      };

      if (formData.type === 'MCQ') {
        payload.options = formData.options.filter(o => o.trim() !== '');
        payload.correctAnswer = formData.correctAnswer;
      } else {
        payload.expectedAnswer = formData.expectedAnswer;
      }

      if (editingId) {
        await questionService.updateQuestion(editingId, payload);
        showToast.success('Question updated successfully!');
      } else {
        await questionService.createQuestion(payload);
        showToast.success('Question created successfully!');
      }
      
      setDrawerOpen(false);
      fetchQuestions();
    } catch (err) {
      console.error('Error saving question:', err);
      setApiFormError(err || 'Failed to persist question details.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;

    try {
      await questionService.deleteQuestion(deleteId);
      setDeleteId(null);
      fetchQuestions();
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err || 'Failed to remove the question.');
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 select-none relative animate-[fadeIn_0.25s_ease-out]">
      {/* Upper header action row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Question Bank
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain your repository of MCQ and Short Answer questions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('upload')}
            icon={FileSpreadsheet}
          >
            Bulk Upload
          </Button>

          <Button
            onClick={handleOpenCreate}
            icon={Plus}
          >
            New Question
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm animate-fade-in">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search controls */}
      <Card hoverable={false} className="p-4 flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="w-full md:flex-1">
          <Input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search questions by text..."
            icon={Search}
            className="!py-2"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap sm:flex-nowrap gap-4 w-full md:w-auto shrink-0">
          <div className="w-full sm:w-44">
            <Select
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setPage(1); }}
              options={[
                { value: '', label: 'All Subjects' },
                ...subjectsList.map(sub => sub.name)
              ]}
              className="py-2"
            />
          </div>

          <div className="w-full sm:w-44">
            <Select
              value={difficulty}
              onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
              options={[
                { value: '', label: 'All Difficulties' },
                'Easy',
                'Medium',
                'Hard',
              ]}
              className="py-2"
            />
          </div>

          <Button
            onClick={handleClearFilters}
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
          >
            Clear
          </Button>
        </div>
      </Card>

      {/* Questions list display */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <CardSkeleton key={idx} variant="list" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <EmptyState
          title="No questions found"
          description="Try adjusting your search criteria, clearing filters, or create a new question."
          icon={Database}
          actionText="Create Question"
          onActionClick={handleOpenCreate}
        />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {questions.map((q) => (
              <Card 
                key={q._id} 
                className="p-5 flex flex-col sm:flex-row justify-between items-start gap-4"
              >
                {/* Info area */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral" className="uppercase">
                      {q.type}
                    </Badge>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {q.subject} • {q.chapter}
                    </span>
                    <Badge variant={
                      q.difficulty === 'Easy' 
                        ? 'success'
                        : q.difficulty === 'Medium'
                        ? 'warning'
                        : 'danger'
                    } className="uppercase">
                      {q.difficulty}
                    </Badge>
                    <Badge variant="neutral">
                      {q.marks} Marks
                    </Badge>
                  </div>

                  <p className="text-sm font-semibold text-neutral-800 leading-relaxed truncate-2-lines pr-4">
                    {q.questionText}
                  </p>

                  {q.questionImage && (
                    <Badge variant="info" className="gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>Has Attached Image Asset</span>
                    </Badge>
                  )}
                </div>

                {/* Actions row */}
                <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenEdit(q)}
                    className="!p-2 text-neutral-500 hover:text-neutral-900 border-neutral-200 rounded-lg shrink-0 w-full sm:w-auto"
                    title="Edit"
                    icon={Edit}
                  >
                    <span className="sm:hidden">Edit</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(q._id)}
                    className="!p-2 text-neutral-400 hover:text-red-650 hover:bg-red-50 border-neutral-200 hover:border-red-200 rounded-lg shrink-0 w-full sm:w-auto"
                    title="Delete"
                    icon={Trash2}
                  >
                    <span className="sm:hidden">Delete</span>
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination controls */}
          <Pagination
            currentPage={page}
            totalPages={pages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Modal Dialog for Create/Edit */}
      <Modal
        isOpen={drawerOpen}
        onClose={() => !submitting && setDrawerOpen(false)}
        title={editingId ? 'Edit Question Details' : 'Create New Question'}
        size="lg"
        footer={
          <div className="flex gap-4 w-full">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => setDrawerOpen(false)}
              className="flex-1 py-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || imageUploading}
              onClick={handleSubmit}
              isLoading={submitting}
              className="flex-1 py-3"
            >
              Save Question
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {apiFormError && (
            <div className="flex items-start gap-3 p-4 bg-red-55 border border-red-200 text-red-800 rounded-lg text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{apiFormError}</span>
            </div>
          )}

          {/* Type Switch Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block">
              Question Format
            </label>
            <div className="grid grid-cols-2 gap-4">
              {['MCQ', 'Short Answer'].map((t) => (
                <Button
                  key={t}
                  type="button"
                  disabled={editingId !== null} // Format locked in edit mode
                  onClick={() => setFormData(prev => ({ ...prev, type: t }))}
                  variant={formData.type === t ? 'primary' : 'secondary'}
                  className={`w-full py-3 ${editingId ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {t}
                </Button>
              ))}
            </div>
          </div>

          {/* Question Text */}
          <Textarea
            label="Question Text"
            value={formData.questionText}
            onChange={(e) => setFormData(prev => ({ ...prev, questionText: e.target.value }))}
            placeholder="Type question content details here..."
            error={formErrors.questionText}
          />

          {/* Image Upload Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block">
              Question Image (Optional)
            </label>
            {formData.questionImage ? (
              <div className="relative border border-neutral-200 rounded-lg p-2 bg-neutral-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3 truncate">
                  <img 
                    src={formData.questionImage} 
                    alt="Question asset preview" 
                    className="w-12 h-12 object-cover rounded border border-neutral-200"
                  />
                  <span className="text-xs text-neutral-600 truncate max-w-xs">
                    {formData.questionImage}
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleRemoveImage}
                  size="sm"
                  className="text-red-655 hover:bg-red-50 border-red-200 hover:border-red-200"
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="relative border border-dashed border-neutral-200 hover:border-neutral-300 rounded-lg bg-neutral-50/50 p-6 text-center cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={imageUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                {imageUploading ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-neutral-550">Uploading asset to Cloudinary...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="w-8 h-8 text-neutral-450" />
                    <span className="text-xs font-semibold text-neutral-650">Click to Upload JPG/PNG/WEBP</span>
                    <span className="text-[10px] text-slate-500">Maximum allowed size: 2MB</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Categorization Row */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              error={formErrors.subject}
              options={[
                { value: '', label: 'Select Subject' },
                ...subjectsList.map(sub => sub.name)
              ]}
            />
            <Input
              label="Chapter"
              value={formData.chapter}
              onChange={(e) => setFormData(prev => ({ ...prev, chapter: e.target.value }))}
              placeholder="e.g. React Hooks"
              error={formErrors.chapter}
            />
          </div>

          {/* Difficulty & Marks Row */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Difficulty"
              value={formData.difficulty}
              onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
              options={['Easy', 'Medium', 'Hard']}
            />
            <Input
              label="Marks"
              type="number"
              min="1"
              value={formData.marks}
              onChange={(e) => setFormData(prev => ({ ...prev, marks: e.target.value }))}
              error={formErrors.marks}
            />
          </div>

          {/* Format Specific Fields */}
          {formData.type === 'MCQ' ? (
            <div className="space-y-4 border-t border-neutral-155 pt-6">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  MCQ Options list
                </label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddOption}
                  icon={PlusCircle}
                >
                  Add Option
                </Button>
              </div>

              {formErrors.options && (
                <span className="text-xs text-red-655 block">{formErrors.options}</span>
              )}

              {/* Render Options Fields */}
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="text-xs font-bold text-neutral-650 w-5 shrink-0">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1} content text`}
                      className="py-2"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={formData.options.length <= 2}
                      onClick={() => handleRemoveOption(index)}
                      className="!p-2.5 text-neutral-505 hover:text-red-650 hover:bg-red-50 border-neutral-200 shrink-0"
                      icon={Trash}
                    />
                  </div>
                ))}
              </div>

              {/* MCQ Correct Answer dropdown selector */}
              <Select
                label="Mark Correct Answer Option"
                value={formData.correctAnswer}
                onChange={(e) => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
                options={[
                  { value: '', label: 'Select Correct Choice' },
                  ...formData.options.filter(o => o.trim() !== '').map((o, index) => ({
                    value: o,
                    label: `Option ${String.fromCharCode(65 + index)}: ${o}`,
                  })),
                ]}
                error={formErrors.correctAnswer}
              />
            </div>
          ) : (
            <div className="space-y-4 border-t border-neutral-155 pt-6">
              <Textarea
                label="Expected Model Correct Answer text"
                value={formData.expectedAnswer}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedAnswer: e.target.value }))}
                placeholder="Provide a reference correct model answer text for this Short Answer question..."
                error={formErrors.expectedAnswer}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Question?"
        footer={
          <div className="flex gap-4 w-full">
            <Button
              onClick={() => setDeleteId(null)}
              variant="secondary"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="danger"
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        }
      >
        <div className="text-center py-4">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4 animate-pulse" />
          <p className="text-sm text-neutral-600 leading-relaxed">
            Are you sure you want to permanently delete this question? This action is irreversible and will remove it from any draft exams.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default QuestionBank;
