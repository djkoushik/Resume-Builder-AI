/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CoverLetterBuilder from '../../components/coverLetter/CoverLetterBuilder';
import { initialCoverLetterData, initialResumeData } from '../../types';

// PDF export now goes through the browser's print pipeline (utils/printDocument).

beforeAll(() => {
  // jsdom has no print implementation.
  window.print = jest.fn();
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

    expect(screen.getByRole('heading', { name: /AI Cover Letter Builder/i })).toBeInTheDocument();
    expect(screen.getByText('Cover Letter Details')).toBeInTheDocument();

    // The main Download PDF button (dropdown trigger) should be visible
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();

    // The "Templates" tab button
    expect(screen.getAllByText('Templates')[0]).toBeInTheDocument();
  });

  test('calls onBack when back button is clicked', () => {
    render(<CoverLetterBuilder {...mockProps} />);

    const backButton = screen.getByLabelText('Back');
    fireEvent.click(backButton);

    expect(mockProps.onBack).toHaveBeenCalledTimes(1);
  });

  test('generates PDF when download button is clicked', async () => {
    // Mock the preview element
    const mockElement = document.createElement('div');
    mockElement.id = 'cover-letter-preview';
    document.body.appendChild(mockElement);

    render(<CoverLetterBuilder {...mockProps} />);

    // Open the dropdown first
    const dropdownTrigger = screen.getByRole('button', { name: /Download PDF/i });
    fireEvent.click(dropdownTrigger);

    const downloadButton = screen.getByLabelText('Download cover letter as PDF');
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(window.print).toHaveBeenCalled();
    });

    // Complete the print lifecycle so the cloned #print-root is torn down;
    // jsdom never fires afterprint on its own.
    fireEvent(window, new Event('afterprint'));
    expect(document.getElementById('print-root')).toBeNull();

    document.body.removeChild(mockElement);
  });

  test('updates template when a template is selected', async () => {
    render(<CoverLetterBuilder {...mockProps} />);

    // Templates tab should be active by default.
    // Click on a template (e.g., 'Modern')
    const modernTemplate = screen.getByText('Modern');
    fireEvent.click(modernTemplate);

    // Should call onUpdate with new templateId
    expect(mockProps.onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      templateId: 'modern'
    }));
  });

});