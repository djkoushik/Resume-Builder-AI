import React, { useRef } from 'react';
// import AuthButton from './AuthButton';

interface LandingPageProps {
  onSelectResume: () => void;
  onSelectCoverLetter: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSelectResume, onSelectCoverLetter }) => {
  const chooseRef = useRef<HTMLDivElement>(null);

  const handleContactUs = () => {
    const footer = document.querySelector('footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartBuilding = () => {
    if (chooseRef.current) {
      chooseRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectResumeWithScroll = () => {
    window.scrollTo(0, 0);
    onSelectResume();
  };

  const handleSelectCoverLetterWithScroll = () => {
    window.scrollTo(0, 0);
    onSelectCoverLetter();
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-center p-4 relative">
      {/* Contact Us & Auth Button - Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
        <button
          onClick={handleContactUs}
          aria-label="Contact Us"
          className="px-8 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 transform hover:scale-105"
        >
          Contact Us
        </button>
        {/* <AuthButton /> */}
      </div>

      {/* Hero Section - Centered */}
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 dark:text-white mb-8">
            Build Your Story with an <span className="text-blue-500">AI Resume Builder</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
            Craft a professional, ATS-friendly resume in minutes.
          </p>

          <button
            onClick={handleStartBuilding}
            aria-label="Start building your resume"
            className="px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 transform hover:scale-105"
          >
            Start Building
          </button>
        </div>
      </div>

      {/* Choose What to Build Section */}
      <div ref={chooseRef} className="w-full py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Choose What to <span className="text-blue-500">Build</span>
          </h2>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12">
            Select the type of document you'd like to create with AI assistance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Resume Builder Card */}
            <div
              onClick={handleSelectResumeWithScroll}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-8 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                  Build Resume
                </h2>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">Create Professional Resume</p>
                <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                  Create an ATS-friendly resume in minutes. Choose from simple or custom templates.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                    Simple Mode
                  </span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded-full">
                    Custom Mode
                  </span>
                </div>
              </div>
            </div>

            {/* Cover Letter Card */}
            <div
              onClick={handleSelectCoverLetterWithScroll}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer p-8 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
                  Build Cover Letter
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                  Craft compelling cover letters that sync with your resume data and leverage AI for personalized content.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-full">
                    Data Sync
                  </span>
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                    AI Powered
                  </span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded-full">
                    Professional
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Both tools work together seamlessly - your resume data automatically syncs to your cover letters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
