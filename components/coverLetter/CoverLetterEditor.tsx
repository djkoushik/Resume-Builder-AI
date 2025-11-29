import React, { useState } from 'react';
import { CoverLetterData, ResumeData } from '../../types';
import { enhanceCoverLetterWithAI } from '../../services/geminiService';
import Accordion from '../ui/Accordion';

interface CoverLetterEditorProps {
  data: CoverLetterData;
  onUpdate: (data: CoverLetterData) => void;
  resumeData: ResumeData;
}

interface ValidationErrors {
  [key: string]: string;
}

const CoverLetterEditor: React.FC<CoverLetterEditorProps> = ({ data, onUpdate, resumeData }) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementError, setEnhancementError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const validateField = (field: keyof CoverLetterData, value: string): string | null => {
    switch (field) {
      case 'senderName':
        if (!value.trim()) return 'Name is required';
        if (value.length > 100) return 'Name must be less than 100 characters';
        return null;

      case 'senderEmail':
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return null;

      case 'senderPhone':
        if (value && value.length > 20) return 'Phone number must be less than 20 characters';
        return null;

      case 'recipientName':
        if (value && value.length > 100) return 'Recipient name must be less than 100 characters';
        return null;

      case 'companyName':
        if (!value.trim()) return 'Company name is required';
        if (value.length > 100) return 'Company name must be less than 100 characters';
        return null;

      case 'jobTitle':
        if (!value.trim()) return 'Job title is required';
        if (value.length > 100) return 'Job title must be less than 100 characters';
        return null;

      case 'date':
        if (!value) return 'Date is required';
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'Please enter a valid date';
        return null;

      case 'bodyContent':
        if (value && value.length > 5000) return 'Content must be less than 5000 characters';
        return null;

      default:
        return null;
    }
  };

  const handleFieldChange = (field: keyof CoverLetterData, value: string) => {
    // Clear previous validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Validate the field
    const error = validateField(field, value);
    if (error) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: error
      }));
    }

    onUpdate({
      ...data,
      [field]: value
    });
  };

  const validateAllFields = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate all required and optional fields
    const fieldsToValidate: (keyof CoverLetterData)[] = [
      'senderName', 'senderEmail', 'senderPhone', 'recipientName',
      'companyName', 'jobTitle', 'date', 'bodyContent'
    ];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, data[field]);
      if (error) {
        errors[field] = error;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAIEnhancement = async () => {
    // Clear previous enhancement error
    setEnhancementError(null);

    // Validation
    if (!data.jobTitle.trim()) {
      setEnhancementError("Please enter a job title before using AI enhancement.");
      return;
    }

    if (!data.companyName.trim()) {
      setEnhancementError("Please enter a company name before using AI enhancement.");
      return;
    }

    setIsEnhancing(true);

    try {
      const enhancedContent = await enhanceCoverLetterWithAI(
        data.jobTitle,
        data.companyName,
        resumeData,
        data.bodyContent
      );

      handleFieldChange('bodyContent', enhancedContent);
    } catch (error) {
      console.error("AI Enhancement Error:", error);

      let errorMessage = "Failed to enhance content. Please try again.";

      if (error instanceof Error) {
        if (error.message.includes("API_KEY")) {
          errorMessage = "AI service is not configured. Please check your API key.";
        } else if (error.message.includes("rate limit")) {
          errorMessage = "AI service rate limit reached. Please try again in a few minutes.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }

      setEnhancementError(errorMessage);
    } finally {
      setIsEnhancing(false);
    }
  };

  const salutationOptions = [
    'Dear Hiring Manager,',
    'Dear Sir/Madam,',
    'To Whom It May Concern,',
    'Dear Recruiter,',
    'Dear Team,'
  ];

  const closingOptions = [
    'Sincerely,',
    'Best regards,',
    'Kind regards,',
    'Respectfully,',
    'Thank you,'
  ];

  return (
    <div className="space-y-1">
      {/* Sender Information Section */}
      <Accordion title="Your Information">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={data.senderName}
              onChange={(e) => handleFieldChange('senderName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${validationErrors.senderName
                ? 'border-red-300 dark:border-red-600'
                : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="John Doe"
            />
            {validationErrors.senderName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.senderName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={data.senderEmail}
              onChange={(e) => handleFieldChange('senderEmail', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${validationErrors.senderEmail
                ? 'border-red-300 dark:border-red-600'
                : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="john.doe@email.com"
            />
            {validationErrors.senderEmail && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.senderEmail}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={data.senderPhone}
              onChange={(e) => handleFieldChange('senderPhone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <input
              type="text"
              value={data.senderAddress}
              onChange={(e) => handleFieldChange('senderAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="City, State ZIP"
            />
          </div>
        </div>
      </Accordion>

      {/* Recipient Information Section */}
      <Accordion title="Recipient Information">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipient Name
            </label>
            <input
              type="text"
              value={data.recipientName}
              onChange={(e) => handleFieldChange('recipientName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Recipient Title
            </label>
            <input
              type="text"
              value={data.recipientTitle}
              onChange={(e) => handleFieldChange('recipientTitle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Hiring Manager"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Name *
            </label>
            <input
              type="text"
              value={data.companyName}
              onChange={(e) => handleFieldChange('companyName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${validationErrors.companyName
                ? 'border-red-300 dark:border-red-600'
                : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="Company Inc."
              required
            />
            {validationErrors.companyName && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.companyName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Address
            </label>
            <input
              type="text"
              value={data.companyAddress}
              onChange={(e) => handleFieldChange('companyAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="123 Business St, City, State ZIP"
            />
          </div>
        </div>
      </Accordion>

      {/* Job Application Details */}
      <Accordion title="Job Application Details">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              value={data.jobTitle}
              onChange={(e) => handleFieldChange('jobTitle', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white ${validationErrors.jobTitle
                ? 'border-red-300 dark:border-red-600'
                : 'border-gray-300 dark:border-gray-600'
                }`}
              placeholder="Software Developer"
              required
            />
            {validationErrors.jobTitle && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.jobTitle}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              value={data.date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
        </div>
      </Accordion>

      {/* Letter Content */}
      <Accordion title="Letter Content" isOpenDefault={true}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Salutation
            </label>
            <div className="flex flex-col space-y-2">
              <select
                value={data.salutation}
                onChange={(e) => handleFieldChange('salutation', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {salutationOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={data.salutation}
                onChange={(e) => handleFieldChange('salutation', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Custom salutation"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Body Content
              </label>
              <button
                type="button"
                onClick={handleAIEnhancement}
                disabled={isEnhancing}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                {isEnhancing ? (
                  <>
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Enhancing...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Enhance with AI</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              value={data.bodyContent}
              onChange={(e) => handleFieldChange('bodyContent', e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Write your cover letter content here, or use AI enhancement to generate professional content based on your resume and job details..."
              aria-describedby="body-content-help"
            />
            <div id="body-content-help" className="sr-only">
              Main content area for your cover letter. You can type directly or use the AI enhancement button to generate content.
            </div>
            {enhancementError && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                {enhancementError}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Closing
            </label>
            <div className="flex flex-col space-y-2">
              <select
                value={data.closing}
                onChange={(e) => handleFieldChange('closing', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {closingOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={data.closing}
                onChange={(e) => handleFieldChange('closing', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Custom closing"
              />
            </div>
          </div>
        </div>
      </Accordion>

      {/* Validation Messages */}
      <div className="text-sm text-gray-500 dark:text-gray-400 px-1">
        <p>* Required fields</p>
        {Object.keys(validationErrors).length > 0 && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <p className="text-red-600 dark:text-red-400 font-medium">Please fix the following errors:</p>
            <ul className="mt-1 list-disc list-inside text-red-600 dark:text-red-400">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverLetterEditor;