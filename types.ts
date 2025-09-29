export enum PipelineStep {
  PROMPT = 'PROMPT',
  IMAGE_GENERATION = 'IMAGE_GENERATION',
  ANALYSIS = 'ANALYSIS',
  CODE_GENERATION = 'CODE_GENERATION',
  RENDER = 'RENDER',
}

export interface AssetComponent {
  name: string;
  shape: string;
  color: string;
}

export interface Blueprint {
  id: string;
  name: string;
  prompt: string;
  generatedImage: string;
  assetComponents: AssetComponent[];
  threeJsCode: string;
  createdAt: string;
}
