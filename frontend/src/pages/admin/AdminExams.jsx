import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Calendar, Clock, Award, Trash2, Globe, Eye, BookOpen, AlertCircle } from 'lucide-react';
import examService from '../../services/examService';
import { Card, Table, Input, Button, Badge, Select, LoadingState } from '../../components/common';
import showToast from '../../utils/toast';

export const AdminExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [error, setError] = useState('');

  const fetchExams = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await examService.getExams();
      if (response && response.success) {
        setExams(response.data.exams || []);
      } else {
        setError('Failed to retrieve exams from the database.');
      }
    } catch (err) {
      console.error('Error fetching exams for admin:', err);
      setError('Connection to assessment service failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this exam? This action is permanent and will delete all submissions.')) {
      return;
    }
    
    try {
      const response = await examService.deleteExam(examId);
      if (response && response.success) {
        showToast.success('Exam deleted successfully.');
        setExams(prev => prev.filter(e => e._id !== examId));
      } else {
        showToast.error('Failed to delete exam.');
      }
    } catch (err) {
      console.error('Error deleting exam:', err);
      showToast.error('An error occurred while deleting the exam.');
    }
  };

  const uniqueTeachers = [
    ...new Set(
      exams
        .map(e => e.createdBy?.name)
        .filter(Boolean)
    )
  ];

  const filteredExams = exams.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                          e.subject.toLowerCase().includes(search.toLowerCase()) ||
                          (e.description && e.description.toLowerCase().includes(search.toLowerCase()));
    
    const matchesStatus = !statusFilter || e.status === statusFilter;
    
    const matchesTeacher = !teacherFilter || e.createdBy?.name === teacherFilter;

    return matchesSearch && matchesStatus && matchesTeacher;
  });

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

  const formatDate = (dateString) => {
    if (!dateString) return 'Always Open';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const headers = [
    { label: 'Assessment Details' },
    { label: 'Subject / Course' },
    { label: 'Instructor' },
    { label: 'Duration' },
    { label: 'Total Marks', className: 'text-center' },
    { label: 'Questions count', className: 'text-center' },
    { label: 'Status' },
    { label: 'Created Date' },
    { label: 'Actions', className: 'text-right' }
  ];

  if (loading && exams.length === 0) {
    return <LoadingState message="Loading platform exams..." />;
  }

  return (
    <div className="space-y-6 select-none">
      {/* Title block */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Platform Exams Ledger
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Monitor draft, active, and completed exams set by platform teachers and instructors.
        </p>
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card hoverable={true}>
          <Card.Body className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-550">Total Exams Created</p>
              <h3 className="text-2xl font-bold text-neutral-900">{exams.length}</h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        <Card hoverable={true}>
          <Card.Body className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-550">Published Active Exams</p>
              <h3 className="text-2xl font-bold text-emerald-600">
                {exams.filter(e => e.status === 'published').length}
              </h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <Globe className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        <Card hoverable={true}>
          <Card.Body className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-550">Draft Status</p>
              <h3 className="text-2xl font-bold text-neutral-800">
                {exams.filter(e => e.status === 'draft').length}
              </h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter panel */}
      <Card>
        <Card.Body className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Search Input */}
          <div className="md:col-span-6">
            <Input
              placeholder="Search exams by title, description or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'closed', label: 'Closed' }
              ]}
            />
          </div>

          {/* Teacher Filter */}
          <div className="md:col-span-3">
            <Select
              label="Teacher"
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              options={[
                { value: '', label: 'All Teachers' },
                ...uniqueTeachers.map(name => ({ value: name, label: name }))
              ]}
            />
          </div>
        </Card.Body>
      </Card>

      {/* Table grid */}
      <Table
        headers={headers}
        data={filteredExams}
        isLoading={loading}
        renderRow={(exam) => (
          <tr key={exam._id} className="hover:bg-neutral-50/80 transition-colors border-b border-neutral-100 last:border-0">
            {/* Exam Details */}
            <td className="py-4 px-6 max-w-[285px]">
              <div>
                <div className="text-sm font-semibold text-neutral-900 truncate">
                  {exam.title}
                </div>
                <div className="text-xs text-neutral-500 truncate mt-0.5">
                  {exam.description || 'No description provided.'}
                </div>
              </div>
            </td>

            {/* Subject */}
            <td className="py-4 px-6 whitespace-nowrap">
              <Badge variant="neutral">
                {exam.subject}
              </Badge>
            </td>

            {/* Teacher Creator */}
            <td className="py-4 px-6 text-sm text-neutral-750 font-semibold whitespace-nowrap">
              {exam.createdBy?.name || 'Instructor'}
            </td>

            {/* Duration */}
            <td className="py-4 px-6 text-xs text-neutral-500 whitespace-nowrap">
              <div className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                {exam.duration} mins
              </div>
            </td>

            {/* Total Marks */}
            <td className="py-4 px-6 text-sm text-neutral-800 font-bold whitespace-nowrap text-center">
              <div className="flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-neutral-405" />
                {exam.totalMarks}
              </div>
            </td>

            {/* Questions count */}
            <td className="py-4 px-6 text-sm text-neutral-800 font-bold whitespace-nowrap text-center">
              {exam.questions?.length || 0}
            </td>

            {/* Status */}
            <td className="py-4 px-6 whitespace-nowrap">
              {getStatusBadge(exam.status)}
            </td>

            {/* Created date */}
            <td className="py-4 px-6 text-xs text-neutral-500 font-medium whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {formatDate(exam.createdAt)}
              </div>
            </td>

            {/* Actions */}
            <td className="py-4 px-6 text-xs whitespace-nowrap text-right">
              <div className="flex items-center justify-end gap-2">
                {/* View Details */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/admin/exams/${exam._id}`)}
                  icon={Eye}
                  className="text-neutral-700 hover:text-neutral-900 border-neutral-200"
                />

                {/* Delete */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDeleteExam(exam._id)}
                  icon={Trash2}
                  className="text-red-650 hover:text-red-750 border-neutral-200"
                />
              </div>
            </td>
          </tr>
        )}
      />
    </div>
  );
};

export default AdminExams;
