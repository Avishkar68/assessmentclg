import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import ProtectedRoute from '../components/common/ProtectedRoute';
import RoleProtectedRoute from '../components/common/RoleProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';

// Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import AdminDashboard from '../pages/admin/AdminDashboard';
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import StudentDashboard from '../pages/student/StudentDashboard';
import QuestionBank from '../pages/teacher/QuestionBank';
import BulkUpload from '../pages/teacher/BulkUpload';
import ExamsList from '../pages/teacher/ExamsList';
import ExamForm from '../pages/teacher/ExamForm';
import ExamGenerate from '../pages/teacher/ExamGenerate';
import ExamSettings from '../pages/teacher/ExamSettings';
import EvaluationQueue from '../pages/teacher/EvaluationQueue';
import EvaluationForm from '../pages/teacher/EvaluationForm';
import ExamAttempt from '../pages/student/ExamAttempt';
import StudentResults from '../pages/student/StudentResults';
import TeacherResults from '../pages/teacher/TeacherResults';
import AdminResults from '../pages/admin/AdminResults';
import StudentAnalytics from '../pages/student/StudentAnalytics';
import TeacherAnalytics from '../pages/teacher/TeacherAnalytics';
import AdminAnalytics from '../pages/admin/AdminAnalytics';
import Profile from '../pages/Profile';
import ExamReview from '../pages/student/ExamReview';
import AuditLogs from '../pages/admin/AuditLogs';
import Landing from '../pages/Landing';
import NotFound from '../pages/NotFound';
import Teachers from '../pages/admin/Teachers';
import Students from '../pages/admin/Students';
import AdminExams from '../pages/admin/AdminExams';
import StudentExams from '../pages/student/StudentExams';
import TeacherForm from '../pages/admin/TeacherForm';
import StudentForm from '../pages/admin/StudentForm';
import AdminExamDetails from '../pages/admin/AdminExamDetails';
import AcademicSetup from '../pages/admin/AcademicSetup';

// Home redirect handler based on user role
const HomeRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (user.role === 'teacher') {
    return <Navigate to="/teacher/dashboard" replace />;
  } else if (user.role === 'student') {
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Root Path - SaaS Landing Page */}
      <Route path="/" element={<Landing />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['admin']} />
          </ProtectedRoute>
        }
      >
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="teachers/create" element={<TeacherForm />} />
          <Route path="teachers/:id/edit" element={<TeacherForm />} />
          <Route path="students" element={<Students />} />
          <Route path="students/create" element={<StudentForm />} />
          <Route path="students/:id/edit" element={<StudentForm />} />
          <Route path="academic" element={<AcademicSetup />} />
          <Route path="exams" element={<AdminExams />} />
          <Route path="exams/:id" element={<AdminExamDetails />} />
          <Route path="results" element={<AdminResults />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Protected Teacher Routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['teacher']} />
          </ProtectedRoute>
        }
      >
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="questions" element={<QuestionBank />} />
          <Route path="questions/upload" element={<BulkUpload />} />
          <Route path="exams" element={<ExamsList />} />
          <Route path="exams/create" element={<ExamForm />} />
          <Route path="exams/generate" element={<ExamGenerate />} />
          <Route path="exams/:id/edit" element={<ExamForm />} />
          <Route path="exams/:id/settings" element={<ExamSettings />} />
          <Route path="evaluation" element={<EvaluationQueue />} />
          <Route path="evaluation/:id" element={<EvaluationForm />} />
          <Route path="results" element={<TeacherResults />} />
          <Route path="analytics" element={<TeacherAnalytics />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Protected Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RoleProtectedRoute allowedRoles={['student']} />
          </ProtectedRoute>
        }
      >
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="exams" element={<StudentExams />} />
          <Route path="results" element={<StudentResults />} />
          <Route path="analytics" element={<StudentAnalytics />} />
          <Route path="profile" element={<Profile />} />
          <Route path="exams/:submissionId/review" element={<ExamReview />} />
        </Route>
        <Route path="exams/:examId/attempt" element={<ExamAttempt />} />
      </Route>

      {/* Catch-all 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
