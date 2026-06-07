import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = ({ user, isCheckingSession }) => {
  if (isCheckingSession) {
    return (
      <div className="h-screen flex items-center justify-center bg-dark">
        <div className="flex justify-center items-center p-4">
          <div className="w-12 h-12 border-4 border-surface border-t-accent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
