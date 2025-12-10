export enum AppMode {
  HOME = 'HOME',
  CREATE = 'CREATE', // Generative creation from scratch or ref
  EDIT = 'EDIT',      // Editing existing image with prompt
  DETAIL_PAGE = 'DETAIL_PAGE', // Creating vertical detail pages
  DETAIL_EDIT = 'DETAIL_EDIT', // Editing specific parts of a detail page
  POSTER = 'POSTER', // Poster creation mode
  COLOR_CORRECTION = 'COLOR_CORRECTION', // Non-AI color grading studio
  PROFILE = 'PROFILE' // User profile and settings
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  description: string;
  styles: StyleOption[];
}

export interface StyleOption {
  id: string;
  label: string;
  promptModifier: string; // The text appended to the prompt
  previewColor: string;
}

export interface GeneratedImage {
  id: string;
  url: string; // Base64 data URL
  prompt: string;
}

export interface LayoutOption {
  id: string;
  label: string;
  icon: string; // Lucide icon name mapping or description
  description: string;
  promptModifier: string;
}

export interface GenerationRequest {
  image?: string; // Base64 (Target image)
  refImage?: string; // Base64 (Reference/Replacement image)
  logoImage?: string; // Base64 (Logo image for posters)
  prompt: string;
  category?: Category;
  style?: StyleOption;
  layout?: LayoutOption;
  mode: AppMode;
  aspectRatio?: string; // "1:1", "9:16", etc.
}

export interface FilterState {
  brightness: number;
  contrast: number;
  saturation: number;
  sepia: number;
  blur: number;
  grayscale: number;
  hueRotate: number;
}

export interface FilterPreset {
  label: string;
  filters: FilterState;
  color: string;
}
