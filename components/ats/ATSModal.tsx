import React from 'react';
import ATSDashboard from './ATSDashboard';
import { ResumeData } from '../../types';

interface ATSModalProps {
    isOpen: boolean;
    onClose: () => void;
    resumeData: ResumeData;
    onAddSkill: (skill: string) => void;
}

const ATSModal: React.FC<ATSModalProps> = ({ isOpen, onClose, resumeData, onAddSkill }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
                onClick={onClose}
            >
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                {/* Center modal */}
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div
                    className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
                    onClick={e => e.stopPropagation()} // Prevent close on click inside
                >
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                            ATS Logic Engine
                        </h3>
                        <button
                            onClick={onClose}
                            className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        >
                            <span className="sr-only">Close</span>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 bg-gray-50 dark:bg-gray-900 max-h-[80vh] overflow-y-auto">
                        <ATSDashboard resumeData={resumeData} onClose={onClose} onAddSkill={onAddSkill} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ATSModal;
