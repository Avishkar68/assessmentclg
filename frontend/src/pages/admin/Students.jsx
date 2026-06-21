import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Users, Mail, BookOpen, Clock, UserCheck, Tag, Upload, Download, 
  X, HelpCircle, FileText, CheckCircle2, ShieldAlert, PlusCircle, Edit3, Trash2
} from 'lucide-react';
import adminService from '../../services/adminService';
import { Card, Table, Input, Button, Modal, Badge, LoadingState } from '../../components/common';
import showToast from '../../utils/toast';

export const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Assign Batch Modal state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newCohort, setNewCohort] = useState('');
  const [updatingBatch, setUpdatingBatch] = useState(false);

  // Bulk Upload Modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPreview, setIsPreview] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [uploadErrors, setUploadErrors] = useState([]);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getStudents();
      if (response && response.success) {
        setStudents(response.data || []);
      } else {
        setError('Failed to fetch students list.');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Connection to backend candidate services failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this student account? This action cannot be undone.')) {
      return;
    }

    setActionLoadingId(studentId);
    try {
      const response = await adminService.deleteStudent(studentId);
      if (response && response.success) {
        setStudents(prev => prev.filter(s => s._id !== studentId));
        showToast.success('Student account removed.');
      }
    } catch (err) {
      console.error('Error deleting student:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenBatchModal = (student) => {
    setSelectedStudent(student);
    setNewCohort(student.cohort || '');
    setBatchModalOpen(true);
  };

  const handleAssignBatchSubmit = async (e) => {
    e.preventDefault();
    setUpdatingBatch(true);
    try {
      const response = await adminService.assignStudentBatch(selectedStudent._id, newCohort);
      if (response && response.success) {
        setStudents(prev =>
          prev.map(s => (s._id === selectedStudent._id ? { ...s, cohort: response.data.cohort } : s))
        );
        showToast.success(`Batch successfully assigned to ${selectedStudent.name}.`);
        setBatchModalOpen(false);
      }
    } catch (err) {
      console.error('Error assigning batch:', err);
    } finally {
      setUpdatingBatch(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResults(null);
      setUploadErrors([]);
    }
  };

  const handleBulkUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast.error('Please choose a valid file first.');
      return;
    }

    setUploadLoading(true);
    setUploadErrors([]);
    setUploadResults(null);

    try {
      const response = await adminService.uploadBulkStudents(selectedFile, isPreview);
      if (response && response.success) {
        setUploadResults(response.data);
        if (!isPreview) {
          showToast.success(`Import completed. Added ${response.data.importedCount} student accounts.`);
          fetchStudents(); // reload list
        } else {
          showToast.success('Validation completed. No formatting errors found.');
        }
      } else {
        if (response.data?.errors) {
          setUploadErrors(response.data.errors);
        } else {
          setError(response.message || 'An error occurred during sheet parsing.');
        }
      }
    } catch (err) {
      console.error('Error uploading students bulk list:', err);
      if (err?.response?.data?.data?.errors) {
        setUploadErrors(err.response.data.data.errors);
      } else {
        showToast.error('Failed to parse upload spreadsheet.');
      }
    } finally {
      setUploadLoading(false);
    }
  };

  const downloadSampleTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,email,password,cohort\nJohn Doe,johndoe@school.edu,password123,Section A\nJane Smith,janesmith@school.edu,password123,Section B";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_bulk_import_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.cohort && s.cohort.toLowerCase().includes(search.toLowerCase()))
  );

  const headers = [
    { label: 'Student Name' },
    { label: 'Cohort / Section' },
    { label: 'Exams Completed', className: 'text-center' },
    { label: 'Status' },
    { label: 'Actions', className: 'text-right' }
  ];

  if (loading && students.length === 0) {
    return <LoadingState message="Loading candidate records..." />;
  }

  return (
    <div className="space-y-6 select-none">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Students Registry
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Provision, assign cohorts, and batch-upload registered students on the exam platform.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setUploadModalOpen(true)}
            icon={Upload}
          >
            Bulk Import
          </Button>
          <Button
            onClick={() => navigate('/admin/students/create')}
            icon={PlusCircle}
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card hoverable={true}>
          <Card.Body className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-505">Registered Students</p>
              <h3 className="text-2xl font-bold text-neutral-900">{students.length}</h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        <Card hoverable={true}>
          <Card.Body className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-505">Assigned Cohorts</p>
              <h3 className="text-2xl font-bold text-neutral-900">
                {new Set(students.map(s => s.cohort).filter(Boolean)).size} Batches
              </h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        <Card hoverable={true}>
          <Card.Body className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-550">Unassigned Students</p>
              <h3 className="text-2xl font-bold text-amber-600">
                {students.filter(s => !s.cohort).length} Candidates
              </h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <Tag className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search panel */}
      <Card>
        <Card.Body className="p-4 flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search students by name, email, or batch cohort..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={Search}
            />
          </div>
          {search && (
            <Button variant="outline" onClick={() => setSearch('')}>
              Clear
            </Button>
          )}
        </Card.Body>
      </Card>

      {/* Table grid */}
      <Table
        headers={headers}
        data={filteredStudents}
        isLoading={loading}
        renderRow={(student) => (
          <tr key={student._id} className="hover:bg-neutral-50/80 transition-colors border-b border-neutral-100 last:border-0">
            {/* Student Info */}
            <td className="py-4 px-6 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-neutral-100 shadow-sm">
                  {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-905">
                    {student.name}
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    {student.email}
                  </div>
                </div>
              </div>
            </td>

            {/* Batch Cohort */}
            <td className="py-4 px-6 whitespace-nowrap">
              <Badge variant={student.cohort ? 'neutral' : 'warning'}>
                {student.cohort || 'Unassigned'}
              </Badge>
            </td>

            {/* Exams completed count */}
            <td className="py-4 px-6 text-sm text-neutral-800 font-semibold whitespace-nowrap text-center">
              0
            </td>

            {/* Status */}
            <td className="py-4 px-6 whitespace-nowrap">
              <Badge variant={student.isActive ? 'success' : 'danger'}>
                {student.isActive ? 'active' : 'inactive'}
              </Badge>
            </td>

            {/* Actions */}
            <td className="py-4 px-6 whitespace-nowrap text-right">
              <div className="flex items-center justify-end gap-2">
                {/* Edit */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/students/${student._id}/edit`)}
                  icon={Edit3}
                  disabled={actionLoadingId === student._id}
                  className="py-1 px-2 border-neutral-200"
                />

                {/* Assign Batch */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenBatchModal(student)}
                  icon={Tag}
                  disabled={actionLoadingId === student._id}
                  className="py-1 px-2 text-neutral-600 hover:text-neutral-905 border-neutral-200"
                />

                {/* Delete */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteStudent(student._id)}
                  icon={Trash2}
                  disabled={actionLoadingId === student._id}
                  className="py-1 px-2 text-red-600 hover:text-red-700 border-neutral-200"
                />
              </div>
            </td>
          </tr>
        )}
      />

      {/* Modal: Assign Batch */}
      {batchModalOpen && selectedStudent && (
        <Modal
          isOpen={batchModalOpen}
          onClose={() => setBatchModalOpen(false)}
          title={`Assign Batch: ${selectedStudent.name}`}
        >
          <form onSubmit={handleAssignBatchSubmit} className="space-y-4 pt-2">
            <div>
              <Input
                label="Batch / Cohort Identifier"
                value={newCohort}
                onChange={(e) => setNewCohort(e.target.value)}
                placeholder="e.g. Class 2026 - Group Alpha"
                icon={Tag}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBatchModalOpen(false)}
                disabled={updatingBatch}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={updatingBatch}
                icon={CheckCircle2}
              >
                Assign Batch
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Bulk Upload */}
      {uploadModalOpen && (
        <Modal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          title="Bulk Import Student Accounts"
        >
          <form onSubmit={handleBulkUploadSubmit} className="space-y-4 pt-2">
            <div className="flex items-start gap-2.5 p-3 bg-neutral-50 border border-neutral-200 text-neutral-700 rounded-lg text-xs leading-relaxed">
              <HelpCircle className="w-5 h-5 shrink-0 text-neutral-500" />
              <div>
                <p className="font-semibold text-neutral-900">Instructions:</p>
                <p className="mt-1">Provide a spreadsheet containing the headers: <strong>name</strong>, <strong>email</strong>, <strong>password</strong>, and <strong>cohort</strong>.</p>
                <button 
                  type="button" 
                  onClick={downloadSampleTemplate}
                  className="mt-2 text-neutral-900 hover:text-neutral-750 font-semibold underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Template</span>
                </button>
              </div>
            </div>

            {/* Mode selection toggle */}
            <div className="flex gap-4 p-1 bg-neutral-100 border border-neutral-200 rounded-xl">
              <button
                type="button"
                onClick={() => setIsPreview(true)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isPreview 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Preview Mode
              </button>
              <button
                type="button"
                onClick={() => setIsPreview(false)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  !isPreview 
                    ? 'bg-white text-neutral-900 shadow-sm' 
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Commit Mode
              </button>
            </div>

            {/* File picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-550 block">Upload Spreadsheet (XLSX / CSV)</label>
              <div className="relative border border-dashed border-neutral-300 rounded-xl p-6 text-center hover:bg-neutral-50/50 cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-neutral-700">
                  {selectedFile ? selectedFile.name : 'Choose file or drag & drop here'}
                </p>
                <p className="text-[10px] text-neutral-450 mt-1">Accepts file size up to 5MB</p>
              </div>
            </div>

            {/* Error messages reporting spreadsheet errors */}
            {uploadErrors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                <p className="font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                  <span>Validation errors found:</span>
                </p>
                <ul className="list-disc pl-4 space-y-0.5 font-medium">
                  {uploadErrors.map((err, i) => (
                     <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Results preview details */}
            {uploadResults && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Spreadsheet Validated!</span>
                </p>
                <p>Parsed rows: <strong>{uploadResults.totalRows}</strong></p>
                {!isPreview && (
                  <p>Accounts provisioned: <strong>{uploadResults.importedCount}</strong></p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadModalOpen(false)}
                disabled={uploadLoading}
              >
                Close
              </Button>
              <Button
                type="submit"
                isLoading={uploadLoading}
                icon={Upload}
                disabled={!selectedFile}
              >
                {isPreview ? 'Verify spreadsheet' : 'Execute Import'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Students;
