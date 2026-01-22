'use client';

/**
 * Color Transfer Tab Component
 * Contract: HYBRID_DESIGN_TRANSFER_TAB
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, ArrowRight, Palette, RefreshCw } from 'lucide-react';
import { transferColors } from '@/lib/imageProcessing/colorTransfer';
import { extractColors } from '@/lib/imageProcessing/extractColor';
import type { ColorPalette, ColorTransferMethod } from '@/lib/imageProcessing/types';

// =====================================================
// Types
// =====================================================

interface ColorTransferTabProps {
  imageUrl: string;
  onProcessed: (url: string | null) => void;
  onProgress: (progress: number) => void;
  disabled?: boolean;
}

// =====================================================
// Sample Reference Images
// =====================================================

const SAMPLE_REFERENCES = [
  {
    id: 'warm-sunset',
    name: '따뜻한 석양',
    url: '/samples/warm-sunset.jpg',
    gradient: 'from-orange-400 via-red-500 to-pink-500',
  },
  {
    id: 'cool-ocean',
    name: '시원한 바다',
    url: '/samples/cool-ocean.jpg',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
  },
  {
    id: 'forest-green',
    name: '숲의 녹음',
    url: '/samples/forest.jpg',
    gradient: 'from-green-400 via-emerald-500 to-teal-600',
  },
  {
    id: 'autumn-leaves',
    name: '가을 단풍',
    url: '/samples/autumn.jpg',
    gradient: 'from-yellow-400 via-orange-500 to-red-600',
  },
  {
    id: 'lavender-field',
    name: '라벤더 들판',
    url: '/samples/lavender.jpg',
    gradient: 'from-purple-400 via-violet-500 to-indigo-500',
  },
  {
    id: 'monochrome',
    name: '모노크롬',
    url: '/samples/monochrome.jpg',
    gradient: 'from-gray-300 via-gray-500 to-gray-700',
  },
];

// =====================================================
// Component
// =====================================================

export function ColorTransferTab({
  imageUrl,
  onProcessed,
  onProgress,
  disabled = false,
}: ColorTransferTabProps) {
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referencePalette, setReferencePalette] = useState<ColorPalette | null>(null);
  const [targetPalette, setTargetPalette] = useState<ColorPalette | null>(null);
  const [method, setMethod] = useState<ColorTransferMethod>('reinhard');
  const [strength, setStrength] = useState(80);
  const [preserveLuminance, setPreserveLuminance] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract palette from target image on mount
  const extractTargetPalette = useCallback(async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const palette = await extractColors(blob, 5);
      setTargetPalette(palette);
    } catch (error) {
      console.error('Failed to extract target palette:', error);
    }
  }, [imageUrl]);

  // Initial extraction
  useState(() => {
    extractTargetPalette();
  });

  // Handle reference image upload
  const handleReferenceUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setReferenceImage(dataUrl);

        // Extract palette
        try {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const palette = await extractColors(blob, 5);
          setReferencePalette(palette);
        } catch (error) {
          console.error('Failed to extract reference palette:', error);
        }
      };
      reader.readAsDataURL(file);
    },
    []
  );

  // Handle sample reference selection
  const handleSampleSelect = useCallback(async (sampleUrl: string) => {
    // For samples, we'll use the gradient as a placeholder
    // In production, these would be actual image URLs
    setReferenceImage(sampleUrl);

    // Generate a mock palette based on the gradient
    // In production, extract from actual sample image
    setReferencePalette(null);
  }, []);

  // Apply color transfer
  const handleApplyTransfer = useCallback(async () => {
    if (!referenceImage || disabled || isProcessing) return;

    setIsProcessing(true);
    onProgress(10);

    try {
      const [targetResponse, referenceResponse] = await Promise.all([
        fetch(imageUrl),
        fetch(referenceImage),
      ]);

      const [targetBlob, referenceBlob] = await Promise.all([
        targetResponse.blob(),
        referenceResponse.blob(),
      ]);

      onProgress(30);

      const result = await transferColors(targetBlob, referenceBlob, {
        method,
        strength: strength / 100,
        preserveLuminance,
        onProgress: (p) => onProgress(30 + p * 0.7),
      });

      if (result.success && result.image) {
        const url = URL.createObjectURL(result.image);
        onProcessed(url);
      } else {
        console.error('Color transfer failed:', result.error);
        onProcessed(null);
      }
    } catch (error) {
      console.error('Color transfer error:', error);
      onProcessed(null);
    } finally {
      setIsProcessing(false);
    }
  }, [
    imageUrl,
    referenceImage,
    method,
    strength,
    preserveLuminance,
    onProcessed,
    onProgress,
    disabled,
    isProcessing,
  ]);

  return (
    <div className="space-y-4">
      {/* Reference Image Section */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          참조 이미지
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          색감을 가져올 이미지를 선택하세요
        </p>

        {/* Upload Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors
            ${referenceImage
              ? 'border-blue-300 dark:border-blue-700'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }
          `}
        >
          {referenceImage ? (
            <div className="flex items-center gap-3">
              <img
                src={referenceImage}
                alt="Reference"
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  참조 이미지 선택됨
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setReferenceImage(null);
                    setReferencePalette(null);
                  }}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  제거
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">이미지 업로드</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleReferenceUpload}
            className="hidden"
          />
        </div>

        {/* Sample References */}
        <div className="mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            또는 샘플 선택:
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SAMPLE_REFERENCES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSampleSelect(sample.url)}
                className={`
                  aspect-square rounded-lg overflow-hidden bg-gradient-to-br ${sample.gradient}
                  ring-2 ring-offset-1 transition-all
                  ${referenceImage === sample.url
                    ? 'ring-blue-500'
                    : 'ring-transparent hover:ring-gray-300'
                  }
                `}
                title={sample.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Color Palette Preview */}
      {(targetPalette || referencePalette) && (
        <div className="flex items-center gap-4">
          {/* Target Palette */}
          {targetPalette && (
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">원본 색상</p>
              <div className="flex gap-1">
                {targetPalette.colors.slice(0, 5).map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Arrow */}
          <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />

          {/* Reference Palette */}
          {referencePalette && (
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">참조 색상</p>
              <div className="flex gap-1">
                {referencePalette.colors.slice(0, 5).map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Options */}
      <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        {/* Method */}
        <div>
          <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
            전이 방식
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as ColorTransferMethod)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="reinhard">Reinhard (자연스러운)</option>
            <option value="pdf-transfer">PDF Transfer (선명한)</option>
          </select>
        </div>

        {/* Strength */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">강도</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {strength}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        {/* Preserve Luminance */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={preserveLuminance}
            onChange={(e) => setPreserveLuminance(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            밝기 유지
          </span>
        </label>
      </div>

      {/* Apply Button */}
      <button
        onClick={handleApplyTransfer}
        disabled={!referenceImage || disabled || isProcessing}
        className="w-full py-2.5 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            처리 중...
          </>
        ) : (
          <>
            <Palette className="w-4 h-4" />
            색 전이 적용
          </>
        )}
      </button>
    </div>
  );
}
