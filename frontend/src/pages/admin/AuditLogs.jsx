import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, ShieldAlert, Monitor, Globe, Clock } from 'lucide-react';
import auditService from '../../services/auditService';
import { Card, Table, Pagination, Button, Input, Select, Badge, LoadingState } from '../../components/common';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  // Fetch logs on page, action, or search change
  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await auditService.getAuditLogs({
        page,
        limit: 15,
        search: debouncedSearch,
        action: actionFilter
      });
      if (response && response.success) {
        setLogs(response.data.logs);
        setTotal(response.data.total);
        setPages(response.data.pages);
      } else {
        setError('Failed to fetch system logs.');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Connection to logging server failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, debouncedSearch]);

  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('');
    setPage(1);
  };

  const getActionBadge = (action) => {
    const variants = {
      login: 'success',
      logout: 'neutral',
      question_created: 'info',
      question_updated: 'neutral',
      exam_created: 'info',
      exam_published: 'success',
      evaluation_submitted: 'warning'
    };

    const labels = {
      login: 'Login',
      logout: 'Logout',
      question_created: 'Question Created',
      question_updated: 'Question Updated',
      exam_created: 'Exam Created',
      exam_published: 'Exam Published',
      evaluation_submitted: 'Evaluation Submitted'
    };

    return (
      <Badge variant={variants[action] || 'neutral'}>
        {labels[action] || action}
      </Badge>
    );
  };

  const formatDetails = (log) => {
    if (!log.details) return '-';
    
    if (log.action === 'login' || log.action === 'logout') {
      return `Account: ${log.details.email || 'N/A'}`;
    }
    if (log.action === 'question_created' || log.action === 'question_updated') {
      return `Q: ${log.details.questionText?.substring(0, 45) || 'N/A'}...`;
    }
    if (log.action === 'exam_created' || log.action === 'exam_published') {
      return `Exam: ${log.details.title || 'N/A'}`;
    }
    if (log.action === 'evaluation_submitted') {
      return `Submission evaluated (ID: ...${log.details.submissionId?.substring(20) || ''})`;
    }
    
    if (typeof log.details === 'object') {
      return JSON.stringify(log.details);
    }
    return String(log.details);
  };

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'question_created', label: 'Question Created' },
    { value: 'question_updated', label: 'Question Updated' },
    { value: 'exam_created', label: 'Exam Created' },
    { value: 'exam_published', label: 'Exam Published' },
    { value: 'evaluation_submitted', label: 'Evaluation Submitted' }
  ];

  const headers = [
    { label: 'Timestamp' },
    { label: 'User Details' },
    { label: 'Action Taken' },
    { label: 'Action Metadata' },
    { label: 'IP Address' },
    { label: 'Device / Agent' }
  ];

  if (loading && logs.length === 0) {
    return <LoadingState message="Loading system logs..." />;
  }

  return (
    <div className="space-y-6 select-none">
      {/* Title block */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          System Audit Logs
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Review and audit administrative actions, logins, and exam management logs.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-650" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter panel */}
      <Card>
        <Card.Body className="p-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* Search bar */}
          <div className="sm:col-span-6">
            <Input
              placeholder="Search logs by name, email, details or IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>

          {/* Action filters */}
          <div className="sm:col-span-4">
            <Select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              options={actionOptions}
            />
          </div>

          {/* Reset button */}
          <div className="sm:col-span-2">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              icon={RotateCcw}
              className="w-full py-2.5"
            >
              Reset
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Table grid */}
      <Table
        headers={headers}
        data={logs}
        isLoading={loading}
        renderRow={(log) => (
          <tr key={log._id} className="hover:bg-neutral-50/80 transition-colors border-b border-neutral-105 last:border-0">
            {/* Timestamp */}
            <td className="py-4 px-6 text-xs text-neutral-500 font-medium whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </td>

            {/* User */}
            <td className="py-4 px-6 whitespace-nowrap">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 flex items-center justify-center font-semibold text-xs">
                  {log.user?.name ? log.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {log.user?.name || 'Deleted User'}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {log.user?.email || 'N/A'} • <span className="uppercase text-[9px] font-bold text-neutral-900">{log.user?.role}</span>
                  </div>
                </div>
              </div>
            </td>

            {/* Action */}
            <td className="py-4 px-6 whitespace-nowrap">
              {getActionBadge(log.action)}
            </td>

            {/* Metadata */}
            <td className="py-4 px-6 text-sm text-neutral-700 font-medium">
              {formatDetails(log)}
            </td>

            {/* IP Address */}
            <td className="py-4 px-6 text-xs text-neutral-500 font-mono whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-neutral-400" />
                {log.ipAddress || '127.0.0.1'}
              </div>
            </td>

            {/* User Agent */}
            <td className="py-4 px-6 text-xs text-neutral-500 max-w-[200px] truncate" title={log.userAgent}>
              <div className="flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                {log.userAgent || 'Unknown'}
              </div>
            </td>
          </tr>
        )}
      />

      {/* Pagination control */}
      {!loading && logs.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={pages}
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  );
};

export default AuditLogs;
