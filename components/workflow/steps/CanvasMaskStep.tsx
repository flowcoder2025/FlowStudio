'use client';

/**
 * CanvasMaskStep - Canvas-based mask painting for inpainting workflows
 *
 * Extracts the mask painting logic from detail-edit/page.tsx
 * into a reusable immersive step component.
 *
 * Features:
 * - Dual canvas (image + mask overlay)
 * - Brush painting with configurable size
 * - Undo / Clear mask
 * - Edit mode selection (AI / Text / Image)
 * - Exports mask as black/white PNG data URL
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  Paintbrush,
  Undo2,
  Trash2,
  Wand2,
  Type,
  ImageIcon,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// =====================================================
// Constants
// =====================================================

type EditMode = 'ai' | 'text' | 'image';

const EDIT_MODES: { id: EditMode; labelKey: string; icon: React.ReactNode }[] = [
  { id: 'ai', labelKey: 'tools.detailEdit.modeAiEdit', icon: <Wand2 className="w-4 h-4" /> },
  { id: 'text', labelKey: 'tools.detailEdit.modeTextReplace', icon: <Type className="w-4 h-4" /> },
  { id: 'image', labelKey: 'tools.detailEdit.modeImageReplace', icon: <ImageIcon className="w-4 h-4" /> },
];

const DEFAULT_BRUSH_SIZE = 30;
const MIN_BRUSH_SIZE = 5;
const MAX_BRUSH_SIZE = 100;

// =====================================================
// Props
// =====================================================

interface CanvasMaskStepProps {
  /** Source image data URL to paint mask on */
  sourceImage: string | null;
  /** Current mask data URL (black/white PNG) */
  value: string | null;
  /** Callback with exported mask data URL */
  onChange: (maskDataUrl: string | null) => void;
  /** Current edit mode */
  editMode: EditMode;
  /** Edit mode change callback */
  onEditModeChange: (mode: EditMode) => void;
  /** Proceed to next step */
  onNext: () => void;
  /** Current step index */
  stepIndex: number;
  /** Total steps count */
  totalSteps: number;
  /** Tool title for header */
  toolTitle: string;
}

// =====================================================
// Component
// =====================================================

