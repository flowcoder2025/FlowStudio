'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Megaphone, Sparkles, X, FolderOpen, Upload, Cloud, Loader2, Check, Download } from 'lucide-react';
import { Header } from '@/components/Header';
import { ResultGrid } from '@/components/ResultGrid';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ImageGalleryModal } from '@/components/ImageGalleryModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppMode, Category, StyleOption, GenerationRequest } from '@/types';
import { POSTER_CATEGORIES, ASPECT_RATIOS } from '@/constants';
import { generateImageVariations, upscaleImage } from '@/services/geminiService';
import { compressImageWithStats, isFileTooLarge } from '@/lib/utils/imageCompression';

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

  const productFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const handleProductGallerySelect = (imageUrl: string) => {
    setProductImage(imageUrl);
  };

  const handleLogoGallerySelect = (imageUrl: string) => {
    setLogoImage(imageUrl);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: (img: string) => void
  ) => {
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
        setImage(result.compressed);
        setIsCompressing(false);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('이미지 압축 오류:', error);
      setIsCompressing(false);
      alert('이미지 처리 중 오류가 발생했습니다. 다른 이미지를 시도해주세요.');
    }
  };

  const validateApiKey = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/profile/api-key');
      if (response.ok) {
        const data = await response.json();
        if (data.exists) {
          return true;
        }
      }
      alert("이미지 생성을 위해 프로필 페이지에서 API 키를 설정해주세요.");
      window.location.href = '/profile';
      return false;
    } catch (error) {
      console.error('API key validation error:', error);
      alert("API 키 확인 중 오류가 발생했습니다.");
      return false;
    }
  };

  const handleGenerate = async () => {
    if (!(await validateApiKey())) return;

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

      const images = await generateImageVariations(request);
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

      const images = await generateImageVariations(request);
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
        alert(data.message || '클라우드에 저장되었습니다.');
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

      <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Megaphone className="text-rose-600 dark:text-rose-400" />
          홍보 포스터 제작
        </h2>
        {/* 제품 사진 업로드 (필수) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">1. 제품 사진 업로드 (필수)</h3>
          <div
            onClick={() => productFileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${productImage ? 'border-rose-500 dark:border-rose-400 bg-rose-50 dark:bg-rose-900/20' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <input
              type="file"
              ref={productFileInputRef}
              onChange={(e) => handleImageUpload(e, setProductImage)}
              accept="image/*"
              className="hidden"
            />
            {productImage ? (
              <div className="relative h-48 w-full flex items-center justify-center">
                <Image
                  src={productImage}
                  alt="Product"
                  fill
                  className="object-contain rounded-lg shadow-sm"
                  unoptimized={productImage.startsWith('data:')}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setProductImage(null); }}
                  className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                >
                  <span className="sr-only">Remove</span>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                <p className="text-slate-600 dark:text-slate-300 font-medium">제품 사진 업로드</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">PNG, JPG (최대 10MB)</p>
              </div>
            )}
          </div>
          {/* Gallery Button */}
          <button
            onClick={() => setIsProductGalleryOpen(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
          >
            <FolderOpen className="w-5 h-5" />
            내 이미지에서 불러오기
          </button>
        </div>

        {/* 로고 이미지 업로드 (선택) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">2. 로고 이미지 (선택)</h3>
          <div
            onClick={() => logoFileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${logoImage ? 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <input
              type="file"
              ref={logoFileInputRef}
              onChange={(e) => handleImageUpload(e, setLogoImage)}
              accept="image/*"
              className="hidden"
            />
            {logoImage ? (
              <div className="relative h-32 w-full flex items-center justify-center">
                <Image
                  src={logoImage}
                  alt="Logo"
                  fill
                  className="object-contain rounded-lg"
                  unoptimized={logoImage.startsWith('data:')}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); setLogoImage(null); }}
                  className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">로고 업로드 (선택)</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">PNG 권장 (투명 배경)</p>
              </div>
            )}
          </div>
          {/* Gallery Button */}
          <button
            onClick={() => setIsLogoGalleryOpen(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 px-4 min-h-[44px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-sm transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            내 이미지에서 불러오기
          </button>
        </div>

        {/* 카테고리 선택 */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">3. 포스터 카테고리</h3>
          <div className="grid grid-cols-2 gap-3">
            {POSTER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedStyle(null);
                }}
                className={`p-4 min-h-[88px] rounded-xl text-left transition-all border ${
                  selectedCategory?.id === cat.id
                    ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 dark:border-rose-400 ring-1 ring-rose-500 dark:ring-rose-400'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-rose-300 dark:hover:border-rose-500'
                }`}
              >
                <span className="block font-semibold text-slate-800 dark:text-slate-100 mb-1">{cat.label}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{cat.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 스타일 선택 */}
        {selectedCategory && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 animate-fadeIn transition-colors">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">4. 디자인 스타일</h3>
            <div className="grid grid-cols-2 gap-3">
              {selectedCategory.styles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-3 min-h-[72px] rounded-xl text-center transition-all border relative overflow-hidden ${
                    selectedStyle?.id === style.id
                      ? 'border-rose-500 dark:border-rose-400 ring-2 ring-rose-500 dark:ring-rose-400'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className={`w-full h-8 mb-2 rounded-lg ${style.previewColor}`}></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{style.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 포스터 비율 */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">5. 포스터 비율</h3>
          <div className="grid grid-cols-3 gap-3">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.value}
                onClick={() => setSelectedAspectRatio(ratio.value)}
                className={`p-4 min-h-[88px] rounded-xl text-center transition-all border ${
                  selectedAspectRatio === ratio.value
                    ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 dark:border-rose-400 ring-1 ring-rose-500 dark:ring-rose-400'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-rose-300 dark:hover:border-rose-500'
                }`}
              >
                <span className="block font-semibold text-slate-800 dark:text-slate-100 mb-1">{ratio.label}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{ratio.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 포스터 컨셉/문구 */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-colors">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-slate-100">6. 포스터 컨셉/문구</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: 신메뉴 '프리미엄 버거' 출시! 50% 할인 이벤트"
            className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 min-h-[100px] transition-colors"
          />
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 pb-safe z-30 transition-colors">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <p className="text-sm text-slate-500 dark:text-slate-400 hidden md:block">
              {selectedCategory ? `${selectedCategory.label}` : '카테고리 선택'}
              {selectedStyle ? ` > ${selectedStyle.label}` : ''}
            </p>
            <button
              onClick={handleGenerate}
              disabled={!productImage || !selectedCategory || !prompt.trim() || isLoading}
              className={`w-full md:w-auto px-8 py-3.5 min-h-[52px] rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
                !productImage || !selectedCategory || !prompt.trim() || isLoading
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-rose-600 dark:bg-rose-500 text-white hover:bg-rose-700 dark:hover:bg-rose-600 hover:shadow-rose-200 dark:hover:shadow-rose-900'
              }`}
            >
              {isLoading ? '생성 중...' : '포스터 2장 생성하기'}
              {!isLoading && <Sparkles className="w-5 h-5" />}
            </button>
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
                      클라우드 저장
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
