import { GoogleGenAI, Type } from "@google/genai";
import { AssetComponent, RigJoint } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const cleanAndValidateCode = (code: string, requireReturn: boolean = true): string => {
  let cleanedCode = code;

  // 1. Strip markdown code blocks
  const codeBlockRegex = /```(?:javascript|js)?\s*([\s\S]*?)```/;
  const codeBlockMatch = cleanedCode.match(codeBlockRegex);
  if (codeBlockMatch && codeBlockMatch[1]) {
      cleanedCode = codeBlockMatch[1].trim();
  } else {
      cleanedCode = cleanedCode.trim();
  }

  // 2. Strip function wrapper, e.g., function createAsset(THREE) { ... }
  // This regex captures the content between the first { and the last }
  const functionWrapperRegex = /function\s*\w*\s*\([^)]*\)\s*\{([\s\S]*)\}/;
  const functionWrapperMatch = cleanedCode.match(functionWrapperRegex);
  if (functionWrapperMatch && functionWrapperMatch[1]) {
      cleanedCode = functionWrapperMatch[1].trim();
  }

  if (cleanedCode.length === 0) {
      throw new Error("The model returned empty code.");
  }

  if (requireReturn && !cleanedCode.includes('return')) {
      console.error("Generated code is missing a return statement:", cleanedCode);
      throw new Error("Generated code is invalid and is missing the required 'return' statement.");
  }
  return cleanedCode;
}

export const generateImage = async (prompt: string): Promise<string> => {
  const isCharacter = prompt.toLowerCase().includes('person') || prompt.toLowerCase().includes('character') || prompt.toLowerCase().includes('knight') || prompt.toLowerCase().includes('robot');
  
  const finalPrompt = isCharacter
    ? `A high-quality, clear, front-facing image of a single 3D character in a neutral T-pose on a plain white background. The character is: ${prompt}`
    : `A high-quality, clear image of a single 3D game asset on a plain white background. The asset is: ${prompt}`;
    
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: finalPrompt,
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
              description: 'Name of the component, e.g., "blade" or "head".',
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


export const generateThreeJsCode = async (
    components: AssetComponent[], 
    prompt: string,
    rig: RigJoint[]
): Promise<string> => {
    
    const isCharacter = rig.length > 5; // Heuristic: characters have more bones than simple objects

    const staticModelInstruction = `You are an expert Three.js developer using r164. Your task is to write the body of a JavaScript function. This function receives the 'THREE' library object as an argument.
- You must create a 3D model based on a list of components and a simple skeleton for attachment points.
- Create a hierarchy of THREE.Bone objects for the skeleton.
- Create basic geometries (BoxGeometry, CylinderGeometry) and MeshStandardMaterial for each component.
- Combine all meshes into a single THREE.Group. Make sure the bones are also added to this group's hierarchy.
- Position the components relative to each other to assemble the final object at the scene's origin (0,0,0).
- DO NOT use SkinnedMesh for this simple object.
- You MUST return the final group object. Your code MUST end with 'return your_group_variable;'`;

    const animatedModelInstruction = `You are an expert Three.js developer specializing in character animation, using r164. Your task is to write the body of a JavaScript function that returns a SkinnedMesh.
- The function receives the 'THREE' library object as an argument.
- You will be given a skeleton structure and a list of geometric components.
- You MUST construct a hierarchy of THREE.Bone objects matching the provided skeleton.
- You MUST create geometries and materials for each component.
- IMPORTANT: For materials like MeshStandardMaterial, DO NOT set the 'skinning: true' property. The renderer enables skinning automatically for a SkinnedMesh. Setting it will cause an error.
- You MUST merge all geometries into a single BufferGeometry.
- You MUST define skinIndices and skinWeights for the vertices of the merged geometry, binding them to the appropriate bones. This is the most critical step. Each vertex should be influenced by 1 to 4 bones.
- You MUST create a THREE.SkinnedMesh using the merged geometry and a material.
- You MUST bind the SkinnedMesh to a THREE.Skeleton created from your bone hierarchy.
- The final SkinnedMesh should be centered at the origin, in a T-Pose.
- Your code MUST end with 'return your_skinned_mesh_variable;'`;

    const userPrompt = `
        The user's original request was for: "${prompt}"
        
        Here is the JSON for the asset's components:
        ${JSON.stringify(components, null, 2)}

        Here is the JSON for the required skeleton:
        ${JSON.stringify(rig, null, 2)}

        Generate the Three.js code now.
        `;
    
  const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: isCharacter ? animatedModelInstruction : staticModelInstruction,
        temperature: 0.2,
      },
  });

  return cleanAndValidateCode(response.text);
};

