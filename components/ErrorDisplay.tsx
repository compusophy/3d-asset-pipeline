
import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onClear: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClear }) => {
  return (
    <div className="absolute bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-2xl z-50 flex items-center space-x-4 max-w-md animate-pulse">
      <div className="flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <p className="font-bold">Error</p>
        <p className="text-sm">{message}</p>
      </div>
      <button onClick={onClear} className="p-1 rounded-full hover:bg-red-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ErrorDisplay;
