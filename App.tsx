
import React, { useState, useCallback } from 'react';
import { PipelineStep, AssetComponent } from './types';
import * as geminiService from './services/geminiService';
import { StepIndicator } from './components/StepIndicator';
import { PromptInput } from './components/PromptInput';
import { ImageDisplay } from './components/ImageDisplay';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { CodeEditor } from './components/CodeEditor';
import { ThreeCanvas } from './components/ThreeCanvas';
import Loader from './components/Loader';
import ErrorDisplay from './components/ErrorDisplay';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<PipelineStep>(PipelineStep.PROMPT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [assetComponents, setAssetComponents] = useState<AssetComponent[] | null>(null);
  const [threeJsCode, setThreeJsCode] = useState<string | null>(null);

  const handleError = (message: string) => {
    setError(message);
    setIsLoading(false);
    setCurrentStep(PipelineStep.PROMPT); // Reset to start on error
  };

  const startPipeline = async (userPrompt: string) => {
    try {
      setPrompt(userPrompt);
      setError(null);

      // Step 1: Image Generation
      setCurrentStep(PipelineStep.IMAGE_GENERATION);
      setIsLoading(true);
      setLoadingMessage('Generating image...');
      const image = await geminiService.generateImage(userPrompt);
      setGeneratedImage(image);
      
      // Step 2: Component Analysis
      setCurrentStep(PipelineStep.ANALYSIS);
      setLoadingMessage('Analyzing components...');
      const components = await geminiService.analyzeImage(image);
      setAssetComponents(components);

      // Step 3: Code Generation
      setCurrentStep(PipelineStep.CODE_GENERATION);
      setLoadingMessage('Writing Three.js code...');
      const code = await geminiService.generateThreeJsCode(components, userPrompt);
      setThreeJsCode(code);

      // Step 4: Render
      setCurrentStep(PipelineStep.RENDER);
      setLoadingMessage('');
      setIsLoading(false);

    } catch (e: any) {
      handleError(e.message || "An unknown error occurred.");
    }
  };

  const handleReset = () => {
    setCurrentStep(PipelineStep.PROMPT);
    setPrompt('');
    setGeneratedImage(null);
    setAssetComponents(null);
    setThreeJsCode(null);
    setError(null);
    setIsLoading(false);
  };
  
  const renderContent = () => {
    if (currentStep === PipelineStep.PROMPT) {
      return (
        <div className="flex items-center justify-center h-full">
            <PromptInput onSubmit={startPipeline} isLoading={isLoading} />
        </div>
      );
    }

    return (
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-150px)]">
            <div className="grid grid-rows-2 gap-8">
                 {generatedImage && <ImageDisplay base64Image={generatedImage} />}
                 {assetComponents && <AnalysisDisplay components={assetComponents} />}
            </div>
            <div className="grid grid-rows-2 gap-8">
                 {threeJsCode && <CodeEditor code={threeJsCode} />}
                 {currentStep === PipelineStep.RENDER && <ThreeCanvas code={threeJsCode} />}
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
       {isLoading && <Loader message={loadingMessage} />}
       {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
       <header className="p-4 flex flex-col sm:flex-row justify-between items-center bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
                <h1 className="text-2xl font-bold text-indigo-400">Gemini 3D Asset Pipeline</h1>
                <p className="text-sm text-gray-400">From prompt to live 3D render</p>
            </div>
            {currentStep !== PipelineStep.PROMPT && (
                <button onClick={handleReset} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Start Over</button>
            )}
        </header>

        <main className="flex-grow flex flex-col">
            <div className="p-4">
                <StepIndicator currentStep={currentStep} isLoading={isLoading} />
            </div>
            <div className="flex-grow relative">
                {renderContent()}
            </div>
        </main>
    </div>
  );
};

export default App;
