import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, 
  Download, Trash2, ArrowLeft, Loader2, FileText, AlertTriangle 
} from 'lucide-react';
import questionService from '../../services/questionService';
import { Button, Card, Table, Badge } from '../../components/common';

export const BulkUpload = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // States
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  
  // UI states
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('valid');

  // Handle Drag actions
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Process selected file
  const processFile = async (selectedFile) => {
    setError('');
    setSuccessMsg('');
    
    // Check file extension
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv') {
      setError('Unsupported format. Only Excel (.xlsx) and CSV (.csv) formats are allowed.');
      return;
    }

    setFile(selectedFile);
    setLoadingPreview(true);

    try {
      const response = await questionService.uploadBulkQuestions(selectedFile, true);
      if (response && response.success && response.data) {
        setPreviewData(response.data);
        if (response.data.invalidCount > 0) {
          setActiveTab('invalid');
        } else {
          setActiveTab('valid');
        }
      } else {
        setError('Failed to validate the spreadsheet document.');
        setFile(null);
      }
    } catch (err) {
      console.error('Error generating preview:', err);
      setError(err || 'Failed to parse the file headers. Please check template formatting.');
      setFile(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Templates Downloads
  const downloadExcelTemplate = async () => {
    try {
      await questionService.downloadExcelTemplate();
    } catch (err) {
      console.error('Excel template download failed:', err);
      setError('Failed to download Excel template.');
    }
  };

  const downloadCsvTemplate = async () => {
    try {
      await questionService.downloadCsvTemplate();
    } catch (err) {
      console.error('CSV template download failed:', err);
      setError('Failed to download CSV template.');
    }
  };

  // Full Import
  const handleImportSubmit = async () => {
    if (!file) return;

    setLoadingImport(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await questionService.uploadBulkQuestions(file, false);
      if (response && response.success) {
        setSuccessMsg(response.message || 'Questions imported successfully.');
        setPreviewData(null);
        setFile(null);
        setTimeout(() => {
          navigate('/teacher/questions');
        }, 2000);
      }
    } catch (err) {
      console.error('Import failed:', err);
      setError(err || 'Import operation failed. Check that questions do not violate database schemas.');
    } finally {
      setLoadingImport(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData(null);
    setError('');
    setSuccessMsg('');
  };

  const previewHeaders = [
    { label: 'Row', className: 'w-16' },
    { label: 'Type', className: 'w-20' },
    { label: 'Question Text' },
    { label: 'Subject', className: 'w-36' },
    { label: 'Difficulty', className: 'w-28' },
    { label: 'Marks', className: 'w-20' }
  ];

  return (
    <div className="space-y-6 select-none animate-[fadeIn_0.25s_ease-out]">
      {/* Navigation and Title header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => navigate('/teacher/questions')}
          variant="secondary"
          size="sm"
          icon={ArrowLeft}
          className="p-2"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Bulk Question Upload
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Import multiple questions at once using Excel or CSV sheets.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Workspace split */}
      {!previewData && !loadingPreview ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Drag & Drop Card */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center min-h-[350px] transition-all relative ${
                dragActive 
                  ? 'border-neutral-900 bg-neutral-900/[0.02]' 
                  : 'border-neutral-200 bg-neutral-50/50 hover:border-neutral-350'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .csv"
                onChange={handleChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-16 h-16 text-neutral-400 mb-4" />
              <h3 className="text-lg font-bold text-neutral-850">Drag & Drop Spreadsheet here</h3>
              <p className="text-xs text-neutral-500 mt-2">or click to browse your directories</p>
              <div className="mt-6 flex gap-2">
                <Badge variant="neutral">.XLSX</Badge>
                <Badge variant="neutral">.CSV</Badge>
              </div>
            </div>
          </div>

          {/* Right: Download Guidelines & Templates card */}
          <Card hoverable={false} className="h-fit">
            <Card.Body className="p-6 space-y-6">
              <h3 className="text-base font-bold text-neutral-900">Guidelines</h3>
              <ul className="text-xs text-neutral-500 space-y-2.5 list-disc pl-4 leading-relaxed">
                <li>Spreadsheets must contain standard header rows.</li>
                <li>Required columns: <code>type</code>, <code>questionText</code>, <code>difficulty</code>, <code>subject</code>, <code>chapter</code>, <code>marks</code>.</li>
                <li>MCQ questions require option lists separated by semicolons (e.g. <code>Option A; Option B; Option C</code>) and a matching <code>correctAnswer</code>.</li>
                <li>Short Answer questions require an <code>expectedAnswer</code> text.</li>
              </ul>

              <div className="border-t border-neutral-100 pt-6 space-y-3">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                  Download Template Sheets
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={downloadExcelTemplate}
                    variant="secondary"
                    size="sm"
                    icon={Download}
                  >
                    Excel Template
                  </Button>
                  <Button
                    onClick={downloadCsvTemplate}
                    variant="secondary"
                    size="sm"
                    icon={Download}
                  >
                    CSV Template
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      ) : loadingPreview ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-10 h-10 text-neutral-900 animate-spin" />
          <p className="text-sm font-semibold text-neutral-500 animate-pulse">
            Analyzing headers and validating question sets...
          </p>
        </div>
      ) : (
        /* Preview Data Display Page */
        <div className="space-y-6">
          {/* Summary Row */}
          <div className="grid grid-cols-3 gap-6">
            <Card hoverable={false}>
              <Card.Body className="p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Rows</p>
                <h3 className="text-2xl font-extrabold text-neutral-900 mt-1">{previewData.totalRows}</h3>
              </Card.Body>
            </Card>

            <Card hoverable={false}>
              <Card.Body className="p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Valid Rows</p>
                <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{previewData.validCount}</h3>
              </Card.Body>
            </Card>

            <Card hoverable={false}>
              <Card.Body className="p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Invalid Rows</p>
                <h3 className="text-2xl font-extrabold text-red-650 mt-1">{previewData.invalidCount}</h3>
              </Card.Body>
            </Card>
          </div>

          {/* Nav Tabs */}
          <div className="flex border-b border-neutral-200 gap-6">
            <button
              onClick={() => setActiveTab('valid')}
              className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition-all ${
                activeTab === 'valid'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Valid Rows ({previewData.validCount})
            </button>
            <button
              onClick={() => setActiveTab('invalid')}
              className={`pb-3 text-sm font-bold border-b-2 cursor-pointer transition-all ${
                activeTab === 'invalid'
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              Invalid Rows ({previewData.invalidCount})
            </button>
          </div>

          {/* Tabs Content */}
          <Card hoverable={false} className="overflow-hidden">
            {activeTab === 'valid' ? (
              previewData.validCount === 0 ? (
                <Card.Body className="p-8 text-center text-neutral-500 text-sm">
                  No valid rows to preview. Fix validation errors in the sheet.
                </Card.Body>
              ) : (
                <Table
                  headers={previewHeaders}
                  data={previewData.validRows}
                  renderRow={(item) => (
                    <tr key={item.rowNumber} className="hover:bg-neutral-50/50">
                      <td className="py-3 px-4 text-neutral-500 font-bold">{item.rowNumber}</td>
                      <td className="py-3 px-4">
                        <Badge variant="neutral" className="uppercase">
                          {item.question.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-neutral-800 font-medium truncate max-w-md">
                        {item.question.questionText}
                      </td>
                      <td className="py-3 px-4 text-neutral-600 font-semibold">{item.question.subject}</td>
                      <td className="py-3 px-4">
                        <Badge variant={
                          item.question.difficulty === 'Easy' 
                            ? 'success'
                            : item.question.difficulty === 'Medium'
                            ? 'warning'
                            : 'danger'
                        } className="uppercase">
                          {item.question.difficulty}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">{item.question.marks}</td>
                    </tr>
                  )}
                />
              )
            ) : (
              /* Invalid Rows Tab */
              previewData.invalidCount === 0 ? (
                <Card.Body className="p-8 text-center text-neutral-500 text-sm">
                  Excellent! Zero validation errors found in this sheet.
                </Card.Body>
              ) : (
                <Card.Body className="p-0 divide-y divide-neutral-100">
                  {previewData.invalidRows.map((item) => (
                    <div key={item.rowNumber} className="p-5 hover:bg-neutral-50/20 flex flex-col sm:flex-row justify-between items-start gap-4">
                      {/* Left: Row & Errors */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="danger">
                            Row {item.rowNumber}
                          </Badge>
                          <span className="text-xs text-neutral-500 font-semibold">
                            (Contains {item.errors.length} validation errors)
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {item.errors.map((err, i) => (
                            <li key={i} className="text-xs text-red-650 flex items-start gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span>{err}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Right: Raw row snippet */}
                      <div className="w-full sm:w-80 shrink-0 text-[10px] font-mono text-neutral-650 border border-neutral-200 rounded bg-neutral-50/50 p-3 overflow-hidden select-text leading-relaxed">
                        <div className="font-bold text-neutral-500 mb-1 border-b border-neutral-100 pb-1 uppercase tracking-wider">Raw Input Data</div>
                        {Object.entries(item.rowRawData)
                          .filter(([_, v]) => v !== undefined && v !== '')
                          .map(([k, v]) => (
                            <div key={k} className="truncate">
                              <strong className="text-neutral-500">{k}:</strong> {v.toString()}
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </Card.Body>
              )
            )}
          </Card>

          {/* Action trigger row */}
          <div className="flex gap-4">
            <Button
              onClick={handleReset}
              variant="secondary"
              className="flex-1 py-3"
            >
              Upload Different File
            </Button>
            <Button
              onClick={handleImportSubmit}
              disabled={previewData.validCount === 0 || loadingImport}
              isLoading={loadingImport}
              variant="primary"
              className="flex-1 py-3"
            >
              Import Questions ({previewData.validCount})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
