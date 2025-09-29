import React, { useState, useEffect, useRef } from 'react';
import { PipelineStep, AssetComponent, Blueprint, RigJoint, Animation } from './types';
import * as geminiService from './services/geminiService';
import * as blueprintService from './services/blueprintService';
import * as animationService from './services/animationService';

import { PromptInput } from './components/PromptInput';
import { PromptDisplay } from './components/PromptDisplay';
import { ImageDisplay } from './components/ImageDisplay';
import { AnalysisDisplay } from './components/AnalysisDisplay';
import { CodeEditor } from './components/CodeEditor';
import { ThreeCanvas } from './components/ThreeCanvas';
import { BlueprintLibrary } from './components/BlueprintLibrary';
import { ImprovementControls } from './components/ImprovementControls';
import { AnimationControls } from './components/AnimationControls';
import { AnimationLibrary } from './components/AnimationLibrary';
import { SaveControls } from './components/SaveControls';
import { AnimationPlaybackControls, IAnimationPlaybackControls } from './components/AnimationPlaybackControls';
import Loader from './components/Loader';
import ErrorDisplay from './components/ErrorDisplay';

const PIPELINE_TABS = ['Prompt', 'Image', 'Analysis', 'Code', 'Render', 'Animate'];

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<PipelineStep>(PipelineStep.PROMPT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('Render');

  // Pipeline data state
  const [prompt, setPrompt] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [assetComponents, setAssetComponents] = useState<AssetComponent[] | null>(null);
  const [threeJsCode, setThreeJsCode] = useState<string | null>(null);
  const [riggingData, setRiggingData] = useState<RigJoint[] | null>(null);
  
  // Decoupled Animation State
  const [animationCode, setAnimationCode] = useState<string | null>(null);
  const [animationControls, setAnimationControls] = useState<IAnimationPlaybackControls | null>(null);
  const [savedAnimations, setSavedAnimations] = useState<Animation[]>([]);

  // Blueprint state
  const [savedBlueprints, setSavedBlueprints] = useState<Blueprint[]>([]);
  const [loadedBlueprintId, setLoadedBlueprintId] = useState<string | null>(null);
  const importBlueprintInputRef = useRef<HTMLInputElement>(null);
  const importAnimationInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setSavedBlueprints(blueprintService.getBlueprints());
    setSavedAnimations(animationService.getAnimations());
  }, []);

  const handleError = (message: string) => {
    setError(message);
    setIsLoading(false);
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

      setActiveTab('Render');
      setCurrentStep(PipelineStep.RENDER);
      setIsLoading(false);

      if (requestedAnimation) {
          await handleGenerateAnimation(requestedAnimation);
          setActiveTab('Animate');
      }

    } catch (e: any) {
      handleError(e.message || "An unknown error occurred.");
      handleReset();
    }
  };
  
  const handleGenerateAnimation = async (newAnimationPrompt: string) => {
      if (!riggingData) return;
      try {
          setIsLoading(true);
          setLoadingMessage(`Animating: ${newAnimationPrompt}...`);
          const animCode = await geminiService.generateAnimationCode(riggingData, newAnimationPrompt);
          setAnimationCode(animCode);

          const newAnimation: Animation = {
            id: Date.now().toString(),
            name: `${prompt.split(' ')[0]} - ${newAnimationPrompt}`,
            prompt: newAnimationPrompt,
            code: animCode,
            createdAt: new Date().toISOString(),
          };
          animationService.saveAnimation(newAnimation);
          setSavedAnimations(animationService.getAnimations());

      } catch (e: any) {
          handleError(e.message || "Failed to generate animation.");
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
        handleError(e.message || "Failed to improve the asset.");
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
  
  const handleSaveBlueprint = (asNew: boolean) => {
    if (!prompt || !generatedImage || !assetComponents || !threeJsCode || !riggingData) return;

    const blueprint: Blueprint = {
      id: (asNew || !loadedBlueprintId) ? Date.now().toString() : loadedBlueprintId,
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
    alert(`Blueprint ${asNew || !loadedBlueprintId ? 'saved' : 'updated'} successfully!`);
  };

  const handleLoadBlueprint = (id: string) => {
    const blueprint = savedBlueprints.find(bp => bp.id === id);
    if (!blueprint) return;
    
    setPrompt(blueprint.prompt);
    setGeneratedImage(blueprint.generatedImage);
    setAssetComponents(blueprint.assetComponents);
    setThreeJsCode(blueprint.threeJsCode);
    setRiggingData(blueprint.riggingData || null);
    setAnimationCode(null);
    setAnimationControls(null);
    setLoadedBlueprintId(blueprint.id);
    setCurrentStep(PipelineStep.RENDER);
    setError(null);
    setActiveTab('Render');
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

  const handleLoadAnimation = (anim: Animation) => {
    setAnimationCode(anim.code);
    setActiveTab('Animate');
  };

  const handleDeleteAnimation = (id: string) => {
    if (window.confirm("Are you sure you want to delete this animation?")) {
      animationService.deleteAnimation(id);
      setSavedAnimations(animationService.getAnimations());
    }
  };
  
  const handleExportAnimation = (animation: Animation) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(animation, null, 2));
    const downloadAnchorNode = document.createElement('a');
    const safeName = animation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${safeName}_animation.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportAnimation = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = e => {
        try {
          const content = e.target?.result;
          if (typeof content !== 'string') throw new Error("File is not valid text.");
          const newAnimation = JSON.parse(content) as Animation;
          
          // Basic validation
          if (!newAnimation.id || !newAnimation.name || !newAnimation.code) {
             throw new Error("Invalid animation file format.");
          }
          
          animationService.saveAnimation(newAnimation);
          setSavedAnimations(animationService.getAnimations());
          alert("Animation imported successfully!");

        } catch (err: any) {
          handleError(err.message || "Failed to import animation.");
        } finally {
            if (importAnimationInputRef.current) {
                importAnimationInputRef.current.value = '';
            }
        }
      };
    }
  };

  const renderContent = () => {
      switch(activeTab) {
          case 'Prompt': return <PromptDisplay prompt={prompt} />;
          case 'Image': return generatedImage ? <ImageDisplay base64Image={generatedImage} /> : null;
          case 'Analysis': return assetComponents ? <AnalysisDisplay components={assetComponents} /> : null;
          case 'Code': return threeJsCode ? <CodeEditor code={threeJsCode} onCodeChange={setThreeJsCode} /> : null;
          case 'Render': return (
              <div className="w-full h-full flex flex-col lg:flex-row gap-4">
                  <div className="w-full flex-grow rounded-lg overflow-hidden border-2 border-gray-700 min-h-0">
                      <ThreeCanvas code={threeJsCode} />
                  </div>
                  <div className="flex-shrink-0 lg:w-1/4">
                      <ImprovementControls 
                          onImprove={handleImprove} 
                          isLoading={isLoading && loadingMessage.startsWith('Improving')} 
                      />
                  </div>
              </div>
          );
          case 'Animate': return (
              <div className="w-full h-full flex flex-col lg:flex-row gap-4">
                  <div className="w-full flex-grow rounded-lg overflow-hidden border-2 border-gray-700 min-h-0 relative">
                      <ThreeCanvas 
                        code={threeJsCode} 
                        animationCode={animationCode}
                        onAnimationControlsReady={setAnimationControls}
                      />
                      {animationCode && animationControls && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                              <AnimationPlaybackControls controls={animationControls} />
                          </div>
                      )}
                  </div>
                  <div className="flex-shrink-0 lg:w-1/4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                      {riggingData && (
                          <AnimationControls 
                              onGenerate={handleGenerateAnimation}
                              isLoading={isLoading && loadingMessage.startsWith('Animating')}
                          />
                      )}
                      <AnimationLibrary
                          animations={savedAnimations}
                          onLoad={handleLoadAnimation}
                          onDelete={handleDeleteAnimation}
                          onImport={() => importAnimationInputRef.current?.click()}
                          onExport={handleExportAnimation}
                      />
                  </div>
              </div>
          );
          default: return null;
      }
  }


  const renderPipeline = () => (
    <div className="flex flex-col h-full overflow-hidden">
        <header className="flex-shrink-0 p-2 flex justify-between items-center border-b border-gray-700 bg-gray-900 z-20">
            <h1 className="text-lg font-bold text-indigo-300 truncate" title={prompt}>
                {prompt ? `Editing: "${prompt}"` : 'Gemini 3D Pipeline'}
            </h1>
             <SaveControls
                isBlueprintLoaded={!!loadedBlueprintId}
                onSaveNew={() => handleSaveBlueprint(true)}
                onUpdate={() => handleSaveBlueprint(false)}
            />
        </header>
        
        {/* TABS */}
        <div className="flex-shrink-0 flex items-center border-b border-gray-700">
            {PIPELINE_TABS.map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === tab 
                            ? 'text-indigo-300 border-indigo-400' 
                            : 'text-gray-400 border-transparent hover:bg-gray-800'
                    }`}
                >
                    {tab}
                </button>
            ))}
        </div>

        {/* CONTENT */}
        <div className="flex-grow p-4 min-h-0 bg-gray-800/50">
           {renderContent()}
        </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden relative font-mono">
      <main className="flex-grow flex flex-col min-h-0">
        {isLoading && <Loader message={loadingMessage} />}
        {error && <ErrorDisplay message={error} onClear={() => setError(null)} />}
        <input type="file" ref={importBlueprintInputRef} onChange={() => {}} className="hidden" accept=".json" />
        <input type="file" ref={importAnimationInputRef} onChange={handleImportAnimation} className="hidden" accept=".json" />


        {currentStep === PipelineStep.PROMPT ? (
            <div className="flex flex-col h-full">
                <div className="flex-shrink-0 pt-16"><PromptInput onSubmit={startPipeline} isLoading={isLoading} /></div>
                <div className="flex items-center text-center my-8 px-4 w-full max-w-2xl mx-auto">
                    <div className="flex-grow border-t border-gray-700"></div>
                    <span className="flex-shrink mx-4 text-gray-400 font-semibold">OR</span>
                    <div className="flex-grow border-t border-gray-700"></div>
                </div>
                <div className="flex-grow overflow-y-auto pb-8">
                    <BlueprintLibrary blueprints={savedBlueprints} onLoad={handleLoadBlueprint} onDelete={handleDeleteBlueprint} onImport={() => importBlueprintInputRef.current?.click()} />
                </div>
            </div>
        ) : renderPipeline()}
      </main>
    </div>
  );
};

export default App;