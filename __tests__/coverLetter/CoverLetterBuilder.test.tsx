/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CoverLetterBuilder from '../../components/coverLetter/CoverLetterBuilder';
import { initialCoverLetterData, initialResumeData } from '../../types';

// Mock the PDF generation library
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

const mockProps = {
  coverLetterData: initialCoverLetterData,
  onUpdate: jest.fn(),
  resumeData: initialResumeData,
  onBack: jest.fn()
};

describe('CoverLetterBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders cover letter builder with all main sections', () => {
    render(<CoverLetterBuilder {...mockProps} />);
    
    expect(screen.getByText('AI Cover Letter Builder')).toBeInTheDocument();
    expect(screen.getByText('Cover Letter Details')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  test('calls onBack when back button is clicked', () => {
    render(<CoverLetterBuilder {...mockProps} />);
    
    const backButton = screen.getByLabelText('Go back to artifact selection');
    fireEvent.click(backButton);
    
    expect(mockProps.onBack).toHaveBeenCalledTimes(1);
  });

  test('exports JSON when export button is clicked', () => {
    // Mock createElement and click
    const mockLink = {
      href: '',
      download: '',
      click: jest.fn()
    };
    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    
    render(<CoverLetterBuilder {...mockProps} />);
    
    const exportButton = screen.getByLabelText('Export cover letter data as JSON file');
    fireEvent.click(exportButton);
    
    expect(mockLink.click).toHaveBeenCalledTimes(1);
    expect(mockLink.download).toContain('.json');
  });

  test('generates PDF when download button is clicked', async () => {
    // Mock the preview element
    const mockElement = document.createElement('div');
    mockElement.id = 'cover-letter-preview';
    document.body.appendChild(mockElement);
    
    render(<CoverLetterBuilder {...mockProps} />);
    
    const downloadButton = screen.getByLabelText('Download cover letter as PDF');
    fireEvent.click(downloadButton);
    
    await waitFor(() => {
      expect(global.html2pdf).toHaveBeenCalled();
    });
    
    document.body.removeChild(mockElement);
  });

  test('updates template when template selector is used', () => {
    render(<CoverLetterBuilder {...mockProps} />);
    
    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);
    
    // Should show template options
    expect(screen.getByText('Choose Template')).toBeInTheDocument();
  });

  test('handles import functionality', () => {
    render(<CoverLetterBuilder {...mockProps} />);
    
    const importButton = screen.getByLabelText('Import cover letter data from JSON file');
    expect(importButton).toBeInTheDocument();
    
    // Test that clicking import button triggers file selection
    fireEvent.click(importButton);
    // Note: File input interaction would need more complex mocking for full testing
  });
});