import React from 'react';

interface SaveControlsProps {
    isBlueprintLoaded: boolean;
    onSaveNew: () => void;
    onUpdate: () => void;
}

export const SaveControls: React.FC<SaveControlsProps> = ({ isBlueprintLoaded, onSaveNew, onUpdate }) => {
    return (
        <div className="flex flex-row gap-2 items-center">
            <button 
                onClick={onSaveNew}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md text-sm hover:bg-green-500 disabled:bg-gray-600 transition-colors"
            >
                Save as New
            </button>
            <button 
                onClick={onUpdate}
                disabled={!isBlueprintLoaded}
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md text-sm hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
                Update
            </button>
        </div>
    );
};