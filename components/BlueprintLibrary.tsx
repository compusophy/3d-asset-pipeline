import React from 'react';
import { Blueprint } from '../types';

interface BlueprintLibraryProps {
  blueprints: Blueprint[];
  onLoad: (id: string) => void;
  onDelete: (id:string) => void;
  onImport: () => void;
}

export const BlueprintLibrary: React.FC<BlueprintLibraryProps> = ({ blueprints, onLoad, onDelete, onImport }) => {

  const handleExport = (blueprint: Blueprint) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blueprint, null, 2));
    const downloadAnchorNode = document.createElement('a');
    const safeName = blueprint.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${safeName}_blueprint.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-indigo-300">Blueprint Library</h3>
        <button 
          onClick={onImport}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-500 transition-colors flex items-center space-x-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L13 9.414V13h-1.5z" />
              <path d="M9 16a1 1 0 01-1-1v-2.586l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 12.414V15a1 1 0 01-1 1H9z" />
            </svg>
            <span>Import</span>
        </button>
      </div>
      
      {blueprints.length === 0 ? (
        <div className="text-center py-12 px-6 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700 max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 5 8-5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 12l8 5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 12l-8 5" />
            </svg>
            <h4 className="mt-4 text-lg font-semibold text-gray-300">Your library is empty.</h4>
            <p className="text-gray-500 mt-1 text-sm">Generate or import an asset to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {blueprints.map(bp => (
            <div key={bp.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 group flex flex-col">
              <div className="aspect-square overflow-hidden">
                  <img src={`data:image/png;base64,${bp.generatedImage}`} alt={bp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-4 flex flex-col flex-grow">
                <h4 className="font-bold text-white truncate flex-grow" title={bp.name}>{bp.name}</h4>
                <p className="text-xs text-gray-400 mb-3">{new Date(bp.createdAt).toLocaleDateString()}</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => onLoad(bp.id)} className="col-span-3 px-3 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-500 transition-colors">Load</button>
                  <button onClick={() => handleExport(bp)} className="col-span-2 p-2 bg-gray-700/80 text-gray-300 rounded-md hover:bg-gray-700 transition-colors text-sm font-semibold">Export</button>
                  <button onClick={() => onDelete(bp.id)} className="p-2 bg-red-800/50 text-red-300 rounded-md hover:bg-red-800/80 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};