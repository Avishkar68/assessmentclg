import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award, Calendar, Clock, Printer, Download, BookOpen,
  AlertCircle, X, CheckCircle2, Loader2, BarChart
} from 'lucide-react';
import resultsService from '../../services/resultsService';
import { Card, Button, Modal, Table } from '../../components/common';

export const StudentResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected result for detail card modal
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await resultsService.getStudentResults();
        if (response && response.success && response.data) {
          setResults(response.data.results || []);
        } else {
          setError('Failed to retrieve academic report ledger.');
        }
      } catch (err) {
        console.error('Failed to load student results:', err);
        setError('Connection to backend results service failed.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  // Calculations
  const totalCompleted = results.length;
  const averagePercentage = totalCompleted > 0
    ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalCompleted)
    : 0;
  const highestPercentage = totalCompleted > 0
    ? Math.max(...results.map(r => r.percentage))
    : 0;

  // Print Transcript using window.print()
  const handlePrint = () => {
    window.print();
  };

  // Download Transcript as text file
  const handleDownload = (res) => {
    const ex = res.exam;
    const reportText = `================================================
          FAVPROCT OFFICIAL ACADEMIC TRANSCRIPT
================================================

EXAM DETAILS:
------------------------------------------------
Exam Title  : ${ex.title}
Subject     : ${ex.subject}
Description : ${ex.description || 'N/A'}
Date Taken  : ${formatDate(res.createdAt)}

CANDIDATE SCORE CARD:
------------------------------------------------
Obtained Marks : ${res.obtainedMarks} / ${ex.totalMarks}
Percentage     : ${res.percentage}%
Grade Assigned : ${res.grade}
Final Exam Rank: Rank #${res.rank}

TEACHER EVALUATION FEEDBACK:
------------------------------------------------
Remarks Comments: 
${res.submission?.feedback || 'No comments provided.'}

================================================
Generated on: ${new Date().toLocaleString()}
FAVProct Verification Signature
================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Report_Card_${ex.title.replace(/\s+/g, '_')}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-neutral-900 animate-spin" />
        <p className="text-sm text-slate-500">Retrieving academic transcript data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      {/* Printable CSS inject */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-card, #printable-report-card * {
            visibility: visible;
          }
          #printable-report-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #fff !important;
            color: #000 !important;
            padding: 40px !important;
            border: 2px solid #000 !important;
          }
          #printable-report-card button, #printable-report-card .print-hide {
            display: none !important;
          }
        }
      `}} />

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          My Results
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review score certificates, performance statistics, and download graded reports.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-650 rounded-lg text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

        {/* Total Completed */}
        <Card hoverable={true} className="p-6 flex items-center justify-between group">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Exams Completed</p>
            <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{totalCompleted}</h3>
          </div>
          <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
        </Card>

        {/* Average Score percentage */}
        <Card hoverable={true} className="p-6 flex items-center justify-between group">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Average Percentage</p>
            <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
              {totalCompleted > 0 ? `${averagePercentage}%` : 'N/A'}
            </h3>
          </div>
          <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
        </Card>

        {/* Highest Score percentage */}
        <Card hoverable={true} className="p-6 flex items-center justify-between group">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Highest Score</p>
            <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">
              {totalCompleted > 0 ? `${highestPercentage}%` : 'N/A'}
            </h3>
          </div>
          <div className="p-2.5 bg-neutral-100 border border-neutral-200 text-neutral-800 rounded-xl">
            <BarChart className="w-5 h-5" />
          </div>
        </Card>

      </div>

      {/* Results listings table */}
      <Table
        headers={[
          'Assessment',
          'Subject',
          'Date Completed',
          'Obtained Marks',
          'Percentage',
          'Grade',
          'Rank',
          { label: 'Actions', className: 'text-right' }
        ]}
        data={results}
        emptyText="No graded reports found"
        emptyIcon={Award}
        renderRow={(res) => (
          <tr key={res._id} className="hover:bg-neutral-50/50 transition-colors">
            <td className="py-4 px-6 font-semibold text-neutral-900">{res.exam?.title}</td>
            <td className="py-4 px-6">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-neutral-100 text-neutral-800 border border-neutral-200 rounded">
                {res.exam?.subject}
              </span>
            </td>
            <td className="py-4 px-6 text-xs text-slate-500">{formatDate(res.createdAt)}</td>
            <td className="py-4 px-6 font-medium text-neutral-900">
              {res.obtainedMarks} / {res.exam?.totalMarks}
            </td>
            <td className="py-4 px-6 font-semibold">
              <span className={`px-2 py-0.5 text-xs rounded border ${res.percentage >= 80
                ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                : res.percentage >= 60
                  ? 'text-neutral-900 bg-neutral-100 border-neutral-200'
                  : 'text-amber-600 bg-amber-50 border-amber-200'
                }`}>
                {res.percentage}%
              </span>
            </td>
            <td className="py-4 px-6">
              <span className="font-bold text-neutral-800 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded text-xs">
                {res.grade}
              </span>
            </td>
            <td className="py-4 px-6">
              <span className="text-xs font-bold text-slate-500">
                #{res.rank}
              </span>
            </td>
            <td className="py-4 px-6 text-right">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedResult(res)}
              >
                View Report Card
              </Button>
            </td>
          </tr>
        )}
      />

      {/* Transcript Report Card Modal Popup */}
      <Modal
        isOpen={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        title="Academic Report Details"
        size="lg"
        footer={
          <div className="flex items-center gap-3 print-hide">
            {selectedResult?.submission && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/student/exams/${selectedResult.submission._id || selectedResult.submission}/review`)}
                icon={BookOpen}
              >
                Review Questions
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(selectedResult)}
              icon={Download}
            >
              Download
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              icon={Printer}
            >
              Print
            </Button>
          </div>
        }
      >
        {selectedResult && (
          <div className="p-2 select-text" id="printable-report-card">
            <div className="border border-neutral-200 p-6 space-y-6 bg-white text-center max-w-xl mx-auto rounded-xl shadow-sm">
              <div className="space-y-1">
                <div className="w-12 h-12 bg-neutral-100 border border-neutral-200 text-neutral-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold uppercase tracking-widest text-neutral-900 font-heading">
                  Official Report Card
                </h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">FAVProct Assessment Transcript</p>
              </div>

              <div className="border-t border-neutral-200 pt-4 text-xs space-y-3 max-w-sm mx-auto text-left text-slate-650">
                <div className="flex justify-between">
                  <span>Student Name:</span>
                  <strong className="text-neutral-900">{selectedResult.student?.name || 'Student Candidate'}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Subject:</span>
                  <strong className="text-neutral-900 font-bold uppercase">{selectedResult.exam?.subject}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Exam:</span>
                  <strong className="text-neutral-900 truncate max-w-[200px]">{selectedResult.exam?.title}</strong>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-3">
                  <span>Marks Obtained:</span>
                  <strong className="text-neutral-900">{selectedResult.obtainedMarks} / {selectedResult.exam?.totalMarks}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Percentage Score:</span>
                  <strong className="text-emerald-600 font-bold">{selectedResult.percentage}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Letter Grade:</span>
                  <strong className="text-neutral-800 font-bold bg-neutral-50 border border-neutral-200 px-2 py-0.2 rounded text-[11px]">{selectedResult.grade}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Class Standing Rank:</span>
                  <strong className="text-neutral-900 font-bold">Rank #{selectedResult.rank}</strong>
                </div>
              </div>

              {/* Overall Feedback Remarks */}
              <div className="border-t border-neutral-200 pt-4 text-left max-w-sm mx-auto text-xs space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Teacher Comments:</span>
                <p className="text-xs text-slate-650 bg-neutral-50 p-3 rounded-lg border border-neutral-200 leading-relaxed italic whitespace-pre-line">
                  "{selectedResult.submission?.feedback || 'No remarks provided.'}"
                </p>
              </div>

              <div className="pt-6 text-[10px] text-slate-500 border-t border-neutral-200 flex justify-between items-center max-w-sm mx-auto">
                <span>Authorized Signature</span>
                <span>Date: {formatDate(selectedResult.createdAt)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default StudentResults;
