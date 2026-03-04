/**
 * Tool Step Definitions for Immersive Workflow Integration
 *
 * Declarative step configurations for each tool mode.
 * Used by ImmersiveInputForm to render the correct step cards.
 */

import type { ToolMode } from '@/lib/tools/types';
import type { AspectRatio } from '@/lib/imageProvider/types';

// =====================================================
// Step Types
// =====================================================

export type ToolStepType =
  | 'image-upload'
  | 'aspect-ratio'
  | 'category-style'
  | 'canvas-mask'
  | 'multi-image'
  | 'prompt'
  | 'confirmation'
  | 'segment-loop';

// =====================================================
// Step Definition
// =====================================================

interface BaseToolStep {
  type: ToolStepType;
  key?: string;
}

export interface ImageUploadStep extends BaseToolStep {
  type: 'image-upload';
  key: string;
  required: boolean;
  labelKey: string;
  previewAspect?: 'square' | 'landscape' | 'portrait';
}

export interface AspectRatioStep extends BaseToolStep {
  type: 'aspect-ratio';
  key: string;
  default: AspectRatio;
}

export interface CategoryStyleStep extends BaseToolStep {
  type: 'category-style';
  key: string;
}

export interface CanvasMaskStep extends BaseToolStep {
  type: 'canvas-mask';
  key: string;
}

export interface MultiImageStep extends BaseToolStep {
  type: 'multi-image';
  key: string;
  min: number;
  max: number;
}

export interface PromptStep extends BaseToolStep {
  type: 'prompt';
  key: string;
  showTags: boolean;
}

export interface ConfirmationStep extends BaseToolStep {
  type: 'confirmation';
}

export interface SegmentLoopStep extends BaseToolStep {
  type: 'segment-loop';
}

export type ToolStep =
  | ImageUploadStep
  | AspectRatioStep
  | CategoryStyleStep
  | CanvasMaskStep
  | MultiImageStep
  | PromptStep
  | ConfirmationStep
  | SegmentLoopStep;

// =====================================================
// Tool Step Definitions
// =====================================================

export const TOOL_STEP_DEFINITIONS: Record<ToolMode, ToolStep[]> = {
  EDIT: [
    { type: 'image-upload', key: 'sourceImage', required: true, labelKey: 'tools.edit.sourceImage' },
    { type: 'image-upload', key: 'refImage', required: false, labelKey: 'tools.edit.referenceImage' },
    { type: 'aspect-ratio', key: 'aspectRatio', default: '1:1' },
    { type: 'prompt', key: 'prompt', showTags: true },
    { type: 'confirmation' },
  ],
  POSTER: [
    { type: 'image-upload', key: 'sourceImage', required: true, labelKey: 'tools.poster.productImage' },
    { type: 'image-upload', key: 'logoImage', required: false, labelKey: 'tools.poster.logoImage', previewAspect: 'square' },
    { type: 'category-style', key: 'categoryStyle' },
    { type: 'aspect-ratio', key: 'aspectRatio', default: '3:4' },
    { type: 'prompt', key: 'prompt', showTags: true },
    { type: 'confirmation' },
  ],
  COMPOSITE: [
    { type: 'multi-image', key: 'refImages', min: 2, max: 10 },
    { type: 'aspect-ratio', key: 'aspectRatio', default: '1:1' },
    { type: 'prompt', key: 'prompt', showTags: true },
    { type: 'confirmation' },
  ],
  DETAIL_EDIT: [
    { type: 'image-upload', key: 'sourceImage', required: true, labelKey: 'tools.detailEdit.sourceImage' },
    { type: 'canvas-mask', key: 'maskImage' },
    { type: 'prompt', key: 'prompt', showTags: false },
    { type: 'confirmation' },
  ],
  DETAIL_PAGE: [
    { type: 'image-upload', key: 'sourceImage', required: true, labelKey: 'tools.detailPage.productImage' },
    { type: 'image-upload', key: 'refImage', required: false, labelKey: 'tools.detailPage.referenceImage' },
    { type: 'category-style', key: 'categoryStyle' },
    { type: 'segment-loop' },
  ],
};

// =====================================================
// Utility
// =====================================================

/** Get steps for a tool mode */
export function getToolSteps(mode: ToolMode): ToolStep[] {
  return TOOL_STEP_DEFINITIONS[mode];
}

/** Get the number of required inputs before generation can proceed */
export function getRequiredStepCount(mode: ToolMode): number {
  return TOOL_STEP_DEFINITIONS[mode].filter((step) => {
    if (step.type === 'image-upload') return step.required;
    if (step.type === 'multi-image') return true;
    if (step.type === 'prompt') return true;
    return false;
  }).length;
}

/** Tool display info for UI (i18n keys) */
export const TOOL_INFO: Record<ToolMode, { titleKey: string; descriptionKey: string }> = {
  EDIT: { titleKey: 'tools.edit.title', descriptionKey: 'tools.edit.description' },
  POSTER: { titleKey: 'tools.poster.title', descriptionKey: 'tools.poster.description' },
  COMPOSITE: { titleKey: 'tools.composite.title', descriptionKey: 'tools.composite.description' },
  DETAIL_EDIT: { titleKey: 'tools.detailEdit.title', descriptionKey: 'tools.detailEdit.description' },
  DETAIL_PAGE: { titleKey: 'tools.detailPage.title', descriptionKey: 'tools.detailPage.description' },
};
