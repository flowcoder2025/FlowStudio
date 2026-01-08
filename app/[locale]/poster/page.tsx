'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Megaphone, Sparkles, X, FolderOpen, Upload, Cloud, Loader2, Check, Download } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { Header } from '@/components/Header';
import { ResultGrid } from '@/components/ResultGrid';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ImageGalleryModal } from '@/components/ImageGalleryModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreditSelectorDropdown, CreditType } from '@/components/CreditSelectorDropdown';
import { ImageCountSelector, getRequiredCredits } from '@/components/ImageCountSelector';
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
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('poster');
  const tCommon = useTranslations('common');

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
  const [imageCount, setImageCount] = useState(1);

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
      alert(t('alertSelectCategory'));
      return;
    }

    if (!productImage) {
      alert(t('alertUploadProduct'));
      return;
    }

    if (!prompt.trim()) {
      alert(t('alertEnterConcept'));
      return;
    }

    if (willHaveWatermark) {
      const confirmed = confirm(t('confirmWatermark'));
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

      const images = await generateImageVariations(request, creditType, imageCount);
      setGeneratedImages(images);
    } catch (error) {
      console.error('Generation error:', error);
      alert(error instanceof Error ? error.message : t('alertGenerationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!selectedCategory || !productImage || !prompt.trim()) return;

    if (willHaveWatermark) {
      const confirmed = confirm(t('confirmWatermark'));
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

      const images = await generateImageVariations(request, creditType, imageCount);
      setGeneratedImages(prev => [...prev, ...images]);
    } catch (error) {
      console.error('Generation error:', error);
      alert(error instanceof Error ? error.message : t('alertGenerationFailed'));
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
      alert(error instanceof Error ? error.message : t('alertUpscaleFailed'));
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
        alert(data.message || t('alertSaved'));
      } else {
        const errorData = await response.json();
        alert(errorData.error || t('alertSaveFailed'));
      }
    } catch (error) {
      console.error('Cloud save error:', error);
      alert(t('alertSaveError'));
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
            {t('pageTitle')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs">{t('pageDescription')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">{t('step1Title')}</h3>
          <FileDropzone
            value={productImage}
            onChange={setProductImage}
            onCompressing={setIsCompressing}
            onError={(msg) => alert(msg)}
            colorTheme="rose"
            icon={<Upload className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
            placeholder={t('step1Placeholder')}
            subPlaceholder={t('step1SubPlaceholder')}
            imageAlt="Product"
            compact
          />

          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            <span className="flex-shrink-0 mx-3 text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2">
              {t('or')}
            </span>
            <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
          </div>

          <button
            onClick={() => setIsProductGalleryOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 min-h-[40px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-sm transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            {t('loadFromGallery')}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">{t('step2Title')}</h3>
          <FileDropzone
            value={logoImage}
            onChange={setLogoImage}
            onCompressing={setIsCompressing}
            onError={(msg) => alert(msg)}
            colorTheme="amber"
            icon={<Upload className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
            placeholder={t('step2Placeholder')}
            subPlaceholder={t('step2SubPlaceholder')}
            imageAlt="Logo"
            imageMaxHeight="h-20"
            compact
          />

          <div className="relative flex items-center my-3">
            <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            <span className="flex-shrink-0 mx-3 text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2">
              {t('or')}
            </span>
            <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
          </div>

          <button
            onClick={() => setIsLogoGalleryOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 min-h-[36px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-xs transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            {t('loadFromGallery')}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">{t('step3Title')}</h3>
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

        {selectedCategory && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 animate-fadeIn transition-colors">
            <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">{t('step4Title')}</h3>
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

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">{t('step5Title')}</h3>
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

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">{t('step6Title')}</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('promptPlaceholder')}
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 dark:focus:ring-rose-400 min-h-[80px] text-sm transition-colors"
          />
        </div>

        <div className="h-16"></div>

        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-3 pb-safe z-30 transition-colors">
          <div className="max-w-5xl mx-auto flex justify-between items-center gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
              {selectedCategory ? selectedCategory.label : t('step3Title')}
              {selectedStyle ? ` > ${selectedStyle.label}` : ''}
              {` > ${selectedAspectRatio}`}
            </p>
            <div className="flex items-center gap-2 ml-auto">
              <ImageCountSelector
                value={imageCount}
                onChange={setImageCount}
                disabled={isLoading}
              />
              <CreditSelectorDropdown
                requiredCredits={getRequiredCredits(imageCount)}
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
                {isLoading ? t('generating') : `${imageCount}${t('generatePosters')}`}
                {!isLoading && <Sparkles className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <LoadingOverlay isVisible={isLoading} message={t('loadingMessage')} />
      <LoadingOverlay isVisible={isUpscaling} message={t('upscalingMessage')} />
      <LoadingOverlay isVisible={isCompressing} message={t('compressingMessage')} />

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
            throw new Error(errorData.error || t('alertSaveFailed'));
          }
        }}
      />

      {upscaledImage && (
        <div className="fixed inset-0 z-60 bg-black/80 dark:bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('upscaleResult')}</h2>
              <button
                onClick={() => setUpscaledImage(null)}
                className="p-2 min-w-[40px] min-h-[40px] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center"
                aria-label={tCommon('close')}
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
                  {t('download4K')}
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
                      {t('saving')}
                    </>
                  ) : isUpscaledSaved ? (
                    <>
                      <Check className="w-5 h-5" />
                      {t('saved')}
                    </>
                  ) : (
                    <>
                      <Cloud className="w-5 h-5" />
                      {t('saveToStorage')}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setUpscaledImage(null)}
                  className="px-6 py-3 min-h-[48px] bg-rose-600 dark:bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-700 dark:hover:bg-rose-600 transition-colors"
                >
                  {tCommon('close')}
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
        title={t('selectProductImage')}
      />

      <ImageGalleryModal
        isOpen={isLogoGalleryOpen}
        onClose={() => setIsLogoGalleryOpen(false)}
        onSelect={handleLogoGallerySelect}
        title={t('selectLogoImage')}
      />
    </>
  );
}
