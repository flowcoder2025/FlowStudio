'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Wand2, ImageIcon, X, FolderOpen, Cloud, Loader2, Check, Download, Eye } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreditSelectorDropdown, CreditType } from '@/components/CreditSelectorDropdown';
import { ImageCountSelector, getRequiredCredits } from '@/components/ImageCountSelector';
import { useToast } from '@/components/Toast';
import { AppMode, GenerationRequest } from '@/types';
import { ASPECT_RATIOS } from '@/constants';
import { generateImageVariations, upscaleImage } from '@/services/geminiService';

const ResultGrid = dynamic(() => import('@/components/ResultGrid').then(mod => mod.ResultGrid));
const ImageGalleryModal = dynamic(() => import('@/components/ImageGalleryModal').then(mod => mod.ImageGalleryModal));

export default function EditPage() {
  return (
    <AuthGuard>
      <EditPageContent />
    </AuthGuard>
  );
}

function EditPageContent() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('edit');

  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [galleryTarget, setGalleryTarget] = useState<'main' | 'ref' | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUpscaledSaving, setIsUpscaledSaving] = useState(false);
  const [isUpscaledSaved, setIsUpscaledSaved] = useState(false);
  const [creditType, setCreditType] = useState<CreditType>('auto');
  const [willHaveWatermark, setWillHaveWatermark] = useState(false);
  const [imageCount, setImageCount] = useState(1);

  const { showToast } = useToast();

  const suggestions = t.raw('suggestions') as string[];

  const handleCreditSelect = (type: CreditType, hasWatermark: boolean) => {
    setCreditType(type);
    setWillHaveWatermark(hasWatermark);
  };

  const handleGallerySelect = (imageUrl: string) => {
    if (galleryTarget === 'ref') {
      setRefImage(imageUrl);
    } else {
      setUploadedImage(imageUrl);
    }
    setGalleryTarget(null);
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !prompt) {
      alert(t('alertUploadAndPrompt'));
      return;
    }

    if (willHaveWatermark) {
      const confirmed = confirm(t('confirmWatermark'));
      if (!confirmed) return;
    }

    setIsLoading(true);
    try {
      const request: GenerationRequest = {
        mode: AppMode.EDIT,
        prompt,
        image: uploadedImage,
        refImage: refImage || undefined,
        aspectRatio: selectedAspectRatio
      };

      const images = await generateImageVariations(request, creditType, imageCount);
      if (images.length === 0) {
        alert(t('alertGenerationFailed'));
      } else {
        setGeneratedImages(images);
      }
    } catch (error) {
      console.error(error);
      alert(t('alertError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!uploadedImage || !prompt) return;

    if (willHaveWatermark) {
      const confirmed = confirm(t('confirmWatermark'));
      if (!confirmed) return;
    }

    setIsLoading(true);
    try {
      const request: GenerationRequest = {
        mode: AppMode.EDIT,
        prompt,
        image: uploadedImage,
        refImage: refImage || undefined,
        aspectRatio: selectedAspectRatio
      };

      const images = await generateImageVariations(request, creditType, imageCount);
      if (images.length === 0) {
        alert(t('alertGenerationFailed'));
      } else {
        setGeneratedImages(prev => [...prev, ...images]);
      }
    } catch (error) {
      console.error(error);
      alert(t('alertError'));
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
        alert(t('alertUpscaleFailed'));
      }
    } catch (error) {
      console.error(error);
      alert(t('alertUpscaleError'));
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
        if (isUpscaled) {
          setIsUpscaledSaved(true);
          showToast(t('toast4KSaved'), 'success');
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || t('toastSaveFailed');
        if (isUpscaled) {
          showToast(errorMessage, 'error');
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Cloud save error:', error);
      if (isUpscaled) {
        showToast(t('toastSaveError'), 'error');
      } else {
        throw error;
      }
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

  const getAspectRatioLabel = (ratio: { value: string; label: string; description: string }) => {
    try {
      return {
        label: t(`aspectRatios.${ratio.value}.label`),
        description: t(`aspectRatios.${ratio.value}.description`)
      };
    } catch {
      return { label: ratio.label, description: ratio.description };
    }
  };

  return (
    <>
      <Header currentMode={AppMode.EDIT} />

      <div className="max-w-5xl mx-auto px-3 lg:px-4 pt-4 lg:pt-6 pb-20">
        <div className="mb-4">
          <h2 className="text-lg lg:text-xl font-bold mb-1 flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Wand2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> {t('pageTitle')}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs">{t('pageDescription')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">{t('step1Title')}</h3>
          <FileDropzone
            value={uploadedImage}
            onChange={setUploadedImage}
            onCompressing={setIsCompressing}
            onError={(msg) => alert(msg)}
            colorTheme="emerald"
            icon={<ImageIcon className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
            placeholder={t('step1Placeholder')}
            imageAlt="To Edit"
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
            onClick={() => {
              setGalleryTarget('main');
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 min-h-[40px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-sm transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            {t('loadFromGallery')}
          </button>
        </div>

        {/* Step 2: 참조 이미지 (색상/스타일 전송용) */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-1 text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-500" />
            {t('refImageTitle') || '참조 이미지 (선택)'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            {t('refImageDescription') || '색상이나 스타일을 전송할 참조 이미지를 업로드하세요. 원본 이미지의 형태는 유지됩니다.'}
          </p>
          <FileDropzone
            value={refImage}
            onChange={setRefImage}
            onCompressing={setIsCompressing}
            onError={(msg) => alert(msg)}
            colorTheme="purple"
            icon={<Eye className="w-5 h-5 text-slate-400 dark:text-slate-500" />}
            placeholder={t('refImagePlaceholder') || '색상/스타일 참조 이미지'}
            imageAlt="Reference"
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
            onClick={() => {
              setGalleryTarget('ref');
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 min-h-[40px] bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-medium text-sm transition-colors border border-purple-200 dark:border-purple-800"
          >
            <FolderOpen className="w-4 h-4" />
            {t('loadRefFromGallery') || '갤러리에서 참조 이미지 선택'}
          </button>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">{t('step3Title') || t('step2Title')}</h3>
          <div className="grid grid-cols-3 gap-2">
            {ASPECT_RATIOS.map(ratio => {
              const localizedRatio = getAspectRatioLabel(ratio);
              return (
                <button
                  key={ratio.value}
                  onClick={() => setSelectedAspectRatio(ratio.value)}
                  className={`p-2 min-h-[56px] rounded-lg text-center transition-all border ${
                    selectedAspectRatio === ratio.value
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 dark:border-emerald-400 ring-1 ring-emerald-500 dark:ring-emerald-400'
                      : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-500'
                  }`}
                >
                  <span className="block font-semibold text-slate-800 dark:text-slate-100 text-xs">{localizedRatio.label}</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">{localizedRatio.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-4 transition-colors">
          <h3 className="font-bold text-sm lg:text-base mb-3 text-slate-800 dark:text-slate-100">{t('step4Title') || t('step3Title')}</h3>

          {/* 색상 변경 관련 예시 태그 (참조 이미지가 있을 때만 표시) */}
          {refImage && (
            <div className="mb-3">
              <p className="text-xs text-purple-600 dark:text-purple-400 mb-2 font-medium">
                {t('colorChangeExamples') || '🎨 색상/스타일 전송 예시:'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  t('colorTag1') || '참조 이미지의 색상으로 변경해줘',
                  t('colorTag2') || '색상만 참조 이미지처럼 바꿔줘',
                  t('colorTag3') || '형태는 유지하고 색감만 전송해줘',
                  t('colorTag4') || '원본 실루엣 유지, 컬러만 적용',
                ].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setPrompt(tag)}
                    className="px-2.5 py-1 min-h-[28px] bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors border border-purple-200 dark:border-purple-700"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-3 flex flex-wrap gap-1.5">
            {suggestions.map(suggestion => (
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
            placeholder={refImage
              ? (t('promptPlaceholderWithRef') || '예: 참조 이미지의 색상으로 변경해줘 (형태는 유지됩니다)')
              : t('promptPlaceholder')
            }
            className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 min-h-[80px] text-sm transition-colors"
          />
        </div>

        <div className="h-16"></div>

        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-3 pb-safe z-30 transition-colors">
          <div className="max-w-5xl mx-auto flex justify-between items-center gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
              {`${t('ratio')}: ${selectedAspectRatio}`}
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
                disabled={!uploadedImage || !prompt || isLoading}
                className={`px-4 py-2 min-h-[40px] rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                  !uploadedImage || !prompt || isLoading
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 hover:shadow-emerald-200 dark:hover:shadow-emerald-900'
                }`}
              >
                {isLoading ? t('generating') : `${imageCount}${t('generateImages')}`}
                {!isLoading && <Wand2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <LoadingOverlay isVisible={isLoading} message={t('generatingImages')} />
      <LoadingOverlay isVisible={isUpscaling} message={t('upscaling')} />
      <LoadingOverlay isVisible={isCompressing} message={t('compressing')} />
      <ResultGrid
        images={generatedImages}
        onClose={() => setGeneratedImages([])}
        onUpscale={handleUpscale}
        onSave={handleSaveToCloud}
        onGenerateMore={handleGenerateMore}
      />

      {upscaledImage && (
        <div className="fixed inset-0 z-60 bg-black/80 dark:bg-black/90 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto transition-colors">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('upscaleResult')}</h2>
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
                  {t('download4K')}
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
                  className="px-6 py-3 min-h-[48px] bg-emerald-600 dark:bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
                >
                  {t('close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ImageGalleryModal
        isOpen={galleryTarget !== null}
        onClose={() => setGalleryTarget(null)}
        onSelect={handleGallerySelect}
        title={galleryTarget === 'ref'
          ? (t('selectRefImage') || '참조 이미지 선택')
          : t('selectEditImage')
        }
      />
    </>
  );
}
