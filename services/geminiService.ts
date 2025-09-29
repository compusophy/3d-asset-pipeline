import { GoogleGenAI, Type } from "@google/genai";
import { AssetComponent } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateImage = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: `A high-quality, clear image of a single 3D game asset on a plain white background. The asset is: ${prompt}`,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: '1:1',
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    const base64Image = response.generatedImages[0].image.imageBytes;
    return base64Image;
  }
  throw new Error("Image generation failed");
};

export const analyzeImage = async (base64Image: string): Promise<AssetComponent[]> => {
  const imagePart = {
    inlineData: {
      mimeType: 'image/png',
      data: base64Image,
    },
  };

  const textPart = {
    text: `You are an expert 3D modeler. Analyze the provided image of an object. Break it down into simple, primitive geometric components (like 'box', 'cylinder', 'sphere', 'cone'). For each component, provide a name, its primitive shape, and its dominant hex color code. Your output MUST follow the provided JSON schema.`,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'Name of the component, e.g., "blade" or "hilt".',
            },
            shape: {
              type: Type.STRING,
              description: 'The suggested primitive shape, e.g., "box", "cylinder".',
            },
            color: {
              type: Type.STRING,
              description: 'The hex color code for the component, e.g., "#FF5733".',
            },
          },
          required: ["name", "shape", "color"],
        },
      },
    },
  });

  try {
    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);
    return parsed as AssetComponent[];
  } catch (e) {
    console.error("Failed to parse analysis JSON:", response.text);
    throw new Error("Could not understand the structure of the image.");
  }
};


export const generateThreeJsCode = async (components: AssetComponent[], prompt: string): Promise<string> => {
    const systemInstruction = `You are an expert Three.js developer using r164. Your task is to write the body of a JavaScript function. This function receives the 'THREE' library object as an argument.
- You must create a 3D model based on a list of components.
- Use basic geometries like BoxGeometry, CylinderGeometry, SphereGeometry.
- Use MeshStandardMaterial for all materials. Set the 'color' property using the hex codes provided.
- Combine all individual meshes into a single THREE.Group.
- Position the components relative to each other to assemble the final object at the scene's origin (0,0,0).
- DO NOT add the group to a scene. Instead, you MUST return the final group object.
- DO NOT include scene setup, camera, renderer, lights, or animation loop code.
- DO NOT define a function, just provide the raw code for the function body. The code must end with 'return your_group_variable;'`;

  const userPrompt = `
    The user's original request was for: "${prompt}"
    
    Here is the JSON describing the components to build:
    ${JSON.stringify(components, null, 2)}

    Generate the Three.js code now.
    `;
    
  const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
      },
  });

  let code = response.text;

  // LLMs can sometimes wrap code in markdown. We need to extract just the code.
  const codeBlockRegex = /```(?:javascript|js)?\s*([\s\S]*?)```/;
  const match = code.match(codeBlockRegex);
  
  if (match && match[1]) {
      code = match[1].trim();
  } else {
      // If no markdown block is found, assume the entire response is code.
      code = code.trim();
  }

  if (code.length === 0) {
      throw new Error("The model returned empty code.");
  }

  if (!code.includes('return')) {
      console.error("Generated code is missing a return statement:", code);
      throw new Error("Generated code is invalid and is missing the required 'return' statement.");
  }

  return code;
};