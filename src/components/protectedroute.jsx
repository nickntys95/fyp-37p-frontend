import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '../context/session';

const ProtectedRoute = () => {
  const { isLoggedIn, loading } = useSession();
  if(loading) {
    return <div>Loading...</div>
  }
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;