'use client';

import React, { useState, useRef } from 'react';
import { Layout, Camera, Eye, X, Plus, Trash2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { AppMode, Category, StyleOption, GenerationRequest } from '@/types';
import { DETAIL_PAGE_CATEGORIES } from '@/constants';
import { generatePreview } from '@/services/geminiService';
import { recordUsage } from '@/services/usageService';

export default function DetailPagePage() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [detailPageSegments, setDetailPageSegments] = useState<string[]>([]);
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

    if (!uploadedImage) {
      alert('제품 사진을 업로드해주세요.');
      return;
    }

    if (!selectedCategory) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const request: GenerationRequest = {
        mode: AppMode.DETAIL_PAGE,
        prompt: prompt || (detailPageSegments.length === 0 ? '제품 인트로 섹션' : '제품 설명 섹션'),
        image: uploadedImage,
        category: selectedCategory,
        style: selectedStyle || undefined,
        aspectRatio: '9:16'
      };

      const result = await generatePreview(request);
      if (result) {
        setDetailPageSegments([...detailPageSegments, result]);
        setPrompt(''); // Clear prompt for next section
        recordUsage(1);
      } else {
        alert('섹션 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSegment = (index: number) => {
    if (confirm('이 섹션을 삭제하시겠습니까?')) {
      setDetailPageSegments(detailPageSegments.filter((_, i) => i !== index));
    }
  };

  return (
    <>
      <Header currentMode={AppMode.DETAIL_PAGE} onNavigate={(mode) => {
        if (mode === AppMode.HOME) window.location.href = '/';
        else if (mode === AppMode.CREATE) window.location.href = '/create';
        else if (mode === AppMode.EDIT) window.location.href = '/edit';
        else if (mode === AppMode.DETAIL_PAGE) window.location.href = '/detail-page';
        else if (mode === AppMode.DETAIL_EDIT) window.location.href = '/detail-edit';
        else if (mode === AppMode.PROFILE) window.location.href = '/profile';
      }} />

      <div className="max-w-6xl mx-auto px-4 py-8 pb-32 flex flex-col md:flex-row gap-8">
        {/* Left Panel: Controls */}
        <div className="md:w-1/2 flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Layout className="text-blue-600" /> 상세페이지 빌더
            </h2>
            <p className="text-slate-600 text-sm">
              원하는 섹션을 순서대로 생성하여 쌓아올리세요. (가로 1080px 기준)
            </p>
          </div>

          {/* Global Product Upload */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-base mb-3 text-slate-800">1. 메인 제품 사진 (필수)</h3>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${uploadedImage ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:bg-slate-50'}`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              {uploadedImage ? (
                <div className="flex items-center gap-4">
                  <img src={uploadedImage} alt="Main Product" className="w-16 h-16 object-cover rounded-md" />
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-slate-800">제품 사진 등록됨</p>
                    <p className="text-xs text-slate-500">모든 섹션 생성시 참조됩니다.</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Camera className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-600">제품 사진 업로드</span>
                </div>
              )}
            </div>
          </div>

          {/* Category & Style */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-base mb-3 text-slate-800">2. 컨셉 설정</h3>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 mb-2 block">카테고리</label>
              <div className="grid grid-cols-2 gap-2">
                {DETAIL_PAGE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat); setSelectedStyle(null); }}
                    className={`p-3 rounded-lg text-left text-sm transition-all border ${
                      selectedCategory?.id === cat.id
                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedCategory && (
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-2 block">스타일</label>
                <div className="grid grid-cols-2 gap-2">
                  {selectedCategory.styles.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style)}
                      className={`p-2 rounded-lg text-center text-xs transition-all border ${
                        selectedStyle?.id === style.id
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section Generation */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex-1">
            <h3 className="font-bold text-base mb-3 text-slate-800">
              {detailPageSegments.length === 0 ? '3. 첫번째 섹션(인트로) 만들기' : `3. ${detailPageSegments.length + 1}번째 섹션 추가하기`}
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={detailPageSegments.length === 0
                ? "예: 제품 이름이 크게 들어간 임팩트 있는 인트로. '순수 비타민 세럼' 텍스트 포함."
                : "예: 핵심 성분을 설명하는 섹션. 비타민 C의 효능을 강조하는 그래프와 아이콘."}
              className="w-full p-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] mb-4 text-sm"
            />

            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || !selectedCategory || isLoading}
              className={`w-full py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all ${
                !uploadedImage || !selectedCategory || isLoading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200'
              }`}
            >
              {isLoading ? '생성 중...' : (detailPageSegments.length === 0 ? '인트로 생성하기' : '다음 섹션 생성하기')}
              {!isLoading && <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Right Panel: Canvas */}
        <div className="md:w-1/2 bg-slate-200 rounded-2xl p-6 overflow-hidden flex flex-col min-h-[600px] border border-slate-300">
          <h3 className="text-center text-slate-600 font-bold mb-4 flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" /> 미리보기 (1080px 기준)
          </h3>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-300/50 rounded-lg p-4 flex flex-col items-center gap-0.5">
            {detailPageSegments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
                <div className="w-20 h-32 border-2 border-dashed border-slate-400 rounded-md"></div>
                <p className="text-sm text-center">생성된 상세페이지가<br />여기에 순서대로 쌓입니다.</p>
              </div>
            ) : (
              detailPageSegments.map((segment, idx) => (
                <div key={idx} className="relative group w-full max-w-[360px] shadow-lg">
                  <img src={segment} alt={`Section ${idx}`} className="w-full h-auto block" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => removeSegment(idx)}
                      className="p-1.5 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700"
                      title="섹션 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">#{idx + 1}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {detailPageSegments.length > 0 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => alert("브라우저의 '이미지 저장' 기능을 이용해 개별 섹션을 저장한 후 포토샵 등에서 연결해주세요. (전체 병합 다운로드 기능 준비중)")}
                className="text-xs text-slate-500 underline hover:text-slate-700"
              >
                전체 이미지 다운로드 가이드
              </button>
            </div>
          )}
        </div>
      </div>

      <LoadingOverlay isVisible={isLoading} message="상세페이지 섹션을 생성하고 있습니다..." />
    </>
  );
}
