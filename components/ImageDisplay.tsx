import React from 'react';

interface ImageDisplayProps {
  base64Image: string;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ base64Image }) => {
  return (
    <div className="p-4 bg-gray-800/50 rounded-xl shadow-lg border border-gray-700 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-indigo-300 mb-3 flex-shrink-0">Generated Image</h3>
      <div className="flex-grow relative rounded-lg overflow-hidden border-2 border-gray-600">
        <img
          src={`data:image/png;base64,${base64Image}`}
          alt="Generated Asset"
          className="absolute top-0 left-0 w-full h-full object-contain"
        />
      </div>
    </div>
  );
};