import { ResumeData } from '../types';
import { canonicalMap, stopWords, standardSkills } from '../utils/ats/canonicalMap';
import Fuse from 'fuse.js';

// --- Types ---

export interface JobDescriptionInput {
    title?: string;
    description?: string; // Long text
    required_skills?: string[];
    min_experience?: number;
    max_experience?: number;
}

export interface ATSScoreResult {
    score: number;
    breakdown: {
        hard_constraints: number;
        skill_match: number;
        semantic_match: number;
    };
    gap_analysis: {
        critical_missing: string[];
        bonus_missing: string[];
    };
    metadata: {
        experience_flag: string | null;
        total_jd_skills: number;
        matched_skills: string[];
    };
}

// --- Phase 0: JD Parsing & Dismantling ---

const extractExperienceFromText = (text: string): { min: number, max: number } | null => {
    // Look for patterns like "3-5 years", "3+ years", "minimum 4 years"
    const rangeRegex = /(\d+)[\s-]*to[\s-]*(\d+)\s*years?/i;
    const plusRegex = /(\d+)\+?\s*years?/i;

    const rangeMatch = text.match(rangeRegex);
    if (rangeMatch) {
        return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };
    }

    const plusMatch = text.match(plusRegex);
    if (plusMatch) {
        return { min: parseInt(plusMatch[1]), max: parseInt(plusMatch[1]) + 2 }; // Assume +2 for "plus"
    }

    return null;
};

// --- Phase 2: Normalizer ---

const normalizeText = (text: string): string => {
    return text.toLowerCase().trim();
};

const normalizeSkills = (skills: string[]): Set<string> => {
    return new Set(skills.map(s => normalizeText(s)));
};

// --- Phase 3: Semantic Mapper (Hybrid: Exact -> Alias -> Fuzzy) ---

const fuseOptions = {
    includeScore: true,
    threshold: 0.3, // 0.0 is exact match, 1.0 matches everything
    keys: [] // searching purely strings
};
const fuse = new Fuse(standardSkills, fuseOptions);

const mapToCanonical = (skills: Set<string>): Set<string> => {
    const canonicalSet = new Set<string>();

    skills.forEach(skill => {
        const lowerSkill = normalizeText(skill);

        // 1. Exact Match in Standard List
        if (standardSkills.includes(lowerSkill)) {
            canonicalSet.add(lowerSkill);
            return;
        }

        // 2. Alias Match in Canonical Map
        if (canonicalMap[lowerSkill]) {
            canonicalSet.add(canonicalMap[lowerSkill]);
            return;
        }

        // 3. Fuzzy Match
        // Don't fuzz short acronyms (risk of false positives e.g. "go" ~ "io")
        if (lowerSkill.length > 2) {
            const results = fuse.search(lowerSkill);
            if (results.length > 0 && results[0].score !== undefined && results[0].score < 0.3) {
                // High confidence match
                canonicalSet.add(results[0].item);
                return;
            }
        }

        // 4. Fallback: keep original if no match found
        canonicalSet.add(lowerSkill);
    });
    return canonicalSet;
};

// --- Phase 4: Scoring Engine ---

