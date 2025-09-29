import React from 'react';
import { AssetComponent } from '../types';

interface AnalysisDisplayProps {
  components: AssetComponent[];
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ components }) => {
  return (
    <div className="h-full bg-gray-900 text-sm text-green-300 p-4 rounded-md overflow-auto">
      <pre>{JSON.stringify(components, null, 2)}</pre>
    </div>
  );
};