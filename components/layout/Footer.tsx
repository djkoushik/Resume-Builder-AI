import React from 'react';
import { footerConfig } from '../../src/config/footerConfig';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { copyright, teamContact } = footerConfig;

  // Dynamic copyright format
  const copyrightText = copyright.startYear === currentYear 
    ? `© ${currentYear} ${copyright.text}`
    : `© ${copyright.startYear} - ${currentYear} ${copyright.text}`;

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      {/* Contact/Team Details Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Contact Information */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Contact Us
            </h3>
            <div className="space-y-3">
              {teamContact.map((contact, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {contact.type === 'email' && (
                      <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                    {contact.type === 'phone' && (
                      <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    )}
                    {contact.type === 'linkedin' && (
                      <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {contact.label}
                    </p>
                    <a
                      href={contact.href}
                      target={contact.type === 'linkedin' ? '_blank' : undefined}
                      rel={contact.type === 'linkedin' ? 'noopener noreferrer' : undefined}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors duration-200"
                    >
                      {contact.value}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional space for future content */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              About DUAL-SYNC
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              DUAL-SYNC presents BuildResumeNow - Create professional resumes and cover letters with our AI-powered builder. 
              Stand out from the crowd with customizable templates and intelligent suggestions.
            </p>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {copyrightText}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Built for job seekers worldwide from job seekers
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;