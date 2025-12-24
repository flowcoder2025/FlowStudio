'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Download, X, Check, Maximize2, ZoomIn, Cloud, Loader2, CloudOff } from 'lucide-react';
import { useToast } from './Toast';

interface ResultGridProps {
  images: string[];
  onClose: () => void;
  onSelect?: (image: string) => void | Promise<void>;
  onUpscale?: (image: string) => void;
  onSave?: (image: string) => Promise<void>;
  onGenerateMore?: () => Promise<void>;
}

export const ResultGrid: React.FC<ResultGridProps> = ({ images, onClose, onSelect, onUpscale, onSave, onGenerateMore }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [savingIndexes, setSavingIndexes] = useState<Set<number>>(new Set());
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [selectingIndex, setSelectingIndex] = useState<number | null>(null);
  const [saveErrors, setSaveErrors] = useState<Set<number>>(new Set());

  const { showToast } = useToast();

  // Stable reference for showToast to avoid useEffect dependency issues
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // Track previous images to detect when completely new images are loaded
  const prevImagesRef = useRef<string[]>([]);

  // Track if we've already shown the "all saved" toast for current image set
  const allSavedToastShownRef = useRef(false);

  // Reset savedIndexes when images array is replaced (not just appended)
  useEffect(() => {
    const prevImages = prevImagesRef.current;

    // Check if this is a completely new set of images (not just additions)
    // If the first image changed, it's a new generation
    if (images.length > 0 && prevImages.length > 0 && images[0] !== prevImages[0]) {
      setSavedIndexes(new Set());
      setSavingIndexes(new Set());
      setSaveErrors(new Set());
      allSavedToastShownRef.current = false;
    }

    // Also reset if going from empty to having images
    if (prevImages.length === 0 && images.length > 0) {
      setSavedIndexes(new Set());
      setSavingIndexes(new Set());
      setSaveErrors(new Set());
      allSavedToastShownRef.current = false;
    }

    prevImagesRef.current = images;
  }, [images]);

  // 모든 이미지 저장 완료 시 알림
  useEffect(() => {
    if (onSave && images.length > 0 && savedIndexes.size === images.length && !allSavedToastShownRef.current) {
      allSavedToastShownRef.current = true;
      showToastRef.current(`모든 이미지 저장 완료! (${images.length}장)`, 'success', 4000);
    }
  }, [savedIndexes.size, images.length, onSave]);

  const handleSave = async (img: string, idx: number) => {
    if (!onSave || savedIndexes.has(idx) || savingIndexes.has(idx)) return;

    // 저장 시작: Set에 추가
    setSavingIndexes(prev => new Set([...prev, idx]));
    setSaveErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(idx);
      return newSet;
    });

    try {
      await onSave(img);
      setSavedIndexes(prev => new Set([...prev, idx]));
      // 개별 저장 완료 알림 (마지막이 아닌 경우)
      const newSavedCount = savedIndexes.size + 1;
      if (newSavedCount < images.length) {
        showToastRef.current(`이미지 #${idx + 1} 저장됨 (${newSavedCount}/${images.length})`, 'success');
      }
    } catch {
      setSaveErrors(prev => new Set([...prev, idx]));
      showToastRef.current(`이미지 #${idx + 1} 저장 실패`, 'error');
    } finally {
      // 저장 완료: Set에서 제거
      setSavingIndexes(prev => {
        const newSet = new Set(prev);
        newSet.delete(idx);
        return newSet;
      });
    }
  };

  const handleSelect = async (img: string, idx: number) => {
    if (!onSelect || selectingIndex !== null) return;
    setSelectingIndex(idx);
    try {
      await onSelect(img);
    } finally {
      setSelectingIndex(null);
    }
  };

  const handleGenerateMore = async () => {
    if (!onGenerateMore || isGeneratingMore) return;
    setIsGeneratingMore(true);
    try {
      await onGenerateMore();
    } finally {
      setIsGeneratingMore(false);
    }
  };

  if (images.length === 0) return null;

  const handleDownload = (base64Data: string, index: number) => {
    const timestamp = Date.now();
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = `biz-ai-generated-${timestamp}-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPreview = (img: string, idx: number) => {
    setPreviewImage(img);
    setPreviewIndex(idx);
  };

  const closePreview = () => {
    setPreviewImage(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col transition-colors">
        {/* 컴팩트 헤더 */}
        <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-3 py-2.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {onSelect ? '사용할 이미지 선택' : `생성 결과 (${images.length}장)`}
            </h2>
            {/* 저장 진행률 표시 */}
            {onSave && savedIndexes.size > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30">
                  {savedIndexes.size === images.length ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        모두 저장됨
                      </span>
                    </>
                  ) : (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {savedIndexes.size}/{images.length} 저장됨
                      </span>
                    </>
                  )}
                </div>
                {/* 진행률 바 */}
                <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      savedIndexes.size === images.length
                        ? 'bg-green-500'
                        : 'bg-blue-500 animate-progress-shine'
                    }`}
                    style={{ width: `${(savedIndexes.size / images.length) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 min-w-[32px] min-h-[32px] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* 경고 및 안내 - 컴팩트하게 통합 */}
        <div className="flex-shrink-0 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-3 py-2">
          <div className="flex items-center gap-2 text-xs">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-amber-800 dark:text-amber-200 font-medium">뒤로가기 시 데이터 삭제</span>
            <span className="text-amber-700 dark:text-amber-300">• 이미지를 저장해주세요</span>
            <span className="text-blue-600 dark:text-blue-400 ml-auto flex items-center gap-1">
              <ZoomIn className="w-3 h-3" />
              클릭하여 확대
            </span>
          </div>
        </div>

        {/* 횡스크롤 이미지 카드 영역 */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-x-auto overflow-y-hidden py-4 px-3">
            <div className="flex gap-3 h-full min-w-max">
              {images.map((img, idx) => (
                <div key={idx} className="flex-shrink-0 w-[260px] lg:w-[300px] h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden group flex flex-col transition-colors">
                  {/* 클릭 가능한 이미지 영역 - 높이 비율 조정 */}
                  <div
                    className="flex-1 min-h-0 relative overflow-hidden bg-slate-100 dark:bg-slate-900 cursor-pointer"
                    onClick={() => openPreview(img, idx)}
                  >
                    <Image
                      src={img}
                      alt={`Generated ${idx}`}
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      unoptimized={img.startsWith('data:')}
                    />
                    {/* 줌 오버레이 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-lg">
                        <ZoomIn className="w-5 h-5 text-slate-700" />
                      </div>
                    </div>
                    {/* 이미지 번호 표시 */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-0.5 rounded">
                      #{idx + 1}
                    </div>
                  </div>

                  {/* 버튼 영역 - 컴팩트화 */}
                  <div className="flex-shrink-0 p-2.5 flex flex-col gap-2">
                    {onUpscale && (
                      <button
                        onClick={() => onUpscale(img)}
                        className="w-full flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-2 py-1.5 rounded-lg transition-colors"
                      >
                        <Maximize2 className="w-3 h-3" />
                        4K 업스케일
                      </button>
                    )}

                    <div className="flex gap-1.5">
                      {/* 다운로드 버튼 - 항상 표시 */}
                      <button
                        onClick={() => handleDownload(img, idx)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-2 min-h-[36px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        저장
                      </button>
                      {/* 저장소 버튼 - onSave가 있으면 표시 */}
                      {onSave && (
                        <button
                          onClick={() => handleSave(img, idx)}
                          disabled={savingIndexes.has(idx) || savedIndexes.has(idx)}
                          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 min-h-[36px] rounded-lg text-xs font-medium transition-colors ${
                            savedIndexes.has(idx)
                              ? 'bg-green-500 dark:bg-green-600 text-white'
                              : saveErrors.has(idx)
                              ? 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700'
                              : savingIndexes.has(idx)
                              ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                              : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
                          }`}
                        >
                          {savingIndexes.has(idx) ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : savedIndexes.has(idx) ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              완료
                            </>
                          ) : saveErrors.has(idx) ? (
                            <>
                              <CloudOff className="w-3.5 h-3.5" />
                              재시도
                            </>
                          ) : (
                            <>
                              <Cloud className="w-3.5 h-3.5" />
                              저장소
                            </>
                          )}
                        </button>
                      )}
                      {/* 선택 버튼 - onSelect가 있으면 표시 (로딩 스피너 포함) */}
                      {onSelect && (
                        <button
                          onClick={() => handleSelect(img, idx)}
                          disabled={selectingIndex !== null}
                          className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 min-h-[36px] rounded-lg text-xs font-medium shadow-sm transition-colors ${
                            selectingIndex === idx
                              ? 'bg-indigo-400 dark:bg-indigo-600 text-white cursor-wait'
                              : selectingIndex !== null
                              ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                              : 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600'
                          }`}
                        >
                          {selectingIndex === idx ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              선택 중...
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              선택
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 하단 스크롤 힌트 */}
          <div className="flex-shrink-0 text-center py-1.5 text-[10px] text-slate-400 dark:text-slate-500">
            ← 좌우로 스크롤하여 모든 이미지 확인 →
          </div>
        </div>

        {/* 컴팩트 하단 액션 바 */}
        <div className="flex-shrink-0 p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          {/* AI 저작권 주의 - 한 줄로 축소 */}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mb-2">
            ⚠️ AI 생성 이미지는 제3자 저작권/초상권이 포함될 수 있습니다. 상업적 사용 전 법률 전문가 상담 권장
          </p>

          <div className="flex gap-2 justify-center">
            {onGenerateMore && (
              <button
                onClick={handleGenerateMore}
                disabled={isGeneratingMore}
                className={`flex items-center gap-1.5 px-4 py-2 min-h-[36px] rounded-lg text-sm font-semibold transition-colors shadow-sm ${
                  isGeneratingMore
                    ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600'
                }`}
              >
                {isGeneratingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    추가 생성 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    2장 더 생성 (20 크레딧)
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 min-h-[36px] rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-300 dark:border-slate-600"
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>

      {/* 전체 이미지 미리보기 모달 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 dark:bg-black/95 flex items-center justify-center p-3"
          onClick={closePreview}
        >
          {/* 헤더 */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between z-10">
            <span className="text-white text-sm font-medium">이미지 #{previewIndex + 1}</span>
            <button
              onClick={closePreview}
              className="p-1.5 min-w-[32px] min-h-[32px] bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center"
              aria-label="닫기"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* 이미지 - 반응형으로 화면에 맞게 확대 */}
          <div
            className="w-full max-w-4xl px-4 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewImage}
              alt={`Preview ${previewIndex}`}
              width={1080}
              height={1920}
              className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-lg"
              unoptimized={previewImage.startsWith('data:')}
            />
          </div>

          {/* 하단 액션 버튼 - 컴팩트 */}
          <div
            className="absolute bottom-0 left-0 right-0 p-3 pb-safe flex justify-center gap-2 flex-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleDownload(previewImage, previewIndex)}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[36px] bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              다운로드
            </button>
            {onSave && (
              <button
                onClick={() => handleSave(previewImage, previewIndex)}
                disabled={savingIndexes.has(previewIndex) || savedIndexes.has(previewIndex)}
                className={`flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-lg text-sm font-medium transition-colors ${
                  savedIndexes.has(previewIndex)
                    ? 'bg-green-500 dark:bg-green-600 text-white'
                    : saveErrors.has(previewIndex)
                    ? 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700'
                    : savingIndexes.has(previewIndex)
                    ? 'bg-white/10 text-white/50'
                    : 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white'
                }`}
              >
                {savingIndexes.has(previewIndex) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : savedIndexes.has(previewIndex) ? (
                  <Check className="w-4 h-4" />
                ) : saveErrors.has(previewIndex) ? (
                  <CloudOff className="w-4 h-4" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                {savedIndexes.has(previewIndex) ? '저장됨' : savingIndexes.has(previewIndex) ? '저장 중...' : saveErrors.has(previewIndex) ? '재시도' : '저장소'}
              </button>
            )}
            {onSelect && (
              <button
                onClick={() => handleSelect(previewImage, previewIndex)}
                disabled={selectingIndex !== null}
                className={`flex items-center gap-1.5 px-4 py-2 min-h-[36px] rounded-lg text-sm font-medium transition-colors shadow-lg ${
                  selectingIndex === previewIndex
                    ? 'bg-indigo-400 dark:bg-indigo-600 text-white cursor-wait'
                    : selectingIndex !== null
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white'
                }`}
              >
                {selectingIndex === previewIndex ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    선택 중...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    선택
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
