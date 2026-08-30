import React, { useState, useCallback, useEffect } from 'react';
import { ResumeData, CustomizationSettings, CoverLetterData, initialResumeData, initialCustomizationSettings, initialCoverLetterData, syncResumeToLetter } from './types';
import { updateMetaTags, SEO_CONFIGS } from './utils/seoUtils';
import ResumeBuilder from './components/ResumeBuilder';
import LandingPage from './components/LandingPage';
import ArtifactSelector from './components/ArtifactSelector';
import CoverLetterBuilder from './components/coverLetter/CoverLetterBuilder';
import ResumeBuilderPage from './components/ResumeBuilderPage';
import CoverLetterBuilderPage from './components/CoverLetterBuilderPage';
import Footer from './components/layout/Footer';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import TermsAndConditions from './components/legal/TermsAndConditions';
import ContactPage from './components/legal/ContactPage';

type AppView = 'landing' | 'resumeBuilderPage' | 'resumeBuilderTool' | 'coverLetterBuilderPage' | 'coverLetterBuilderTool' | 'privacy' | 'terms' | 'contact';

const App: React.FC = () => {
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [coverLetterData, setCoverLetterData] = useState<CoverLetterData>(() => ({
    ...initialCoverLetterData,
    ...syncResumeToLetter(initialResumeData)
  }));
  const [customization, setCustomization] = useState<CustomizationSettings>(initialCustomizationSettings);
  // Cover-letter typography/colour choices. Lifted here (rather than kept local
  // to CoverLetterBuilder) so they survive a viewport-driven remount of the
  // builder shell and a round-trip to the resume builder.
  const [coverLetterCustomization, setCoverLetterCustomization] = useState<CustomizationSettings>(initialCustomizationSettings);
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
      } else if (path === '/resume-builder/build') {
        // Default to simple if accessed directly without state, or preserve existing
        setCurrentView('resumeBuilderTool');
      } else if (path === '/build-resume') {
        // Simple Mode
        setResumeData(prev => ({ ...prev, resumeMode: 'simple' }));
        setCustomization(prev => ({ ...prev, template: 'Professional' }));
        setCurrentView('resumeBuilderTool');
      } else if (path === '/build-custom-resume') {
        // Custom Mode
        setResumeData(prev => ({ ...prev, resumeMode: 'custom' }));
        setCurrentView('resumeBuilderTool');
      } else if (path === '/resume-builder') {
        setCurrentView('resumeBuilderPage');
      } else if (path === '/cover-letter-builder/build') {
        setCurrentView('coverLetterBuilderTool');
      } else if (path === '/cover-letter-builder') {
        setCurrentView('coverLetterBuilderPage');
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

  // Update meta tags when view changes
  useEffect(() => {
    switch (currentView) {
      case 'resumeBuilderPage':
        updateMetaTags(SEO_CONFIGS.resumeBuilder);
        break;
      case 'coverLetterBuilderPage':
        updateMetaTags(SEO_CONFIGS.coverLetterBuilder);
        break;
      case 'privacy':
        updateMetaTags(SEO_CONFIGS.privacy);
        break;
      case 'terms':
        updateMetaTags(SEO_CONFIGS.terms);
        break;
      case 'contact':
        updateMetaTags(SEO_CONFIGS.contact);
        break;
      default:
        updateMetaTags(SEO_CONFIGS.home);
    }
  }, [currentView]);

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
          } else if (url.pathname === '/build-resume') {
            setResumeData(prev => ({ ...prev, resumeMode: 'simple' }));
            setCustomization(prev => ({ ...prev, template: 'Professional' }));
            setCurrentView('resumeBuilderTool');
          } else if (url.pathname === '/build-custom-resume') {
            setResumeData(prev => ({ ...prev, resumeMode: 'custom' }));
            setCurrentView('resumeBuilderTool');
          } else if (url.pathname === '/resume-builder/build') {
            setCurrentView('resumeBuilderTool');
          } else if (url.pathname === '/resume-builder') {
            setCurrentView('resumeBuilderPage');
          } else if (url.pathname === '/cover-letter-builder/build') {
            setCurrentView('coverLetterBuilderTool');
          } else if (url.pathname === '/cover-letter-builder') {
            setCurrentView('coverLetterBuilderPage');
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

  // Imported resume data, from ImportResumeModal on the resume-builder page.
  // Order matters: the data is set BEFORE navigating. The route handlers use
  // functional updates (prev => ...), so they compose correctly on top of this
  // in the same batch; doing it the other way round would clobber resumeMode.
  const handleImportResume = useCallback((importedData: ResumeData) => {
    handleResumeChange({ ...importedData, resumeMode: 'simple' });
    setCustomization(prev => ({ ...prev, template: 'Professional' }));
    window.history.pushState({}, '', '/build-resume');
    setCurrentView('resumeBuilderTool');
  }, [handleResumeChange]);

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
        <LandingPage
          onSelectResume={() => {
            window.history.pushState({}, '', '/resume-builder');
            setCurrentView('resumeBuilderPage');
          }}
          onSelectCoverLetter={() => {
            window.history.pushState({}, '', '/cover-letter-builder');
            setCurrentView('coverLetterBuilderPage');
          }}
        />
        <Footer />
      </div>
    );
  }

  if (currentView === 'resumeBuilderPage') {
    return (
      <div className="flex flex-col min-h-screen">
        <ResumeBuilderPage
          currentResume={resumeData}
          onImportResume={handleImportResume}
          onBuildSimple={() => {
            setResumeData(prev => ({ ...prev, resumeMode: 'simple' }));
            setCustomization(prev => ({ ...prev, template: 'Professional' }));
            window.history.pushState({}, '', '/build-resume');
            setCurrentView('resumeBuilderTool');
          }}
          onBuildCustom={() => {
            setResumeData(prev => ({ ...prev, resumeMode: 'custom' }));
            window.history.pushState({}, '', '/build-custom-resume');
            setCurrentView('resumeBuilderTool');
          }}
          onBack={handleBackToLanding}
        />
        <Footer />
      </div>
    );
  }

  if (currentView === 'coverLetterBuilderPage') {
    return (
      <div className="flex flex-col min-h-screen">
        <CoverLetterBuilderPage
          onStart={() => {
            window.history.pushState({}, '', '/cover-letter-builder/build');
            setCurrentView('coverLetterBuilderTool');
          }}
          onBack={handleBackToLanding}
        />
        <Footer />
      </div>
    );
  }

  // Resume builder tool view
  if (currentView === 'resumeBuilderTool') {
    return (
      <ResumeBuilder
        resumeData={resumeData}
        customization={customization}
        onResumeChange={handleResumeChange}
        onCustomizationChange={handleCustomizationChange}
        onBack={() => {
          window.history.pushState({}, '', '/resume-builder');
          setCurrentView('resumeBuilderPage');
        }}
        onBuildCoverLetter={() => {
          window.history.pushState({}, '', '/cover-letter-builder/build');
          setCurrentView('coverLetterBuilderTool');
        }}
      />
    );
  }

  // Cover letter builder tool view
  if (currentView === 'coverLetterBuilderTool') {
    return (
      <CoverLetterBuilder
        coverLetterData={coverLetterData}
        onUpdate={handleCoverLetterChange}
        resumeData={resumeData}
        customization={coverLetterCustomization}
        onCustomizationChange={setCoverLetterCustomization}
        onBack={() => {
          window.history.pushState({}, '', '/cover-letter-builder');
          setCurrentView('coverLetterBuilderPage');
        }}
        onGoToResume={() => {
          window.history.pushState({}, '', '/resume-builder/build');
          setCurrentView('resumeBuilderTool');
        }}
      />
    );
  }
};

export default App;