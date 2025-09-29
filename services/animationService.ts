import { Animation } from '../types';

const STORAGE_KEY = 'gemini-3d-asset-animations';

export const getAnimations = (): Animation[] => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return [];
    const animations: Animation[] = JSON.parse(rawData);
    return animations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Failed to load animations from localStorage", error);
    return [];
  }
};

export const saveAnimation = (animation: Animation): void => {
  try {
    const animations = getAnimations();
    const existingIndex = animations.findIndex(an => an.id === animation.id);
    if (existingIndex > -1) {
      animations[existingIndex] = animation;
    } else {
      animations.push(animation);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(animations));
  } catch (error) {
    console.error("Failed to save animation to localStorage", error);
  }
};

export const deleteAnimation = (id: string): void => {
  try {
    let animations = getAnimations();
    animations = animations.filter(an => an.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(animations));
  } catch (error) {
    console.error("Failed to delete animation from localStorage", error);
  }
};
