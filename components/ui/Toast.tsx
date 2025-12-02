import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };

    return (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-md shadow-lg text-white ${bgColors[type]} transition-opacity duration-300`}>
            <div className="flex items-center space-x-2">
                <span>{message}</span>
                <button
                    onClick={onClose}
                    className="ml-2 hover:text-gray-200 focus:outline-none"
                >
                    ×
                </button>
            </div>
        </div>
    );
};

export default Toast;
