import { getContactItems } from './privateConfig';

export interface ContactItem {
  type: string;
  label: string;
  value: string;
  href: string;
}

export interface FooterConfig {
  copyright: {
    text: string;
    startYear: number;
  };
  teamContact: ContactItem[];
}

export const footerConfig: FooterConfig = {
  copyright: {
    // Base text for the copyright notice
    text: "DUAL-SYNC | BuildResumeNow",
    // The year the project started
    startYear: 2023,
  },
  // Get contact items from private config (only shows non-empty values)
  teamContact: getContactItems(),
};