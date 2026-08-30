import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImportReviewPanel from '../../components/import/ImportReviewPanel';
import { parseResumeText } from '../../utils/resumeImport/heuristicParser';
import { emptyContent } from '../../utils/resumeImport/normalize';
import type { ParsedResume } from '../../utils/resumeImport/types';

const sample = (): ParsedResume =>
  parseResumeText(
    [
      'PRIYA SHARMA',
      'Senior Backend Engineer',
      'Bengaluru, India | priya.sharma@gmail.com',
      '',
      'WORK EXPERIENCE',
      '',
      'Razorpay - Senior Backend Engineer',
      'March 2021 - Present',
      '- Led the settlements migration.',
      '',
      'SKILLS',
      'Languages: Go, Python',
    ].join('\n')
  );

const renderPanel = (overrides: Partial<React.ComponentProps<typeof ImportReviewPanel>> = {}) => {
  const onChange = jest.fn();
  const props = { parsed: sample(), onChange, isPristine: true, ...overrides };
  const utils = render(<ImportReviewPanel {...props} />);
  return { ...utils, onChange, props };
};

describe('ImportReviewPanel', () => {
  test('renders the parsed values into editable fields', () => {
    renderPanel();
    expect(screen.getByLabelText('Full Name')).toHaveValue('PRIYA SHARMA');
    expect(screen.getByLabelText('Email')).toHaveValue('priya.sharma@gmail.com');
    expect(screen.getByLabelText('Location')).toHaveValue('Bengaluru, India');
  });

  test('editing a field reports the full updated content', () => {
    const { onChange } = renderPanel();
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Priya S' } });

    expect(onChange).toHaveBeenCalledTimes(1);
    const updated = onChange.mock.calls[0][0];
    expect(updated.basics.name).toBe('Priya S');
    // Everything else must survive the edit.
    expect(updated.experience).toHaveLength(1);
    expect(updated.skills).toHaveLength(1);
  });

  test('shows the overwrite warning only when the resume is not pristine', () => {
    const { unmount } = renderPanel({ isPristine: true });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    unmount();

    renderPanel({ isPristine: false });
    expect(screen.getByRole('alert')).toHaveTextContent('replace what you have written');
  });

  test('flags fields the parser guessed', () => {
    renderPanel();
    // The headline is inferred from the line below the name — always a guess.
    expect(screen.getByText(/We guessed this one/i)).toBeInTheDocument();
  });

  test('a guessed field is visually highlighted and linked to its hint', () => {
    renderPanel();
    const headline = screen.getByLabelText('Headline / Job Title');
    expect(headline.className).toMatch(/amber/);

    const hintId = headline.getAttribute('aria-describedby');
    expect(hintId).toBeTruthy();
    expect(document.getElementById(hintId!)).toHaveTextContent(/worth a check/i);

    // A field the parser was sure about carries neither.
    const email = screen.getByLabelText('Email');
    expect(email.className).not.toMatch(/amber/);
    expect(email).not.toHaveAttribute('aria-describedby');
  });

  test('a flagged education entry shows a "to check" badge and a hint', () => {
    const parsed = sample();
    parsed.lowConfidence = [...parsed.lowConfidence, 'education.0.institution'];
    parsed.content.education = [
      { id: 'e1', institution: 'State University, BSc', degree: 'State University, BSc', areaOfStudy: '', startDate: '2012', endDate: '2016', summary: '' },
    ];
    render(<ImportReviewPanel parsed={parsed} onChange={jest.fn()} isPristine />);

    fireEvent.click(screen.getByRole('button', { name: /Education/i }));
    expect(screen.getByText('1 to check')).toBeInTheDocument();
    expect(screen.getByText(/split this entry automatically/i)).toBeInTheDocument();
  });

  test('reports counts for each section', () => {
    renderPanel();
    expect(screen.getByText('1 role')).toBeInTheDocument();
    expect(screen.getByText('2 skills')).toBeInTheDocument();
  });

  test('says a section is empty rather than hiding it', () => {
    // The seed-data guard made visible: an empty section must be stated, so a
    // user notices content that failed to parse.
    const parsed: ParsedResume = { content: emptyContent(), lowConfidence: [], warnings: [] };
    render(<ImportReviewPanel parsed={parsed} onChange={jest.fn()} isPristine />);

    fireEvent.click(screen.getByRole('button', { name: /Work Experience/i }));
    expect(screen.getByText(/No work experience found/i)).toBeInTheDocument();
  });

  test('shows the AI-unavailable notice without blocking the import', () => {
    renderPanel({ aiUnavailable: true });
    expect(screen.getByRole('status')).toHaveTextContent('without AI assistance');
    // Fields still render — degradation is a notice, not a failure state.
    expect(screen.getByLabelText('Full Name')).toHaveValue('PRIYA SHARMA');
  });
});
