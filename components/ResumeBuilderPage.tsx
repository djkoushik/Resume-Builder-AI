import React, { Suspense, lazy, useState } from 'react';
import { CheckCircle, ChevronRight, Zap, Download, Shield, Upload } from 'lucide-react';
import { usePageSEO } from '../hooks/usePageSEO';
import { useViewport } from '../hooks/useViewport';
import type { ResumeData } from '../types';

// Lazy so the parser, the review UI and the file readers stay out of the main
// bundle. A visitor who never imports a resume downloads none of it.
const ImportResumeModal = lazy(() => import('./import/ImportResumeModal'));
const prefetchImportModal = () => { void import('./import/ImportResumeModal'); };

interface ResumeBuilderPageProps {
  onBuildSimple: () => void;
  onBuildCustom: () => void;
  onBack: () => void;
  currentResume: ResumeData;
  onImportResume: (data: ResumeData) => void;
}

interface ModeOption {
  key: string;
  icon: React.ReactNode;
  title: string;
  titleMobile: string;
  badge: string;
  descDesktop: string;
  descMobile: string;
  cta: string;
  onClick: () => void;
  onHover?: () => void;
  /** Literal Tailwind class ordering the card on desktop (kept literal for JIT). */
  mdOrder: 'md:order-1' | 'md:order-2' | 'md:order-3';
  ring: string;      // hover border colour on the desktop card
  iconWrap: string;  // icon circle bg (+ group-hover) on the desktop card
  iconText: string;  // icon + link colour
  badgeCls: string;  // badge pill colours
  iconWrapMobile: string;
}

