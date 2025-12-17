'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Megaphone, Sparkles, X, FolderOpen, Upload, Cloud, Loader2, Check, Download } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { Header } from '@/components/Header';
import { ResultGrid } from '@/components/ResultGrid';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ImageGalleryModal } from '@/components/ImageGalleryModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreditSelectorDropdown, CreditType } from '@/components/CreditSelectorDropdown';
import { AppMode, Category, StyleOption, GenerationRequest } from '@/types';
import { POSTER_CATEGORIES, ASPECT_RATIOS } from '@/constants';
import { generateImageVariations, upscaleImage } from '@/services/geminiService';

export default function PosterPage() {
  return (
    <AuthGuard>
      <PosterPageContent />
    </AuthGuard>
  );
}

function PosterPageContent() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [prompt, setPrompt] = useState('');
  const [productImage, setProductImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isProductGalleryOpen, setIsProductGalleryOpen] = useState(false);
  const [isLogoGalleryOpen, setIsLogoGalleryOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUpscaledSaving, setIsUpscaledSaving] = useState(false);
  const [isUpscaledSaved, setIsUpscaledSaved] = useState(false);
  const [creditType, setCreditType] = useState<CreditType>('auto');
  const [willHaveWatermark, setWillHaveWatermark] = useState(false);

  const handleCreditSelect = (type: CreditType, hasWatermark: boolean) => {
    setCreditType(type);
    setWillHaveWatermark(hasWatermark);
  };

  const handleProductGallerySelect = (imageUrl: string) => {
    setProductImage(imageUrl);
  };

  const handleLogoGallerySelect = (imageUrl: string) => {
    setLogoImage(imageUrl);
  };

  const handleGenerate = async () => {
    if (!selectedCategory) {
      alert('포스터 카테고리를 선택해주세요.');
      return;
    }

    if (!productImage) {
      alert('포스터를 만들 제품 사진을 업로드해주세요.');
      return;
    }

    if (!prompt.trim()) {
      alert('포스터 컨셉이나 문구를 입력해주세요.');
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
    setGeneratedImages([]);
    setUpscaledImage(null);

    try {
      const request: GenerationRequest = {
        image: productImage,
        logoImage: logoImage || undefined,
        prompt,
        category: selectedCategory,
        style: selectedStyle || undefined,
        mode: AppMode.POSTER,
        aspectRatio: selectedAspectRatio,
      };

      const images = await generateImageVariations(request, creditType);
      setGeneratedImages(images);
    } catch (error) {
      console.error('Generation error:', error);
      alert(error instanceof Error ? error.message : '이미지 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!selectedCategory || !productImage || !prompt.trim()) return;

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
        image: productImage,
        logoImage: logoImage || undefined,
        prompt,
        category: selectedCategory,
        style: selectedStyle || undefined,
        mode: AppMode.POSTER,
        aspectRatio: selectedAspectRatio,
      };

      const images = await generateImageVariations(request, creditType);
      setGeneratedImages(prev => [...prev, ...images]);
    } catch (error) {
      console.error('Generation error:', error);
      alert(error instanceof Error ? error.message : '이미지 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpscale = async (imageUrl: string) => {
    setIsUpscaling(true);
    setUpscaledImage(null);
    setIsUpscaledSaved(false);

    try {
      const upscaled = await upscaleImage(imageUrl);
      if (upscaled) {
        setUpscaledImage(upscaled);
      }
    } catch (error) {
      console.error('Upscale error:', error);
      alert(error instanceof Error ? error.message : '고화질 변환에 실패했습니다.');
    } finally {
      setIsUpscaling(false);
    }
  };

  const handleSaveToCloud = async (image: string) => {
    if (isUpscaledSaved) return;

    setIsUpscaledSaving(true);
    try {
      const response = await fetch('/api/images/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [image],
          mode: 'POSTER',
          prompt,
          category: selectedCategory?.id,
          aspectRatio: selectedAspectRatio,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsUpscaledSaved(true);
        alert(data.message || '이미지 저장소에 저장되었습니다.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Cloud save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsUpscaledSaving(false);
    }
  };

  return (
    <>
      <Header currentMode={AppMode.POSTER} />

      <div className="max-w-5xl mx-auto px-3 lg:px-4 pt-4 lg:pt-6 pb-20">
        <div className="mb-4">
          <h2 className="text-lg lg:text-xl font-bold mb-1 flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Megaphone className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            홍보 포스터 제작
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs">제품 사진을 활용하여 홍보/마케팅용 포스터를 생성합니다</p>
        </div>
        {/* 제품 사진 업로드 (필수) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">1. 제품 사진 업로드 (필수)</h3>
          <FileDropzone
            value={productImage}
            onChange={setProductImage}
            onCompressing={setIsCompressing}
            onError={(msg) => alert(msg)}
            colorTheme="rose"
            icon={<Upload className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
            placeholder="제품 사진을 끌어다 놓거나 클릭해서 업로드하세요"
            subPlaceholder="PNG, JPG (최대 10MB)"
            imageAlt="Product"
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
            onClick={() => setIsProductGalleryOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 min-h-[40px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-sm transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            이미지 저장소에서 불러오기
          </button>
        </div>

        {/* 로고 이미지 업로드 (선택) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">2. 로고 이미지 (선택)</h3>
          <FileDropzone
            value={logoImage}
            onChange={setLogoImage}
            onCompressing={setIsCompressing}
            onError={(msg) => alert(msg)}
            colorTheme="amber"
            icon={<Upload className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
            placeholder="로고를 끌어다 놓거나 클릭해서 업로드하세요 (선택)"
            subPlaceholder="PNG 권장 (투명 배경)"
            imageAlt="Logo"
            imageMaxHeight="h-20"
            compact
          />

          {/* Divider with "또는" */}
          <div className="relative flex items-center my-3">
            <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            <span className="flex-shrink-0 mx-3 text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2">
              또는
            </span>
            <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
          </div>

          {/* Gallery Button */}
          <button
            onClick={() => setIsLogoGalleryOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 min-h-[36px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-xs transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            이미지 저장소에서 불러오기
          </button>
        </div>

        {/* 카테고리 선택 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">3. 포스터 카테고리</h3>
          <div className="grid grid-cols-2 gap-2">
            {POSTER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedStyle(null);
                }}
                className={`p-3 min-h-[60px] rounded-lg text-left transition-all border ${
                  selectedCategory?.id === cat.id
                    ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 dark:border-rose-400 ring-1 ring-rose-500 dark:ring-rose-400'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-rose-300 dark:hover:border-rose-500'
                }`}
              >
                <span className="block font-semibold text-slate-800 dark:text-slate-100 text-xs mb-0.5">{cat.label}</span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">{cat.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 스타일 선택 */}
        {selectedCategory && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 animate-fadeIn transition-colors">
            <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">4. 디자인 스타일</h3>
            <div className="grid grid-cols-2 gap-2">
              {selectedCategory.styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-2 min-h-[56px] rounded-lg text-center transition-all border relative overflow-hidden ${
                    selectedStyle?.id === style.id
                      ? 'border-rose-500 dark:border-rose-400 ring-2 ring-rose-500 dark:ring-rose-400'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className={`w-full h-6 mb-1.5 rounded ${style.previewColor}`}></div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{style.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 포스터 비율 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">5. 포스터 비율</h3>
          <div className="grid grid-cols-3 gap-2">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.value}
                onClick={() => setSelectedAspectRatio(ratio.value)}
                className={`p-2 min-h-[56px] rounded-lg text-center transition-all border ${
                  selectedAspectRatio === ratio.value
                    ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 dark:border-rose-400 ring-1 ring-rose-500 dark:ring-rose-400'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-rose-300 dark:hover:border-rose-500'
                }`}
              >
                <span className="block font-semibold text-slate-800 dark:text-slate-100 text-xs">{ratio.label}</span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">{ratio.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 포스터 컨셉/문구 */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">6. 포스터 컨셉/문구</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: 신메뉴 '프리미엄 버거' 출시! 50% 할인 이벤트"
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 min-h-[80px] text-sm transition-colors"
          />
        </div>

        {/* Spacer for fixed bottom bar */}
        <div className="h-16"></div>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-3 pb-safe z-30 transition-colors">
          <div className="max-w-5xl mx-auto flex justify-between items-center gap-3">
            {/* 선택 경로 */}
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
              {selectedCategory ? selectedCategory.label : '카테고리 선택'}
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
                disabled={!productImage || !selectedCategory || !prompt.trim() || isLoading}
                className={`px-4 py-2 min-h-[40px] rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                  !productImage || !selectedCategory || !prompt.trim() || isLoading
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-rose-600 dark:bg-rose-500 text-white hover:bg-rose-700 dark:hover:bg-rose-600 hover:shadow-rose-200 dark:hover:shadow-rose-900'
                }`}
              >
                {isLoading ? '생성 중...' : '포스터 4장 생성하기'}
                {!isLoading && <Sparkles className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <LoadingOverlay isVisible={isLoading} message="AI가 포스터를 디자인하고 있습니다..." />
      <LoadingOverlay isVisible={isUpscaling} message="업스케일링 중..." />
      <LoadingOverlay isVisible={isCompressing} message="이미지 압축 중..." />

      <ResultGrid
        images={generatedImages}
        onClose={() => setGeneratedImages([])}
        onUpscale={handleUpscale}
        onGenerateMore={handleGenerateMore}
        onSave={async (image: string) => {
          const response = await fetch('/api/images/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              images: [image],
              mode: 'POSTER',
              prompt,
              category: selectedCategory?.id,
              style: selectedStyle?.id,
              aspectRatio: selectedAspectRatio,
            }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '저장에 실패했습니다.');
          }
        }}
      />

      {/* Upscaled Image Modal */}
      {upscaledImage && (
        <div className="fixed inset-0 z-60 bg-black/80 dark:bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">업스케일 결과 (4K)</h2>
              <button
                onClick={() => setUpscaledImage(null)}
                className="p-2 min-w-[40px] min-h-[40px] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center"
                aria-label="닫기"
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
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = upscaledImage;
                    link.download = `upscaled-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="flex items-center gap-2 px-6 py-3 min-h-[48px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  4K 이미지 다운로드
                </button>
                <button
                  onClick={() => handleSaveToCloud(upscaledImage)}
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
                  className="px-6 py-3 min-h-[48px] bg-rose-600 dark:bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-700 dark:hover:bg-rose-600 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ImageGalleryModal
        isOpen={isProductGalleryOpen}
        onClose={() => setIsProductGalleryOpen(false)}
        onSelect={handleProductGallerySelect}
        title="제품 이미지 선택"
      />

      <ImageGalleryModal
        isOpen={isLogoGalleryOpen}
        onClose={() => setIsLogoGalleryOpen(false)}
        onSelect={handleLogoGallerySelect}
        title="로고 이미지 선택"
      />
    </>
  );
}