export function CanvasMaskStep({
  sourceImage,
  value,
  onChange,
  editMode,
  onEditModeChange,
  onNext,
  stepIndex,
  totalSteps,
  toolTitle,
}: CanvasMaskStepProps) {
  const t = useTranslations();
  const tW = useTranslations('workflow');

  // Canvas refs
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);

  // Canvas state
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [hasMask, setHasMask] = useState(!!value);
  const [brushSize, setBrushSize] = useState(DEFAULT_BRUSH_SIZE);
  const maskHistoryRef = useRef<ImageData[]>([]);

  // Load image onto canvas when sourceImage changes
  useEffect(() => {
    if (!sourceImage || !imageCanvasRef.current || !maskCanvasRef.current || !canvasContainerRef.current) return;

    const img = new Image();
    img.onload = () => {
      const container = canvasContainerRef.current;
      if (!container) return;

      const containerWidth = container.clientWidth;
      const scale = containerWidth / img.width;
      const displayWidth = containerWidth;
      const displayHeight = Math.round(img.height * scale);

      setCanvasSize({ width: displayWidth, height: displayHeight });

      // Image canvas
      const imageCanvas = imageCanvasRef.current;
      if (imageCanvas) {
        imageCanvas.width = displayWidth;
        imageCanvas.height = displayHeight;
        const ctx = imageCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
        }
      }

      // Mask canvas
      const maskCanvas = maskCanvasRef.current;
      if (maskCanvas) {
        maskCanvas.width = displayWidth;
        maskCanvas.height = displayHeight;
        const ctx = maskCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, displayWidth, displayHeight);
        }
      }

      setHasMask(false);
      maskHistoryRef.current = [];
      onChange(null);
    };
    img.src = sourceImage;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceImage]);

  // Get canvas coordinates from mouse/touch event
  const getCanvasCoords = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = maskCanvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    []
  );

  // Save mask state for undo
  const saveMaskState = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    maskHistoryRef.current.push(imageData);
  }, []);

  // Draw on mask canvas
  const drawOnMask = useCallback(
    (x: number, y: number) => {
      const canvas = maskCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    },
    [brushSize]
  );

  // Export mask as black/white PNG
  const exportMask = useCallback((): string | null => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return null;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = maskCanvas.width;
    exportCanvas.height = maskCanvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return null;

    // Black background (unmasked area)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Get mask data and draw white where painted
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return null;
    const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const exportData = ctx.getImageData(0, 0, exportCanvas.width, exportCanvas.height);

    for (let i = 0; i < maskData.data.length; i += 4) {
      if (maskData.data[i + 3] > 0) {
        exportData.data[i] = 255;     // R
        exportData.data[i + 1] = 255; // G
        exportData.data[i + 2] = 255; // B
        exportData.data[i + 3] = 255; // A
      }
    }

    ctx.putImageData(exportData, 0, 0);
    return exportCanvas.toDataURL('image/png');
  }, []);

  // Pointer handlers
  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const coords = getCanvasCoords(e);
      if (!coords) return;
      saveMaskState();
      setIsDrawing(true);
      drawOnMask(coords.x, coords.y);
      setHasMask(true);
    },
    [getCanvasCoords, saveMaskState, drawOnMask]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      const coords = getCanvasCoords(e);
      if (!coords) return;
      drawOnMask(coords.x, coords.y);
    },
    [isDrawing, getCanvasCoords, drawOnMask]
  );

  const handlePointerUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      // Export mask on stroke end
      const maskDataUrl = exportMask();
      onChange(maskDataUrl);
    }
  }, [isDrawing, exportMask, onChange]);

  // Undo last stroke
  const handleUndo = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const history = maskHistoryRef.current;
    if (history.length === 0) return;

    const lastState = history.pop()!;
    ctx.putImageData(lastState, 0, 0);

    // Check if mask is empty
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasPixels = imageData.data.some((v, i) => i % 4 === 3 && v > 0);
    setHasMask(hasPixels);

    // Export updated mask
    if (hasPixels) {
      const maskDataUrl = exportMask();
      onChange(maskDataUrl);
    } else {
      onChange(null);
    }
  }, [exportMask, onChange]);

  // Clear mask
  const handleClearMask = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasMask(false);
    maskHistoryRef.current = [];
    onChange(null);
  }, [onChange]);

  // No source image → show placeholder
  if (!sourceImage) {
    return (
      <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl items-center justify-center p-8">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          {t('tools.detailEdit.sourceImage')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full max-w-lg mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Paintbrush className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            {toolTitle}
          </span>
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          {stepIndex + 1} / {totalSteps}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Canvas Container */}
          <div
            ref={canvasContainerRef}
            className="relative select-none"
            style={{ touchAction: 'none' }}
          >
            <canvas
              ref={imageCanvasRef}
              className="block w-full"
              style={{ height: canvasSize.height || 'auto' }}
            />
            <canvas
              ref={maskCanvasRef}
              className="absolute inset-0 w-full cursor-crosshair"
              style={{ height: canvasSize.height || 'auto' }}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
            />
            {/* Paint hint overlay */}
            {!hasMask && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 text-white text-sm px-4 py-2 rounded-lg">
                  {t('tools.detailEdit.paintToSelect')}
                </div>
              </div>
            )}
          </div>

          {/* Brush Size + Toolbar */}
          <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            {/* Brush Size Slider */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                {t('tools.detailEdit.brushSize')}
              </span>
              <input
                type="range"
                min={MIN_BRUSH_SIZE}
                max={MAX_BRUSH_SIZE}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400 w-8 text-right">
                {brushSize}
              </span>
            </div>

            {/* Undo / Clear */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleUndo}
                disabled={maskHistoryRef.current.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400
                  hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Undo2 className="w-3.5 h-3.5" />
                {t('tools.detailEdit.undo')}
              </button>
              <button
                onClick={handleClearMask}
                disabled={!hasMask}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400
                  hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t('tools.detailEdit.clearMask')}
              </button>
            </div>

            {/* Edit Mode Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {t('tools.detailEdit.editMode')}
              </label>
              <div className="flex gap-1.5">
                {EDIT_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => onEditModeChange(mode.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-1 justify-center',
                      editMode === mode.id
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-transparent'
                    )}
                  >
                    {mode.icon}
                    <span className="hidden sm:inline">{t(mode.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 pt-2">
        <Button
          onClick={onNext}
          disabled={!hasMask}
          className="w-full h-11 text-base font-semibold"
          size="lg"
        >
          {tW('ui.next')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
