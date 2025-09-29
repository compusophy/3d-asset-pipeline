import React, { useState } from 'react';

interface ImprovementControlsProps {
  onImprove: (instruction: string) => void;
  isLoading: boolean;
}

export const ImprovementControls: React.FC<ImprovementControlsProps> = ({ onImprove, isLoading }) => {
  const [instruction, setInstruction] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onImprove(instruction); // Pass instruction, even if empty
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        id="improvement-prompt"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="Optional: 'Make it red', 'Add a spike on top'..."
        className="w-full bg-gray-900 text-sm text-gray-200 p-3 rounded-md font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 border-2 border-gray-600"
        disabled={isLoading}
        spellCheck="false"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-3 bg-indigo-600 text-white font-semibold rounded-md text-sm hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
      >
        {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        ) : 'Improve'}
      </button>
    </form>
  );
};