const ResumeBuilderPage: React.FC<ResumeBuilderPageProps> = ({
  onBuildSimple,
  onBuildCustom,
  onBack,
  currentResume,
  onImportResume,
}) => {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const viewport = useViewport();

  usePageSEO({
    title: 'Free Resume Builder | AI Resume Builder & Free Resume Download',
    description: 'Build a professional, ATS-friendly resume for free using our AI Resume Builder. Download your resume instantly in PDF format.',
    canonicalUrl: 'https://buildresumenow.in/resume-builder',
    ogUrl: 'https://buildresumenow.in/resume-builder',
  });

  const options: ModeOption[] = [
    {
      key: 'upload',
      icon: <Upload className="w-full h-full" />,
      title: 'Upload Existing Resume',
      titleMobile: 'Upload resume',
      badge: 'Fastest',
      descDesktop: 'Already have a resume? Upload your PDF or Word file and keep everything you have written.',
      descMobile: 'Import a PDF or Word file',
      cta: 'Upload and Continue',
      onClick: () => setIsImportOpen(true),
      onHover: prefetchImportModal,
      mdOrder: 'md:order-3',
      ring: 'hover:border-teal-500',
      iconWrap: 'bg-teal-100 dark:bg-teal-900/30 group-hover:bg-teal-600',
      iconText: 'text-teal-600 dark:text-teal-400',
      badgeCls: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30',
      iconWrapMobile: 'bg-teal-100 dark:bg-teal-900/30',
    },
    {
      key: 'simple',
      icon: <Zap className="w-full h-full" />,
      title: 'Simple Resume',
      titleMobile: 'Simple resume',
      badge: 'Recommended',
      descDesktop: 'Perfect for standard, professional resumes. Quick, easy, and auto-formatted for best ATS results.',
      descMobile: 'Quick, auto-formatted, ATS-ready',
      cta: 'Start Simple Build',
      onClick: onBuildSimple,
      mdOrder: 'md:order-1',
      ring: 'hover:border-blue-500',
      iconWrap: 'bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-600',
      iconText: 'text-blue-600 dark:text-blue-400',
      badgeCls: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
      iconWrapMobile: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      key: 'custom',
      icon: <Shield className="w-full h-full" />,
      title: 'Custom Resume',
      titleMobile: 'Custom resume',
      badge: 'Advanced',
      descDesktop: 'Full control over layout, fonts, colors, and styling. Best for creative roles or specific design needs.',
      descMobile: 'Full control of layout and style',
      cta: 'Start Custom Build',
      onClick: onBuildCustom,
      mdOrder: 'md:order-2',
      ring: 'hover:border-purple-500',
      iconWrap: 'bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-600',
      iconText: 'text-purple-600 dark:text-purple-400',
      badgeCls: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30',
      iconWrapMobile: 'bg-purple-100 dark:bg-purple-900/30',
    },
  ];

  const modeChooser =
    viewport === 'mobile' ? (
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
        {options.map(o => (
          <button
            key={o.key}
            onClick={o.onClick}
            onTouchStart={o.onHover}
            className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-gray-800 text-left active:bg-gray-50 dark:active:bg-gray-700/50 transition-colors"
          >
            <span className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${o.iconWrapMobile}`}>
              <span className={`w-5 h-5 ${o.iconText}`}>{o.icon}</span>
            </span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-gray-900 dark:text-white">{o.titleMobile}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${o.badgeCls}`}>{o.badge}</span>
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{o.descMobile}</span>
            </span>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
          </button>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {options.map(o => (
          <button
            key={o.key}
            onClick={o.onClick}
            onMouseEnter={o.onHover}
            onFocus={o.onHover}
            className={`${o.mdOrder} bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md border-2 border-transparent hover:shadow-xl transition-all duration-300 group text-left ${o.ring}`}
          >
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-colors duration-300 flex-shrink-0 ${o.iconWrap}`}>
                <span className={`w-6 h-6 group-hover:text-white ${o.iconText}`}>{o.icon}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{o.title}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${o.badgeCls}`}>{o.badge}</span>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{o.descDesktop}</p>
            <span className={`font-medium group-hover:underline flex items-center ${o.iconText}`}>
              {o.cta}
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </span>
          </button>
        ))}
      </div>
    );

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <div className="px-4 py-4">
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </button>
      </div>

      <main className="flex-grow max-w-6xl mx-auto w-full px-4 py-8 md:py-12">
        {/* Hero + mode chooser */}
        <section className="mb-12 md:mb-16 text-center">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-3 md:mb-6">
            Build Your Professional Resume in Minutes
          </h1>
          <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 mb-6 md:mb-10 max-w-3xl mx-auto">
            Create an ATS-friendly resume using our AI-powered resume builder. Choose the mode that fits your needs.
          </p>

          {modeChooser}
        </section>

        {/* Features grid */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-12">Why Choose Our Resume Builder?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mb-4">
                <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Easy to Use</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Simple, intuitive interface that guides you through creating a professional resume step by step.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg mb-4">
                <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Instant Download</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Download your resume as a PDF instantly. No waiting, no hidden fees, completely free.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg mb-4">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">ATS-Friendly</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Our resumes are optimized to pass Applicant Tracking Systems and get noticed by recruiters.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg mb-4">
                <CheckCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI-Powered</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get intelligent suggestions to improve your resume content and make it stand out.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits section */}
        <section className="mb-16 bg-blue-50 dark:bg-blue-900/20 p-8 rounded-lg">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">What You Get</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'Professional resume templates',
              'Customizable designs and colors',
              'Real-time preview of your resume',
              'ATS compatibility checker',
              'PDF download in seconds',
              '100% free, no credit card required',
            ].map(benefit => (
              <li key={benefit} className="flex items-start">
                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0 mt-1" />
                <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA section */}
        <section className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to Build Your Resume?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Join thousands of job seekers who have successfully created their resumes with our free builder.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={onBuildSimple}
              className="px-8 py-3 bg-blue-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            >
              Build Simple Resume
            </button>
            <button
              onClick={onBuildCustom}
              className="px-8 py-3 bg-purple-600 text-white font-bold text-lg rounded-lg shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"
            >
              Build Custom Resume
            </button>
          </div>
        </section>
      </main>
      {isImportOpen && (
        <Suspense fallback={null}>
          <ImportResumeModal
            isOpen
            onClose={() => setIsImportOpen(false)}
            currentResume={currentResume}
            onImport={data => {
              setIsImportOpen(false);
              onImportResume(data);
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default ResumeBuilderPage;
