
import React, { useState } from 'react';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export const PromptInput: React.FC<PromptInputProps> = ({ onSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 bg-gray-800/50 rounded-xl shadow-2xl backdrop-blur-md border border-gray-700">
      <h2 className="text-2xl font-bold text-center text-indigo-300 mb-1">Generate 3D Asset</h2>
      <p className="text-center text-gray-400 mb-6">Describe the game asset you want to create.</p>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center bg-gray-900 border-2 border-gray-700 rounded-lg focus-within:border-indigo-500 transition-all duration-300">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., a magical glowing sword"
            className="flex-grow bg-transparent p-4 text-white placeholder-gray-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="m-2 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
          >
            Generate
          </button>
        </div>
      </form>
    </div>
  );
};
