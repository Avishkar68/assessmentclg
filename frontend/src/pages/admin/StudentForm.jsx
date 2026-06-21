import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, Lock, ShieldAlert, GraduationCap } from 'lucide-react';
import adminService from '../../services/adminService';
import { Card, Button, Input, Select, LoadingState } from '../../components/common';
import showToast from '../../utils/toast';

export const StudentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cohort, setCohort] = useState('');
  const [studentSubjects, setStudentSubjects] = useState([]);
  const [password, setPassword] = useState('');
  
  const [subjectsList, setSubjectsList] = useState([]);
  const [cohortsList, setCohortsList] = useState([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [subjsRes, cohortsRes] = await Promise.all([
          adminService.getSubjects(),
          adminService.getClassRooms()
        ]);
        if (subjsRes && subjsRes.success) setSubjectsList(subjsRes.data || []);
        if (cohortsRes && cohortsRes.success) setCohortsList(cohortsRes.data || []);
      } catch (err) {
        console.error('Error fetching dropdowns:', err);
      }
    };
    fetchDropdowns();

    if (isEditMode) {
      const fetchStudent = async () => {
        setLoading(true);
        setError('');
        try {
          const response = await adminService.getStudentById(id);
          if (response && response.success && response.data) {
            setName(response.data.name || '');
            setEmail(response.data.email || '');
            setCohort(response.data.cohort || '');
            setStudentSubjects(response.data.subjects || []);
          } else {
            setError('Failed to load student details.');
          }
        } catch (err) {
          console.error('Error fetching student:', err);
          setError('Could not connect to the database registry.');
        } finally {
          setLoading(false);
        }
      };
      fetchStudent();
    }
  }, [id, isEditMode]);

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Name is required.';
    if (!email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    
    if (!isEditMode) {
      if (!password) {
        errors.password = 'Password is required for new accounts.';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!validateForm()) return;

    setSubmitting(true);
    setError('');

    const payload = { name, email, cohort, subjects: studentSubjects };
    if (!isEditMode) {
      payload.password = password;
    }

    try {
      let response;
      if (isEditMode) {
        response = await adminService.updateStudent(id, payload);
      } else {
        response = await adminService.createStudent(payload);
      }

      if (response && response.success) {
        showToast.success(`Student account ${isEditMode ? 'updated' : 'created'} successfully.`);
        navigate('/admin/students');
      } else {
        setError(response.message || 'An error occurred.');
      }
    } catch (err) {
      console.error('Error saving student:', err);
      setError(err?.message || 'Connection to the student administration service failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading student credentials..." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 select-none">
      {/* Header action */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/students')}
          className="p-2 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-xl cursor-pointer transition-colors text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            {isEditMode ? 'Edit Candidate Details' : 'Register New Student'}
          </h1>
          <p className="text-sm text-neutral-550 mt-1">
            {isEditMode ? 'Modify registration cohort, name or communication email.' : 'Enlist a new candidate to the exam platform.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <Card>
        <Card.Body className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <Input
                label="Student Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                icon={User}
              />
              {validationErrors.name && (
                <span className="text-xs text-red-500 block mt-1">{validationErrors.name}</span>
              )}
            </div>

            {/* Email Field */}
            <div>
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. johndoe@school.edu"
                icon={Mail}
              />
              {validationErrors.email && (
                <span className="text-xs text-red-500 block mt-1">{validationErrors.email}</span>
              )}
            </div>

            {/* Class/Cohort Selection Dropdown */}
            <Select
              label="Cohort / Class Allocation"
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              options={[
                { value: '', label: 'Select a Class' },
                ...cohortsList.map(c => ({ value: c.name, label: c.name }))
              ]}
              icon={GraduationCap}
            />

            {/* Subjects Selection List (Checkboxes) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-500 uppercase block">Enrolled Subjects</label>
              {subjectsList.length === 0 ? (
                <p className="text-xs text-neutral-500">No subjects defined in the platform. Add subjects first.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-xl max-h-[150px] overflow-y-auto">
                  {subjectsList.map(sub => {
                    const isChecked = studentSubjects.includes(sub.name);
                    return (
                      <label key={sub._id} className="flex items-center gap-2 text-xs text-neutral-700 font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStudentSubjects(prev => [...prev, sub.name]);
                            } else {
                              setStudentSubjects(prev => prev.filter(s => s !== sub.name));
                            }
                          }}
                          className="rounded text-neutral-900 focus:ring-neutral-900 w-4 h-4 bg-white border-neutral-300"
                        />
                        <span>{sub.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Password (Only in Create Mode) */}
            {!isEditMode && (
              <div>
                <Input
                  label="Initial Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={Lock}
                />
                {validationErrors.password && (
                  <span className="text-xs text-red-500 block mt-1">{validationErrors.password}</span>
                )}
              </div>
            )}

            {/* Footer Submit Button */}
            <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/students')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={submitting}
                icon={Save}
              >
                {isEditMode ? 'Save Changes' : 'Register Account'}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default StudentForm;
