/**
 * @jest-environment node
 */

import { enhanceCoverLetterWithAI } from '../../services/geminiService';
import { initialResumeData } from '../../types';

// Mock the Google GenAI
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn()
    }
  }))
}));

const mockResumeData = {
  ...initialResumeData,
  summary: 'Experienced software developer with 5 years in web development',
  experience: [
    {
      id: '1',
      company: 'Tech Solutions',
      position: 'Senior Developer',
      location: 'San Francisco, CA',
      startDate: 'Jan 2020',
      endDate: 'Present',
      isCurrent: true,
      summary: 'Led development of web applications using React and Node.js'
    }
  ],
  skills: [
    {
      id: '1',
      name: 'Programming Languages',
      keywords: ['JavaScript', 'TypeScript', 'Python']
    }
  ]
};

describe('geminiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variable
    process.env.API_KEY = 'test-api-key';
  });

  describe('enhanceCoverLetterWithAI', () => {
    test('throws error when job title is missing', async () => {
      await expect(
        enhanceCoverLetterWithAI('', 'Tech Corp', mockResumeData)
      ).rejects.toThrow('Job title is required for AI enhancement');
    });

    test('throws error when company name is missing', async () => {
      await expect(
        enhanceCoverLetterWithAI('Developer', '', mockResumeData)
      ).rejects.toThrow('Company name is required for AI enhancement');
    });

    test('calls Gemini API with correct parameters', async () => {
      const { GoogleGenAI } = require('@google/genai');
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: 'Generated cover letter content'
      });
      
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent
        }
      }));

      const result = await enhanceCoverLetterWithAI(
        'Software Developer',
        'Tech Corp',
        mockResumeData,
        'Draft content'
      );

      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash',
        contents: expect.stringContaining('Software Developer'),
        config: {
          systemInstruction: expect.stringContaining('expert career consultant'),
          temperature: 0.7,
          topP: 1,
          topK: 1
        }
      });

      expect(result).toBe('Generated cover letter content');
    });

    test('includes resume context in the prompt', async () => {
      const { GoogleGenAI } = require('@google/genai');
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: 'Generated content'
      });
      
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent
        }
      }));

      await enhanceCoverLetterWithAI(
        'Software Developer',
        'Tech Corp',
        mockResumeData
      );

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const prompt = callArgs.contents;

      expect(prompt).toContain('Software Developer');
      expect(prompt).toContain('Tech Corp');
      expect(prompt).toContain('Experienced software developer');
      expect(prompt).toContain('Senior Developer at Tech Solutions');
      expect(prompt).toContain('JavaScript, TypeScript, Python');
    });

    test('handles API errors gracefully', async () => {
      const { GoogleGenAI } = require('@google/genai');
      const mockGenerateContent = jest.fn().mockRejectedValue(
        new Error('API rate limit exceeded')
      );
      
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent
        }
      }));

      await expect(
        enhanceCoverLetterWithAI('Developer', 'Tech Corp', mockResumeData)
      ).rejects.toThrow('API rate limit exceeded');
    });

    test('includes body draft when provided', async () => {
      const { GoogleGenAI } = require('@google/genai');
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: 'Enhanced content'
      });
      
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent
        }
      }));

      await enhanceCoverLetterWithAI(
        'Developer',
        'Tech Corp',
        mockResumeData,
        'My draft content'
      );

      const callArgs = mockGenerateContent.mock.calls[0][0];
      expect(callArgs.contents).toContain('My draft content');
    });

    test('handles empty resume data gracefully', async () => {
      const { GoogleGenAI } = require('@google/genai');
      const mockGenerateContent = jest.fn().mockResolvedValue({
        text: 'Generated content'
      });
      
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent
        }
      }));

      const emptyResumeData = {
        ...initialResumeData,
        experience: [],
        skills: [],
        education: []
      };

      const result = await enhanceCoverLetterWithAI(
        'Developer',
        'Tech Corp',
        emptyResumeData
      );

      expect(result).toBe('Generated content');
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    test('trims whitespace from required fields', async () => {
      await expect(
        enhanceCoverLetterWithAI('  ', 'Tech Corp', mockResumeData)
      ).rejects.toThrow('Job title is required for AI enhancement');

      await expect(
        enhanceCoverLetterWithAI('Developer', '  ', mockResumeData)
      ).rejects.toThrow('Company name is required for AI enhancement');
    });
  });
});