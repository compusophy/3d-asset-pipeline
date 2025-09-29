import React from 'react';

interface ImageDisplayProps {
  base64Image: string;
}

export const ImageDisplay: React.FC<ImageDisplayProps> = ({ base64Image }) => {
  return (
    <div className="h-full w-full relative rounded-lg overflow-hidden border-2 border-gray-600">
      <img
        src={`data:image/png;base64,${base64Image}`}
        alt="Generated Asset"
        className="absolute top-0 left-0 w-full h-full object-contain"
      />
    </div>
  );
};