
import React from 'react';
import { PipelineStep } from '../types';

interface StepIndicatorProps {
  currentStep: PipelineStep;
  isLoading: boolean;
}

const steps = [
  { id: PipelineStep.PROMPT, title: 'Prompt' },
  { id: PipelineStep.IMAGE_GENERATION, title: 'Image' },
  { id: PipelineStep.ANALYSIS, title: 'Analysis' },
  { id: PipelineStep.CODE_GENERATION, title: 'Code' },
  { id: PipelineStep.RENDER, title: 'Render' },
];

const Step: React.FC<{ title: string, isCompleted: boolean, isActive: boolean, isLoading: boolean }> = ({ title, isCompleted, isActive, isLoading }) => {
    const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300";
    const activeClasses = "bg-indigo-500 text-white shadow-lg shadow-indigo-500/50";
    const completedClasses = "bg-green-500 text-white";
    const futureClasses = "bg-gray-700 text-gray-400";
    
    let stateClasses = futureClasses;
    if (isActive) stateClasses = activeClasses;
    if (isCompleted) stateClasses = completedClasses;

    return (
        <div className="flex items-center">
            <div className={`${baseClasses} ${stateClasses}`}>
                {isLoading && isActive ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : isCompleted ? '✓' : ''}
            </div>
            <span className={`ml-3 text-sm font-medium ${isActive || isCompleted ? 'text-white' : 'text-gray-400'}`}>{title}</span>
        </div>
    );
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, isLoading }) => {
  const currentIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="flex items-center justify-center space-x-4 p-4 bg-gray-800/50 rounded-lg backdrop-blur-sm">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <Step 
            title={step.title}
            isCompleted={index < currentIndex}
            isActive={index === currentIndex}
            isLoading={isLoading}
          />
          {index < steps.length - 1 && <div className="flex-1 h-0.5 bg-gray-700"></div>}
        </React.Fragment>
      ))}
    </div>
  );
};
