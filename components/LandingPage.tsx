
import React from 'react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const handleContactUs = () => {
    const footer = document.querySelector('footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-center p-4 relative">
      {/* Contact Us Button - Top Right */}
      <button
        onClick={handleContactUs}
        aria-label="Contact Us"
        className="absolute top-4 right-4 px-8 py-3 bg-blue-600 text-white font-bold text-sm rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 transform hover:scale-105"
      >
        Contact Us
      </button>

      <div className="max-w-2xl">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-800 dark:text-white mb-4">
           Build Your Story with an <span className="text-blue-500">AI Resume Builder</span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
          Craft a professional, ATS-friendly resume in minutes.
        </p>
        
        <button
          onClick={onStart}
          aria-label="Start building your resume"
          className="px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-300 transform hover:scale-105"
        >
          Start Building
        </button>

      </div>

    </div>
  );
};

export default LandingPage;