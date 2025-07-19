import React from 'react';
import Header from './Header';
import Footer from './Footer';
import AnnouncementBar from '../common/AnnouncementBar';
import SignUpPromptModal from '../common/SignUpPromptModal';
import { useSignUpPrompt } from '../../hooks/useSignUpPrompt';
import SeoMeta from '../common/SeoMeta';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'business.business';
  twitterCard?: 'summary' | 'summary_large_image';
  businessName?: string;
  businessCategory?: string;
  businessLocation?: string;
  noindex?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children,
  title,
  description,
  image,
  url,
  type,
  twitterCard,
  businessName,
  businessCategory,
  businessLocation,
  noindex
}) => {
  const { 
    showPrompt, 
    setShowPrompt, 
    permanentlyDismiss, 
    temporarilyDismiss 
  } = useSignUpPrompt();

  return (
    <div className="min-h-screen flex flex-col">
      <SeoMeta
        title={title}
        description={description}
        image={image}
        url={url}
        type={type}
        twitterCard={twitterCard}
        businessName={businessName}
        businessCategory={businessCategory}
        businessLocation={businessLocation}
        noindex={noindex}
      />
      <AnnouncementBar />
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />

      {/* Sign Up Prompt Modal */}
      <SignUpPromptModal
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        onDismiss={temporarilyDismiss}
        onDontShowAgain={permanentlyDismiss}
      />
    </div>
  );
};

export default Layout;