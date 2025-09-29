
import React from 'react';

interface CodeEditorProps {
  code: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code }) => {
  return (
    <div className="p-4 bg-gray-800/50 rounded-xl shadow-lg border border-gray-700 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-indigo-300 mb-3">Generated Three.js Code</h3>
      <textarea
        readOnly
        value={code}
        className="flex-grow w-full bg-gray-900 text-sm text-cyan-300 p-4 rounded-md font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
};
