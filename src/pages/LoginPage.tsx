import React, { useEffect } from 'react';
import { useLocation, Navigate, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    // Check if user was trying to perform a specific action
    const pendingAction = sessionStorage.getItem('pendingAction');
    
    if (user && pendingAction) {
      sessionStorage.removeItem('pendingAction');
      
      // Redirect based on the pending action
      if (pendingAction === 'claim-business') {
        navigate('/claim-business');
      } else if (pendingAction === 'become-vip') {
        navigate('/members?action=payment');
      }
    }
  }, [user, navigate]);

  if (user) {
    return <Navigate to={from} replace />;
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </Layout>
  );
};

export default LoginPage;