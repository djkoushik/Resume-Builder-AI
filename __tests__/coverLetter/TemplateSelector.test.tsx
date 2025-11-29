/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplateSelector from '../../components/coverLetter/TemplateSelector';
import { coverLetterTemplates } from '../../types';

const mockProps = {
  selectedTemplateId: 'professional',
  onTemplateSelect: jest.fn()
};

describe('TemplateSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders template selector button', () => {
    render(<TemplateSelector {...mockProps} />);
    
    expect(screen.getByText('Templates')).toBeInTheDocument();
  });

  test('opens template selection modal when clicked', () => {
    render(<TemplateSelector {...mockProps} />);
    
    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);
    
    expect(screen.getByText('Choose Template')).toBeInTheDocument();
  });

  test('displays all available templates', () => {
    render(<TemplateSelector {...mockProps} />);
    
    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);
    
    coverLetterTemplates.forEach(template => {
      expect(screen.getByText(template.name)).toBeInTheDocument();
      expect(screen.getByText(template.description)).toBeInTheDocument();
    });
  });

  test('shows selected template with checkmark', () => {
    render(<TemplateSelector {...mockProps} />);
    
    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);
    
    // Professional template should be selected by default
    const professionalTemplate = screen.getByText('Professional').closest('div');
    expect(professionalTemplate).toHaveClass('border-blue-500');
  });

  test('calls onTemplateSelect when template is clicked', () => {
    render(<TemplateSelector {...mockProps} />);
    
    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);
    
    const modernTemplate = screen.getByText('Modern');
    fireEvent.click(modernTemplate);
    
    expect(mockProps.onTemplateSelect).toHaveBeenCalledWith('modern');
  });

  test('closes modal when template is selected', () => {
    render(<TemplateSelector {...mockProps} />);
    
    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);
    
    expect(screen.getByText('Choose Template')).toBeInTheDocument();
    
    const modernTemplate = screen.getByText('Modern');
    fireEvent.click(modernTemplate);
    
    expect(screen.queryByText('Choose Template')).not.toBeInTheDocument();
  });

  test('closes modal when backdrop is clicked', () => {
    render(<TemplateSelector {...mockProps} />);
    
    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);
    
    expect(screen.getByText('Choose Template')).toBeInTheDocument();
    
    // Click backdrop (the fixed overlay)
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    
    expect(screen.queryByText('Choose Template')).not.toBeInTheDocument();
  });

  test('displays template previews with correct styling', () => {
    render(<TemplateSelector {...mockProps} />);
    
    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);
    
    // Check that template previews show font families
    coverLetterTemplates.forEach(template => {
      expect(screen.getByText(`${template.name} Style`)).toBeInTheDocument();
      expect(screen.getByText(`Sample body text in ${template.styles.fonts.body}`)).toBeInTheDocument();
    });
  });

  test('shows current template in footer', () => {
    render(<TemplateSelector {...mockProps} />);
    
    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);
    
    expect(screen.getByText('Professional')).toBeInTheDocument();
  });

  test('handles different selected template', () => {
    const propsWithModern = {
      ...mockProps,
      selectedTemplateId: 'modern'
    };
    
    render(<TemplateSelector {...propsWithModern} />);
    
    const templatesButton = screen.getByText('Templates');
    fireEvent.click(templatesButton);
    
    const modernTemplate = screen.getByText('Modern').closest('div');
    expect(modernTemplate).toHaveClass('border-blue-500');
  });
});