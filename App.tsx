import React, { useState, useEffect } from 'react';
import { PipelineStep, AssetComponent, Blueprint } from './types';
import * as geminiService from './services/geminiService';
import * as blueprintService from './services/blueprintService';
import { StepIndicator } from './components/StepIndicator';
import { PromptInput } from './components/PromptInput';
import { ImageDisplay } from './components/ImageDisplay';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { CodeEditor } from './components/CodeEditor';
import { ThreeCanvas } from './components/ThreeCanvas';
import { BlueprintLibrary } from './components/BlueprintLibrary';
import Loader from './components/Loader';
import ErrorDisplay from './components/ErrorDisplay';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<PipelineStep>(PipelineStep.PROMPT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Pipeline data state
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [assetComponents, setAssetComponents] = useState<AssetComponent[] | null>(null);
  const [threeJsCode, setThreeJsCode] = useState<string | null>(null);
  
  // Blueprint state
  const [savedBlueprints, setSavedBlueprints] = useState<Blueprint[]>([]);
  const [loadedBlueprintId, setLoadedBlueprintId] = useState<string | null>(null);
  
  useEffect(() => {
    // Load blueprints from storage on initial render
    setSavedBlueprints(blueprintService.getBlueprints());
  }, []);

  const handleError = (message: string) => {
    setError(message);
    setIsLoading(false);
    setCurrentStep(PipelineStep.PROMPT); // Reset to start on error
  };

  const startPipeline = async (userPrompt: string) => {
    try {
      setPrompt(userPrompt);
      setError(null);
      setLoadedBlueprintId(null); // Starting a new generation

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
    setLoadedBlueprintId(null);
  };
  
  const handleSaveBlueprint = () => {
    if (!prompt || !generatedImage || !assetComponents || !threeJsCode) return;

    const blueprint: Blueprint = {
      id: loadedBlueprintId || Date.now().toString(),
      name: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt,
      prompt,
      generatedImage,
      assetComponents,
      threeJsCode,
      createdAt: new Date().toISOString(),
    };
    
    blueprintService.saveBlueprint(blueprint);
    setSavedBlueprints(blueprintService.getBlueprints());
    setLoadedBlueprintId(blueprint.id); // Ensure we are now "editing" this saved blueprint
    alert(`Blueprint ${loadedBlueprintId ? 'updated' : 'saved'} successfully!`);
  };

  const handleLoadBlueprint = (id: string) => {
    const blueprint = savedBlueprints.find(bp => bp.id === id);
    if (!blueprint) return;
    
    setPrompt(blueprint.prompt);
    setGeneratedImage(blueprint.generatedImage);
    setAssetComponents(blueprint.assetComponents);
    setThreeJsCode(blueprint.threeJsCode);
    setLoadedBlueprintId(blueprint.id);
    setCurrentStep(PipelineStep.RENDER);
    setError(null);
  };
  
  const handleDeleteBlueprint = (id: string) => {
    if (window.confirm("Are you sure you want to delete this blueprint?")) {
        blueprintService.deleteBlueprint(id);
        setSavedBlueprints(blueprintService.getBlueprints());
    }
  };

  const renderContent = () => {
    if (currentStep === PipelineStep.PROMPT) {
      return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 pt-16">
                <PromptInput onSubmit={startPipeline} isLoading={isLoading} />
            </div>

            <div className="flex items-center text-center my-8 px-4 w-full max-w-2xl mx-auto">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="flex-shrink mx-4 text-gray-400 font-semibold">OR</span>
                <div className="flex-grow border-t border-gray-700"></div>
            </div>
            
            <div className="flex-grow overflow-y-auto pb-8">
                <BlueprintLibrary blueprints={savedBlueprints} onLoad={handleLoadBlueprint} onDelete={handleDeleteBlueprint} />
            </div>
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
                 {threeJsCode && <CodeEditor code={threeJsCode} onCodeChange={setThreeJsCode} />}
                 {currentStep === PipelineStep.RENDER && <ThreeCanvas code={threeJsCode} />}
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
       {isLoading && <Loader message={loadingMessage} />}
       {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
       <header className="p-4 flex flex-col sm:flex-row justify-between items-center bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
                <h1 className="text-2xl font-bold text-indigo-400">Gemini 3D Asset Pipeline</h1>
                <p className="text-sm text-gray-400">From prompt to live 3D render</p>
            </div>
            <div className="flex items-center space-x-4">
              {currentStep === PipelineStep.RENDER && (
                  <button onClick={handleSaveBlueprint} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors font-semibold">
                      {loadedBlueprintId ? 'Update Blueprint' : 'Save Blueprint'}
                  </button>
              )}
              {currentStep !== PipelineStep.PROMPT && (
                  <button onClick={handleReset} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Start Over</button>
              )}
            </div>
        </header>

        <main className="flex-grow flex flex-col">
            {currentStep !== PipelineStep.PROMPT && (
              <div className="p-4">
                  <StepIndicator currentStep={currentStep} isLoading={isLoading} />
              </div>
            )}
            <div className="flex-grow relative">
                {renderContent()}
            </div>
        </main>
    </div>
  );
};

export default App;