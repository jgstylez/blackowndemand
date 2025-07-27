import React from 'react';
import Layout from '../components/layout/Layout';
import RegisterForm from '../components/auth/RegisterForm';

const SignupPage = () => {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <RegisterForm />
      </div>
    </Layout>
  );
};

export default SignupPage;