import { Blueprint } from '../types';

const STORAGE_KEY = 'gemini-3d-asset-blueprints';

export const getBlueprints = (): Blueprint[] => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) return [];
    const blueprints: Blueprint[] = JSON.parse(rawData);
    // Sort by most recent first
    return blueprints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Failed to load blueprints from localStorage", error);
    return [];
  }
};

export const saveBlueprint = (blueprint: Blueprint): void => {
  try {
    const blueprints = getBlueprints();
    const existingIndex = blueprints.findIndex(bp => bp.id === blueprint.id);
    if (existingIndex > -1) {
      // Update existing blueprint
      blueprints[existingIndex] = blueprint;
    } else {
      // Add new blueprint
      blueprints.push(blueprint);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprints));
  } catch (error) {
    console.error("Failed to save blueprint to localStorage", error);
  }
};

export const deleteBlueprint = (id: string): void => {
  try {
    let blueprints = getBlueprints();
    blueprints = blueprints.filter(bp => bp.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(blueprints));
  } catch (error) {
    console.error("Failed to delete blueprint from localStorage", error);
  }
};
