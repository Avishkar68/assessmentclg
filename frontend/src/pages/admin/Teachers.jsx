import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, GraduationCap, Mail, Calendar, ShieldAlert, Award, UserCheck, 
  PlusCircle, Edit3, Trash2, Key, ToggleLeft, ToggleRight, X, Sparkles, RefreshCw
} from 'lucide-react';
import adminService from '../../services/adminService';
import { Card, Table, Input, Button, Modal, Badge, LoadingState } from '../../components/common';
import showToast from '../../utils/toast';

export const Teachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Password Reset Modal states
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getTeachers();
      if (response && response.success) {
        setTeachers(response.data || []);
      } else {
        setError('Failed to fetch teachers from the database.');
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError('Connection to backend teacher services failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleToggleStatus = async (teacher) => {
    setActionLoadingId(teacher._id);
    try {
      const response = await adminService.toggleTeacherStatus(teacher._id);
      if (response && response.success) {
        setTeachers(prev =>
          prev.map(t => (t._id === teacher._id ? { ...t, isActive: response.data.isActive } : t))
        );
        showToast.success(`Teacher account ${response.data.isActive ? 'activated' : 'deactivated'} successfully.`);
      }
    } catch (err) {
      console.error('Error toggling teacher status:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this teacher account? This action cannot be undone.')) {
      return;
    }

    setActionLoadingId(teacherId);
    try {
      const response = await adminService.deleteTeacher(teacherId);
      if (response && response.success) {
        setTeachers(prev => prev.filter(t => t._id !== teacherId));
        showToast.success('Teacher deleted successfully.');
      }
    } catch (err) {
      console.error('Error deleting teacher:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenResetModal = (teacher) => {
    setSelectedTeacher(teacher);
    setNewPassword('');
    setResetModalOpen(true);
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast.error('Password must be at least 6 characters.');
      return;
    }

    setResettingPassword(true);
    try {
      const response = await adminService.resetTeacherPassword(selectedTeacher._id, newPassword);
      if (response && response.success) {
        showToast.success(`Password reset successfully for ${selectedTeacher.name}.`);
        setResetModalOpen(false);
      }
    } catch (err) {
      console.error('Error resetting password:', err);
    } finally {
      setResettingPassword(false);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    (t.subject && t.subject.toLowerCase().includes(search.toLowerCase()))
  );

  const headers = [
    { label: 'Instructor' },
    { label: 'Primary Domain' },
    { label: 'Registry Date' },
    { label: 'Status' },
    { label: 'Actions', className: 'text-right' }
  ];

  if (loading && teachers.length === 0) {
    return <LoadingState message="Loading teacher records..." />;
  }

  return (
    <div className="space-y-6 select-none">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Teachers Registry
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Monitor exam authors, subject domain allocations, and total question bank contributions.
          </p>
        </div>
        <Button
          onClick={() => navigate('/admin/teachers/create')}
          icon={PlusCircle}
        >
          Add Teacher
        </Button>
      </div>

      {/* Registry Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card hoverable={true}>
          <Card.Body className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-505">Total Teachers</p>
              <h3 className="text-2xl font-bold text-neutral-900">{teachers.length}</h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        <Card hoverable={true}>
          <Card.Body className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-505">Active Instructors</p>
              <h3 className="text-2xl font-bold text-emerald-600">
                {teachers.filter(t => t.isActive).length}
              </h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <UserCheck className="w-5 h-5" />
            </div>
          </Card.Body>
        </Card>

        <Card hoverable={true}>
          <Card.Body className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-505">Deactivated</p>
              <h3 className="text-2xl font-bold text-red-600">
                {teachers.filter(t => !t.isActive).length}
              </h3>
            </div>
            <div className="p-3 bg-neutral-100 border border-neutral-200 text-neutral-700 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
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

      {/* Filter panel */}
      <Card>
        <Card.Body className="p-4 flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search teachers by name, email, or domain..."
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
        data={filteredTeachers}
        isLoading={loading}
        renderRow={(teacher) => (
          <tr key={teacher._id} className="hover:bg-neutral-50/80 transition-colors border-b border-neutral-100 last:border-0">
            {/* Instructor Profile */}
            <td className="py-4 px-6 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-900 flex items-center justify-center text-xs font-bold text-neutral-100 shadow-sm">
                  {teacher.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-905">
                    {teacher.name}
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                    <Mail className="w-3.5 h-3.5" />
                    {teacher.email}
                  </div>
                </div>
              </div>
            </td>

            {/* Subject Allocation */}
            <td className="py-4 px-6 whitespace-nowrap">
              <Badge variant="neutral">
                {teacher.subject || 'Unassigned'}
              </Badge>
            </td>

            {/* Registry date */}
            <td className="py-4 px-6 text-xs text-neutral-500 font-medium whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {new Date(teacher.createdAt).toLocaleDateString()}
              </div>
            </td>

            {/* Status */}
            <td className="py-4 px-6 whitespace-nowrap">
              <Badge variant={teacher.isActive ? 'success' : 'danger'}>
                {teacher.isActive ? 'active' : 'inactive'}
              </Badge>
            </td>

            {/* Actions */}
            <td className="py-4 px-6 whitespace-nowrap text-right">
              <div className="flex items-center justify-end gap-2">
                {/* Edit */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/teachers/${teacher._id}/edit`)}
                  icon={Edit3}
                  disabled={actionLoadingId === teacher._id}
                  className="py-1 px-2 border-neutral-200"
                />

                {/* Password reset */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenResetModal(teacher)}
                  icon={Key}
                  disabled={actionLoadingId === teacher._id}
                  className="py-1 px-2 text-amber-600 hover:text-amber-700 border-neutral-200"
                />

                {/* Toggle Status */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleStatus(teacher)}
                  icon={teacher.isActive ? ToggleRight : ToggleLeft}
                  disabled={actionLoadingId === teacher._id}
                  className={`py-1 px-2 border-neutral-200 ${
                    teacher.isActive ? 'text-emerald-600 hover:text-emerald-700' : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                />

                {/* Delete */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteTeacher(teacher._id)}
                  icon={Trash2}
                  disabled={actionLoadingId === teacher._id}
                  className="py-1 px-2 text-red-600 hover:text-red-700 border-neutral-200"
                />
              </div>
            </td>
          </tr>
        )}
      />

      {/* Password Reset Modal */}
      {resetModalOpen && selectedTeacher && (
        <Modal
          isOpen={resetModalOpen}
          onClose={() => setResetModalOpen(false)}
          title={`Reset Credentials: ${selectedTeacher.name}`}
        >
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-2">
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs leading-relaxed">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600" />
              <span>Warning: This will immediately override this teacher's password. They will need to log in using the new credentials.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase block">New Password</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePassword}
                  icon={Sparkles}
                  className="px-3"
                >
                  Generate
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-neutral-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetModalOpen(false)}
                disabled={resettingPassword}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={resettingPassword}
                icon={RefreshCw}
                className="bg-amber-600 hover:bg-amber-700 text-white border-none"
              >
                Reset Password
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Teachers;
