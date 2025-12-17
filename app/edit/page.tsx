'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Wand2, ImageIcon, X, FolderOpen, Cloud, Loader2, Check, Download } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { Header } from '@/components/Header';
import { ResultGrid } from '@/components/ResultGrid';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ImageGalleryModal } from '@/components/ImageGalleryModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreditSelectorDropdown, CreditType } from '@/components/CreditSelectorDropdown';
import { AppMode, GenerationRequest } from '@/types';
import { ASPECT_RATIOS } from '@/constants';
import { generateImageVariations, upscaleImage } from '@/services/geminiService';

export default function EditPage() {
  return (
    <AuthGuard>
      <EditPageContent />
    </AuthGuard>
  );
}

function EditPageContent() {
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUpscaledSaving, setIsUpscaledSaving] = useState(false);
  const [isUpscaledSaved, setIsUpscaledSaved] = useState(false);
  const [creditType, setCreditType] = useState<CreditType>('auto');
  const [willHaveWatermark, setWillHaveWatermark] = useState(false);

  const handleCreditSelect = (type: CreditType, hasWatermark: boolean) => {
    setCreditType(type);
    setWillHaveWatermark(hasWatermark);
  };

  const handleGallerySelect = (imageUrl: string) => {
    setUploadedImage(imageUrl);
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !prompt) {
      alert('이미지를 업로드하고 편집 내용을 입력해주세요.');
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
        mode: AppMode.EDIT,
        prompt,
        image: uploadedImage,
        aspectRatio: selectedAspectRatio
      };

      const images = await generateImageVariations(request, creditType);
      if (images.length === 0) {
        alert('이미지 생성에 실패했습니다. 다시 시도해주세요.');
      } else {
        setGeneratedImages(images);
        // Usage is now tracked server-side in /api/generate
      }
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!uploadedImage || !prompt) return;

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
        mode: AppMode.EDIT,
        prompt,
        image: uploadedImage,
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
          mode: 'EDIT',
          prompt,
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
      <Header currentMode={AppMode.EDIT} />

      <div className="max-w-5xl mx-auto px-3 lg:px-4 pt-4 lg:pt-6 pb-20">
        <div className="mb-4">
          <h2 className="text-lg lg:text-xl font-bold mb-1 flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Wand2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> AI 이미지 편집
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs">기존 이미지를 프롬프트에 따라 수정합니다</p>
        </div>

        {/* Step 1: Mandatory Upload */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">1. 편집할 사진을 올려주세요</h3>
          <FileDropzone
            value={uploadedImage}
            onChange={setUploadedImage}
            onCompressing={setIsCompressing}
            onError={(msg) => alert(msg)}
            colorTheme="emerald"
            icon={<ImageIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
            placeholder="편집할 이미지를 끌어다 놓거나 클릭해서 업로드하세요"
            imageAlt="To Edit"
            compact
          />

          {/* Divider with "또는" */}
          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            <span className="flex-shrink-0 mx-3 text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2">
              또는
            </span>
            <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
          </div>

          {/* Gallery Button */}
          <button
            onClick={() => setIsGalleryOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 min-h-[40px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-sm transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            이미지 저장소에서 불러오기
          </button>
        </div>

        {/* Step 2: Aspect Ratio Selection */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">2. 결과 이미지 비율</h3>
          <div className="grid grid-cols-3 gap-2">
            {ASPECT_RATIOS.map(ratio => (
              <button
                key={ratio.value}
                onClick={() => setSelectedAspectRatio(ratio.value)}
                className={`p-2 min-h-[56px] rounded-lg text-center transition-all border ${
                  selectedAspectRatio === ratio.value
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-400 ring-1 ring-emerald-500 dark:ring-emerald-400'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-500'
                }`}
              >
                <span className="block font-semibold text-slate-800 dark:text-slate-100 text-xs">{ratio.label}</span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">{ratio.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Instruction & Preview */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">3. 어떻게 바꿔드릴까요?</h3>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {['레트로 필터 씌워줘', '배경에 있는 사람 지워줘', '배경을 사무실로 바꿔줘', '좀 더 화사하게 만들어줘'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="px-2.5 py-1 min-h-[28px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: 배경을 깔끔한 흰색으로 바꿔줘, 텍스트를 제거해줘."
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 min-h-[80px] text-sm transition-colors"
          />
        </div>

        {/* Spacer for fixed bottom bar */}
        <div className="h-16"></div>

        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-3 pb-safe z-30 transition-colors">
          <div className="max-w-5xl mx-auto flex gap-3 justify-end items-center">
            {/* 크레딧 드롭다운 + 버튼 */}
            <div className="flex items-center gap-2">
              <CreditSelectorDropdown
                requiredCredits={20}
                selectedType={creditType}
                onSelect={handleCreditSelect}
              />
              <button
                onClick={handleGenerate}
                disabled={!uploadedImage || !prompt || isLoading}
                className={`px-4 py-1.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                  !uploadedImage || !prompt || isLoading
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:shadow-emerald-200 dark:hover:shadow-emerald-900'
                }`}
              >
                {isLoading ? '생성 중...' : '이미지 4장 생성'}
                {!isLoading && <Wand2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <LoadingOverlay isVisible={isLoading} message="이미지 생성 중..." />
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
                  className="px-6 py-3 min-h-[48px] bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
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
        title="편집할 이미지 선택"
      />
    </>
  );
}
