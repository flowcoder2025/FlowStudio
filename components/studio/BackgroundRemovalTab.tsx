'use client';

/**
 * Background Removal Tab Component
 * Contract: HYBRID_DESIGN_BG_REMOVE_TAB
 */

import { useState, useCallback } from 'react';
import { Eraser, Download, RefreshCw, Image as ImageIcon, Square } from 'lucide-react';
import {
  removeBackground,
  isBackgroundRemovalAvailable,
} from '@/lib/imageProcessing/removeBackground';
import type { BackgroundRemovalModel } from '@/lib/imageProcessing/types';

// =====================================================
// Types
// =====================================================

interface BackgroundRemovalTabProps {
  imageUrl: string;
  onProcessed: (url: string | null) => void;
  onProgress: (progress: number) => void;
  disabled?: boolean;
}

type OutputMode = 'foreground' | 'mask' | 'background';

// =====================================================
// Background Options
// =====================================================

const BACKGROUND_COLORS = [
  { id: 'transparent', color: 'transparent', label: '투명' },
  { id: 'white', color: '#FFFFFF', label: '흰색' },
  { id: 'black', color: '#000000', label: '검정' },
  { id: 'gray', color: '#808080', label: '회색' },
  { id: 'blue', color: '#0066CC', label: '파랑' },
  { id: 'green', color: '#00CC66', label: '초록' },
];

// =====================================================
// Component
// =====================================================

export function BackgroundRemovalTab({
  imageUrl,
  onProcessed,
  onProgress,
  disabled = false,
}: BackgroundRemovalTabProps) {
  const [model, setModel] = useState<BackgroundRemovalModel>('isnet_fp16');
  const [outputMode, setOutputMode] = useState<OutputMode>('foreground');
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [isProcessing, setIsProcessing] = useState(false);
  const [maskUrl, setMaskUrl] = useState<string | null>(null);
  const [foregroundUrl, setForegroundUrl] = useState<string | null>(null);

  const isAvailable = isBackgroundRemovalAvailable();

  // Apply background removal
  const handleRemoveBackground = useCallback(async () => {
    if (disabled || isProcessing || !isAvailable) return;

    setIsProcessing(true);
    onProgress(0);

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const result = await removeBackground(blob, {
        model,
        output: outputMode,
        returnMask: true,
        quality: 'medium',
        onProgress,
      });

      if (result.success && result.foreground) {
        // Store foreground
        const fgUrl = URL.createObjectURL(result.foreground);
        setForegroundUrl(fgUrl);

        // Store mask if available
        if (result.mask) {
          const mUrl = URL.createObjectURL(result.mask);
          setMaskUrl(mUrl);
        }

        // Apply background color if not transparent
        if (backgroundColor !== 'transparent' && outputMode === 'foreground') {
          const finalUrl = await applyBackgroundColor(result.foreground, backgroundColor);
          onProcessed(finalUrl);
        } else {
          onProcessed(fgUrl);
        }
      } else {
        console.error('Background removal failed:', result.error);
        onProcessed(null);
      }
    } catch (error) {
      console.error('Background removal error:', error);
      onProcessed(null);
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl, model, outputMode, backgroundColor, onProcessed, onProgress, disabled, isProcessing, isAvailable]);

  // Apply background color to transparent image
  const applyBackgroundColor = async (
    foregroundBlob: Blob,
    color: string
  ): Promise<string> => {
    const img = await createImageBitmap(foregroundBlob);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    // Fill background
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw foreground
    ctx.drawImage(img, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(URL.createObjectURL(foregroundBlob));
        }
      }, 'image/png');
    });
  };

  // Handle background color change (for already processed image)
  const handleBackgroundColorChange = useCallback(
    async (color: string) => {
      setBackgroundColor(color);

      if (foregroundUrl && outputMode === 'foreground') {
        if (color === 'transparent') {
          onProcessed(foregroundUrl);
        } else {
          const response = await fetch(foregroundUrl);
          const blob = await response.blob();
          const finalUrl = await applyBackgroundColor(blob, color);
          onProcessed(finalUrl);
        }
      }
    },
    [foregroundUrl, outputMode, onProcessed]
  );

  if (!isAvailable) {
    return (
      <div className="text-center py-8">
        <Eraser className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          이 브라우저에서는 배경 제거 기능을 사용할 수 없습니다.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          최신 Chrome, Firefox, Edge 브라우저를 사용해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Output Mode */}
      <div>
        <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
          출력 유형
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setOutputMode('foreground')}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors
              ${outputMode === 'foreground'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }
            `}
          >
            <ImageIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-xs text-gray-700 dark:text-gray-300">전경</span>
          </button>
          <button
            onClick={() => setOutputMode('mask')}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors
              ${outputMode === 'mask'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Square className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-xs text-gray-700 dark:text-gray-300">마스크</span>
          </button>
          <button
            onClick={() => setOutputMode('background')}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors
              ${outputMode === 'background'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Eraser className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-xs text-gray-700 dark:text-gray-300">배경만</span>
          </button>
        </div>
      </div>

      {/* Background Color (only for foreground mode) */}
      {outputMode === 'foreground' && (
        <div>
          <label className="text-sm text-gray-600 dark:text-gray-400 block mb-2">
            대체 배경
          </label>
          <div className="flex flex-wrap gap-2">
            {BACKGROUND_COLORS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => handleBackgroundColorChange(bg.color)}
                className={`
                  w-8 h-8 rounded-lg border-2 transition-all
                  ${backgroundColor === bg.color
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-gray-300 dark:border-gray-600'
                  }
                  ${bg.color === 'transparent'
                    ? 'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%3E%3Crect%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23ccc%22%2F%3E%3Crect%20x%3D%228%22%20y%3D%228%22%20width%3D%228%22%20height%3D%228%22%20fill%3D%22%23ccc%22%2F%3E%3C%2Fsvg%3E")]'
                    : ''
                  }
                `}
                style={{
                  backgroundColor:
                    bg.color === 'transparent' ? undefined : bg.color,
                }}
                title={bg.label}
              />
            ))}
          </div>
        </div>
      )}

      {/* Model Selection */}
      <div>
        <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
          처리 모델
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as BackgroundRemovalModel)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="isnet_fp16">표준 (권장)</option>
          <option value="isnet">고품질 (느림)</option>
          <option value="isnet_quint8">빠른 처리</option>
        </select>
      </div>

      {/* Processing Info */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
        <p>
          ⓘ 배경 제거는 브라우저에서 직접 처리됩니다. 첫 실행 시 모델을 다운로드하므로
          시간이 걸릴 수 있습니다.
        </p>
      </div>

      {/* Apply Button */}
      <button
        onClick={handleRemoveBackground}
        disabled={disabled || isProcessing}
        className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            처리 중...
          </>
        ) : (
          <>
            <Eraser className="w-4 h-4" />
            배경 제거
          </>
        )}
      </button>

      {/* Quick Actions */}
      {(maskUrl || foregroundUrl) && (
        <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          {maskUrl && (
            <a
              href={maskUrl}
              download="mask.png"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              마스크 저장
            </a>
          )}
          {foregroundUrl && (
            <a
              href={foregroundUrl}
              download="foreground.png"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              전경 저장
            </a>
          )}
        </div>
      )}
    </div>
  );
}
