import React from 'react';

interface PromptDisplayProps {
  prompt: string;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompt }) => {
  return (
    <div className="p-4 bg-gray-800/50 rounded-xl shadow-lg border border-gray-700 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-indigo-300 mb-3 flex-shrink-0">Original Prompt</h3>
      <div className="flex-grow bg-gray-900 text-base text-gray-300 p-4 rounded-md">
        <p>"{prompt}"</p>
      </div>
    </div>
  );
};