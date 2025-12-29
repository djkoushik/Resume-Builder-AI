import React from 'react';

interface ATSAlertsProps {
    message: string | null;
}

const ATSAlerts: React.FC<ATSAlertsProps> = ({ message }) => {
    if (!message) return null;

    return (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
            <div className="flex">
                <div className="flex-shrink-0">
                    <span className="text-amber-500 text-xl">ℹ️</span>
                </div>
                <div className="ml-3">
                    <p className="text-sm text-amber-800 font-medium">
                        INSIGHT: EXPERIENCE FLAG
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ATSAlerts;
