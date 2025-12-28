import React, { useState, useCallback, useEffect } from 'react';
import { ResumeData, CustomizationSettings, CoverLetterData, initialResumeData, initialCustomizationSettings, initialCoverLetterData, syncResumeToLetter } from './types';
import EditorPanel from './components/editor/EditorPanel';
import PreviewPanel from './components/preview/PreviewPanel';
import CustomizationPanel from './components/customization/CustomizationPanel';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import ArtifactSelector from './components/ArtifactSelector';
import CoverLetterBuilder from './components/coverLetter/CoverLetterBuilder';
import Footer from './components/layout/Footer';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import TermsAndConditions from './components/legal/TermsAndConditions';
import ContactPage from './components/legal/ContactPage';

type AppView = 'landing' | 'selector' | 'resume' | 'coverLetter' | 'privacy' | 'terms' | 'contact';

const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>(() => ({
    ...initialCoverLetterData,
    ...syncResumeToLetter(initialResumeData)
  }));
  const [customization, setCustomization] = useState<CustomizationSettings>(initialCustomizationSettings);
  const [currentView, setCurrentView] = useState<AppView>('landing');

  // Handle browser navigation and initial route
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      if (path === '/privacy-policy') {
        setCurrentView('privacy');
      } else if (path === '/terms-and-conditions') {
        setCurrentView('terms');
      } else if (path === '/contact') {
        setCurrentView('contact');
      } else {
        setCurrentView('landing');
      }
    };

    // Check initial route
    handleRouteChange();

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  // Handle link clicks
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        const url = new URL(link.href);
        if (url.origin === window.location.origin) {
          e.preventDefault();
          window.history.pushState({}, '', url.pathname);
          
          if (url.pathname === '/privacy-policy') {
            setCurrentView('privacy');
          } else if (url.pathname === '/terms-and-conditions') {
            setCurrentView('terms');
          } else if (url.pathname === '/contact') {
            setCurrentView('contact');
          } else {
            setCurrentView('landing');
          }
          window.scrollTo(0, 0);
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);

  const handleResumeChange = useCallback((newResumeData: ResumeData) => {
    setResumeData(newResumeData);
    // Sync shared fields to cover letter
    setCoverLetterData(prev => ({
      ...prev,
      ...syncResumeToLetter(newResumeData)
    }));
  }, []);

  const handleCoverLetterChange = useCallback((newCoverLetterData: CoverLetterData) => {
    setCoverLetterData(newCoverLetterData);
    // Sync shared fields back to resume
    setResumeData(prev => ({
      ...prev,
      basics: {
        ...prev.basics,
        name: newCoverLetterData.senderName,
        location: newCoverLetterData.senderAddress,
        phone: newCoverLetterData.senderPhone,
        email: newCoverLetterData.senderEmail,
      }
    }));
  }, []);

  const handleCustomizationChange = useCallback((newCustomization: CustomizationSettings) => {
    setCustomization(newCustomization);
  }, []);

  const handleStartBuilding = () => {
    setCurrentView('selector');
  };

  const handleSelectResume = () => {
    setCurrentView('resume');
  };

  const handleSelectCoverLetter = () => {
    setCurrentView('coverLetter');
  };

  const handleGoToResume = () => {
    setCurrentView('resume');
  };

  const handleBackToLanding = () => {
    window.history.pushState({}, '', '/');
    setCurrentView('landing');
  };

  // Legal pages navigation
  if (currentView === 'privacy') {
    return (
      <div className="flex flex-col min-h-screen">
        <PrivacyPolicy onBack={handleBackToLanding} />
        <Footer />
      </div>
    );
  }

  if (currentView === 'terms') {
    return (
      <div className="flex flex-col min-h-screen">
        <TermsAndConditions onBack={handleBackToLanding} />
        <Footer />
      </div>
    );
  }

  if (currentView === 'contact') {
    return (
      <div className="flex flex-col min-h-screen">
        <ContactPage onBack={handleBackToLanding} />
        <Footer />
      </div>
    );
  }

  if (currentView === 'landing') {
    return (
      <div className="flex flex-col min-h-screen">
        <LandingPage onStart={handleStartBuilding} />
        <Footer />
      </div>
    );
  }

  if (currentView === 'selector') {
    return (
      <div className="flex flex-col min-h-screen">
        <ArtifactSelector onSelectResume={handleSelectResume} onSelectCoverLetter={handleSelectCoverLetter} onBack={handleBackToLanding} />
        <Footer />
      </div>
    );
  }

  if (currentView === 'coverLetter') {
    return (
      <div className="flex flex-col min-h-screen">
        <CoverLetterBuilder
          coverLetterData={coverLetterData}
          onUpdate={handleCoverLetterChange}
          resumeData={resumeData}
          onBack={() => setCurrentView('selector')}
          onGoToResume={handleGoToResume}
        />
        <Footer />
      </div>
    );
  }

  // Resume builder view
  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Header
        resumeData={resumeData}
        customization={customization}
        onImport={handleResumeChange}
        onBack={() => setCurrentView('selector')}
        onBuildCoverLetter={() => setCurrentView('coverLetter')}
      />
      <main className="flex-grow flex">
        <div className="w-full grid grid-cols-1 lg:grid-cols-10 xl:grid-cols-4 gap-4 p-4 items-start">
          {/* Left Panel: Editor */}
          <div className="lg:col-span-3 xl:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-1">
            <EditorPanel
              resumeData={resumeData}
              onUpdate={handleResumeChange}
              template={customization.template}
            />
          </div>

          {/* Center Panel: Preview */}
          <div className="lg:col-span-4 xl:col-span-2 flex items-start justify-center bg-gray-200 dark:bg-gray-700 rounded-lg shadow-inner">
            <PreviewPanel resumeData={resumeData} customization={customization} />
          </div>

          {/* Right Panel: Customization */}
          <div className="lg:col-span-3 xl:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md p-1">
            <CustomizationPanel
              settings={customization}
              onUpdate={handleCustomizationChange}
              resumeData={resumeData}
              onImport={handleResumeChange}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;