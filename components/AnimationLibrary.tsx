import React from 'react';
import { Animation } from '../types';

interface AnimationLibraryProps {
  animations: Animation[];
  onLoad: (animation: Animation) => void;
  onDelete: (id: string) => void;
  onImport: () => void;
  onExport: (animation: Animation) => void;
}

export const AnimationLibrary: React.FC<AnimationLibraryProps> = ({ animations, onLoad, onDelete, onImport, onExport }) => {
  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex justify-center items-center relative">
        <p className="text-sm font-semibold text-indigo-300 text-center">Animation Library</p>
        <button 
          onClick={onImport}
          className="absolute right-0 p-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors"
          title="Import Animation"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.414l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L13 9.414V13h-1.5z" />
                <path d="M9 16a1 1 0 01-1-1v-2.586l-1.293 1.293a1 1 0 01-1.414-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 12.414V15a1 1 0 01-1 1H9z" />
            </svg>
        </button>
      </div>
      <div className="flex-grow bg-gray-900 rounded-md p-2 overflow-y-auto border-2 border-gray-600">
        {animations.length === 0 ? (
          <p className="text-xs text-center text-gray-500 p-4">No animations saved yet.</p>
        ) : (
          <ul className="space-y-2">
            {animations.map(anim => (
              <li key={anim.id} className="bg-gray-800 p-2 rounded-md flex items-center justify-between gap-2">
                <span className="text-xs text-gray-300 truncate flex-grow" title={anim.name}>{anim.name}</span>
                <div className="flex-shrink-0 flex gap-1">
                    <button onClick={() => onExport(anim)} className="p-1 bg-gray-700/80 text-gray-300 rounded hover:bg-gray-700 transition-colors" title="Export">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button onClick={() => onLoad(anim)} className="px-2 py-1 bg-indigo-600 text-white text-xs font-semibold rounded hover:bg-indigo-500 transition-colors">Load</button>
                    <button onClick={() => onDelete(anim.id)} className="p-1 bg-red-800/50 text-red-300 rounded hover:bg-red-800/80 transition-colors" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};