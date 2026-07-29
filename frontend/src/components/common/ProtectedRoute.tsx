import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Loader from './Loader';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, token } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return <Loader />;
  }

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
