'use client';

import React, { useState, useRef } from 'react';
import { Camera, Sparkles, X, FolderOpen } from 'lucide-react';
import { Header } from '@/components/Header';
import { ResultGrid } from '@/components/ResultGrid';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ImageGalleryModal } from '@/components/ImageGalleryModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppMode, Category, StyleOption, GenerationRequest } from '@/types';
import { CATEGORIES, ASPECT_RATIOS } from '@/constants';
import { generateImageVariations, upscaleImage } from '@/services/geminiService';

export default function CreatePage() {
  return (
    <AuthGuard>
      <CreatePageContent />
    </AuthGuard>
  );
}

function CreatePageContent() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [upscaledImage, setUpscaledImage] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGallerySelect = (imageUrl: string) => {
    setUploadedImage(imageUrl);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      alert('이미지의 종류를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const request: GenerationRequest = {
        mode: AppMode.CREATE,
        prompt,
        image: uploadedImage || undefined,
        category: selectedCategory,
        style: selectedStyle || undefined,
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

  const handleUpscale = async (imageUrl: string) => {
    if (!(await validateApiKey())) return;

    setIsUpscaling(true);
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

  const handleSaveToCloud = async (image: string) => {
    try {
      const response = await fetch('/api/images/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [image],
          mode: 'CREATE',
          prompt,
          category: selectedCategory?.id,
          style: selectedStyle?.id,
          aspectRatio: selectedAspectRatio,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || '클라우드에 저장되었습니다.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Cloud save error:', error);
      alert('저장 중 오류가 발생했습니다.');
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
      // Fallback: 새 탭에서 열기
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <>
      <Header currentMode={AppMode.CREATE} />

      <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Sparkles className="text-indigo-600" /> 이미지 생성 마법사
        </h2>

        {/* Step 1: Upload (Optional) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <h3 className="font-bold text-lg mb-4 text-slate-800">1. 참고할 제품 사진이 있나요? (선택)</h3>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${uploadedImage ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            {uploadedImage ? (
              <div className="relative h-48 w-full flex items-center justify-center">
                <img src={uploadedImage} alt="Uploaded" className="h-full object-contain rounded-lg shadow-sm" />
                <button
                  onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                  className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                >
                  <span className="sr-only">Remove</span>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Camera className="w-10 h-10 text-slate-400" />
                <p className="text-slate-600 font-medium">제품 사진 업로드 또는 촬영</p>
                <p className="text-xs text-slate-400">사진이 없으면 텍스트로만 생성됩니다.</p>
              </div>
            )}
          </div>
          {/* Gallery Button */}
          <button
            onClick={() => setIsGalleryOpen(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
          >
            <FolderOpen className="w-5 h-5" />
            내 이미지에서 불러오기
          </button>
        </div>

        {/* Step 2: Category Selection */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <h3 className="font-bold text-lg mb-4 text-slate-800">2. 어떤 용도로 만드시나요?</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat); setSelectedStyle(null); }}
                className={`p-4 rounded-xl text-left transition-all border ${
                  selectedCategory?.id === cat.id
                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <span className="block font-semibold text-slate-800 mb-1">{cat.label}</span>
                <span className="block text-xs text-slate-500">{cat.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Style Selection (Conditional) */}
        {selectedCategory && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 animate-fadeIn">
            <h3 className="font-bold text-lg mb-4 text-slate-800">3. 어떤 분위기를 원하세요?</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {selectedCategory.styles.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`p-3 rounded-xl text-center transition-all border relative overflow-hidden ${
                    selectedStyle?.id === style.id
                      ? 'border-indigo-500 ring-2 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-full h-12 mb-2 rounded-lg ${style.previewColor}`}></div>
                  <span className="text-sm font-medium text-slate-700">{style.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Aspect Ratio Selection */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <h3 className="font-bold text-lg mb-4 text-slate-800">4. 이미지 비율을 선택해주세요</h3>
          <div className="grid grid-cols-3 gap-3">
            {ASPECT_RATIOS.map(ratio => (
              <button
                key={ratio.id}
                onClick={() => setSelectedAspectRatio(ratio.id)}
                className={`p-4 rounded-xl text-center transition-all border ${
                  selectedAspectRatio === ratio.id
                    ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <span className="block font-semibold text-slate-800 mb-1">{ratio.label}</span>
                <span className="block text-xs text-slate-500">{ratio.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 5: Text Prompt */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <h3 className="font-bold text-lg mb-4 text-slate-800">5. 추가로 원하시는 내용을 적어주세요</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="예: 나무 테이블 위에 커피가 놓여있고, 아침 햇살이 들어오는 느낌으로 만들어줘."
            className="w-full p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
          />
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-30">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <p className="text-sm text-slate-500 hidden md:block">
              {selectedCategory ? `${selectedCategory.label}` : '종류 선택'}
              {selectedStyle ? ` > ${selectedStyle.label}` : ''}
            </p>
            <button
              onClick={handleGenerate}
              disabled={!selectedCategory || isLoading}
              className={`w-full md:w-auto px-8 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
                !selectedCategory || isLoading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200'
              }`}
            >
              {isLoading ? '생성 중...' : '이미지 4장 생성하기'}
              {!isLoading && <Sparkles className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <LoadingOverlay isVisible={isLoading} message="이미지 생성 중..." />
      <LoadingOverlay isVisible={isUpscaling} message="업스케일링 중..." />
      <ResultGrid
        images={generatedImages}
        onClose={() => setGeneratedImages([])}
        onUpscale={handleUpscale}
        onSave={handleSaveToCloud}
      />

      {/* Upscaled Image Modal */}
      {upscaledImage && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800">업스케일 결과 (2K)</h2>
              <button
                onClick={() => setUpscaledImage(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={upscaledImage}
                alt="Upscaled"
                className="w-full rounded-lg shadow-lg"
              />
              <div className="mt-4 flex gap-3 justify-center">
                <button
                  onClick={() => handleDownloadImage(upscaledImage, `upscaled-${Date.now()}.png`)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                >
                  2K 이미지 다운로드
                </button>
                <button
                  onClick={() => setUpscaledImage(null)}
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
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
        title="참고 이미지 선택"
      />
    </>
  );
}
