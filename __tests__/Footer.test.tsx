import React from 'react';
import { render, screen } from '@testing-library/react';
import Footer from '../components/layout/Footer';
import { footerConfig } from '../src/config/footerConfig';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import test from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock the private config to ensure consistent testing
jest.mock('../src/config/privateConfig', () => ({
  getContactItems: () => [
    {
      type: "email",
      label: "Support",
      value: "team.buildresumenow@gmail.com",
      href: "mailto:team.buildresumenow@gmail.com",
    }
  ]
}));

describe('Footer Component', () => {
  beforeEach(() => {
    render(<Footer />);
  });

  test('renders copyright notice with correct format', () => {
    const currentYear = new Date().getFullYear();
    const expectedCopyright = currentYear === 2023
      ? `© ${currentYear} DUAL-SYNC | BuildResumeNow`
      : `© 2024- ${currentYear} DUAL-SYNC | BuildResumeNow`;

    expect(screen.getByText(expectedCopyright)).toBeInTheDocument();
  });

  test('renders contact information from config', () => {
    expect(screen.getByText('Support')).toBeInTheDocument();
    expect(screen.getByText('team.buildresumenow@gmail.com')).toBeInTheDocument();
  });

  test('renders contact links with correct href attributes', () => {
    const emailLink = screen.getByRole('link', { name: 'team.buildresumenow@gmail.com' });
    expect(emailLink).toHaveAttribute('href', 'mailto:team.buildresumenow@gmail.com');
  });

  test('renders about section', () => {
    expect(screen.getByText('About DUAL-SYNC')).toBeInTheDocument();
    expect(screen.getByText(/DUAL-SYNC presents BuildResumeNow/)).toBeInTheDocument();
  });

  test('renders contact us section', () => {
    expect(screen.getByText('Contact Us')).toBeInTheDocument();
  });
});