import React from 'react';

interface ATSGapAnalysisProps {
    missingCritical: string[]; // List 1
    missingBonus: string[];    // List 2 (Suggestions)
    onAddSkill?: (skill: string) => void;
}

const ATSGapAnalysis: React.FC<ATSGapAnalysisProps> = ({ missingCritical, missingBonus, onAddSkill }) => {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm space-y-6">

            {/* Critical Gaps */}
            <div>
                <h4 className="flex items-center text-red-600 font-bold mb-3">
                    <span className="mr-2">⚠️</span> CRITICAL GAPS <span className="text-sm font-normal text-gray-500 ml-2">(Fix to pass filter)</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                    {missingCritical.length > 0 ? (
                        missingCritical.map((skill, idx) => (
                            <button
                                key={idx}
                                onClick={() => onAddSkill && onAddSkill(skill)}
                                className="px-3 py-1 text-sm font-medium text-red-600 bg-white border border-red-500 rounded-full flex items-center shadow-sm hover:bg-red-50 transition-colors cursor-pointer"
                                title="Click to add this required skill"
                            >
                                <span className="mr-1 text-xs">❌</span> {skill}
                            </button>
                        ))
                    ) : (
                        <span className="text-sm text-green-600">No critical gaps found! 🎉</span>
                    )}
                </div>
            </div>

            {/* Suggestions */}
            {/* For now assuming missingBonus might be populated later or we use extracted ones */}
            {/* Suggestions */}
            {missingBonus.length > 0 && (
                <div>
                    <h4 className="flex items-center text-gray-700 dark:text-gray-300 font-bold mb-3">
                        <span className="mr-2">💡</span> SUGGESTIONS <span className="text-sm font-normal text-gray-500 ml-2">(To reach 100%)</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {missingBonus.map((skill, idx) => (
                            <button
                                key={idx}
                                onClick={() => onAddSkill && onAddSkill(skill)}
                                className="px-3 py-1 text-sm font-medium text-slate-600 bg-slate-50 border border-dashed border-slate-400 rounded-full flex items-center hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Click to add this bonus skill"
                            >
                                <span className="mr-1 text-xs">+</span> {skill}
                            </button>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
};

export default ATSGapAnalysis;
