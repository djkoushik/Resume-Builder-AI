import React, { useState } from 'react';
import ATSScore from './ATSScore';
import ATSMetrics from './ATSMetrics';
import ATSGapAnalysis from './ATSGapAnalysis';
import ATSAlerts from './ATSAlerts';
import { ResumeData } from '../../types';

interface ATSDashboardProps {
    resumeData: ResumeData;
    onClose: () => void;
    onAddSkill?: (skill: string) => void;
}

interface ATSResult {
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
    };
}

const ATSDashboard: React.FC<ATSDashboardProps> = ({ resumeData, onClose, onAddSkill }) => {
    const [jdText, setJdText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ATSResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!jdText.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ats-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidate: resumeData,
                    jobDescription: { description: jdText } // Sending as simple text wrapper
                })
            });

            const data = await response.json();
            if (data.success) {
                setResult(data.data);
            } else {
                setError(data.error || 'Failed to analyze');
            }
        } catch (err: any) {
            setError(err.message || 'Network error');
        } finally {
            setLoading(false);
        }
    };

    const score = result?.score || 0;
    let label = "Needs Improvement";
    let subLabel = "Below average alignment";

    if (score >= 80) {
        label = "Strong Match";
        subLabel = "You are in the top 10% of candidates";
    } else if (score >= 50) {
        label = "Good Match";
        subLabel = "Decent alignment, but missing key areas";
    }

    const handleAddSkillWrapper = (skill: string) => {
        // Optimistically remove from suggestion list
        if (result) {
            setResult(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    gap_analysis: {
                        ...prev.gap_analysis,
                        bonus_missing: prev.gap_analysis.bonus_missing.filter(s => s !== skill)
                    }
                };
            });
        }

        // Propagate to parent to update resume
        if (onAddSkill) {
            onAddSkill(skill);
        }
    };

    return (
        <div className="space-y-6">
            {/* Input Section */}
            {!result && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Paste Job Description (JD) to Analyze
                    </label>
                    <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        rows={6}
                        placeholder="Paste the full job description text here..."
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleAnalyze}
                            disabled={loading || !jdText.trim()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Analyzing...
                                </>
                            ) : 'Analyze Resume'}
                        </button>
                    </div>
                    {error && (
                        <div className="text-red-600 text-sm mt-2">
                            Error: {error}
                        </div>
                    )}
                </div>
            )}

            {/* Results Section */}
            {result && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold dark:text-white">ATS Analysis Results</h2>
                        <button
                            onClick={() => setResult(null)}
                            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
                        >
                            Analyze New JD
                        </button>
                    </div>

                    {/* Panel A: Hero Score */}
                    <ATSScore score={result.score} label={label} subLabel={subLabel} />

                    {/* Panel B: Metrics */}
                    <ATSMetrics metrics={result.breakdown} />

                    {/* Panel C: Gap Analysis */}
                    <ATSGapAnalysis
                        missingCritical={result.gap_analysis.critical_missing}
                        missingBonus={result.gap_analysis.bonus_missing}
                        onAddSkill={handleAddSkillWrapper}
                    />

                    {/* Panel D: Alerts */}
                    <ATSAlerts message={result.metadata.experience_flag} />
                </div>
            )}
        </div>
    );
};

export default ATSDashboard;