export const calculateATSScore = (
    candidate: ResumeData,
    jobDescription: JobDescriptionInput
): ATSScoreResult => {

    // -- Phase 0 & 1: Extraction & Validation --
    // (Simplified validation: assume valid inputs if they exist, else default)

    const jdText = (jobDescription.description || "").toLowerCase();
    const jdSkillsRaw = jobDescription.required_skills || [];

    // Attempt to extract experience if not provided
    let jdExp = { min: jobDescription.min_experience || 0, max: jobDescription.max_experience || 0 };
    if (jdExp.min === 0 && jdText) {
        const extracted = extractExperienceFromText(jdText);
        if (extracted) jdExp = extracted;
    }

    // Attempt to extract skills from text if explicit list is empty OR to find bonus skills
    const extractedKeywords = new Set<string>();

    // Helper to find context-based keywords
    if (jdText) {
        // Check for standard skills in text
        standardSkills.forEach(skill => {
            if (jdText.includes(skill)) extractedKeywords.add(skill);
        });
        // Also check aliases
        Object.keys(canonicalMap).forEach(key => {
            if (jdText.includes(key)) extractedKeywords.add(canonicalMap[key]);
        });
    }

    // Determine Critical (P0) vs Bonus (P1) Skills
    const jdCriticalRaw: string[] = [];
    const jdBonusRaw: string[] = [];

    if (jobDescription.required_skills && jobDescription.required_skills.length > 0) {
        // If explicit required skills are provided, use them as Critical
        jdCriticalRaw.push(...jobDescription.required_skills);

        // Any other extracted high-value keywords are Bonus
        extractedKeywords.forEach(kw => {
            if (!jdCriticalRaw.includes(kw)) {
                jdBonusRaw.push(kw);
            }
        });
    } else {
        // If no explicit list, use heuristic based on context words
        // Simple heuristic: if it appears near "bonus", "plus", "preferred" -> Bonus
        // otherwise default to Critical
        extractedKeywords.forEach(kw => {
            const regex = new RegExp(`(bonus|plus|preferred|nice to have|desirable).{0,50}${kw}`, 'i');
            const regexReverse = new RegExp(`${kw}.{0,50}(bonus|plus|preferred|nice to have|desirable)`, 'i');

            const isBonus = regex.test(jdText) || regexReverse.test(jdText);

            // Log to file since we can't see server console
            try {
                const fs = require('fs');
                const logMsg = `[ATS] KW: '${kw}' | JD Snippet: '${jdText.substring(0, 50)}...' | Bonus? ${isBonus}\n`;
                fs.appendFileSync('debug_ats.log', logMsg);
            } catch (e) { }

            if (isBonus) {
                jdBonusRaw.push(kw);
            } else {
                jdCriticalRaw.push(kw);
            }
        });

        // Fallback: if scanning yielded nothing to critical, assume everything extracted is critical
        if (jdCriticalRaw.length === 0 && jdBonusRaw.length === 0 && extractedKeywords.size > 0) {
            jdCriticalRaw.push(...Array.from(extractedKeywords));
        }
    }

    const jdExperienceKeywords = extractKeywords(jdText); // Phase 0.4

    // -- Phase 2: Normalization --

    // Candidate Skills
    const candidateSkillsRaw = candidate.skills.flatMap(s => s.keywords);
    if (candidateSkillsRaw.length === 0) {
        // Fallback regex on history
        candidate.experience.forEach(exp => {
            standardSkills.forEach(skill => {
                if (exp.summary.toLowerCase().includes(skill)) candidateSkillsRaw.push(skill);
            });
            Object.keys(canonicalMap).forEach(key => {
                if (exp.summary.toLowerCase().includes(key)) candidateSkillsRaw.push(key);
            });
        });
    }

    const candidateSet = normalizeSkills(candidateSkillsRaw);
    const jdCriticalSet = normalizeSkills(jdCriticalRaw);
    const jdBonusSet = normalizeSkills(jdBonusRaw);
    const jdTotalSet = new Set([...jdCriticalSet, ...jdBonusSet]);

    // -- Phase 3: Mapping --
    const candidateCanonical = mapToCanonical(candidateSet);
    const jdCriticalCanonical = mapToCanonical(jdCriticalSet);
    const jdBonusCanonical = mapToCanonical(jdBonusSet);
    const jdTotalCanonical = mapToCanonical(jdTotalSet);

    // -- Phase 4: Scoring --

    // 1. Hard Constraints (40%)
    // Experience
    let candidateYears = 0;
    candidate.experience.forEach(exp => {
        const start = new Date(exp.startDate);
        const end = exp.isCurrent ? new Date() : new Date(exp.endDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);
            candidateYears += diffYears;
        }
    });

    let scoreHard = 0;
    if (jdExp.min > 0) {
        if (candidateYears >= jdExp.min && candidateYears <= jdExp.max) {
            scoreHard = 1.0;
        } else if (candidateYears > jdExp.max) {
            scoreHard = 0.9; // Seniority penalty
        } else if (candidateYears < jdExp.min) {
            scoreHard = Math.max(0, 1.0 - ((jdExp.min - candidateYears) / jdExp.min));
        }
    } else {
        scoreHard = 1.0; // No exp req found
    }
    // Education check - assume passed if education section exists and is not empty
    if (candidate.education.length > 0) {
        // Keep as is, could boost slightly or be a binary gate
    } else {
        scoreHard *= 0.8;
    }

    // 2. Skill Match (35%)
    // Base skill match on Critical skills primarily, with Bonus adding extra

    let matchCountCritical = 0;
    const missingCritical: string[] = [];

    jdCriticalCanonical.forEach(skill => {
        if (candidateCanonical.has(skill)) {
            matchCountCritical++;
        } else {
            missingCritical.push(skill);
        }
    });

    let matchCountBonus = 0;
    const missingBonus: string[] = [];

    jdBonusCanonical.forEach(skill => {
        if (candidateCanonical.has(skill)) {
            matchCountBonus++;
        } else {
            missingBonus.push(skill);
        }
    });

    // Score Calculation: 
    // Critical skills are worth 100% of the Skill Score capability.
    // Bonus skills can boost the score or fill gaps?
    // Let's use weighted avg or: Critical is the baseline. 
    // Total Skill Score = (CriticalMatch / TotalCritical) * 0.8 + (BonusMatch / TotalBonus) * 0.2

    let scoreSkill = 0;

    if (jdCriticalCanonical.size > 0) {
        const criticalPart = (matchCountCritical / jdCriticalCanonical.size);
        const bonusPart = jdBonusCanonical.size > 0 ? (matchCountBonus / jdBonusCanonical.size) : 0; // If no bonus logic needed, 0 or 1?

        // If there are no bonus skills defined in JD, critical is 100% of score
        if (jdBonusCanonical.size === 0) {
            scoreSkill = criticalPart;
        } else {
            scoreSkill = (criticalPart * 0.8) + (bonusPart * 0.2);
        }
    } else {
        // No critical skills found?
        scoreSkill = 1.0;
    }

    // Critical Penalty (Simplified: if match < 50%, penalty)
    if (jdCriticalCanonical.size > 0 && (matchCountCritical / jdCriticalCanonical.size) < 0.5) {
        scoreSkill *= 0.5;
    }

    // 3. Semantic Match (25%)
    let semanticMatches = 0;
    let semanticTotal = 0;

    // Create a bag-of-words from JD description
    if (jdText) {
        const tokens = jdText.split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));
        const uniqueTokens = new Set(tokens);
        semanticTotal = uniqueTokens.size;

        const candidateString = JSON.stringify(candidate).toLowerCase();
        uniqueTokens.forEach(token => {
            if (candidateString.includes(token)) semanticMatches++;
        });
    }

    const scoreSem = semanticTotal > 0 ? (semanticMatches / semanticTotal) : 1.0;

    // Final Calculation
    const W1 = 0.4;
    const W2 = 0.35;
    const W3 = 0.25;

    let totalScore = (W1 * scoreHard) + (W2 * scoreSkill) + (W3 * scoreSem);

    // -- Phase 5: Output Generation --

    const gap_analysis = {
        critical_missing: missingCritical.slice(0, 5), // Top 5 missing
        bonus_missing: missingBonus.slice(0, 5)
    };

    let experience_flag = null;
    if (candidateYears > jdExp.max && jdExp.max > 0) {
        experience_flag = `Note: You are applying for a role requiring ${jdExp.min}-${jdExp.max} years, but you have ${candidateYears.toFixed(1)}. Recruiters may consider you 'Senior'.`;
    } else if (candidateYears < jdExp.min && jdExp.min > 0) {
        experience_flag = `Note: You are under the minimum experience requirement of ${jdExp.min} years.`;
    }

    return {
        score: Math.round(totalScore * 100),
        breakdown: {
            hard_constraints: Math.round(scoreHard * 100),
            skill_match: Math.round(scoreSkill * 100),
            semantic_match: Math.round(scoreSem * 100)
        },
        gap_analysis,
        metadata: {
            experience_flag,
            total_jd_skills: jdTotalCanonical.size,
            matched_skills: [...Array.from(jdTotalCanonical).filter(s => candidateCanonical.has(s))]
        }
    };
};

// Helper: Extract keywords (Phase 0.4)
const extractKeywords = (text: string): string[] => {
    return text.split(/\W+/).filter(x => x.length > 3 && !stopWords.has(x));
};
