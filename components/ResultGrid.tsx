'use client';

import React, { useState } from 'react';
import { Download, X, Check, Maximize2, ZoomIn, Cloud, Loader2 } from 'lucide-react';

interface ResultGridProps {
  images: string[];
  onClose: () => void;
  onSelect?: (image: string) => void;
  onUpscale?: (image: string) => void;
  onSave?: (image: string) => Promise<void>;
}

export const ResultGrid: React.FC<ResultGridProps> = ({ images, onClose, onSelect, onUpscale, onSave }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number>(0);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());

  const handleSave = async (img: string, idx: number) => {
    if (!onSave || savedIndexes.has(idx)) return;
    setSavingIndex(idx);
    try {
      await onSave(img);
      setSavedIndexes(prev => new Set([...prev, idx]));
    } finally {
      setSavingIndex(null);
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
      <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col overflow-y-auto transition-colors">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {onSelect ? '사용할 이미지 선택' : `생성 결과 (${images.length}장)`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 min-w-[40px] min-h-[40px] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center"
            aria-label="닫기"
          >
            <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 px-4 py-2 text-center">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <ZoomIn className="w-4 h-4 inline mr-1" />
            이미지를 클릭하면 전체 화면으로 볼 수 있습니다
          </p>
        </div>

        <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {images.map((img, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden group flex flex-col transition-colors">
                {/* 클릭 가능한 이미지 영역 */}
                <div
                  className="aspect-[9/16] max-h-[400px] relative overflow-hidden bg-slate-100 dark:bg-slate-900 cursor-pointer"
                  onClick={() => openPreview(img, idx)}
                >
                  <img
                    src={img}
                    alt={`Generated ${idx}`}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* 줌 오버레이 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3 shadow-lg">
                      <ZoomIn className="w-6 h-6 text-slate-700" />
                    </div>
                  </div>
                  {/* 더보기 힌트 */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3">
                    <p className="text-white text-xs text-center">클릭하여 전체 보기</p>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-3 mt-auto">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">이미지 #{idx + 1}</span>
                    {onUpscale && (
                      <button
                        onClick={() => onUpscale(img)}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 min-h-[32px] rounded-full transition-colors"
                      >
                        <Maximize2 className="w-3 h-3" />
                        업스케일링 (2K)
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(img, idx)}
                      className="p-2 min-w-[40px] min-h-[40px] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-600 flex items-center justify-center"
                      title="다운로드"
                      aria-label="다운로드"
                    >
                      <Download className="w-5 h-5" />
                    </button>

                    {onSave && (
                      <button
                        onClick={() => handleSave(img, idx)}
                        disabled={savingIndex === idx || savedIndexes.has(idx)}
                        className={`p-2 min-w-[40px] min-h-[40px] rounded-lg transition-colors border flex items-center justify-center ${
                          savedIndexes.has(idx)
                            ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-600 dark:text-green-400'
                            : savingIndex === idx
                            ? 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500'
                            : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700'
                        }`}
                        title={savedIndexes.has(idx) ? '저장됨' : '클라우드 저장'}
                        aria-label={savedIndexes.has(idx) ? '저장됨' : '클라우드 저장'}
                      >
                        {savingIndex === idx ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : savedIndexes.has(idx) ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Cloud className="w-5 h-5" />
                        )}
                      </button>
                    )}

                    {onSelect && (
                      <button
                        onClick={() => onSelect(img)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        선택하기
                      </button>
                    )}

                    {!onSelect && (
                      <button
                        onClick={() => handleDownload(img, idx)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-slate-900 dark:bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                      >
                        다운로드
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-slate-500 dark:text-slate-400 mb-4">마음에 드는 이미지가 없으신가요?</p>
          <button
            onClick={onClose}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline min-h-[32px] inline-flex items-center"
          >
            돌아가서 다시 생성하기
          </button>
        </div>
      </div>

      {/* 전체 이미지 미리보기 모달 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 dark:bg-black/95 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          {/* 헤더 */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
            <span className="text-white font-medium">이미지 #{previewIndex + 1} 전체 보기</span>
            <button
              onClick={closePreview}
              className="p-2 min-w-[40px] min-h-[40px] bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center"
              aria-label="닫기"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* 이미지 */}
          <div
            className="max-w-md w-full max-h-[85vh] overflow-auto rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt={`Preview ${previewIndex}`}
              className="w-full h-auto"
            />
          </div>

          {/* 하단 액션 버튼 */}
          <div
            className="absolute bottom-0 left-0 right-0 p-4 pb-safe flex justify-center gap-3 flex-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleDownload(previewImage, previewIndex)}
              className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-5 h-5" />
              다운로드
            </button>
            {onSave && (
              <button
                onClick={() => handleSave(previewImage, previewIndex)}
                disabled={savingIndex === previewIndex || savedIndexes.has(previewIndex)}
                className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg font-medium transition-colors ${
                  savedIndexes.has(previewIndex)
                    ? 'bg-green-500 dark:bg-green-600 text-white'
                    : savingIndex === previewIndex
                    ? 'bg-white/10 text-white/50'
                    : 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white'
                }`}
              >
                {savingIndex === previewIndex ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : savedIndexes.has(previewIndex) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Cloud className="w-5 h-5" />
                )}
                {savedIndexes.has(previewIndex) ? '저장됨' : savingIndex === previewIndex ? '저장 중...' : '클라우드 저장'}
              </button>
            )}
            {onSelect && (
              <button
                onClick={() => {
                  onSelect(previewImage);
                  closePreview();
                }}
                className="flex items-center gap-2 px-6 py-2.5 min-h-[44px] bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors shadow-lg"
              >
                <Check className="w-5 h-5" />
                이 이미지 선택하기
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
