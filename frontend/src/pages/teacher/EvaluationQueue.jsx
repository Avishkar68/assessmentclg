import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardCheck, Clock, BookOpen, AlertCircle, 
  CheckCircle2, Loader2, Search, ArrowRight, User 
} from 'lucide-react';
import submissionService from '../../services/submissionService';
import { Button, Card, Table, Input, Badge } from '../../components/common';

export const EvaluationQueue = () => {
  const navigate = useNavigate();

  // Data states
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await submissionService.getPendingSubmissions();
        if (response && response.success && response.data) {
          const list = Array.isArray(response.data) 
            ? response.data 
            : response.data.submissions || response.data.results || [];
          setSubmissions(list);
        } else {
          setError('Failed to load pending evaluations list.');
        }
      } catch (err) {
        console.error('Error fetching pending submissions:', err);
        setError('Connection to backend submission service failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  // Filter local listings
  const filteredSubmissions = submissions.filter(sub => {
    const studentName = sub.student?.name || '';
    const examTitle = sub.exam?.title || '';
    const query = search.toLowerCase();
    return studentName.toLowerCase().includes(query) || examTitle.toLowerCase().includes(query);
  });

  const headers = [
    { label: 'Student' },
    { label: 'Assessment' },
    { label: 'Subject' },
    { label: 'Submitted Date' },
    { label: 'Actions', className: 'text-right' }
  ];

  return (
    <div className="space-y-6 select-none animate-[fadeIn_0.25s_ease-out]">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Evaluation Queue
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review and grade student responses for pending Short Answer assessments.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card hoverable={false}>
        <Card.Body className="p-4 flex items-center gap-4">
          <div className="w-full md:max-w-md">
            <Input
              icon={Search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name or exam title..."
            />
          </div>
        </Card.Body>
      </Card>

      {/* Main Listings */}
      <Table
        headers={headers}
        data={filteredSubmissions}
        isLoading={loading}
        loadingText="Fetching pending submissions..."
        emptyText={submissions.length === 0 
          ? "All submitted student exams have been graded and evaluated successfully." 
          : "No pending evaluations match your current search criteria."}
        emptyIcon={ClipboardCheck}
        renderRow={(sub) => (
          <tr key={sub._id} className="hover:bg-neutral-50/50 transition-colors">
            <td className="py-4 px-6 font-medium">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-neutral-105 rounded border border-neutral-200 text-neutral-500">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="text-neutral-800">{sub.student?.name}</span>
              </div>
            </td>
            <td className="py-4 px-6 font-semibold text-neutral-900 truncate max-w-xs">{sub.exam?.title}</td>
            <td className="py-4 px-6">
              <Badge variant="neutral">
                {sub.exam?.subject}
              </Badge>
            </td>
            <td className="py-4 px-6 text-xs text-neutral-500">{formatDate(sub.submitTime)}</td>
            <td className="py-4 px-6 text-right">
              <Button
                onClick={() => navigate(sub._id)}
                variant="outline"
                size="sm"
                icon={ArrowRight}
                iconPosition="right"
                className="ml-auto group hover:bg-neutral-900 hover:text-white hover:border-transparent transition-all"
              >
                Evaluate
              </Button>
            </td>
          </tr>
        )}
      />
    </div>
  );
};

export default EvaluationQueue;
