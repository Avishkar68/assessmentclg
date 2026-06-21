import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import GlobalLoader from './GlobalLoader';

export const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <GlobalLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Role not authorized. Redirect them to their role's natural default home route.
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'teacher') {
      return <Navigate to="/teacher" replace />;
    } else if (user.role === 'student') {
      return <Navigate to="/student" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return children ? children : <Outlet />;
};

export default RoleProtectedRoute;
