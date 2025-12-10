'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  SlidersHorizontal,
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  Sun,
  Droplets,
  Maximize2,
  RefreshCw,
  FolderOpen,
  ImageIcon,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ImageGalleryModal } from '@/components/ImageGalleryModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppMode, FilterState } from '@/types';
import { DEFAULT_FILTERS, FILTER_PRESETS } from '@/lib/constants';
import { upscaleImage } from '@/services/geminiService';
import { compressImageWithStats, isFileTooLarge } from '@/lib/utils/imageCompression';

export default function ColorCorrectionPage() {
  return (
    <AuthGuard>
      <ColorCorrectionPageContent />
    </AuthGuard>
  );
}

function ColorCorrectionPageContent() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGallerySelect = (imageUrl: string) => {
    setUploadedImage(imageUrl);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const needsCompression = isFileTooLarge(file, 3);

      if (needsCompression) {
        setIsCompressing(true);
        console.log(`🖼️ 이미지 압축 시작: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);

        const result = await compressImageWithStats(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2048,
        });

        console.log(`✅ 압축 완료: ${result.originalSizeMB.toFixed(2)}MB → ${result.compressedSizeMB.toFixed(2)}MB (${result.reductionPercent.toFixed(1)}% 감소)`);
        setUploadedImage(result.compressed);
        setIsCompressing(false);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('이미지 압축 오류:', error);
      setIsCompressing(false);
      alert('이미지 처리 중 오류가 발생했습니다. 다른 이미지를 시도해주세요.');
    }
  };

  // Canvas에 필터 적용
  useEffect(() => {
    if (uploadedImage && canvasRef.current) {
      // 이미지가 변경되었을 때만 새로 로드
      if (!sourceImageRef.current || sourceImageRef.current.src !== uploadedImage) {
        const img = new Image();
        img.src = uploadedImage;
        img.onload = () => {
          sourceImageRef.current = img;
          drawCanvas();
        };
      } else {
        // 이미지는 그대로, 필터만 변경
        drawCanvas();
      }
    }
  }, [uploadedImage, filters]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = sourceImageRef.current;

    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정
    canvas.width = img.width;
    canvas.height = img.height;

    // 필터 적용
    ctx.filter = `
      brightness(${filters.brightness}%)
      contrast(${filters.contrast}%)
      saturate(${filters.saturation}%)
      sepia(${filters.sepia}%)
      blur(${filters.blur}px)
      grayscale(${filters.grayscale}%)
      hue-rotate(${filters.hueRotate}deg)
    `;

    // 이미지 그리기
    ctx.drawImage(img, 0, 0);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `corrected-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleUpscale = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);

    try {
      // Canvas를 base64로 변환
      const base64Image = canvas.toDataURL('image/png');

      // Gemini API로 고화질 변환
      const upscaled = await upscaleImage(base64Image);

      if (upscaled) {
        // 고화질 이미지를 새로운 이미지로 설정
        setUploadedImage(upscaled);
        setFilters(DEFAULT_FILTERS); // 필터 초기화
        alert('고화질 변환이 완료되었습니다!');
      }
    } catch (error) {
      console.error('Upscale error:', error);
      alert(error instanceof Error ? error.message : '고화질 변환에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header currentMode={AppMode.COLOR_CORRECTION} />

      <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <SlidersHorizontal className="text-amber-500 dark:text-amber-400" size={28} />
              색감 보정 스튜디오
            </h2>
            <p className="text-slate-600 dark:text-slate-400">AI 없이 즉시 색감을 조절합니다 (무료/무제한)</p>
          </div>

          {uploadedImage && (
            <button
              onClick={() => {
                setUploadedImage(null);
                setFilters(DEFAULT_FILTERS);
              }}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> 다른 이미지 열기
            </button>
          )}
        </div>

        {!uploadedImage ? (
          <div className="flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 min-h-[500px] transition-colors">
            <div className="text-center max-w-md space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer p-12 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="bg-amber-100 dark:bg-amber-900/40 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ImageIcon className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">보정할 사진 업로드</h3>
                <p className="text-slate-500 dark:text-slate-400">PNG, JPG (최대 10MB)</p>
              </div>

              <button
                onClick={() => setIsGalleryOpen(true)}
                className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                내 이미지에서 불러오기
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Canvas Area */}
            <div className="lg:col-span-2 bg-slate-900 dark:bg-slate-950 rounded-xl overflow-hidden relative border border-slate-700 dark:border-slate-800 shadow-inner flex items-center justify-center min-h-[600px] transition-colors">
              <div className="max-w-full max-h-full p-4 relative">
                <canvas ref={canvasRef} className="max-w-full max-h-[70vh] object-contain shadow-2xl" />
                <div className="absolute bottom-6 right-6 flex gap-2">
                  <button
                    onClick={handleUpscale}
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600/90 dark:bg-indigo-700/90 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Maximize2 className="w-3 h-3" />
                    )}
                    AI 고화질 변환 (2K)
                  </button>
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col overflow-y-auto max-h-[600px] transition-colors">
              {/* Presets */}
              <div className="mb-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" /> 전문가 필터 프리셋
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {FILTER_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setFilters(preset.filters)}
                      className={`p-2 text-xs rounded transition-colors text-left font-medium border ${preset.color}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4 flex-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2 border-t border-slate-100 dark:border-slate-700 pt-4">
                  <SlidersHorizontal className="w-4 h-4 text-amber-500 dark:text-amber-400" /> 세부 조절
                </h3>

                {/* Brightness */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sun className="w-3 h-3" /> 밝기
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{filters.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.brightness}
                    onChange={(e) => setFilters({ ...filters, brightness: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 dark:accent-amber-400"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">대비</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{filters.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.contrast}
                    onChange={(e) => setFilters({ ...filters, contrast: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 dark:accent-amber-400"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Droplets className="w-3 h-3" /> 채도
                    </span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{filters.saturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.saturation}
                    onChange={(e) => setFilters({ ...filters, saturation: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 dark:accent-amber-400"
                  />
                </div>

                {/* Sepia */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">따뜻함 (Sepia)</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{filters.sepia}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.sepia}
                    onChange={(e) => setFilters({ ...filters, sepia: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 dark:accent-amber-400"
                  />
                </div>

                {/* Blur */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">흐림 (Blur)</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{filters.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={filters.blur}
                    onChange={(e) => setFilters({ ...filters, blur: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 dark:accent-amber-400"
                  />
                </div>

                {/* Grayscale */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">흑백 (Grayscale)</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{filters.grayscale}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.grayscale}
                    onChange={(e) => setFilters({ ...filters, grayscale: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 dark:accent-amber-400"
                  />
                </div>

                {/* Hue Rotate */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 dark:text-slate-400">색조 (Hue)</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{filters.hueRotate}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={filters.hueRotate}
                    onChange={(e) => setFilters({ ...filters, hueRotate: Number(e.target.value) })}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 dark:accent-amber-400"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="flex-1 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-4 h-4" /> 초기화
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-[2] py-3 text-sm font-bold text-white bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-700 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-200 dark:shadow-amber-900/50"
                >
                  <Download className="w-4 h-4" /> 저장하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {isLoading && <LoadingOverlay message="AI가 고화질로 변환하고 있습니다..." />}
      {isCompressing && <LoadingOverlay message="이미지를 최적화하고 있습니다..." />}

      <ImageGalleryModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} onSelect={handleGallerySelect} />
    </>
  );
}
