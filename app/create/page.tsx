'use client';

import React, { useState, useRef } from 'react';
import { Camera, Sparkles, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { ResultGrid } from '@/components/ResultGrid';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { AppMode, Category, StyleOption, GenerationRequest } from '@/types';
import { CATEGORIES } from '@/constants';
import { generateImageVariations } from '@/services/geminiService';
import { recordUsage } from '@/services/usageService';

export default function CreatePage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const validateApiKey = (): boolean => {
    if (typeof window === 'undefined') return false;

    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      alert("이미지 생성을 위해 프로필 페이지에서 API 키를 설정해주세요.");
      window.location.href = '/profile';
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!validateApiKey()) return;

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
        aspectRatio: '1:1'
      };

      const images = await generateImageVariations(request);
      if (images.length === 0) {
        alert('이미지 생성에 실패했습니다. 다시 시도해주세요.');
      } else {
        setGeneratedImages(images);
        // Record Usage (4 images)
        recordUsage(4);
      }
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header currentMode={AppMode.CREATE} onNavigate={(mode) => {
        if (mode === AppMode.HOME) window.location.href = '/';
        else if (mode === AppMode.CREATE) window.location.href = '/create';
        else if (mode === AppMode.EDIT) window.location.href = '/edit';
        else if (mode === AppMode.DETAIL_PAGE) window.location.href = '/detail-page';
        else if (mode === AppMode.DETAIL_EDIT) window.location.href = '/detail-edit';
        else if (mode === AppMode.PROFILE) window.location.href = '/profile';
      }} />

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

        {/* Step 4: Text Prompt */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <h3 className="font-bold text-lg mb-4 text-slate-800">4. 추가로 원하시는 내용을 적어주세요</h3>
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

      <LoadingOverlay isVisible={isLoading} />
      <ResultGrid
        images={generatedImages}
        onClose={() => setGeneratedImages([])}
      />
    </>
  );
}
