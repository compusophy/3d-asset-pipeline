import React, { useState, useEffect, useRef } from 'react';
import { PipelineStep, AssetComponent, Blueprint, RigJoint } from './types';
import * as geminiService from './services/geminiService';
import * as blueprintService from './services/blueprintService';
import { PromptInput } from './components/PromptInput';
import { PromptDisplay } from './components/PromptDisplay';
import { ImageDisplay } from './components/ImageDisplay';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { CodeEditor } from './components/CodeEditor';
import { ThreeCanvas } from './components/ThreeCanvas';
import { BlueprintLibrary } from './components/BlueprintLibrary';
import { ImprovementControls } from './components/ImprovementControls';
import { AnimationControls } from './components/AnimationControls';
import { AnimationPlaybackControls, IAnimationPlaybackControls } from './components/AnimationPlaybackControls';
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
  const [riggingData, setRiggingData] = useState<RigJoint[] | null>(null);
  
  // Decoupled Animation State
  const [animationCode, setAnimationCode] = useState<string | null>(null);
  const [animationControls, setAnimationControls] = useState<IAnimationPlaybackControls | null>(null);
  
  // Blueprint state
  const [savedBlueprints, setSavedBlueprints] = useState<Blueprint[]>([]);
  const [loadedBlueprintId, setLoadedBlueprintId] = useState<string | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setSavedBlueprints(blueprintService.getBlueprints());
  }, []);

  const handleError = (message: string, isImprovement: boolean = false) => {
    setError(message);
    setIsLoading(false);
    if (!isImprovement) {
        // Don't reset on improve error, so user can try again
    }
  };

  const analyzeActionablePrompt = (fullPrompt: string) => {
      const actions = ['walking', 'running', 'jumping', 'waving', 'dancing', 'attacking', 'idle'];
      const action = actions.find(a => fullPrompt.toLowerCase().includes(a));
      const basePrompt = fullPrompt.replace(new RegExp(action || '', 'gi'), '').trim().replace(/  +/g, ' ');
      return { basePrompt, animation: action || null };
  }

  const startPipeline = async (userPrompt: string) => {
    try {
      handleReset();
      
      const { basePrompt, animation: requestedAnimation } = analyzeActionablePrompt(userPrompt);
      setPrompt(basePrompt);

      setCurrentStep(PipelineStep.IMAGE_GENERATION);
      setIsLoading(true);
      setLoadingMessage('Generating image...');
      const image = await geminiService.generateImage(basePrompt);
      setGeneratedImage(image);
      
      setCurrentStep(PipelineStep.ANALYSIS);
      setLoadingMessage('Analyzing components...');
      const components = await geminiService.analyzeImage(image);
      setAssetComponents(components);

      setLoadingMessage('Creating skeleton...');
      const rig = await geminiService.generateRiggingData(components, basePrompt);
      setRiggingData(rig);

      setCurrentStep(PipelineStep.CODE_GENERATION);
      setLoadingMessage('Writing Three.js code...');
      const code = await geminiService.generateThreeJsCode(components, basePrompt, rig);
      setThreeJsCode(code);

      setCurrentStep(PipelineStep.RENDER);
      setLoadingMessage('');
      setIsLoading(false);

      if (requestedAnimation) {
          await handleGenerateAnimation(requestedAnimation);
      }

    } catch (e: any) {
      handleError(e.message || "An unknown error occurred.");
      handleReset();
      setError(e.message || "An unknown error occurred.");
    }
  };
  
  const handleGenerateAnimation = async (newAnimationPrompt: string) => {
      if (!riggingData) return;
      try {
          setIsLoading(true);
          setLoadingMessage(`Animating: ${newAnimationPrompt}...`);
          const animCode = await geminiService.generateAnimationCode(riggingData, newAnimationPrompt);
          setAnimationCode(animCode);
      } catch (e: any) {
          handleError(e.message || "Failed to generate animation.", true);
      } finally {
          setIsLoading(false);
          setLoadingMessage('');
      }
  };

  const handleImprove = async (instruction: string) => {
    if (!prompt || !generatedImage || !threeJsCode) return;
    try {
        setError(null);
        setIsLoading(true);
        setLoadingMessage('Improving asset...');
        
        const improvedCode = await geminiService.improveThreeJsCode(
            prompt,
            generatedImage,
            threeJsCode,
            instruction,
            !!riggingData && riggingData.length > 5
        );
        
        setThreeJsCode(improvedCode);

    } catch (e: any) {
        handleError(e.message || "Failed to improve the asset.", true);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  const handleReset = () => {
    setCurrentStep(PipelineStep.PROMPT);
    setPrompt('');
    setGeneratedImage(null);
    setAssetComponents(null);
    setThreeJsCode(null);
    setRiggingData(null);
    setAnimationCode(null);
    setAnimationControls(null);
    setError(null);
    setIsLoading(false);
    setLoadedBlueprintId(null);
  };
  
  const handleSaveBlueprint = () => {
    if (!prompt || !generatedImage || !assetComponents || !threeJsCode || !riggingData) return;

    const blueprint: Blueprint = {
      id: loadedBlueprintId || Date.now().toString(),
      name: prompt.length > 50 ? prompt.substring(0, 47) + '...' : prompt,
      prompt,
      generatedImage,
      assetComponents,
      threeJsCode,
      createdAt: new Date().toISOString(),
      riggingData,
    };
    
    blueprintService.saveBlueprint(blueprint);
    setSavedBlueprints(blueprintService.getBlueprints());
    setLoadedBlueprintId(blueprint.id); 
    alert(`Blueprint ${loadedBlueprintId ? 'updated' : 'saved'} successfully!`);
  };

  const handleLoadBlueprint = (id: string) => {
    const blueprint = savedBlueprints.find(bp => bp.id === id);
    if (!blueprint) return;
    
    setPrompt(blueprint.prompt);
    setGeneratedImage(blueprint.generatedImage);
    setAssetComponents(blueprint.assetComponents);
    setThreeJsCode(blueprint.threeJsCode);
    setRiggingData(blueprint.riggingData || null);
    setAnimationCode(null); // Animations are not saved with blueprints
    setAnimationControls(null);
    setLoadedBlueprintId(blueprint.id);
    setCurrentStep(PipelineStep.RENDER);
    setError(null);
  };
  
  const handleDeleteBlueprint = (id: string) => {
    if (window.confirm("Are you sure you want to delete this blueprint?")) {
        blueprintService.deleteBlueprint(id);
        setSavedBlueprints(blueprintService.getBlueprints());
        if (loadedBlueprintId === id) {
            handleReset();
        }
    }
  };

  const handleImportClick = () => {
    importFileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target?.result;
            if (typeof content !== 'string') throw new Error("Invalid file content");
            
            const newBlueprint = JSON.parse(content);
            if (newBlueprint.id && newBlueprint.prompt && newBlueprint.threeJsCode) {
                blueprintService.saveBlueprint(newBlueprint);
                setSavedBlueprints(blueprintService.getBlueprints());
                alert("Blueprint imported successfully!");
            } else {
                throw new Error("Invalid blueprint file format.");
            }
        } catch (err: any) {
            handleError(err.message || "Failed to import blueprint.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const renderPipeline = () => (
    <div className="p-4 flex flex-row gap-4 flex-grow min-h-0">
        <div className="flex-1 min-w-0"><PromptDisplay prompt={prompt} /></div>
        {generatedImage && <div className="flex-1 min-w-0"><ImageDisplay base64Image={generatedImage} /></div>}
        {assetComponents && <div className="flex-1 min-w-0"><AnalysisDisplay components={assetComponents} /></div>}
        {threeJsCode && <div className="flex-1 min-w-0"><CodeEditor code={threeJsCode} onCodeChange={setThreeJsCode} /></div>}
        {currentStep === PipelineStep.RENDER && threeJsCode && (
            <div className="flex-1 min-w-0 h-full">
                <div className="p-4 bg-gray-800/50 rounded-xl shadow-lg border border-gray-700 h-full flex flex-col gap-4">
                    <h3 className="text-lg font-semibold text-indigo-300 flex-shrink-0">Render & Animate</h3>
                    <div className="w-full flex-grow rounded-lg overflow-hidden border-2 border-gray-700 min-h-0">
                        <ThreeCanvas 
                          code={threeJsCode} 
                          animationCode={animationCode}
                          onAnimationControlsReady={setAnimationControls}
                        />
                    </div>
                     {animationCode && animationControls && (
                        <AnimationPlaybackControls controls={animationControls} />
                    )}
                    <div className="flex-shrink-0 grid grid-cols-2 gap-4">
                        <ImprovementControls 
                            onImprove={handleImprove} 
                            isLoading={isLoading && loadingMessage.startsWith('Improving')} 
                        />
                        {riggingData && (
                            <AnimationControls 
                                onGenerate={handleGenerateAnimation}
                                isLoading={isLoading && loadingMessage.startsWith('Animating')}
                            />
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden relative">
      <header className="p-4 flex flex-col sm:flex-row justify-between items-center bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10 gap-4 flex-shrink-0">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold text-indigo-400">Gemini 3D Pipeline</h1>
          <p className="text-sm text-gray-400">From prompt to live 3D render</p>
        </div>
        <div>
            {currentStep === PipelineStep.RENDER && (
                <button onClick={handleSaveBlueprint} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg transition-colors font-semibold text-sm">
                    {loadedBlueprintId ? 'Update Blueprint' : 'Save Blueprint'}
                </button>
            )}
            {currentStep !== PipelineStep.PROMPT && (
                <button onClick={handleReset} className="ml-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm">Start Over</button>
            )}
        </div>
      </header>
      
      <main className="flex-grow flex flex-col min-h-0">
        {isLoading && <Loader message={loadingMessage} />}
        {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
        <input type="file" ref={importFileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />

        {currentStep === PipelineStep.PROMPT ? (
            <div className="flex flex-col h-full">
                <div className="flex-shrink-0 pt-16"><PromptInput onSubmit={startPipeline} isLoading={isLoading} /></div>
                <div className="flex items-center text-center my-8 px-4 w-full max-w-2xl mx-auto">
                    <div className="flex-grow border-t border-gray-700"></div>
                    <span className="flex-shrink mx-4 text-gray-400 font-semibold">OR</span>
                    <div className="flex-grow border-t border-gray-700"></div>
                </div>
                <div className="flex-grow overflow-y-auto pb-8">
                    <BlueprintLibrary blueprints={savedBlueprints} onLoad={handleLoadBlueprint} onDelete={handleDeleteBlueprint} onImport={handleImportClick} />
                </div>
            </div>
        ) : renderPipeline()}
      </main>
    </div>
  );
};

export default App;