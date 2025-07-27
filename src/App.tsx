
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ScrollToTop from './components/utils/ScrollToTop';
import AuthRoute from './components/auth/AuthRoute';
import AdminRoute from './components/admin/AdminRoute';
import ErrorBoundary from './components/utils/ErrorBoundary';
import NetworkStatusIndicator from './components/common/NetworkStatusIndicator';
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import BusinessDetailPage from './pages/BusinessDetailPage';
import BusinessListingPage from './pages/BusinessListingPage';
import BusinessSuccessPage from './pages/BusinessSuccessPage';
import CategoriesPage from './pages/CategoriesPage';
import ResourcesPage from './pages/ResourcesPage';
import VIPPage from './pages/MembersPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ClaimAccountPage from './pages/ClaimAccountPage';
import ClaimBusinessPage from './pages/ClaimBusinessPage';
import CollaborationPage from './pages/CollaborationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import SupportPage from './pages/SupportPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import FAQsPage from './pages/FAQsPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <ScrollToTop />
          <NetworkStatusIndicator />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/business/:id" element={<BusinessDetailPage />} />
            <Route 
              path="/business/new" 
              element={
                <AuthRoute>
                  <BusinessListingPage />
                </AuthRoute>
              } 
            />
            <Route 
              path="/business/success" 
              element={
                <AuthRoute>
                  <BusinessSuccessPage />
                </AuthRoute>
              } 
            />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/collaboration" element={<CollaborationPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/members" element={<VIPPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/claim-account" element={<ClaimAccountPage />} />
            <Route path="/claim-business" element={<ClaimBusinessPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/update-password" element={<UpdatePasswordPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route 
              path="/dashboard" 
              element={
                <AuthRoute>
                  <DashboardPage />
                </AuthRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AdminRoute requiredRole={['admin', 'editor']}>
                  <AdminDashboardPage />
                </AdminRoute>
              } 
            />
            <Route path="/faqs" element={<FAQsPage />} />
            
            {/* 404 Page - This must be the last route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
}

export default App;