'use client';

import React, { useState, useRef } from 'react';
import { Wand2, ImageIcon, Eye, X, RefreshCw } from 'lucide-react';
import { Header } from '@/components/Header';
import { ResultGrid } from '@/components/ResultGrid';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { AppMode, GenerationRequest } from '@/types';
import { generateImageVariations, generatePreview } from '@/services/geminiService';

export default function EditPage() {
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setPreviewImage(null);
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

  const handlePreview = async () => {
    if (!(await validateApiKey())) return;

    if (!uploadedImage || !prompt) {
      alert('이미지를 업로드하고 편집 내용을 입력해주세요.');
      return;
    }

    setIsPreviewLoading(true);
    try {
      const request: GenerationRequest = {
        mode: AppMode.EDIT,
        prompt,
        image: uploadedImage,
        aspectRatio: '1:1'
      };

      const result = await generatePreview(request);
      if (result) {
        setPreviewImage(result);
        // Usage is now tracked server-side in /api/generate
      } else {
        alert('미리보기 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!(await validateApiKey())) return;

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
        aspectRatio: '1:1'
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

  return (
    <>
      <Header currentMode={AppMode.EDIT} />

      <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Wand2 className="text-emerald-600" /> AI 이미지 편집
        </h2>

        {/* Step 1: Mandatory Upload */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <h3 className="font-bold text-lg mb-4 text-slate-800">1. 편집할 사진을 올려주세요</h3>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${uploadedImage ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 hover:bg-slate-50'}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            {uploadedImage ? (
              <div className="relative">
                <img src={uploadedImage} alt="To Edit" className="max-h-80 w-auto mx-auto rounded-lg shadow-sm" />
                <button
                  onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                >
                  <span className="text-xs font-bold">변경</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-8">
                <ImageIcon className="w-12 h-12 text-slate-400" />
                <p className="text-slate-600 font-medium text-lg">사진 업로드하기</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Instruction & Preview */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <h3 className="font-bold text-lg mb-4 text-slate-800">2. 어떻게 바꿔드릴까요?</h3>
          <div className="mb-4 flex flex-wrap gap-2">
            {['레트로 필터 씌워줘', '배경에 있는 사람 지워줘', '배경을 사무실로 바꿔줘', '좀 더 화사하게 만들어줘'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm rounded-full hover:bg-slate-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <div className="relative mb-4">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: 배경을 깔끔한 흰색으로 바꿔줘, 텍스트를 제거해줘."
              className="w-full p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[120px]"
            />
          </div>

          {/* Preview Area */}
          {previewImage && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" /> 미리보기 결과
                </h4>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-square w-full max-w-sm mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <p className="text-center text-xs text-slate-500 mt-2">
                미리보기는 1장만 빠르게 생성됩니다. 마음에 들면 하단 버튼으로 고화질 4장을 생성하세요.
              </p>
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-30">
          <div className="max-w-3xl mx-auto flex gap-3 justify-end">
            {/* Preview Button */}
            <button
              onClick={handlePreview}
              disabled={!uploadedImage || !prompt || isPreviewLoading || isLoading}
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 border-2 transition-all ${
                isPreviewLoading
                  ? 'bg-slate-100 border-slate-200 text-slate-400'
                  : 'bg-white border-emerald-600 text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              {isPreviewLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
              미리보기
            </button>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || !prompt || isLoading || isPreviewLoading}
              className={`flex-1 md:flex-none px-8 py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg transition-all ${
                !uploadedImage || !prompt || isLoading || isPreviewLoading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-200'
              }`}
            >
              {isLoading ? '생성 중...' : '이미지 4장 생성'}
              {!isLoading && <Wand2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <LoadingOverlay isVisible={isLoading || isPreviewLoading} />
      <ResultGrid
        images={generatedImages}
        onClose={() => setGeneratedImages([])}
      />
    </>
  );
}
