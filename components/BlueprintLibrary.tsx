import React from 'react';
import { Blueprint } from '../types';

interface BlueprintLibraryProps {
  blueprints: Blueprint[];
  onLoad: (id: string) => void;
  onDelete: (id:string) => void;
}

export const BlueprintLibrary: React.FC<BlueprintLibraryProps> = ({ blueprints, onLoad, onDelete }) => {
  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <h3 className="text-2xl font-bold text-center text-indigo-300 mb-6">Blueprint Library</h3>
      
      {blueprints.length === 0 ? (
        <div className="text-center py-12 px-6 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700 max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 5 8-5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 12l8 5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 12l-8 5" />
            </svg>
            <h4 className="mt-4 text-lg font-semibold text-gray-300">Your library is empty.</h4>
            <p className="text-gray-500 mt-1 text-sm">Generate a new asset to save it here for later.</p>
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
                <div className="flex items-center space-x-2">
                  <button onClick={() => onLoad(bp.id)} className="w-full px-3 py-1.5 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-500 transition-colors">Load</button>
                  <button onClick={() => onDelete(bp.id)} className="p-2 bg-red-800/50 text-red-300 rounded-md hover:bg-red-800/80 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
