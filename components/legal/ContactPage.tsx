import React, { useState } from 'react';

interface ContactPageProps {
  onBack?: () => void;
}

const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General',
    message: ''
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create mailto link with form data
    const mailtoLink = `mailto:team.buildresumenow@gmail.com?subject=${encodeURIComponent(`[${formData.subject}] ${formData.name}`)}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`)}`;
    
    window.location.href = mailtoLink;
    
    setSubmitStatus('success');
    setTimeout(() => {
      setSubmitStatus('idle');
      setFormData({ name: '', email: '', subject: 'General', message: '' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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
          Contact & Grievance Redressal
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Build Resume Now is committed to addressing your concerns promptly and transparently. 
          This page provides contact information in compliance with the Information Technology Act, 2000 
          and the Digital Personal Data Protection Act, 2023.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Contact Information */}
          <div className="space-y-6">
            {/* General Support */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                General Support
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                For product questions, technical support, or feedback:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <a href="mailto:team.buildresumenow@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                      team.buildresumenow@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Response Time</p>
                    <p className="text-gray-700 dark:text-gray-300">Within 48 hours (excluding weekends)</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  💡 <strong>Tip:</strong> Include screenshots or details for faster resolution
                </p>
              </div>
            </div>

            {/* Grievance Officer */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Grievance Officer
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                (Mandatory under IT Act 2000)
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                For complaints regarding:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 mb-4 ml-2">
                <li>Privacy violations or data concerns</li>
                <li>Content disputes</li>
                <li>Terms & Conditions violations</li>
                <li>Illegal or objectionable content</li>
              </ul>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded space-y-2">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Name:</strong> Admin Team (DUAL-SYNC)
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Designation:</strong> Grievance Officer
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Email:</strong> <a href="mailto:team.buildresumenow@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">team.buildresumenow@gmail.com</a>
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Address:</strong> Hyderabad, Telangana, India
                </p>
              </div>

              <div className="mt-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">Response Commitment:</p>
                <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-2">
                  <li>✓ Acknowledgment: Within 24 hours of complaint receipt</li>
                  <li>✓ Investigation: Within 7 business days</li>
                  <li>✓ Resolution: Within 30 days from complaint date</li>
                </ul>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>How to File a Complaint:</strong><br />
                  Send an email to <a href="mailto:team.buildresumenow@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">team.buildresumenow@gmail.com</a> with:
                </p>
                <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 ml-2 mt-2">
                  <li>Your name and contact information</li>
                  <li>Detailed description of the issue</li>
                  <li>Relevant screenshots or evidence</li>
                  <li>Desired resolution</li>
                </ol>
              </div>
            </div>

            {/* Data Protection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Data Privacy Requests
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                (DPDP Act 2023)
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                For data-related requests:
              </p>
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:team.buildresumenow@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                  team.buildresumenow@gmail.com
                </a>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Supported Requests:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300 ml-2">
                <li>Access to data processing information</li>
                <li>Correction of inaccurate data</li>
                <li>Erasure requests (though we don't store data)</li>
                <li>Withdrawal of consent</li>
                <li>Questions about our Privacy Policy</li>
              </ul>
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Note:</strong> Since Build Resume Now does not permanently store user data, 
                  most data protection rights are automatically fulfilled when you close your browser.
                </p>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Support Availability
              </h2>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p><strong>Monday - Friday:</strong> 10:00 AM - 6:00 PM IST</p>
                <p><strong>Saturday:</strong> 10:00 AM - 2:00 PM IST</p>
                <p><strong>Sunday & Public Holidays:</strong> Closed</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  (Emails monitored, responses on next business day)
                </p>
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Help Us Improve
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Build Resume Now is an experimental project and we value your input:
              </p>
              <div className="space-y-2 text-gray-700 dark:text-gray-300">
                <p>📧 <strong>Feedback:</strong> <a href="mailto:team.buildresumenow@gmail.com?subject=Feedback" className="text-blue-600 dark:text-blue-400 hover:underline">team.buildresumenow@gmail.com</a></p>
                <p>🐛 <strong>Bug Reports:</strong> <a href="mailto:team.buildresumenow@gmail.com?subject=Bug Report" className="text-blue-600 dark:text-blue-400 hover:underline">team.buildresumenow@gmail.com</a></p>
                <p>💡 <strong>Feature Requests:</strong> <a href="mailto:team.buildresumenow@gmail.com?subject=Feature Request" className="text-blue-600 dark:text-blue-400 hover:underline">team.buildresumenow@gmail.com</a></p>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:sticky lg:top-4 h-fit">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Quick Contact Form
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Privacy">Privacy Concern</option>
                    <option value="Grievance">Grievance/Complaint</option>
                    <option value="Bug">Bug Report</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Feature">Feature Request</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                    placeholder="Please describe your inquiry or concern in detail..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                >
                  Send Message
                </button>

                {submitStatus === 'success' && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-300 text-sm">
                    ✓ Your email client should open. If not, please email us directly at team.buildresumenow@gmail.com
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  This form will open your default email client. Alternatively, you can email us directly at{' '}
                  <a href="mailto:team.buildresumenow@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                    team.buildresumenow@gmail.com
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
