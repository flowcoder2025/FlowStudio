'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Wand2, ImageIcon, X, FolderOpen, Cloud, Loader2, Check, Download } from 'lucide-react';
import { Header } from '@/components/Header';
import { ResultGrid } from '@/components/ResultGrid';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ImageGalleryModal } from '@/components/ImageGalleryModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppMode, GenerationRequest } from '@/types';
import { ASPECT_RATIOS } from '@/constants';
import { generateImageVariations, upscaleImage } from '@/services/geminiService';
import { compressImageWithStats, isFileTooLarge } from '@/lib/utils/imageCompression';

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

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleGallerySelect = (imageUrl: string) => {
    setUploadedImage(imageUrl);
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !prompt) {
      alert('이미지를 업로드하고 편집 내용을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const request: GenerationRequest = {
        mode: AppMode.EDIT,
        prompt,
        image: uploadedImage,
        aspectRatio: selectedAspectRatio
      };

      const images = await generateImageVariations(request);
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

    setIsLoading(true);
    try {
      const request: GenerationRequest = {
        mode: AppMode.EDIT,
        prompt,
        image: uploadedImage,
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
          mode: 'EDIT',
          prompt,
          aspectRatio: selectedAspectRatio,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (isUpscaled) setIsUpscaledSaved(true);
        alert(data.message || '클라우드에 저장되었습니다.');
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

      <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Wand2 className="text-emerald-600 dark:text-emerald-400" /> AI 이미지 편집
        </h2>

        {/* Step 1: Mandatory Upload */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">1. 편집할 사진을 올려주세요</h3>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${uploadedImage ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            {uploadedImage ? (
              <div className="relative max-h-80 mx-auto w-fit">
                <Image
                  src={uploadedImage}
                  alt="To Edit"
                  width={1080}
                  height={1920}
                  className="max-h-80 w-auto rounded-lg shadow-sm"
                  unoptimized={uploadedImage.startsWith('data:')}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 min-h-[36px] min-w-[36px] transition-colors"
                >
                  <span className="text-xs font-bold">변경</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <ImageIcon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                <p className="text-slate-600 dark:text-slate-300 font-medium text-lg">사진 업로드하기</p>
              </div>
            )}
          </div>
          {/* Gallery Button */}
          <button
            onClick={() => setIsGalleryOpen(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[48px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
          >
            <FolderOpen className="w-5 h-5" />
            내 이미지에서 불러오기
          </button>
        </div>

        {/* Step 2: Aspect Ratio Selection */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">2. 결과 이미지 비율</h3>
          <div className="grid grid-cols-3 gap-3">
            {ASPECT_RATIOS.map(ratio => (
              <button
                key={ratio.value}
                onClick={() => setSelectedAspectRatio(ratio.value)}
                className={`p-3 min-h-[72px] rounded-xl text-center transition-all border ${
                  selectedAspectRatio === ratio.value
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-400 ring-1 ring-emerald-500 dark:ring-emerald-400'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-500'
                }`}
              >
                <span className="block font-semibold text-slate-800 dark:text-slate-100 text-sm">{ratio.label}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{ratio.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Instruction & Preview */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">3. 어떻게 바꿔드릴까요?</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {['레트로 필터 씌워줘', '배경에 있는 사람 지워줘', '배경을 사무실로 바꿔줘', '좀 더 화사하게 만들어줘'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="px-3 py-1.5 min-h-[32px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: 배경을 깔끔한 흰색으로 바꿔줘, 텍스트를 제거해줘."
            className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 min-h-[120px] transition-colors"
          />
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 pb-safe z-30 transition-colors">
          <div className="max-w-6xl mx-auto flex gap-3 justify-end">
            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || !prompt || isLoading}
              className={`flex-1 md:flex-none px-8 py-3 min-h-[52px] rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
                !uploadedImage || !prompt || isLoading
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:shadow-emerald-200 dark:hover:shadow-emerald-900'
              }`}
            >
              {isLoading ? '생성 중...' : '이미지 4장 생성'}
              {!isLoading && <Wand2 className="w-5 h-5" />}
            </button>
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
                      클라우드 저장
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
