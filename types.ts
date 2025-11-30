export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview'
}

export interface GeneratedExam {
  id: string;
  copyNumber: number;
  content: string; // The raw text/latex content
  timestamp: number;
}

export interface AppConfig {
  apiKey: string;
  model: ModelType;
  numCopies: number;
}

export interface UploadedFile {
  id: string;
  file: File;
  previewUrl?: string;
}
