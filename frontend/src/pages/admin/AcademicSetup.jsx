import React, { useState, useEffect } from 'react';
import { BookOpen, Layers, Plus, Trash2, ShieldAlert } from 'lucide-react';
import adminService from '../../services/adminService';
import { Card, Button, Input, LoadingState } from '../../components/common';
import showToast from '../../utils/toast';

export const AcademicSetup = () => {
  const [subjects, setSubjects] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Creation states
  const [newSubject, setNewSubject] = useState('');
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [newCohort, setNewCohort] = useState('');
  const [creatingCohort, setCreatingCohort] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [subjectsRes, cohortsRes] = await Promise.all([
        adminService.getSubjects(),
        adminService.getClassRooms()
      ]);
      if (subjectsRes && subjectsRes.success) {
        setSubjects(subjectsRes.data || []);
      }
      if (cohortsRes && cohortsRes.success) {
        setCohorts(cohortsRes.data || []);
      }
    } catch (err) {
      console.error('Error loading academic data:', err);
      setError('Could not retrieve academic parameters from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim() || creatingSubject) return;

    setCreatingSubject(true);
    try {
      const response = await adminService.createSubject(newSubject.trim());
      if (response && response.success) {
        showToast.success('Subject added successfully.');
        setNewSubject('');
        setSubjects(prev => [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        showToast.error(response.message || 'Failed to create subject.');
      }
    } catch (err) {
      console.error('Error creating subject:', err);
      showToast.error(err?.message || 'Error occurred while saving subject.');
    } finally {
      setCreatingSubject(false);
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the subject "${name}"? Teachers and students assigned to this subject will lose association.`)) {
      return;
    }

    try {
      const response = await adminService.deleteSubject(id);
      if (response && response.success) {
        showToast.success('Subject removed.');
        setSubjects(prev => prev.filter(s => s._id !== id));
      }
    } catch (err) {
      console.error('Error deleting subject:', err);
      showToast.error('Failed to delete subject.');
    }
  };

  const handleAddCohort = async (e) => {
    e.preventDefault();
    if (!newCohort.trim() || creatingCohort) return;

    setCreatingCohort(true);
    try {
      const response = await adminService.createClassRoom(newCohort.trim());
      if (response && response.success) {
        showToast.success('Class added successfully.');
        setNewCohort('');
        setCohorts(prev => [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        showToast.error(response.message || 'Failed to create class.');
      }
    } catch (err) {
      console.error('Error creating class:', err);
      showToast.error(err?.message || 'Error occurred while saving class.');
    } finally {
      setCreatingCohort(false);
    }
  };

  const handleDeleteCohort = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the class "${name}"? Students and teachers assigned to this class will lose association.`)) {
      return;
    }

    try {
      const response = await adminService.deleteClassRoom(id);
      if (response && response.success) {
        showToast.success('Class removed.');
        setCohorts(prev => prev.filter(c => c._id !== id));
      }
    } catch (err) {
      console.error('Error deleting class:', err);
      showToast.error('Failed to delete class.');
    }
  };

  if (loading) {
    return <LoadingState message="Loading academic configurations..." />;
  }

  return (
    <div className="space-y-6 select-none">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Academic Configuration Setup
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Manage system courses/subjects and class cohorts available for teachers and student enrollments.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-650 animate-pulse" />
          <span>{error}</span>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Subjects Management */}
        <Card>
          <Card.Body className="p-6 flex flex-col justify-between min-h-[450px] space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-neutral-800" />
                <h3 className="text-lg font-semibold text-neutral-900">Subjects Directory ({subjects.length})</h3>
              </div>

              {/* Create Subject Form inline */}
              <form onSubmit={handleAddSubject} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="e.g. Mathematics, Science"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={creatingSubject}
                  icon={Plus}
                  className="px-4 py-2"
                >
                  Add
                </Button>
              </form>

              {/* Subjects list */}
              {subjects.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 text-neutral-500 text-xs">
                  No subjects registered yet. Add a subject above.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {subjects.map((sub) => (
                    <div 
                      key={sub._id} 
                      className="flex justify-between items-center p-3 bg-white border border-neutral-200 rounded-xl hover:border-neutral-350 transition-colors shadow-2xs"
                    >
                      <span className="text-xs font-semibold text-neutral-805">{sub.name}</span>
                      <button
                        onClick={() => handleDeleteSubject(sub._id, sub.name)}
                        className="p-1.5 text-red-650 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* Right Column: Classes/Cohorts Management */}
        <Card>
          <Card.Body className="p-6 flex flex-col justify-between min-h-[450px] space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-neutral-800" />
                <h3 className="text-lg font-semibold text-neutral-900">Classes / Cohorts Setup ({cohorts.length})</h3>
              </div>

              {/* Create Class Form inline */}
              <form onSubmit={handleAddCohort} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="e.g. Grade 10, Batch A"
                    value={newCohort}
                    onChange={(e) => setNewCohort(e.target.value)}
                    className="w-full text-xs"
                  />
                </div>
                <Button
                  type="submit"
                  isLoading={creatingCohort}
                  icon={Plus}
                  className="px-4 py-2"
                >
                  Add
                </Button>
              </form>

              {/* Cohorts list */}
              {cohorts.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-neutral-200 rounded-xl bg-neutral-50/50 text-neutral-500 text-xs">
                  No classes registered yet. Add a class above.
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {cohorts.map((c) => (
                    <div 
                      key={c._id} 
                      className="flex justify-between items-center p-3 bg-white border border-neutral-200 rounded-xl hover:border-neutral-350 transition-colors shadow-2xs"
                    >
                      <span className="text-xs font-semibold text-neutral-805">{c.name}</span>
                      <button
                        onClick={() => handleDeleteCohort(c._id, c.name)}
                        className="p-1.5 text-red-655 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

      </div>
    </div>
  );
};

export default AcademicSetup;
