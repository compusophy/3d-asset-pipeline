
import React from 'react';

interface ImageDisplayProps {
  base64Image: string;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ base64Image }) => {
  return (
    <div className="p-4 bg-gray-800/50 rounded-xl shadow-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-indigo-300 mb-3">Generated Image</h3>
      <img
        src={`data:image/png;base64,${base64Image}`}
        alt="Generated Asset"
        className="rounded-lg w-full h-auto object-cover border-2 border-gray-600"
      />
    </div>
  );
};
