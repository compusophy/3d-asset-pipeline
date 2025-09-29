
import React from 'react';
import { useThree } from '../hooks/useThree';

interface ThreeCanvasProps {
  code: string | null;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ code }) => {
  const mountRef = useThree(code);
  return <div ref={mountRef} className="w-full h-full rounded-xl overflow-hidden border-2 border-gray-700" />;
};
