'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SlidersHorizontal,
  Download,
  RotateCcw,
  Sparkles,
  Sun,
  Droplets,
  Maximize2,
  RefreshCw,
  FolderOpen,
  ImageIcon,
  Cloud,
} from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ImageGalleryModal } from '@/components/ImageGalleryModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppMode, FilterState } from '@/types';
import { DEFAULT_FILTERS, FILTER_PRESETS } from '@/lib/constants';
import { upscaleImage } from '@/services/geminiService';

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

  const handleGallerySelect = (imageUrl: string) => {
    setUploadedImage(imageUrl);
  };

  const drawCanvas = useCallback(() => {
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
  }, [filters]);

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
  }, [uploadedImage, filters, drawCanvas]);

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

  const handleSaveToCloud = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);

    try {
      // Canvas를 base64로 변환
      const base64Image = canvas.toDataURL('image/png');

      // 클라우드에 저장
      const response = await fetch('/api/images/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [base64Image],
          mode: 'COLOR_CORRECTION',
          prompt: `색감 보정 - 밝기: ${filters.brightness}%, 대비: ${filters.contrast}%, 채도: ${filters.saturation}%`,
        }),
      });

      if (!response.ok) {
        throw new Error('이미지 저장소 저장에 실패했습니다.');
      }

      alert('이미지 저장소에 저장되었습니다!');
    } catch (error) {
      console.error('Cloud save error:', error);
      alert(error instanceof Error ? error.message : '이미지 저장소 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header currentMode={AppMode.COLOR_CORRECTION} />

      <div className="max-w-5xl mx-auto px-3 lg:px-4 py-4 lg:py-6 pb-24">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg lg:text-xl font-bold mb-1 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <SlidersHorizontal className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              색감 보정 스튜디오
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs">AI 없이 즉시 색감을 조절합니다 (무료/무제한)</p>
          </div>

          {uploadedImage && (
            <button
              onClick={() => {
                setUploadedImage(null);
                setFilters(DEFAULT_FILTERS);
              }}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> 다른 이미지 열기
            </button>
          )}
        </div>

        {!uploadedImage ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 min-h-[350px] transition-colors">
            <div className="max-w-sm mx-auto space-y-4">
              <FileDropzone
                value={uploadedImage}
                onChange={setUploadedImage}
                onCompressing={setIsCompressing}
                onError={(msg) => alert(msg)}
                colorTheme="amber"
                icon={<ImageIcon className="w-8 h-8 text-amber-600 dark:text-amber-400" />}
                placeholder="보정할 사진 업로드 또는 드래그 앤 드롭"
                subPlaceholder="PNG, JPG (최대 10MB)"
                imageAlt="To Correct"
                compact
                minHeight="min-h-[200px]"
              />

              {/* Divider with "또는" */}
              <div className="relative flex items-center my-4">
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                <span className="flex-shrink-0 mx-3 text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2">
                  또는
                </span>
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
              </div>

              <button
                onClick={() => setIsGalleryOpen(true)}
                className="w-full py-2.5 px-4 min-h-[40px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                이미지 저장소에서 불러오기
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Canvas Area */}
            <div className="lg:col-span-2 bg-slate-900 dark:bg-slate-950 rounded-xl overflow-hidden relative border border-slate-700 dark:border-slate-800 shadow-inner flex items-center justify-center min-h-[400px] lg:min-h-[500px] transition-colors">
              <div className="max-w-full max-h-full p-3 relative">
                <canvas ref={canvasRef} className="max-w-full max-h-[60vh] object-contain shadow-2xl" />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={handleUpscale}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-indigo-600/90 dark:bg-indigo-700/90 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white text-[10px] font-bold rounded-full shadow-lg backdrop-blur-sm flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Maximize2 className="w-3 h-3" />
                    )}
                    AI 고화질 변환 (4K)
                  </button>
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-col overflow-y-auto max-h-[500px] transition-colors">
              {/* Presets */}
              <div className="mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-2 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> 전문가 필터 프리셋
                </h3>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {FILTER_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => setFilters(preset.filters)}
                      className={`p-1.5 text-[10px] rounded transition-colors text-left font-medium border ${preset.color}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3 flex-1">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-700 pt-3">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> 세부 조절
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
              <div className="mt-4 space-y-1.5">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="flex-1 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> 초기화
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-[2] py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> 다운로드
                  </button>
                </div>
                <button
                  onClick={handleSaveToCloud}
                  disabled={isLoading}
                  className="w-full py-2 text-xs font-bold text-white bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-amber-200 dark:shadow-amber-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Cloud className="w-3.5 h-3.5" /> 이미지 저장소에 저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <LoadingOverlay isVisible={isLoading} message="AI가 고화질로 변환하고 있습니다..." />
      <LoadingOverlay isVisible={isCompressing} message="이미지를 최적화하고 있습니다..." />

      <ImageGalleryModal isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} onSelect={handleGallerySelect} />
    </>
  );
}
