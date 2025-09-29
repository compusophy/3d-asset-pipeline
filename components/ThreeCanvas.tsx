import React, { useEffect } from 'react';
import { useThree, AnimationControls } from '../hooks/useThree';

interface ThreeCanvasProps {
  code: string | null;
  animationCode?: string | null;
  onAnimationControlsReady: (controls: AnimationControls) => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({ code, animationCode, onAnimationControlsReady }) => {
  const { mountRef, animationControls } = useThree(code, animationCode);
  
  useEffect(() => {
    if (onAnimationControlsReady) {
      onAnimationControlsReady(animationControls);
    }
  }, [animationControls, onAnimationControlsReady]);

  return <div ref={mountRef} className="w-full h-full rounded-xl overflow-hidden border-2 border-gray-700" />;
};