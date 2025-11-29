/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CoverLetterEditor from '../../components/coverLetter/CoverLetterEditor';
import { initialCoverLetterData, initialResumeData } from '../../types';
import * as geminiService from '../../services/geminiService';

// Mock the Gemini service
jest.mock('../../services/geminiService');
const mockEnhanceCoverLetterWithAI = geminiService.enhanceCoverLetterWithAI as jest.MockedFunction<typeof geminiService.enhanceCoverLetterWithAI>;

const mockProps = {
  data: initialCoverLetterData,
  onUpdate: jest.fn(),
  resumeData: initialResumeData
};

describe('CoverLetterEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all form sections', () => {
    render(<CoverLetterEditor {...mockProps} />);
    
    expect(screen.getByText('Your Information')).toBeInTheDocument();
    expect(screen.getByText('Recipient Information')).toBeInTheDocument();
    expect(screen.getByText('Job Application Details')).toBeInTheDocument();
    expect(screen.getByText('Letter Content')).toBeInTheDocument();
  });

  test('updates data when form fields change', () => {
    render(<CoverLetterEditor {...mockProps} />);
    
    const nameInput = screen.getByPlaceholderText('John Doe');
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith({
      ...initialCoverLetterData,
      senderName: 'Jane Smith'
    });
  });

  test('validates required fields', () => {
    const dataWithErrors = {
      ...initialCoverLetterData,
      senderName: '',
      companyName: '',
      jobTitle: ''
    };
    
    render(<CoverLetterEditor {...mockProps} data={dataWithErrors} />);
    
    // Trigger validation by trying to change a field
    const nameInput = screen.getByPlaceholderText('John Doe');
    fireEvent.change(nameInput, { target: { value: '' } });
    fireEvent.blur(nameInput);
    
    // Should show validation error
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  test('validates email format', () => {
    render(<CoverLetterEditor {...mockProps} />);
    
    const emailInput = screen.getByPlaceholderText('john.doe@email.com');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  test('AI enhancement requires job title and company name', async () => {
    const dataWithoutRequired = {
      ...initialCoverLetterData,
      jobTitle: '',
      companyName: ''
    };
    
    render(<CoverLetterEditor {...mockProps} data={dataWithoutRequired} />);
    
    const aiButton = screen.getByText('Enhance with AI');
    fireEvent.click(aiButton);
    
    expect(screen.getByText('Please enter a job title before using AI enhancement.')).toBeInTheDocument();
  });

  test('AI enhancement works with valid data', async () => {
    const dataWithRequired = {
      ...initialCoverLetterData,
      jobTitle: 'Software Developer',
      companyName: 'Tech Corp'
    };
    
    mockEnhanceCoverLetterWithAI.mockResolvedValue('Enhanced cover letter content');
    
    render(<CoverLetterEditor {...mockProps} data={dataWithRequired} />);
    
    const aiButton = screen.getByText('Enhance with AI');
    fireEvent.click(aiButton);
    
    // Should show loading state
    expect(screen.getByText('Enhancing...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(mockEnhanceCoverLetterWithAI).toHaveBeenCalledWith(
        'Software Developer',
        'Tech Corp',
        initialResumeData,
        ''
      );
    });
    
    await waitFor(() => {
      expect(mockProps.onUpdate).toHaveBeenCalledWith({
        ...dataWithRequired,
        bodyContent: 'Enhanced cover letter content'
      });
    });
  });

  test('handles AI enhancement errors', async () => {
    const dataWithRequired = {
      ...initialCoverLetterData,
      jobTitle: 'Software Developer',
      companyName: 'Tech Corp'
    };
    
    mockEnhanceCoverLetterWithAI.mockRejectedValue(new Error('API Error'));
    
    render(<CoverLetterEditor {...mockProps} data={dataWithRequired} />);
    
    const aiButton = screen.getByText('Enhance with AI');
    fireEvent.click(aiButton);
    
    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  test('salutation and closing dropdowns work', () => {
    render(<CoverLetterEditor {...mockProps} />);
    
    const salutationSelect = screen.getByDisplayValue('Dear Hiring Manager,');
    fireEvent.change(salutationSelect, { target: { value: 'Dear Sir/Madam,' } });
    
    expect(mockProps.onUpdate).toHaveBeenCalledWith({
      ...initialCoverLetterData,
      salutation: 'Dear Sir/Madam,'
    });
  });

  test('character limits are enforced', () => {
    render(<CoverLetterEditor {...mockProps} />);
    
    const nameInput = screen.getByPlaceholderText('John Doe');
    const longName = 'a'.repeat(101);
    fireEvent.change(nameInput, { target: { value: longName } });
    
    expect(screen.getByText('Name must be less than 100 characters')).toBeInTheDocument();
  });
});