
import { GoogleGenAI } from "@google/genai";
import { ResumeData } from "../types";

// FIX: Removed apiKey parameter and rely on process.env.API_KEY as per guidelines.
export const enhanceTextWithGemini = async (promptText: string, instruction: string): Promise<string> => {
  // FIX: The API key must be obtained exclusively from the environment variable `process.env.API_KEY`.
  // As per guidelines, assume the API key is pre-configured and accessible.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
          systemInstruction: instruction,
          temperature: 0.7,
          topP: 1,
          topK: 1
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        return `Error: ${error.message}`;
    }
    return "An unknown error occurred with the AI service.";
  }
};

export const enhanceCoverLetterWithAI = async (
  jobTitle: string,
  companyName: string,
  resumeData: ResumeData,
  bodyDraft?: string
): Promise<string> => {
  if (!jobTitle.trim()) {
    throw new Error("Job title is required for AI enhancement");
  }

  if (!companyName.trim()) {
    throw new Error("Company name is required for AI enhancement");
  }

  // Build context from resume data
  const experienceContext = resumeData.experience
    .map(exp => `${exp.position} at ${exp.company}: ${exp.summary}`)
    .join('\n');

  const skillsContext = resumeData.skills
    .map(skill => `${skill.name}: ${skill.keywords.join(', ')}`)
    .join('\n');

  const educationContext = resumeData.education
    .map(edu => `${edu.degree} in ${edu.areaOfStudy} from ${edu.institution}`)
    .join('\n');

  const systemPrompt = `You are an expert career consultant and professional writer. Draft a compelling, professional cover letter body for the applicant. The tone should be enthusiastic yet professional, highlighting how the applicant's experience aligns with the desired role. 

Key requirements:
- Output ONLY the body paragraphs (no salutation or closing)
- Keep it to 2-3 paragraphs maximum
- Be specific about relevant experience and skills
- Show enthusiasm for the role and company
- Maintain professional tone throughout
- Make it personalized to the job and company`;

  const userQuery = `Write a cover letter body for:

Job Title: ${jobTitle}
Company: ${companyName}
${bodyDraft ? `Current draft/focus: ${bodyDraft}` : ''}

Applicant's Background:
Professional Summary: ${resumeData.summary}

Work Experience:
${experienceContext}

Skills:
${skillsContext}

Education:
${educationContext}

Please generate compelling body content that connects the applicant's background to this specific role at ${companyName}.`;

  return enhanceTextWithGemini(userQuery, systemPrompt);
};