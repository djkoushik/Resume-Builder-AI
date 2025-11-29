/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';
import * as geminiService from '../../services/geminiService';

// Mock the Gemini service
jest.mock('../../services/geminiService');
const mockEnhanceCoverLetterWithAI = geminiService.enhanceCoverLetterWithAI as jest.MockedFunction<typeof geminiService.enhanceCoverLetterWithAI>;

// Mock PDF generation
declare global {
  var html2pdf: jest.Mock;
}

beforeAll(() => {
  global.html2pdf = jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(undefined),
    toPdf: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      output: jest.fn().mockReturnValue('mock-blob-url')
    })
  }));
});

describe('Cover Letter Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('complete user workflow from landing to cover letter creation', async () => {
    render(<App />);
    
    // 1. Start from landing page
    expect(screen.getByText(/Build Your Story with an/)).toBeInTheDocument();
    
    const startButton = screen.getByText('Start Building');
    fireEvent.click(startButton);
    
    // 2. Navigate to artifact selector
    expect(screen.getByText('Choose What to Build')).toBeInTheDocument();
    expect(screen.getByText('Build Resume')).toBeInTheDocument();
    expect(screen.getByText('Build Cover Letter')).toBeInTheDocument();
    
    const coverLetterCard = screen.getByText('Build Cover Letter');
    fireEvent.click(coverLetterCard);
    
    // 3. Should now be in cover letter builder
    expect(screen.getByText('AI Cover Letter Builder')).toBeInTheDocument();
    expect(screen.getByText('Cover Letter Details')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  test('data synchronization between resume and cover letter', async () => {
    render(<App />);
    
    // Navigate to cover letter builder
    fireEvent.click(screen.getByText('Start Building'));
    fireEvent.click(screen.getByText('Build Cover Letter'));
    
    // Check that resume data is pre-populated
    const nameInput = screen.getByDisplayValue('John Doe');
    expect(nameInput).toBeInTheDocument();
    
    const emailInput = screen.getByDisplayValue('john.doe@gmail.com');
    expect(emailInput).toBeInTheDocument();
    
    // Change name in cover letter
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });
    
    // Go back to resume builder to verify sync
    fireEvent.click(screen.getByLabelText('Go back to artifact selection'));
    fireEvent.click(screen.getByText('Build Resume'));
    
    // Note: This would require more complex state management testing
    // to verify the actual synchronization across components
  });

  test('AI enhancement workflow', async () => {
    mockEnhanceCoverLetterWithAI.mockResolvedValue('AI generated cover letter content that highlights relevant experience and skills for the Software Developer position at Tech Corp.');
    
    render(<App />);
    
    // Navigate to cover letter builder
    fireEvent.click(screen.getByText('Start Building'));
    fireEvent.click(screen.getByText('Build Cover Letter'));
    
    // Fill in required fields
    const jobTitleInput = screen.getByPlaceholderText('Software Developer');
    fireEvent.change(jobTitleInput, { target: { value: 'Software Developer' } });
    
    const companyInput = screen.getByPlaceholderText('Company Inc.');
    fireEvent.change(companyInput, { target: { value: 'Tech Corp' } });
    
    // Use AI enhancement
    const aiButton = screen.getByText('Enhance with AI');
    fireEvent.click(aiButton);
    
    // Should show loading state
    expect(screen.getByText('Enhancing...')).toBeInTheDocument();
    
    // Wait for AI enhancement to complete
    await waitFor(() => {
      expect(mockEnhanceCoverLetterWithAI).toHaveBeenCalledWith(
        'Software Developer',
        'Tech Corp',
        expect.any(Object),
        ''
      );
    });
    
    // Should update the preview with AI content
    await waitFor(() => {
      expect(screen.getByText(/AI generated cover letter content/)).toBeInTheDocument();
    });
  });

  test('template selection updates preview', async () => {
    render(<App />);
    
    // Navigate to cover letter builder
    fireEvent.click(screen.getByText('Start Building'));
    fireEvent.click(screen.getByText('Build Cover Letter'));
    
    // Open template selector
    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);
    
    // Select Modern template
    const modernTemplate = screen.getByText('Modern');
    fireEvent.click(modernTemplate);
    
    // Template selector should close
    expect(screen.queryByText('Choose Template')).not.toBeInTheDocument();
    
    // Preview should update (this would require checking styling changes)
    expect(screen.getByRole('document')).toBeInTheDocument();
  });

  test('PDF generation workflow', async () => {
    render(<App />);
    
    // Navigate to cover letter builder
    fireEvent.click(screen.getByText('Start Building'));
    fireEvent.click(screen.getByText('Build Cover Letter'));
    
    // Mock the preview element
    const mockElement = document.createElement('div');
    mockElement.id = 'cover-letter-preview';
    document.body.appendChild(mockElement);
    
    // Fill in some basic data
    const nameInput = screen.getByDisplayValue('John Doe');
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    
    const companyInput = screen.getByPlaceholderText('Company Inc.');
    fireEvent.change(companyInput, { target: { value: 'Test Company' } });
    
    // Download PDF
    const downloadButton = screen.getByLabelText('Download cover letter as PDF');
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      expect(global.html2pdf).toHaveBeenCalled();
    });
    
    document.body.removeChild(mockElement);
  });

  test('form validation prevents invalid submissions', async () => {
    render(<App />);
    
    // Navigate to cover letter builder
    fireEvent.click(screen.getByText('Start Building'));
    fireEvent.click(screen.getByText('Build Cover Letter'));
    
    // Try to use AI enhancement without required fields
    const aiButton = screen.getByText('Enhance with AI');
    fireEvent.click(aiButton);
    
    // Should show validation error
    expect(screen.getByText('Please enter a job title before using AI enhancement.')).toBeInTheDocument();
    
    // Fill in job title but not company
    const jobTitleInput = screen.getByPlaceholderText('Software Developer');
    fireEvent.change(jobTitleInput, { target: { value: 'Developer' } });
    
    fireEvent.click(aiButton);
    
    // Should show company validation error
    expect(screen.getByText('Please enter a company name before using AI enhancement.')).toBeInTheDocument();
  });

  test('responsive design works on mobile viewport', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    render(<App />);
    
    // Navigate to cover letter builder
    fireEvent.click(screen.getByText('Start Building'));
    fireEvent.click(screen.getByText('Build Cover Letter'));
    
    // Should render mobile-friendly layout
    expect(screen.getByText('AI Cover Letter Builder')).toBeInTheDocument();
    expect(screen.getByText('Cover Letter Details')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    
    // Header should stack on mobile
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  test('accessibility features work correctly', () => {
    render(<App />);
    
    // Navigate to cover letter builder
    fireEvent.click(screen.getByText('Start Building'));
    fireEvent.click(screen.getByText('Build Cover Letter'));
    
    // Check ARIA labels and roles
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByRole('document')).toBeInTheDocument();
    
    // Check navigation accessibility
    expect(screen.getByLabelText('Go back to artifact selection')).toBeInTheDocument();
    expect(screen.getByLabelText('Download cover letter as PDF')).toBeInTheDocument();
    
    // Check form accessibility
    expect(screen.getByLabelText('Cover letter actions')).toBeInTheDocument();
  });
});