export const improveThreeJsCode = async (
  prompt: string,
  base64Image: string,
  currentCode: string,
  improvementInstruction: string,
  hasRig: boolean
): Promise<string> => {
    
    const systemInstruction = `You are an expert Three.js developer using r164. Your task is to REFINE an existing 3D model based on user feedback.
- You will be given the original prompt, a reference image, the current JavaScript code, and a new improvement instruction.
- You MUST analyze all these inputs to understand the context.
- Your goal is to modify the provided code to satisfy the improvement instruction while staying true to the original concept and reference image.
${hasRig ? "- CRITICAL: The model is a SkinnedMesh. You MUST preserve the skeleton, bone hierarchy, skin indices, and skin weights. ONLY modify geometries, materials, and positions. IMPORTANT: DO NOT set 'skinning: true' on materials." : ""}
- The output MUST be the complete, modified, raw JavaScript code for the function body.
- The code must end with a return statement (e.g., 'return your_group_variable;').
- DO NOT add comments explaining your changes.
- DO NOT wrap the code in markdown blocks.`;

    const imagePart = {
        inlineData: {
            mimeType: 'image/png',
            data: base64Image,
        },
    };

    const finalInstruction = improvementInstruction.trim() 
        ? improvementInstruction 
        : "Refine the 3D model to better match the original prompt and the reference image. Focus on improving the accuracy of shapes, proportions, and overall quality.";

    const textPart = {
        text: `
Original prompt: "${prompt}"

Current Three.js Code:
${currentCode}

Improvement instruction: "${finalInstruction}"

Generate the improved Three.js code now.
`
    };
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.3,
        },
    });

    return cleanAndValidateCode(response.text);
};

export const generateRiggingData = async (components: AssetComponent[], prompt: string): Promise<RigJoint[]> => {
    const systemInstruction = `You are an expert 3D character rigger. Your task is to create a JSON representation of a skeleton for a 3D model.
- You will be given a prompt and a list of the model's geometric components.
- Analyze these to determine a logical bone hierarchy.
- If the prompt describes a person, humanoid, or bipedal creature, you MUST create a standard humanoid skeleton (hips, spine, chest, neck, head, shoulders, arms, hands, legs, feet).
- If the prompt describes a simple object (like a sword), create a minimal skeleton for attachment points (e.g., a 'root' and a 'tip').
- The root bone must have its parent set to 'null'. All other bones must have a valid parent.
- Define a name, parent, and a relative [x, y, z] position for each joint.
- The overall skeleton should be centered at [0, 0, 0].
- Your output MUST be a valid JSON array adhering to the provided schema.`;

    const userPrompt = `
    The user's original request was for: "${prompt}"
    
    Here is the JSON describing the character's components:
    ${JSON.stringify(components, null, 2)}

    Generate the skeleton rigging data now.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: 'Name of the joint, e.g., "head" or "left_hand".' },
                        parent: { type: Type.STRING, description: 'Name of the parent joint. Use null for the root.' },
                        position: {
                            type: Type.ARRAY,
                            items: { type: Type.NUMBER },
                            description: 'The [x, y, z] position relative to the parent.'
                        },
                    },
                    required: ["name", "parent", "position"],
                },
            },
        },
    });

    try {
        const jsonText = response.text.trim();
        const parsed = JSON.parse(jsonText);
        return parsed as RigJoint[];
    } catch (e) {
        console.error("Failed to parse rigging JSON:", response.text);
        throw new Error("Could not understand the character's rig structure.");
    }
};

export const generateAnimationCode = async (
    rig: RigJoint[], 
    animationPrompt: string
): Promise<string> => {
    const systemInstruction = `You are an expert Three.js animator using r164. Your task is to write the body of a JavaScript function that creates and returns a THREE.AnimationClip.
- This function receives the list of bone names ('boneNames') as an argument.
- You MUST create an animation based on the user's prompt (e.g., 'walking', 'jumping').
- Create an array of THREE.KeyframeTrack objects for the relevant bones. Use VectorKeyframeTrack for position and QuaternionKeyframeTrack for rotation.
- Use THREE.InterpolateLinear for interpolation.
- The bone names you use MUST exist in the provided 'boneNames' list.
- Construct a THREE.AnimationClip from your keyframe tracks. The duration should be appropriate for the animation.
- DO NOT define a function, just provide the raw code for the function body.
- The code MUST end with 'return new THREE.AnimationClip(...)';`;
    
    const userPrompt = `
    The available bones are: ${JSON.stringify(rig.map(j => j.name))}
    
    The user wants an animation of: "${animationPrompt}"

    Generate the THREE.AnimationClip code now.
    `;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.4,
        },
    });

    return cleanAndValidateCode(response.text, false);
};