import React from 'react';

interface ATSMetricsProps {
    metrics: {
        hard_constraints: number;
        skill_match: number;
        semantic_match: number;
    };
}

const ProgressBar: React.FC<{ label: string; value: number; icon: string }> = ({ label, value, icon }) => {
    let colorClass = 'bg-blue-500';
    if (value >= 80) colorClass = 'bg-emerald-500';
    else if (value >= 50) colorClass = 'bg-amber-500';
    else colorClass = 'bg-red-500';

    return (
        <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between text-sm font-medium">
                <span className="flex items-center text-gray-700 dark:text-gray-300">
                    <span className="mr-2 text-lg">{icon}</span>
                    {label}
                </span>
                <span className="text-gray-900 dark:text-gray-100">{value}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${value}%` }}
                ></div>
            </div>
        </div>
    );
};

const ATSMetrics: React.FC<ATSMetricsProps> = ({ metrics }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <ProgressBar label="Education & Exp" value={metrics.hard_constraints} icon="🎓" />
            <ProgressBar label="Skill Match" value={metrics.skill_match} icon="💻" />
            <ProgressBar label="Relevance" value={metrics.semantic_match} icon="🧠" />
        </div>
    );
};

export default ATSMetrics;
