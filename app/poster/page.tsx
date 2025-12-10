'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Megaphone, Sparkles, X, FolderOpen, Upload, ImageIcon } from 'lucide-react';
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

  const handleUpscale = async (imageUrl: string) => {
    setIsUpscaling(true);
    setUpscaledImage(null);

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

  return (
    <>
      <Header currentMode={AppMode.POSTER} />

      <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Megaphone className="text-rose-600 dark:text-rose-400" size={28} />
            홍보 포스터 제작
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            제품 사진으로 시선을 사로잡는 광고 포스터를 만듭니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Inputs */}
          <div className="space-y-6">
            {/* 제품 사진 업로드 (필수) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                제품 사진 (필수)
              </h3>

              {!productImage ? (
                <div className="space-y-3">
                  <div
                    onClick={() => productFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 transition-all"
                  >
                    <Upload className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-300 font-medium">클릭하여 사진 업로드</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">PNG, JPG (최대 10MB)</p>
                  </div>

                  <button
                    onClick={() => setIsProductGalleryOpen(true)}
                    className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <FolderOpen className="w-4 h-4" />
                    내 이미지에서 불러오기
                  </button>

                  <input
                    type="file"
                    ref={productFileInputRef}
                    onChange={(e) => handleImageUpload(e, setProductImage)}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative">
                  <Image
                    src={productImage}
                    alt="Product"
                    width={400}
                    height={400}
                    className="w-full h-auto rounded-xl"
                  />
                  <button
                    onClick={() => setProductImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* 로고 이미지 업로드 (선택) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                로고 이미지 (선택)
              </h3>

              {!logoImage ? (
                <div className="space-y-3">
                  <div
                    onClick={() => logoFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-900/20 transition-all"
                  >
                    <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">로고 업로드 (선택)</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">PNG 권장 (투명 배경)</p>
                  </div>

                  <button
                    onClick={() => setIsLogoGalleryOpen(true)}
                    className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <FolderOpen className="w-4 h-4" />
                    내 이미지에서 불러오기
                  </button>

                  <input
                    type="file"
                    ref={logoFileInputRef}
                    onChange={(e) => handleImageUpload(e, setLogoImage)}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative">
                  <Image
                    src={logoImage}
                    alt="Logo"
                    width={200}
                    height={200}
                    className="w-full h-auto rounded-xl bg-slate-50 p-4"
                  />
                  <button
                    onClick={() => setLogoImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* 포스터 컨셉/문구 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">포스터 컨셉/문구</h3>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="예: 신메뉴 '프리미엄 버거' 출시! 50% 할인 이벤트"
                className="w-full h-32 px-4 py-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 focus:border-transparent resize-none transition-colors"
              />
            </div>

            {/* 포스터 비율 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">포스터 비율</h3>
              <div className="grid grid-cols-3 gap-3">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setSelectedAspectRatio(ratio.value)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedAspectRatio === ratio.value
                        ? 'border-rose-500 dark:border-rose-400 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-600 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-sm font-bold">{ratio.label}</div>
                    <div className="text-xs opacity-60 mt-1">{ratio.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Categories & Styles */}
          <div className="space-y-6">
            {/* 카테고리 선택 */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">포스터 카테고리</h3>
              <div className="grid grid-cols-2 gap-3">
                {POSTER_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedStyle(null);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedCategory?.id === cat.id
                        ? 'border-rose-500 dark:border-rose-400 bg-rose-50 dark:bg-rose-900/30'
                        : 'border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-600'
                    }`}
                  >
                    <div className="font-bold text-slate-900 dark:text-slate-100 mb-1">{cat.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{cat.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 스타일 선택 */}
            {selectedCategory && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">디자인 스타일</h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedCategory.styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedStyle?.id === style.id
                          ? 'border-rose-500 dark:border-rose-400 ring-2 ring-rose-200 dark:ring-rose-800'
                          : 'border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-600'
                      } ${style.previewColor}`}
                    >
                      <div className="font-bold text-sm">{style.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 생성 버튼 */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || !productImage || !selectedCategory || !prompt.trim()}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  포스터 생성 중...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  포스터 생성하기 (4장)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {generatedImages.length > 0 && (
          <div className="mt-8">
            <ResultGrid
              images={generatedImages}
              onUpscale={handleUpscale}
              isUpscaling={isUpscaling}
              upscaledImage={upscaledImage}
            />
          </div>
        )}
      </div>

      {isLoading && <LoadingOverlay message="AI가 포스터를 디자인하고 있습니다..." />}
      {isCompressing && <LoadingOverlay message="이미지를 최적화하고 있습니다..." />}

      <ImageGalleryModal
        isOpen={isProductGalleryOpen}
        onClose={() => setIsProductGalleryOpen(false)}
        onSelect={handleProductGallerySelect}
      />

      <ImageGalleryModal
        isOpen={isLogoGalleryOpen}
        onClose={() => setIsLogoGalleryOpen(false)}
        onSelect={handleLogoGallerySelect}
      />
    </>
  );
}
