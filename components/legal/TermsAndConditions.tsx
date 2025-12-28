import React from 'react';

interface TermsAndConditionsProps {
  onBack?: () => void;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-12 px-4">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-2"
          >
            ← Back to Home
          </button>
        )}

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Terms & Conditions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last Updated: December 28, 2025
        </p>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 space-y-8">
          {/* Section 1: Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Welcome to Build Resume Now ('we', 'our', 'us'). By accessing or using buildresumenow.in (the 'Service'), 
              you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, 
              please discontinue use immediately.
            </p>
          </section>

          {/* Section 2: Agreement to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Agreement to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              By using Build Resume Now, you represent that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>You are at least 13 years old</li>
              <li>You have the legal capacity to enter into this agreement</li>
              <li>If under 18, you have obtained parental/guardian consent</li>
              <li>You will provide accurate and truthful information</li>
              <li>You will use the Service in compliance with all applicable Indian laws</li>
            </ul>
          </section>

          {/* Section 3: Beta Service Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. Beta Service Disclaimer
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-semibold mb-2">
                Build Resume Now is currently an EXPERIMENTAL/BETA project by DUAL-SYNC:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                <li>Provided 'AS IS' and 'AS AVAILABLE' without warranties of any kind</li>
                <li>We do NOT guarantee uninterrupted or error-free service</li>
                <li>We do NOT guarantee bug-free operation</li>
                <li>We do NOT guarantee specific resume formatting outcomes</li>
                <li>We do NOT guarantee compatibility with all browsers/devices</li>
                <li>We do NOT guarantee successful download every time</li>
              </ul>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Service may be modified, suspended, or discontinued at any time without notice. Features may change without prior warning.
              <strong> USE AT YOUR OWN RISK:</strong> This is a free experimental tool for learning and testing purposes.
            </p>
          </section>

          {/* Section 4: User Responsibilities */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Your Obligations
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              You agree to:
            </p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>✓ Provide accurate, truthful information only</li>
              <li>✓ Not use the Service for fraudulent purposes</li>
              <li>✓ Not create resumes containing:</li>
              <ul className="list-disc list-inside ml-6 space-y-1">
                <li>False credentials or fake work experience</li>
                <li>Defamatory, offensive, or illegal content</li>
                <li>Copyrighted material you don't own</li>
                <li>Information that violates third-party rights</li>
              </ul>
              <li>✓ Not attempt to hack, reverse-engineer, or compromise the Service</li>
              <li>✓ Not use automated bots or scrapers</li>
              <li>✓ Not overload our servers with excessive requests</li>
              <li>✓ Download your resume immediately (we don't store it for later)</li>
            </ul>
          </section>

          {/* Section 5: Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Ownership Rights
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Website & Templates:</strong> The website design, code, resume templates, and branding are owned by DUAL-SYNC and protected under Indian copyright law</li>
              <li><strong>Your Resume Content:</strong> You retain all rights to the content YOU provide (your personal information, work history, etc.)</li>
              <li><strong>License to You:</strong> We grant you a non-exclusive, non-transferable license to use our templates to create your resume</li>
              <li><strong>License from You:</strong> By using the Service, you grant us a temporary license to process your data ONLY to generate your resume</li>
              <li><strong>No Resale:</strong> You may not resell, redistribute, or commercialize our templates</li>
            </ul>
          </section>

          {/* Section 6: Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Legal Liability Limits
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              To the maximum extent permitted under Indian law, Build Resume Now SHALL NOT BE LIABLE for:
            </p>
            
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">A. Data Loss:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>Loss of resume data due to technical errors</li>
                  <li>Failure to download or save your resume</li>
                  <li>Browser crashes or session timeouts</li>
                  <li>Internet connectivity issues</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-gray-900 dark:text-white">B. Employment Outcomes:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>Failure to secure job interviews or employment</li>
                  <li>Rejection by employers or recruitment agencies</li>
                  <li>Any career or financial losses</li>
                  <li>Perception of your resume by third parties</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-gray-900 dark:text-white">C. Technical Issues:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>Service downtime or maintenance periods</li>
                  <li>Incompatibility with your device/browser</li>
                  <li>PDF formatting variations across devices</li>
                  <li>Third-party service failures (Google Analytics, CDN)</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-gray-900 dark:text-white">D. Indirect Damages:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
                  <li>Consequential damages of any kind</li>
                  <li>Loss of profits or business opportunities</li>
                  <li>Emotional distress or reputational harm</li>
                  <li>Punitive or exemplary damages</li>
                </ul>
              </div>
            </div>

          </section>

          {/* Section 7: Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Your Indemnification Agreement
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              You agree to indemnify, defend, and hold harmless Build Resume Now, its owners, employees, and partners from any claims, 
              losses, damages, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Your violation of these Terms</li>
              <li>Fraudulent or false information in your resume</li>
              <li>Plagiarism or copyright infringement</li>
              <li>Violation of third-party rights</li>
              <li>Misuse of the generated resume</li>
              <li>Any illegal activity conducted through or related to the Service</li>
              <li>Your breach of Indian laws or regulations</li>
            </ul>
          </section>

          {/* Section 8: Prohibited Uses */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Forbidden Activities
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              You may NOT use Build Resume Now to:
            </p>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-4">
              <li>❌ Create fake identities or fraudulent credentials</li>
              <li>❌ Impersonate another person</li>
              <li>❌ Generate resumes for illegal purposes</li>
              <li>❌ Attempt to gain unauthorized access to our systems</li>
              <li>❌ Introduce viruses, malware, or malicious code</li>
              <li>❌ Scrape or data-mine the website</li>
              <li>❌ Resell or commercialize our free service</li>
              <li>❌ Bypass any security or rate-limiting measures</li>
              <li>❌ Use the Service to spam or harass others</li>
              <li>❌ Violate any applicable laws or regulations</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              Violation may result in immediate termination of access and legal action.
            </p>
          </section>

          {/* Section 9: Service Modifications */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. Changes to Service
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>Modify or discontinue the Service at any time</li>
              <li>Change resume templates or features without notice</li>
              <li>Implement rate limits or usage restrictions</li>
              <li>Introduce paid premium features in the future</li>
              <li>Update these Terms with 7 days' notice via this page</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              Continued use after modifications = acceptance of changes.
            </p>
          </section>

          {/* Section 10: Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. Governing Law & Jurisdiction
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              These Terms are governed by the laws of India, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
              <li>Information Technology Act, 2000</li>
              <li>Digital Personal Data Protection Act, 2023</li>
              <li>Consumer Protection Act, 2019</li>
              <li>Indian Contract Act, 1872</li>
            </ul>
          </section>

          {/* Section 11: Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. Contact Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              For questions about these Terms:
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <p className="text-gray-700 dark:text-gray-300"><strong>Email:</strong> <a href="mailto:team.buildresumenow@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">team.buildresumenow@gmail.com</a></p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Team:</strong> DUAL-SYNC</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Location:</strong> Hyderabad, Telangana, India</p>
            </div>
          </section>
        </div>

        {/* Simple Language Callout at Bottom */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mt-8 rounded">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            ⚖️ Terms in Simple Language
          </h3>
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            <li>• This is a FREE beta project (bugs may happen)</li>
            <li>• Use real info only (no fake credentials)</li>
            <li>• We own the website, you own your resume content</li>
            <li>• We're not responsible if you don't get hired</li>
            <li>• Don't abuse or hack our service</li>
            <li>• Questions? Email us: <a href="mailto:team.buildresumenow@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">team.buildresumenow@gmail.com</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
