/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';
import * as geminiService from '../../services/geminiService';

// Mock the Gemini service
jest.mock('../../services/geminiService');
const mockEnhanceCoverLetterWithAI = (geminiService.enhanceCoverLetterWithAI as any);

// Mock PDF generation
declare global {
  var html2pdf: jest.Mock;
}

beforeAll(() => {
  // Mock scroll methods which are not implemented in JSDOM
  Element.prototype.scrollIntoView = jest.fn();
  window.scrollTo = jest.fn();
  window.scrollBy = jest.fn();
  window.alert = jest.fn();
  (window as any).checkUserLimit = jest.fn(() => true);

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
    window.history.pushState({}, '', '/');
    // Default to a desktop viewport so the builders render their full layout.
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
  });

  test('complete user workflow from landing to cover letter creation', async () => {
    render(<App />);

    // 1. Start from landing page
    expect(screen.getByText((content, element) => content.includes('Build Your Story with an'))).toBeInTheDocument();

    const startButton = screen.getAllByText((content, element) => content === 'Start Building')[0];
    fireEvent.click(startButton);

    // 2. Navigate to artifact selector
    await screen.findByRole('heading', { name: /Choose What to Build/i, level: 2 }, { timeout: 10000 });
    expect(screen.getAllByText('Build Resume')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Build Cover Letter')[0]).toBeInTheDocument();

    const coverLetterCard = screen.getAllByText('Build Cover Letter')[0];
    fireEvent.click(coverLetterCard);

    // 3. Should now be in cover letter landing page, click start
    const startWritingButton = screen.getByText((content, element) => content === 'Start Writing Your Cover Letter');
    fireEvent.click(startWritingButton);

    // 4. Should now be in cover letter builder
    expect(screen.getByRole('heading', { name: /AI Cover Letter Builder/i })).toBeInTheDocument();
    expect(screen.getByText('Cover Letter Details')).toBeInTheDocument();

    // Check for dropdown trigger instead of direct Preview button
    expect(screen.getByRole('button', { name: /Download PDF/i })).toBeInTheDocument();
  });

  test('data synchronization between resume and cover letter', async () => {
    render(<App />);

    // Navigate to cover letter builder
    fireEvent.click(screen.getAllByText('Start Building')[0]);
    fireEvent.click(screen.getAllByText('Build Cover Letter')[0]);
    fireEvent.click(screen.getByText('Start Writing Your Cover Letter'));

    // 4. Should now be in cover letter builder
    expect(screen.getByRole('heading', { name: /AI Cover Letter Builder/i })).toBeInTheDocument();

    // Expand Your Information to see sync'd data
    fireEvent.click(screen.getByText('Your Information'));

    const nameInput = screen.getAllByDisplayValue('John Doe')[0];
    expect(nameInput).toBeInTheDocument();

    const emailInput = screen.getAllByDisplayValue('john.doe@gmail.com')[0];
    expect(emailInput).toBeInTheDocument();

    // Change name in cover letter
    fireEvent.change(nameInput, { target: { value: 'Jane Smith' } });

    // Go back to resume builder via header button
    const switchButton = screen.getByRole('button', { name: /Switch to resume builder/i });
    fireEvent.click(switchButton);

    // If it lands on landing page, click the 'Build Resume' card
    if (screen.queryByText(/Choose What to Build/i)) {
      fireEvent.click(screen.getAllByText('Build Resume')[0]);
    }

    // Should now be in resume builder
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /AI Resume Builder/i })).toBeInTheDocument();
    }, { timeout: 10000 });

    // Note: This would require more complex state management testing
    // to verify the actual synchronization across components
  });

  test('AI enhancement workflow', async () => {
    mockEnhanceCoverLetterWithAI.mockResolvedValue('AI generated cover letter content that highlights relevant experience and skills for the Software Developer position at Tech Corp.');

    render(<App />);

    // Navigate to cover letter builder
    fireEvent.click(screen.getAllByText('Start Building')[0]);
    fireEvent.click(screen.getAllByText('Build Cover Letter')[0]);
    fireEvent.click(screen.getByText('Start Writing Your Cover Letter'));

    // Fill in required fields
    fireEvent.click(screen.getByText('Job Application Details'));
    const jobTitleInput = screen.getByPlaceholderText('Software Developer');
    fireEvent.change(jobTitleInput, { target: { value: 'Software Developer' } });

    fireEvent.click(screen.getByText('Recipient Information'));
    const companyInput = screen.getByPlaceholderText('Company Inc.');
    fireEvent.change(companyInput, { target: { value: 'Tech Corp' } });

    // Expand Letter Content to show AI button
    fireEvent.click(screen.getByText('Letter Content'));

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
      const preview = screen.getByRole('document');
      if (!preview.textContent?.includes('AI generated cover letter content')) {
        // screen.debug(preview); // Uncomment if still failing
      }
      expect(preview.textContent).toContain('AI generated cover letter content');
    }, { timeout: 5000 });
  });

  test('template selection updates preview', async () => {
    render(<App />);

    // Navigate to cover letter builder
    fireEvent.click(screen.getAllByText('Start Building')[0]);
    fireEvent.click(screen.getAllByText('Build Cover Letter')[0]);
    fireEvent.click(screen.getByText('Start Writing Your Cover Letter'));

    // Select Modern template - it's already in the Templates tab by default
    const modernTemplate = screen.getAllByText('Modern')[0];
    fireEvent.click(modernTemplate);

    // Template should be selected (check for active state or callback if possible)
    // No Choose Template modal anymore
    expect(screen.queryByText('Choose Template')).not.toBeInTheDocument();

    // Preview should update (this would require checking styling changes)
    expect(screen.getByRole('document')).toBeInTheDocument();
  });

  test('PDF generation workflow', async () => {
    render(<App />);

    // Navigate to cover letter builder
    fireEvent.click(screen.getAllByText('Start Building')[0]);
    fireEvent.click(screen.getAllByText('Build Cover Letter')[0]);
    fireEvent.click(screen.getByText('Start Writing Your Cover Letter'));

    // Mock the preview element
    const mockElement = document.createElement('div');
    mockElement.id = 'cover-letter-preview';
    document.body.appendChild(mockElement);

    // Fill in some basic data
    fireEvent.click(screen.getByText('Your Information'));
    const nameInput = screen.getAllByDisplayValue('John Doe')[0];
    fireEvent.change(nameInput, { target: { value: 'Test User' } });

    fireEvent.click(screen.getByText('Recipient Information'));
    const companyInput = screen.getByPlaceholderText('Company Inc.');
    fireEvent.change(companyInput, { target: { value: 'Test Company' } });

    // Open Download dropdown
    const dropdownTrigger = screen.getByRole('button', { name: /Download PDF/i });
    fireEvent.click(dropdownTrigger);

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
    fireEvent.click(await screen.findByText('Start Building'));
    fireEvent.click(await screen.findByText('Build Cover Letter'));
    fireEvent.click(await screen.findByText('Start Writing Your Cover Letter'));

    // The editor's accordions are single-open. "Letter Content" (which holds the
    // Enhance-with-AI button) is open by default. Query the button by role so we
    // never accidentally match the preview's placeholder copy, which also
    // contains the words "Enhance with AI".
    const enhanceButton = () => screen.getByRole('button', { name: /Enhance with AI/i });

    // 1. No job title yet -> job-title validation toast.
    fireEvent.click(await screen.findByRole('button', { name: /Enhance with AI/i }));
    expect(await screen.findByText(/Please enter a job title/i, {}, { timeout: 10000 })).toBeInTheDocument();

    // Dismiss the toast.
    fireEvent.click(screen.getByRole('alert').querySelector('button')!);
    await waitFor(() => {
      expect(screen.queryByText(/Please enter a job title/i)).not.toBeInTheDocument();
    }, { timeout: 5000 });

    // 2. Fill in the job title (this closes "Letter Content").
    fireEvent.click(screen.getByText('Job Application Details'));
    const jobTitleInput = await screen.findByPlaceholderText('Software Developer');
    fireEvent.change(jobTitleInput, { target: { value: 'Developer' } });

    // Re-open "Letter Content" so the Enhance button is mounted again.
    fireEvent.click(screen.getByText('Letter Content'));
    await waitFor(() => expect(enhanceButton()).toBeInTheDocument());

    // 3. Job title set, company still empty -> company validation toast.
    fireEvent.click(enhanceButton());
    expect(await screen.findByText(/Please enter a company name/i, {}, { timeout: 10000 })).toBeInTheDocument();
  }, 30000);

  test('renders the purpose-built mobile shell on a phone viewport', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(<App />);

    // Navigate to cover letter builder
    const startButtons = screen.getAllByText((content, element) => content === 'Start Building');
    fireEvent.click(startButtons[1] || startButtons[0]);
    fireEvent.click(screen.getAllByText('Build Cover Letter')[0]);
    fireEvent.click(screen.getByText((content, element) => content === 'Start Writing Your Cover Letter'));

    // The mobile shell: compact bar + a bottom Edit/Preview/Design switch,
    // one surface at a time (not the three-panel desktop layout).
    expect(screen.getByRole('heading', { name: /Cover letter/i })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /Builder view/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Edit$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Preview$/i })).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByLabelText('Back')).toBeInTheDocument();

    // The desktop-only three-panel chrome must NOT be present.
    expect(screen.queryByText('Cover Letter Details')).not.toBeInTheDocument();
  });

  test('accessibility features work correctly', () => {
    render(<App />);

    // Navigate to cover letter builder
    fireEvent.click(screen.getAllByText('Start Building')[0]);
    fireEvent.click(screen.getAllByText('Build Cover Letter')[0]);
    fireEvent.click(screen.getByText('Start Writing Your Cover Letter'));

    // Check ARIA labels and roles
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByRole('document')).toBeInTheDocument();

    // Check navigation accessibility
    expect(screen.getByLabelText('Back')).toBeInTheDocument();

    // Open dropdown to check its items accessibility
    fireEvent.click(screen.getByRole('button', { name: /Download PDF/i }));
    expect(screen.getByLabelText('Download cover letter as PDF')).toBeInTheDocument();

    // Check form accessibility
    expect(screen.getByLabelText('Cover letter actions')).toBeInTheDocument();
  });
});