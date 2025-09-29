import React from 'react';
import { AssetComponent } from '../types';

interface AnalysisDisplayProps {
  components: AssetComponent[];
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ components }) => {
  return (
    <div className="p-4 bg-gray-800/50 rounded-xl shadow-lg border border-gray-700 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-indigo-300 mb-3 flex-shrink-0">Component Analysis</h3>
      <pre className="flex-grow bg-gray-900 text-sm text-green-300 p-4 rounded-md overflow-auto">
        {JSON.stringify(components, null, 2)}
      </pre>
    </div>
  );
};