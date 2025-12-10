'use client';

import React, { useState } from 'react';
import Image from 'next/image';
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

        {/* 데이터 손실 경고 배너 */}
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                뒤로가기나 새로고침 시 데이터가 사라집니다
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                이미지를 다운로드하거나 클라우드에 저장해주세요
              </p>
            </div>
          </div>
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
                  <Image
                    src={img}
                    alt={`Generated ${idx}`}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    unoptimized={img.startsWith('data:')}
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

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      {onSelect ? (
                        <button
                          onClick={() => onSelect(img)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm"
                        >
                          <Check className="w-4 h-4" />
                          선택하기
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleDownload(img, idx)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors border border-slate-300 dark:border-slate-600"
                          >
                            <Download className="w-4 h-4" />
                            다운로드
                          </button>
                          {onSave && (
                            <button
                              onClick={() => handleSave(img, idx)}
                              disabled={savingIndex === idx || savedIndexes.has(idx)}
                              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                                savedIndexes.has(idx)
                                  ? 'bg-green-500 dark:bg-green-600 text-white border border-green-600 dark:border-green-700'
                                  : savingIndex === idx
                                  ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 border border-slate-400 dark:border-slate-500 cursor-not-allowed'
                                  : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 border border-blue-600 dark:border-blue-700'
                              }`}
                            >
                              {savingIndex === idx ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  저장 중...
                                </>
                              ) : savedIndexes.has(idx) ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  저장됨
                                </>
                              ) : (
                                <>
                                  <Cloud className="w-4 h-4" />
                                  클라우드 저장
                                </>
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    {!onSelect && onSave && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center px-2">
                        클라우드 저장 시, 다른 페이지에서 재사용 가능
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          {/* AI 이미지 저작권 주의 문구 */}
          <div className="max-w-3xl mx-auto mb-6 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">AI 생성 이미지 사용 시 주의사항</p>
                <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
                  <li>생성된 이미지에는 제3자의 저작권이나 초상권이 포함될 수 있습니다</li>
                  <li>상업적 사용 전 반드시 법률 전문가와 상담하시기 바랍니다</li>
                  <li>타인의 권리를 침해하지 않도록 주의해서 사용해주세요</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">마음에 드는 이미지가 없으신가요?</p>
            <button
              onClick={onClose}
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline min-h-[32px] inline-flex items-center"
            >
              돌아가서 다시 생성하기
            </button>
          </div>
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
            className="max-w-md w-full max-h-[85vh] overflow-auto rounded-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={previewImage}
              alt={`Preview ${previewIndex}`}
              width={1080}
              height={1920}
              className="w-full h-auto"
              unoptimized={previewImage.startsWith('data:')}
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
