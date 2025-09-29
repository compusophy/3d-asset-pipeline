import React from 'react';

interface PipelineStepCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const PipelineStepCard: React.FC<PipelineStepCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`flex flex-col flex-shrink-0 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden ${className}`}>
      <h3 className="flex-shrink-0 px-4 py-2 text-sm font-semibold text-indigo-300 border-b border-gray-700 bg-gray-800/50">{title}</h3>
      <div className="flex-grow p-2 min-h-0">
        {children}
      </div>
    </div>
  );
};