'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Layers, Plus, X, FolderOpen, Cloud, Loader2, Check, Download } from 'lucide-react';
import { Header } from '@/components/Header';
import { ResultGrid } from '@/components/ResultGrid';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ImageGalleryModal } from '@/components/ImageGalleryModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppMode, Category, StyleOption, GenerationRequest } from '@/types';
import { COMPOSITE_CATEGORIES, ASPECT_RATIOS } from '@/constants';
import { generateImageVariations, upscaleImage } from '@/services/geminiService';
import { compressImageWithStats, isFileTooLarge } from '@/lib/utils/imageCompression';

const MAX_IMAGES = 10;

export default function CompositePage() {
  return (
    <AuthGuard>
      <CompositePageContent />
    </AuthGuard>
  );
}

function CompositePageContent() {
  const [compositeImages, setCompositeImages] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [prompt, setPrompt] = useState('');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUpscaledSaving, setIsUpscaledSaving] = useState(false);
  const [isUpscaledSaved, setIsUpscaledSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = MAX_IMAGES - compositeImages.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToProcess) {
      try {
        const needsCompression = isFileTooLarge(file, 3);

        if (needsCompression) {
          setIsCompressing(true);
          console.log(`🖼️ 이미지 압축 시작: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);

          const result = await compressImageWithStats(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 2048,
          });

          console.log(`✅ 압축 완료: ${result.originalSizeMB.toFixed(2)}MB → ${result.compressedSizeMB.toFixed(2)}MB`);
          setCompositeImages(prev => [...prev, result.compressed].slice(0, MAX_IMAGES));
          setIsCompressing(false);
        } else {
          const reader = new FileReader();
          reader.onloadend = () => {
            setCompositeImages(prev => [...prev, reader.result as string].slice(0, MAX_IMAGES));
          };
          reader.readAsDataURL(file);
        }
      } catch (error) {
        console.error('이미지 압축 오류:', error);
        setIsCompressing(false);
        alert('이미지 처리 중 오류가 발생했습니다.');
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGallerySelect = (imageUrl: string) => {
    if (compositeImages.length < MAX_IMAGES) {
      setCompositeImages(prev => [...prev, imageUrl]);
    }
  };

  const removeImage = (index: number) => {
    setCompositeImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (compositeImages.length === 0) {
      alert('합성할 이미지를 최소 1장 이상 업로드해주세요.');
      return;
    }

    if (!selectedCategory) {
      alert('합성 테마를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const request: GenerationRequest = {
        mode: AppMode.COMPOSITE,
        prompt,
        refImages: compositeImages,
        category: selectedCategory,
        style: selectedStyle || undefined,
        aspectRatio: selectedAspectRatio
      };

      const images = await generateImageVariations(request);
      if (images.length === 0) {
        alert('이미지 생성에 실패했습니다. 다시 시도해주세요.');
      } else {
        setGeneratedImages(images);
      }
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMore = async () => {
    if (compositeImages.length === 0 || !selectedCategory) return;

    setIsLoading(true);
    try {
      const request: GenerationRequest = {
        mode: AppMode.COMPOSITE,
        prompt,
        refImages: compositeImages,
        category: selectedCategory,
        style: selectedStyle || undefined,
        aspectRatio: selectedAspectRatio
      };

      const images = await generateImageVariations(request);
      if (images.length === 0) {
        alert('이미지 생성에 실패했습니다. 다시 시도해주세요.');
      } else {
        setGeneratedImages(prev => [...prev, ...images]);
      }
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpscale = async (imageUrl: string) => {
    setIsUpscaling(true);
    setIsUpscaledSaved(false);
    try {
      const result = await upscaleImage(imageUrl);
      if (result) {
        setUpscaledImage(result);
      } else {
        alert('업스케일링에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('업스케일링 중 오류가 발생했습니다.');
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleSaveToCloud = async (image: string, isUpscaled: boolean = false) => {
    if (isUpscaled && isUpscaledSaved) return;
    if (isUpscaled) setIsUpscaledSaving(true);

    try {
      const response = await fetch('/api/images/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [image],
          mode: 'COMPOSITE',
          prompt,
          category: selectedCategory?.id,
          style: selectedStyle?.id,
          aspectRatio: selectedAspectRatio,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (isUpscaled) setIsUpscaledSaved(true);
        alert(data.message || '이미지 저장소에 저장되었습니다.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Cloud save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      if (isUpscaled) setIsUpscaledSaving(false);
    }
  };

  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <>
      <Header currentMode={AppMode.COMPOSITE} />

      <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Layers className="text-cyan-600 dark:text-cyan-400" /> 이미지 연출/합성
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 -mt-4">
          여러 장의 이미지(제품, 소품, 배경 등)를 자연스럽게 하나로 합칩니다.
        </p>

        {/* Step 1: Upload Images */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">
            1. 재료 이미지 업로드 (최대 {MAX_IMAGES}장)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
            {compositeImages.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700">
                <Image
                  src={img}
                  alt={`재료 ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized={img.startsWith('data:')}
                />
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  IMG {idx + 1}
                </div>
              </div>
            ))}

            {compositeImages.length < MAX_IMAGES && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                  multiple
                />
                <Plus className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-1" />
                <span className="text-xs text-slate-500 dark:text-slate-400">이미지 추가</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
            * 제품 사진, 소품, 배경 질감 등을 업로드하세요. 순서는 중요하지 않습니다.
          </p>

          <button
            onClick={() => setIsGalleryOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[48px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
          >
            <FolderOpen className="w-5 h-5" />
            이미지 저장소에서 불러오기
          </button>
        </div>

        {/* Step 2: Category Selection */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">2. 합성 테마 선택</h3>
          <div className="grid grid-cols-2 gap-3">
            {COMPOSITE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat); setSelectedStyle(null); }}
                className={`p-4 min-h-[88px] rounded-xl text-left transition-all border ${
                  selectedCategory?.id === cat.id
                    ? 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-500 dark:border-cyan-400 ring-1 ring-cyan-500 dark:ring-cyan-400'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-cyan-300 dark:hover:border-cyan-500'
                }`}
              >
                <span className="block font-semibold text-slate-800 dark:text-slate-100 mb-1">{cat.label}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{cat.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Style Selection (Conditional) */}
        {selectedCategory && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 animate-fadeIn transition-colors">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">3. 연출 스타일</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selectedCategory.styles.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-3 min-h-[88px] rounded-xl text-center transition-all border relative overflow-hidden ${
                    selectedStyle?.id === style.id
                      ? 'border-cyan-500 dark:border-cyan-400 ring-2 ring-cyan-500 dark:ring-cyan-400'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className={`w-full h-12 mb-2 rounded-lg ${style.previewColor}`}></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{style.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Aspect Ratio Selection */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">4. 이미지 비율</h3>
          <div className="grid grid-cols-3 gap-3">
            {ASPECT_RATIOS.map(ratio => (
              <button
                key={ratio.value}
                onClick={() => setSelectedAspectRatio(ratio.value)}
                className={`p-3 min-h-[72px] rounded-xl text-center transition-all border ${
                  selectedAspectRatio === ratio.value
                    ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 dark:border-cyan-400 ring-1 ring-cyan-500 dark:ring-cyan-400'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-cyan-300 dark:hover:border-cyan-500'
                }`}
              >
                <span className="block font-semibold text-slate-800 dark:text-slate-100 text-sm">{ratio.label}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{ratio.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 5: Prompt Input */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">5. 합성 요청 사항</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: IMG 1의 운동화를 중앙에 놓고, IMG 2의 나뭇잎들을 주변에 배치해서 자연스러운 숲 속 느낌을 연출해줘."
            className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 min-h-[120px] transition-colors"
          />
        </div>

        {/* Fixed Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 pb-safe z-30 transition-colors">
          <div className="max-w-6xl mx-auto flex gap-3 justify-end">
            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={compositeImages.length === 0 || !selectedCategory || isLoading}
              className={`flex-1 md:flex-none px-8 py-3 min-h-[52px] rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
                compositeImages.length === 0 || !selectedCategory || isLoading
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-600 dark:bg-cyan-500 text-white hover:bg-cyan-700 dark:hover:bg-cyan-600 hover:shadow-cyan-200 dark:hover:shadow-cyan-900'
              }`}
            >
              {isLoading ? '합성 중...' : '이미지 4장 합성'}
              {!isLoading && <Layers className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <LoadingOverlay isVisible={isLoading} message="이미지 합성 중..." />
      <LoadingOverlay isVisible={isUpscaling} message="업스케일링 중..." />
      <LoadingOverlay isVisible={isCompressing} message="이미지 압축 중..." />
      <ResultGrid
        images={generatedImages}
        onClose={() => setGeneratedImages([])}
        onUpscale={handleUpscale}
        onSave={handleSaveToCloud}
        onGenerateMore={handleGenerateMore}
      />

      {/* Upscaled Image Modal */}
      {upscaledImage && (
        <div className="fixed inset-0 z-60 bg-black/80 dark:bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto transition-colors">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">업스케일 결과 (4K)</h2>
              <button
                onClick={() => setUpscaledImage(null)}
                className="p-2 min-h-[40px] min-w-[40px] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            <div className="p-4">
              <Image
                src={upscaledImage}
                alt="Upscaled"
                width={2048}
                height={2048}
                className="w-full h-auto rounded-lg shadow-lg"
                unoptimized={upscaledImage.startsWith('data:')}
              />
              <div className="mt-4 flex gap-3 justify-center flex-wrap">
                <button
                  onClick={() => handleDownloadImage(upscaledImage, `upscaled-${Date.now()}.png`)}
                  className="flex items-center gap-2 px-6 py-3 min-h-[48px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  4K 이미지 다운로드
                </button>
                <button
                  onClick={() => handleSaveToCloud(upscaledImage, true)}
                  disabled={isUpscaledSaving || isUpscaledSaved}
                  className={`flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl font-semibold transition-colors ${
                    isUpscaledSaved
                      ? 'bg-green-500 dark:bg-green-600 text-white'
                      : isUpscaledSaving
                      ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
                  }`}
                >
                  {isUpscaledSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      저장 중...
                    </>
                  ) : isUpscaledSaved ? (
                    <>
                      <Check className="w-5 h-5" />
                      저장됨
                    </>
                  ) : (
                    <>
                      <Cloud className="w-5 h-5" />
                      이미지 저장소에 저장
                    </>
                  )}
                </button>
                <button
                  onClick={() => setUpscaledImage(null)}
                  className="px-6 py-3 min-h-[48px] bg-cyan-600 dark:bg-cyan-500 text-white rounded-xl font-semibold hover:bg-cyan-700 dark:hover:bg-cyan-600 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={handleGallerySelect}
        title="재료 이미지 선택"
      />
    </>
  );
}
