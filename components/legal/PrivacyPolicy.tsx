import React from 'react';

interface PrivacyPolicyProps {
  onBack?: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last Updated: December 28, 2025
        </p>

        {/* Simple Version Callout */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-8 rounded">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            📝 Privacy Policy in Plain English
          </h3>
          <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>✅ We create your resume and immediately forget it</p>
            <p>✅ We use cookies to count visitors (anonymous)</p>
            <p>✅ We use Google Analytics (you can opt-out)</p>
            <p>✅ Your resume disappears when you close the tab</p>
            <p>❌ We DON'T store your resume in any database</p>
            <p>❌ We DON'T sell your data to anyone</p>
            <p>❌ We DON'T send spam emails</p>
            <p>❌ We DON'T require Aadhaar or bank details</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 space-y-8">
          {/* Section 1: Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Welcome to Build Resume Now, owned by DUAL-SYNC. We value your privacy and are committed to protecting your personal data. 
              This policy explains how we handle your information when you use our resume-building tool in compliance with the 
              <strong> Digital Personal Data Protection (DPDP) Act, 2023</strong>.
            </p>
          </section>

          {/* Section 2: No-Storage Promise */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              2. Our No-Storage Promise
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              Build Resume Now operates on a <strong>transient processing model</strong>:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>We <strong>DO NOT</strong> store your personal data (name, email, phone, work history) in any permanent database</li>
              <li>Your data is used in real-time only to generate your PDF resume</li>
              <li>All data is automatically purged from our server's temporary memory once your session ends or the PDF is downloaded</li>
              <li>We cannot retrieve your resume after you close the browser - it's permanently deleted</li>
            </ul>
          </section>

          {/* Section 3: Information We Process */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              3. What Information We Process
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              We temporarily process the data you voluntarily provide, including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Identity Data:</strong> Name, contact details (email, phone, address)</li>
              <li><strong>Professional Data:</strong> Work history, education, skills, certifications, projects</li>
              <li><strong>Technical Data:</strong> IP address, browser type, device information (for security and analytics only)</li>
              <li><strong>Session Data:</strong> Temporary cookies to maintain your resume-building session</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              <strong>Important:</strong> We do NOT require or collect Aadhaar numbers, bank details, or any government ID information.
            </p>
          </section>

          {/* Section 4: Data Principal Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              4. Your Rights Under DPDP Act 2023
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              As a data principal in India, you have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Right to Access:</strong> Request information about data processing (though we don't store data)</li>
              <li><strong>Right to Correction:</strong> Correct any inaccurate data before generating your resume</li>
              <li><strong>Right to Erasure:</strong> Request deletion of data (automatically done after session ends)</li>
              <li><strong>Right to Withdraw Consent:</strong> Stop using the service at any time</li>
              <li><strong>Right to Nominate:</strong> Nominate another person to exercise these rights on your behalf</li>
              <li><strong>Right to Grievance Redressal:</strong> File complaints with our Grievance Officer</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              Since we don't store your data permanently, most rights are automatically fulfilled when you close your browser.
            </p>
          </section>

          {/* Section 5: How We Use Your Data */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              5. Purpose of Data Processing
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              We process your data for these specific purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Resume Generation:</strong> Creating your PDF resume document</li>
              <li><strong>Service Improvement:</strong> Anonymous analytics to improve user experience</li>
              <li><strong>Security:</strong> Preventing fraud, abuse, and ensuring platform security</li>
              <li><strong>Legal Compliance:</strong> Meeting obligations under Indian law</li>
            </ul>
          </section>

          {/* Section 6: Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              6. Security Measures
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              We implement industry-standard security practices:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li>SSL/TLS encryption for all data transmission</li>
              <li>Secure server infrastructure with regular security audits</li>
              <li>No permanent data storage = no database breach risk</li>
              <li>Automatic memory purging after each session</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              However, as an experimental beta tool, we encourage users NOT to enter highly sensitive information beyond what's typically needed for a professional resume.
            </p>
          </section>

          {/* Section 7: Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              7. Third-Party Data Processing
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              We use the following third-party services:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Google Analytics:</strong> To understand website usage patterns (anonymized data)</li>
              <li>This may transfer data to Google servers (including outside India)</li>
              <li>You can opt-out using browser plugins or browser settings</li>
              <li>Google's Privacy Policy: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">https://policies.google.com/privacy</a></li>
              <li><strong>CDN Services:</strong> For faster content delivery (no personal data shared)</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              By using our service, you consent to this limited third-party data processing.
            </p>
          </section>

          {/* Section 8: Cookies Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              8. Cookies & Tracking
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              We use minimal cookies:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Essential Cookies:</strong> Required for site functionality (session management)</li>
              <li><strong>Analytics Cookies:</strong> Google Analytics for anonymous usage statistics</li>
              <li><strong>No Advertising Cookies:</strong> We don't use tracking for ads or marketing</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              You can disable cookies in your browser settings, but this may affect site functionality.
            </p>
          </section>

          {/* Section 9: Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              9. Data Retention Period
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Resume Data:</strong> Retained in temporary memory ONLY during active session (typically 5-30 minutes)</li>
              <li><strong>Server Logs:</strong> IP addresses retained for 7 days for security purposes only</li>
              <li><strong>Analytics Data:</strong> Anonymized aggregated data retained indefinitely (no personal identification)</li>
              <li><strong>No Long-Term Storage:</strong> We do not maintain any database of user resumes or personal information</li>
            </ul>
          </section>

          {/* Section 10: Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              10. Age Restriction
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              This service is intended for users aged 13 years or older. If you are under 18, please obtain parental or guardian consent 
              before using Build Resume Now. We do not knowingly collect data from children under 13.
            </p>
          </section>

          {/* Section 11: Data Transfer */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              11. Data Location & Transfer
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
              <li><strong>Processing Location:</strong> Your data is processed on servers located in India</li>
              <li><strong>No Cross-Border Storage:</strong> Since we don't store data, there's no permanent cross-border data transfer</li>
              <li><strong>Temporary Processing:</strong> Data may temporarily pass through global CDN networks for performance</li>
              <li><strong>Google Analytics:</strong> May transfer anonymized analytics data to Google servers internationally</li>
            </ul>
          </section>

          {/* Section 12: Policy Updates */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              12. Policy Updates
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. 
              Continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Section 13: Grievance Redressal */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              13. Grievance Redressal
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              For privacy concerns, data requests, or complaints:
            </p>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded">
              <p className="text-gray-700 dark:text-gray-300"><strong>Grievance Officer:</strong> Admin Team (DUAL-SYNC)</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Email:</strong> <a href="mailto:team.buildresumenow@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">team.buildresumenow@gmail.com</a></p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Address:</strong> Hyderabad, Telangana, India</p>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              <strong>Response Timeline:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-4">
              <li>Acknowledgment: Within 24 hours</li>
              <li>Resolution: Within 30 days</li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
              You may also file complaints with the Data Protection Board of India (once operational under DPDP Act 2023).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
