import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User, Mail, BookOpen, Lock, ShieldAlert, GraduationCap } from 'lucide-react';
import adminService from '../../services/adminService';
import { Card, Button, Input, Select, LoadingState } from '../../components/common';
import showToast from '../../utils/toast';

export const TeacherForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [cohort, setCohort] = useState('');
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
      const fetchTeacher = async () => {
        setLoading(true);
        setError('');
        try {
          const response = await adminService.getTeacherById(id);
          if (response && response.success && response.data) {
            setName(response.data.name || '');
            setEmail(response.data.email || '');
            setSubject(response.data.subject || '');
            setCohort(response.data.cohort || '');
          } else {
            setError('Failed to load teacher details.');
          }
        } catch (err) {
          console.error('Error fetching teacher:', err);
          setError('Could not connect to the database registry.');
        } finally {
          setLoading(false);
        }
      };
      fetchTeacher();
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

    const payload = { name, email, subject, cohort };
    if (!isEditMode) {
      payload.password = password;
    }

    try {
      let response;
      if (isEditMode) {
        response = await adminService.updateTeacher(id, payload);
      } else {
        response = await adminService.createTeacher(payload);
      }

      if (response && response.success) {
        showToast.success(`Teacher account ${isEditMode ? 'updated' : 'created'} successfully.`);
        navigate('/admin/teachers');
      } else {
        setError(response.message || 'An error occurred.');
      }
    } catch (err) {
      console.error('Error saving teacher:', err);
      setError(err?.message || 'Connection to the user administration service failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading teacher credentials..." />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 select-none">
      {/* Header action */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/teachers')}
          className="p-2 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-xl cursor-pointer transition-colors text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            {isEditMode ? 'Edit Instructor' : 'Add New Teacher'}
          </h1>
          <p className="text-sm text-neutral-550 mt-1">
            {isEditMode ? 'Update account details and course domain settings.' : 'Provision a new teacher account and set access credentials.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-655" />
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
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Jane Smith"
                icon={User}
              />
              {validationErrors.name && (
                <span className="text-xs text-red-505 block mt-1">{validationErrors.name}</span>
              )}
            </div>

            {/* Email Field */}
            <div>
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. janesmith@university.edu"
                icon={Mail}
              />
              {validationErrors.email && (
                <span className="text-xs text-red-505 block mt-1">{validationErrors.email}</span>
              )}
            </div>

            {/* Subject Selection Dropdown */}
            <Select
              label="Primary Subject / Course Domain"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              options={[
                { value: '', label: 'Select a Subject' },
                ...subjectsList.map(sub => ({ value: sub.name, label: sub.name }))
              ]}
              icon={BookOpen}
            />

            {/* Class/Cohort Selection Dropdown */}
            <Select
              label="Assigned Class / Section"
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              options={[
                { value: '', label: 'Select a Class' },
                ...cohortsList.map(c => ({ value: c.name, label: c.name }))
              ]}
              icon={GraduationCap}
            />

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
                  <span className="text-xs text-red-550 block mt-1">{validationErrors.password}</span>
                )}
              </div>
            )}

            {/* Footer Submit Button */}
            <div className="pt-4 border-t border-neutral-200 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/teachers')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={submitting}
                icon={Save}
              >
                {isEditMode ? 'Save Changes' : 'Create Account'}
              </Button>
            </div>
          </form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TeacherForm;
