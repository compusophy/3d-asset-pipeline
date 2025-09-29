import React from 'react';

interface CodeEditorProps {
  code: string;
  onCodeChange: (newCode: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCodeChange }) => {
  return (
    <textarea
      value={code}
      onChange={(e) => onCodeChange(e.target.value)}
      className="h-full w-full bg-gray-900 text-sm text-cyan-300 p-4 rounded-md font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
      spellCheck="false"
    />
  );
};