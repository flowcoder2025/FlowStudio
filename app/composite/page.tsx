'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import nextDynamic from 'next/dynamic';
import { Layers, Plus, X, FolderOpen, Cloud, Loader2, Check, Download, ImageIcon } from 'lucide-react';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreditSelectorDropdown, CreditType } from '@/components/CreditSelectorDropdown';
import { AppMode, Category, StyleOption, GenerationRequest } from '@/types';
import { COMPOSITE_CATEGORIES, ASPECT_RATIOS } from '@/constants';
import { generateImageVariations, upscaleImage } from '@/services/geminiService';
import { compressImageWithStats, isFileTooLarge } from '@/lib/utils/imageCompression';

const ResultGrid = nextDynamic(() => import('@/components/ResultGrid').then(mod => mod.ResultGrid));
const ImageGalleryModal = nextDynamic(() => import('@/components/ImageGalleryModal').then(mod => mod.ImageGalleryModal));

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
  const [isDragging, setIsDragging] = useState(false);
  const [creditType, setCreditType] = useState<CreditType>('auto');
  const [willHaveWatermark, setWillHaveWatermark] = useState(false);

  const handleCreditSelect = (type: CreditType, hasWatermark: boolean) => {
    setCreditType(type);
    setWillHaveWatermark(hasWatermark);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const processFiles = useCallback(async (files: File[]) => {
    const remainingSlots = MAX_IMAGES - compositeImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        continue;
      }

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
  }, [compositeImages.length]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(Array.from(files));
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current -= 1;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current = 0;
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(Array.from(files));
    }
  }, [processFiles]);

  // 싱글 셀렉트 (기존 호환성)
  const handleGallerySelect = (imageUrl: string) => {
    if (compositeImages.length < MAX_IMAGES) {
      setCompositeImages(prev => [...prev, imageUrl]);
    }
  };

  // 멀티 셀렉트 (여러 이미지 한 번에 추가)
  const handleGalleryMultiSelect = (imageUrls: string[]) => {
    const remainingSlots = MAX_IMAGES - compositeImages.length;
    const urlsToAdd = imageUrls.slice(0, remainingSlots);
    if (urlsToAdd.length > 0) {
      setCompositeImages(prev => [...prev, ...urlsToAdd].slice(0, MAX_IMAGES));
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

    // 워터마크 적용 확인
    if (willHaveWatermark) {
      const confirmed = confirm(
        '무료 크레딧 사용 시 생성된 이미지에 워터마크가 적용됩니다.\n\n계속 진행하시겠습니까?'
      );
      if (!confirmed) return;
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

      const images = await generateImageVariations(request, creditType);
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

    // 워터마크 적용 확인
    if (willHaveWatermark) {
      const confirmed = confirm(
        '무료 크레딧 사용 시 생성된 이미지에 워터마크가 적용됩니다.\n\n계속 진행하시겠습니까?'
      );
      if (!confirmed) return;
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

      const images = await generateImageVariations(request, creditType);
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

      <div className="max-w-5xl mx-auto px-3 lg:px-4 pt-4 lg:pt-6 pb-20">
        <div className="mb-4">
          <h2 className="text-lg lg:text-xl font-bold mb-1 flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Layers className="w-5 h-5 text-cyan-600 dark:text-cyan-400" /> 이미지 연출/합성
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs">
            여러 장의 이미지(제품, 소품, 배경 등)를 자연스럽게 하나로 합칩니다
          </p>
        </div>

        {/* Step 1: Upload Images */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-semibold text-sm lg:text-base mb-2 text-slate-800 dark:text-slate-100">
            1. 재료 이미지 업로드 (최대 {MAX_IMAGES}장)
          </h3>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
            multiple
          />

          {/* Drag & Drop Zone with Grid */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group border-2 border-dashed rounded-xl p-3 mb-3 transition-all duration-200 cursor-pointer ${
              isDragging
                ? 'border-cyan-500 dark:border-cyan-400 bg-cyan-100 dark:bg-cyan-900/40 scale-[1.01]'
                : compositeImages.length > 0
                ? 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
            onClick={() => compositeImages.length === 0 && fileInputRef.current?.click()}
          >
            {compositeImages.length === 0 ? (
              /* Empty State - FileDropzone Style */
              <div className="flex flex-col items-center justify-center py-6">
                <ImageIcon className={`w-8 h-8 mb-2 transition-colors ${
                  isDragging
                    ? 'text-cyan-500 dark:text-cyan-400 animate-bounce'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 dark:group-hover:text-cyan-400'
                }`} />
                <p className={`text-sm font-medium transition-colors ${
                  isDragging
                    ? 'text-cyan-600 dark:text-cyan-400'
                    : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100'
                }`}>
                  {isDragging ? '여기에 놓으세요!' : '이미지를 끌어다 놓거나 클릭해서 업로드하세요'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  여러 장을 한 번에 선택할 수 있습니다
                </p>
              </div>
            ) : (
              /* Grid with Images */
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
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
                      onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
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
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="aspect-square border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-cyan-400 dark:hover:border-cyan-500 transition-colors"
                  >
                    <Plus className="w-5 h-5 text-slate-400 dark:text-slate-500 mb-0.5" />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">추가</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">
            * 제품 사진, 소품, 배경 질감 등을 업로드하세요. 순서는 중요하지 않습니다.
          </p>

          {/* Divider with "또는" */}
          <div className="relative flex items-center my-3">
            <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            <span className="flex-shrink-0 mx-3 text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2">
              또는
            </span>
            <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
          </div>

          <button
            onClick={() => setIsGalleryOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 min-h-[40px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-sm transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            이미지 저장소에서 불러오기
          </button>
        </div>

        {/* Step 2: Category Selection */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-semibold text-sm lg:text-base mb-2 text-slate-800 dark:text-slate-100">2. 합성 테마 선택</h3>
          <div className="grid grid-cols-2 gap-2">
            {COMPOSITE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat); setSelectedStyle(null); }}
                className={`p-3 min-h-[68px] rounded-xl text-left transition-all border ${
                  selectedCategory?.id === cat.id
                    ? 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-500 dark:border-cyan-400 ring-1 ring-cyan-500 dark:ring-cyan-400'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-cyan-300 dark:hover:border-cyan-500'
                }`}
              >
                <span className="block font-semibold text-sm text-slate-800 dark:text-slate-100 mb-0.5">{cat.label}</span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">{cat.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Style Selection (Conditional) */}
        {selectedCategory && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 animate-fadeIn transition-colors">
            <h3 className="font-semibold text-sm lg:text-base mb-2 text-slate-800 dark:text-slate-100">3. 연출 스타일</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {selectedCategory.styles.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-2 min-h-[68px] rounded-xl text-center transition-all border relative overflow-hidden ${
                    selectedStyle?.id === style.id
                      ? 'border-cyan-500 dark:border-cyan-400 ring-2 ring-cyan-500 dark:ring-cyan-400'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className={`w-full h-8 mb-1 rounded-lg ${style.previewColor}`}></div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{style.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Aspect Ratio Selection */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-semibold text-sm lg:text-base mb-2 text-slate-800 dark:text-slate-100">4. 이미지 비율</h3>
          <div className="grid grid-cols-3 gap-2">
            {ASPECT_RATIOS.map(ratio => (
              <button
                key={ratio.value}
                onClick={() => setSelectedAspectRatio(ratio.value)}
                className={`p-2 min-h-[56px] rounded-xl text-center transition-all border ${
                  selectedAspectRatio === ratio.value
                    ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 dark:border-cyan-400 ring-1 ring-cyan-500 dark:ring-cyan-400'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-cyan-300 dark:hover:border-cyan-500'
                }`}
              >
                <span className="block font-semibold text-slate-800 dark:text-slate-100 text-xs">{ratio.label}</span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">{ratio.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 5: Prompt Input */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-semibold text-sm lg:text-base mb-2 text-slate-800 dark:text-slate-100">5. 합성 요청 사항</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: IMG 1의 운동화를 중앙에 놓고, IMG 2의 나뭇잎들을 주변에 배치해서 자연스러운 숲 속 느낌을 연출해줘."
            className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 min-h-[80px] text-sm transition-colors"
          />
        </div>

        {/* Spacer for fixed bottom bar */}
        <div className="h-16"></div>

        {/* Fixed Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-3 pb-safe z-30 transition-colors">
          <div className="max-w-5xl mx-auto flex justify-between items-center gap-3">
            {/* 선택 경로 */}
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
              {selectedCategory ? selectedCategory.label : '테마 선택'}
              {selectedStyle ? ` > ${selectedStyle.label}` : ''}
              {` > ${selectedAspectRatio}`}
            </p>
            {/* 크레딧 드롭다운 + 버튼 */}
            <div className="flex items-center gap-2 ml-auto">
              <CreditSelectorDropdown
                requiredCredits={20}
                selectedType={creditType}
                onSelect={handleCreditSelect}
              />
              <button
                onClick={handleGenerate}
                disabled={compositeImages.length === 0 || !selectedCategory || isLoading}
                className={`px-4 py-2 min-h-[40px] rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                  compositeImages.length === 0 || !selectedCategory || isLoading
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-cyan-600 dark:bg-cyan-500 text-white hover:bg-cyan-700 dark:hover:bg-cyan-600 hover:shadow-cyan-200 dark:hover:shadow-cyan-900'
                }`}
              >
                {isLoading ? '합성 중...' : '이미지 4장 합성'}
                {!isLoading && <Layers className="w-4 h-4" />}
              </button>
            </div>
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
        <div className="fixed inset-0 z-60 bg-black/80 dark:bg-black/90 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto transition-colors">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between">
              <h2 className="text-base lg:text-lg font-bold text-slate-800 dark:text-slate-100">업스케일 결과 (4K)</h2>
              <button
                onClick={() => setUpscaledImage(null)}
                className="p-1.5 min-h-[36px] min-w-[36px] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            <div className="p-3">
              <Image
                src={upscaledImage}
                alt="Upscaled"
                width={2048}
                height={2048}
                className="w-full h-auto rounded-lg shadow-lg"
                unoptimized={upscaledImage.startsWith('data:')}
              />
              <div className="mt-3 flex gap-2 justify-center flex-wrap">
                <button
                  onClick={() => handleDownloadImage(upscaledImage, `upscaled-${Date.now()}.png`)}
                  className="flex items-center gap-1.5 px-4 py-2 min-h-[40px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-sm font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  4K 다운로드
                </button>
                <button
                  onClick={() => handleSaveToCloud(upscaledImage, true)}
                  disabled={isUpscaledSaving || isUpscaledSaved}
                  className={`flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-xl text-sm font-semibold transition-colors ${
                    isUpscaledSaved
                      ? 'bg-green-500 dark:bg-green-600 text-white'
                      : isUpscaledSaving
                      ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
                  }`}
                >
                  {isUpscaledSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      저장 중...
                    </>
                  ) : isUpscaledSaved ? (
                    <>
                      <Check className="w-4 h-4" />
                      저장됨
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      저장소에 저장
                    </>
                  )}
                </button>
                <button
                  onClick={() => setUpscaledImage(null)}
                  className="px-4 py-2 min-h-[40px] bg-cyan-600 dark:bg-cyan-500 text-white rounded-xl text-sm font-semibold hover:bg-cyan-700 dark:hover:bg-cyan-600 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal - 멀티 셀렉트 모드 */}
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={handleGallerySelect}
        onMultiSelect={handleGalleryMultiSelect}
        multiSelect={true}
        maxSelect={MAX_IMAGES - compositeImages.length}
        title="재료 이미지 선택 (여러 장 선택 가능)"
      />
    </>
  );
}
