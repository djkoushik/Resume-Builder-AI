/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CoverLetterPreview from '../../components/coverLetter/CoverLetterPreview';
import { initialCoverLetterData } from '../../types';

const mockData = {
  ...initialCoverLetterData,
  senderName: 'John Doe',
  senderEmail: 'john@example.com',
  senderPhone: '(555) 123-4567',
  senderAddress: '123 Main St, City, State 12345',
  recipientName: 'Jane Smith',
  recipientTitle: 'Hiring Manager',
  companyName: 'Tech Corp',
  companyAddress: '456 Business Ave, City, State 67890',
  jobTitle: 'Software Developer',
  bodyContent: 'I am writing to express my interest in the Software Developer position at Tech Corp.\n\nWith my experience in web development, I believe I would be a great fit for your team.',
  date: '2024-01-15'
};

describe('CoverLetterPreview', () => {
  test('renders cover letter preview with all data', () => {
    render(<CoverLetterPreview data={mockData} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Hiring Manager')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Dear Hiring Manager,')).toBeInTheDocument();
    expect(screen.getByText('Sincerely,')).toBeInTheDocument();
  });

  test('renders body content with proper paragraph breaks', () => {
    render(<CoverLetterPreview data={mockData} />);
    
    expect(screen.getByText(/I am writing to express my interest/)).toBeInTheDocument();
    expect(screen.getByText(/With my experience in web development/)).toBeInTheDocument();
  });

  test('formats date correctly', () => {
    render(<CoverLetterPreview data={mockData} />);
    
    expect(screen.getByText('January 15, 2024')).toBeInTheDocument();
  });

  test('handles missing optional data gracefully', () => {
    const minimalData = {
      ...initialCoverLetterData,
      senderName: 'John Doe',
      companyName: 'Tech Corp',
      jobTitle: 'Developer'
    };
    
    render(<CoverLetterPreview data={minimalData} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
  });

  test('renders different templates correctly', () => {
    const modernData = { ...mockData, templateId: 'modern' };
    const { rerender } = render(<CoverLetterPreview data={modernData} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    const creativeData = { ...mockData, templateId: 'creative' };
    rerender(<CoverLetterPreview data={creativeData} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    const executiveData = { ...mockData, templateId: 'executive' };
    rerender(<CoverLetterPreview data={executiveData} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(<CoverLetterPreview data={mockData} />);
    
    const preview = screen.getByRole('document');
    expect(preview).toHaveAttribute('aria-label', 'Cover letter preview');
    expect(preview).toHaveAttribute('id', 'cover-letter-preview');
  });

  test('shows placeholder text when body content is empty', () => {
    const emptyData = { ...mockData, bodyContent: '' };
    render(<CoverLetterPreview data={emptyData} />);
    
    expect(screen.getByText(/Your cover letter content will appear here/)).toBeInTheDocument();
  });

  test('handles long content appropriately', () => {
    const longContent = 'This is a very long paragraph. '.repeat(50);
    const longData = { ...mockData, bodyContent: longContent };
    
    render(<CoverLetterPreview data={longData} />);
    
    expect(screen.getByText(/This is a very long paragraph/)).toBeInTheDocument();
  });
});