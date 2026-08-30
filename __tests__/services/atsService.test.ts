import { calculateATSScore } from '../../services/atsService';
import { initialResumeData } from '../../types';
import type { ResumeData } from '../../types';

const candidateWith = (over: Partial<ResumeData>): ResumeData => ({ ...initialResumeData, ...over });

const skillsFor = (keywords: string[]): ResumeData['skills'] => [
  { id: 's1', name: 'Skills', keywords },
];

describe('ATS scorer — skill extraction word boundaries', () => {
  test('does not flag one/two-letter skills ("r", "go") from ordinary JD prose', () => {
    // The production regression: "years", "docker" etc. contain "r"/"go" as substrings.
    const jd = { description: '3+ years of react and docker experience. Python is a plus. Strong Go interest not required.' };
    const candidate = candidateWith({ skills: skillsFor(['react', 'docker', 'python', 'go']) });

    const result = calculateATSScore(candidate, jd);
    const flagged = [...result.gap_analysis.critical_missing, ...result.gap_analysis.bonus_missing];

    expect(flagged).not.toContain('r');
    // The candidate has go/react/docker/python, so none of those should be "missing" either.
    expect(flagged).not.toContain('go');
  });

  test('still detects a genuine standalone one-letter skill ("r")', () => {
    const jd = { description: 'Must have experience with R and Python for statistical analysis.' };
    const candidateMissingR = candidateWith({ skills: skillsFor(['python']) });

    const result = calculateATSScore(candidateMissingR, jd);
    const flagged = [...result.gap_analysis.critical_missing, ...result.gap_analysis.bonus_missing];

    expect(flagged).toContain('r');
  });

  test('detects multi-token / punctuated skills without matching them as substrings', () => {
    const jd = { description: 'Backend in C# and .NET. Frontend with Node.js. Not Objective-C.' };
    const candidate = candidateWith({ skills: skillsFor(['java']) });

    const result = calculateATSScore(candidate, jd);
    const flagged = [...result.gap_analysis.critical_missing, ...result.gap_analysis.bonus_missing];

    expect(flagged).toEqual(expect.arrayContaining(['c#']));
    // ".net" must not be reported from "asp.net"-style text, and plain "c" must not
    // be pulled out of "c#".
    expect(flagged).not.toContain('c');
  });

  test('a JD containing regex metacharacters does not throw', () => {
    const jd = { description: 'Skills: C++ (n/a), C# preferred, ((weird)) *punctuation* + more.' };
    const candidate = candidateWith({ skills: skillsFor(['python']) });

    expect(() => calculateATSScore(candidate, jd)).not.toThrow();
  });

  test('candidate summary fallback credits real skills, not substrings', () => {
    const jd = { description: 'Looking for React and Go experience.' };
    // No explicit skills -> falls back to scanning experience summaries.
    const candidate = candidateWith({
      skills: [],
      experience: [
        {
          id: 'e1',
          company: 'Acme',
          position: 'Engineer',
          location: '',
          startDate: 'Jan 2020',
          endDate: 'Present',
          isCurrent: true,
          // "Golang" contains "go" but only as part of a longer word.
          summary: 'Built a React app; refactored the Golang API gateway.',
        },
      ],
    });

    const result = calculateATSScore(candidate, jd);
    expect(result.metadata.matched_skills).toContain('react');
    expect(result.gap_analysis.critical_missing.concat(result.gap_analysis.bonus_missing)).toContain('go');
  });
});
