import React from 'react';

interface ATSScoreProps {
    score: number;
    label: string;
    subLabel: string;
}

const ATSScore: React.FC<ATSScoreProps> = ({ score, label, subLabel }) => {
    const radius = 60;
    const stroke = 8;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    let color = '#10B981'; // Emerald Green
    if (score < 50) color = '#EF4444'; // Red
    else if (score < 80) color = '#F59E0B'; // Amber

    return (
        <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="relative w-48 h-48 flex items-center justify-center">
                <svg
                    height={radius * 2 * 1.5} // slightly larger container
                    width={radius * 2 * 1.5}
                    className="transform -rotate-90 origin-center"
                    viewBox={`0 0 ${radius * 2} ${radius * 2}`}
                >
                    <circle
                        stroke="#E2E8F0"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    <circle
                        stroke={color}
                        strokeWidth={stroke}
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                        strokeLinecap="round"
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold" style={{ color }}>{score}%</span>
                </div>
            </div>
            <h3 className="text-xl font-bold mt-2 text-gray-800 dark:text-white">{label}</h3>
            <p className="text-sm text-gray-500 text-center mt-1">{subLabel}</p>
        </div>
    );
};

export default ATSScore;
