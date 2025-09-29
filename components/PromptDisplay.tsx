import React from 'react';

interface PromptDisplayProps {
  prompt: string;
}

export const PromptDisplay: React.FC<PromptDisplayProps> = ({ prompt }) => {
  return (
    <div className="h-full bg-gray-900 text-base text-gray-300 p-4 rounded-md flex items-center justify-center">
      <p className="italic">"{prompt}"</p>
    </div>
  );
};