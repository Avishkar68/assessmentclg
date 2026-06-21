import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Calendar, Clock, BookOpen, AlertCircle, CheckCircle2, 
  Trash2, Edit, Search, AlertTriangle, Sparkles, Settings 
} from 'lucide-react';
import examService from '../../services/examService';
import { Button, Card, Modal, Input, Select, CardSkeleton, Badge, EmptyState } from '../../components/common';
import showToast from '../../utils/toast';

export const ExamsList = () => {
  const navigate = useNavigate();
  
  // Data states
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Local filter states
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  // Delete & Publish Modal states
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [publishId, setPublishId] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const fetchExams = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await examService.getExams();
      if (response && response.success && response.data) {
        setExams(response.data.exams || []);
      } else {
        setError('Failed to load exam details.');
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
      setError('Connection to backend exam service failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    setError('');
    setSuccess('');
    try {
      const response = await examService.deleteExam(deleteId);
      if (response && response.success) {
        setSuccess('Exam deleted successfully.');
        setExams(prev => prev.filter(e => e._id !== deleteId));
        setDeleteId(null);
      }
    } catch (err) {
      console.error('Failed to delete exam:', err);
      setError(err || 'Failed to delete the selected exam.');
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async () => {
    if (!publishId) return;
    setPublishing(true);
    setError('');
    setSuccess('');
    try {
      const response = await examService.publishExam(publishId);
      if (response && response.success) {
        showToast.success('Exam published successfully!');
        setSuccess('Exam published successfully. Students can now view and attempt this exam.');
        setExams(prev => prev.map(e => e._id === publishId ? { ...e, status: 'published' } : e));
        setPublishId(null);
      }
    } catch (err) {
      console.error('Failed to publish exam:', err);
      setError(err || 'Failed to publish exam. Make sure it contains questions.');
      setPublishId(null);
    } finally {
      setPublishing(false);
    }
  };

  // Filter calculations
  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(search.toLowerCase()) || 
                          (exam.description && exam.description.toLowerCase().includes(search.toLowerCase()));
    const matchesSubject = subjectFilter === '' || exam.subject === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  // Extract unique subjects for the filter dropdown
  const uniqueSubjects = Array.from(new Set(exams.map(e => e.subject).filter(Boolean)));

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="space-y-6 select-none animate-[fadeIn_0.25s_ease-out]">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Exam Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, update, delete, and publish assessments for your students.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate('generate')}
            icon={Sparkles}
          >
            Auto Generate
          </Button>

          <Button
            onClick={() => navigate('create')}
            icon={Plus}
          >
            Create Exam
          </Button>
        </div>
      </div>

      {/* API Alerts */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card hoverable={false} className="p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:flex-1">
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exams by title or description..."
            icon={Search}
            className="!py-2"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
          <Select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            options={[
              { value: '', label: 'All Subjects' },
              ...uniqueSubjects.map(sub => ({ value: sub, label: sub }))
            ]}
            className="w-full md:w-48"
          />

          {(search !== '' || subjectFilter !== '') && (
            <Button
              onClick={() => { setSearch(''); setSubjectFilter(''); }}
              variant="secondary"
              size="sm"
              className="w-full md:w-auto"
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Exams Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <CardSkeleton key={idx} variant="grid" />
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <EmptyState
          title="No exams found"
          description={exams.length === 0 
            ? 'Get started by creating your very first assessment.' 
            : 'No exams match your current search queries or subject filter.'}
          icon={BookOpen}
          actionText={exams.length === 0 ? 'Create Exam' : null}
          onActionClick={exams.length === 0 ? () => navigate('create') : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <Card 
              key={exam._id} 
              hoverable={true}
              className="flex flex-col justify-between h-full"
            >
              {/* Header Status Badge and Subject */}
              <div className="p-5 pb-3 border-b border-neutral-100">
                <div className="flex justify-between items-center gap-2 mb-2">
                  <Badge variant="neutral">
                    {exam.subject}
                  </Badge>
                  
                  <Badge variant={
                    exam.status === 'published' 
                      ? 'success'
                      : exam.status === 'closed'
                      ? 'danger'
                      : 'warning'
                  }>
                    {exam.status}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-neutral-900 line-clamp-1">
                  {exam.title}
                </h3>
                {exam.description && (
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2 min-h-[2rem]">
                    {exam.description}
                  </p>
                )}
              </div>

              {/* Statistics details */}
              <div className="p-5 py-4 space-y-3 flex-1">
                <div className="flex items-center text-xs text-neutral-600 gap-2">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  <span className="font-semibold text-neutral-500">Duration:</span>
                  <span className="text-neutral-800">{exam.duration} Minutes</span>
                </div>

                <div className="flex items-center text-xs text-neutral-600 gap-2">
                  <BookOpen className="w-4 h-4 text-neutral-400" />
                  <span className="font-semibold text-neutral-500">Questions:</span>
                  <span className="text-neutral-800">{exam.questions?.length || 0} Questions ({exam.totalMarks} Marks)</span>
                </div>

                <div className="border-t border-neutral-100 pt-3 space-y-2 text-[11px] text-neutral-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span><strong>Starts:</strong> {formatDate(exam.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span><strong>Ends:</strong> {formatDate(exam.endTime)}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex gap-2 rounded-b-2xl">
                {exam.status === 'draft' ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPublishId(exam._id)}
                      className="flex-1"
                      icon={CheckCircle2}
                    >
                      Publish
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`${exam._id}/edit`)}
                      className="flex-1"
                      icon={Edit}
                    >
                      Edit
                    </Button>
                  </>
                ) : (
                  <div className="flex-1 text-center py-2 text-xs font-semibold text-neutral-500 border border-neutral-200 rounded-lg bg-neutral-50">
                    Exam is {exam.status}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`${exam._id}/settings`)}
                  className="!p-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 border-neutral-200 rounded-lg shrink-0"
                  icon={Settings}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(exam._id)}
                  className="!p-2 text-neutral-400 hover:text-red-650 hover:bg-red-50 border-neutral-200 hover:border-red-200 rounded-lg shrink-0"
                  icon={Trash2}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Assessment?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleting}
            >
              Delete Exam
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-sm leading-relaxed text-neutral-600">
            Are you sure you want to delete this exam? This action is permanent and cannot be undone. Associated student submissions and grades might be affected.
          </p>
        </div>
      </Modal>

      {/* Publish Confirmation Modal */}
      <Modal
        isOpen={!!publishId}
        onClose={() => setPublishId(null)}
        title="Publish Assessment?"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setPublishId(null)}
              disabled={publishing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handlePublish}
              isLoading={publishing}
            >
              Publish Exam
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-sm leading-relaxed text-neutral-600">
            This will transition the exam from Draft to Published, making it active for students to take at the scheduled Start Time. You will no longer be able to edit or modify the exam or its selected question sets after publishing.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ExamsList;
