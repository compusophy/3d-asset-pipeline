import React, { useState } from 'react';

interface AnimationControlsProps {
  onGenerate: (animationPrompt: string) => void;
  isLoading: boolean;
}

export const AnimationControls: React.FC<AnimationControlsProps> = ({ onGenerate, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(prompt.trim()) {
        onGenerate(prompt);
    }
  };

  const handlePreset = (preset: string) => {
      setPrompt(preset);
      onGenerate(preset);
  }

  return (
    <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-indigo-300 text-center">Animate Character</p>
        <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handlePreset('Walk cycle')} disabled={isLoading} className="px-3 py-1.5 bg-gray-700/80 text-gray-300 rounded-md hover:bg-gray-700 transition-colors text-xs font-semibold">Walk</button>
            <button onClick={() => handlePreset('Idle breathing')} disabled={isLoading} className="px-3 py-1.5 bg-gray-700/80 text-gray-300 rounded-md hover:bg-gray-700 transition-colors text-xs font-semibold">Idle</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Or type a custom animation, e.g., 'Jumping jack'"
                className="w-full bg-gray-900 text-sm text-gray-200 p-2 rounded-md font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 h-16 border-2 border-gray-600"
                disabled={isLoading}
                spellCheck="false"
            />
            <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-md text-sm hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
                {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : 'Generate Animation'}
            </button>
        </form>
    </div>
  );
};
