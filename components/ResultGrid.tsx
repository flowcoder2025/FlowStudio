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
      <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {onSelect ? '사용할 이미지 선택' : `생성 결과 (${images.length}장)`}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 text-center">
          <p className="text-sm text-blue-700">
            <ZoomIn className="w-4 h-4 inline mr-1" />
            이미지를 클릭하면 전체 화면으로 볼 수 있습니다
          </p>
        </div>

        <div className="flex-1 p-4 bg-slate-50">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {images.map((img, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group flex flex-col">
                {/* 클릭 가능한 이미지 영역 */}
                <div
                  className="aspect-[9/16] max-h-[400px] relative overflow-hidden bg-slate-100 cursor-pointer"
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
                    <span className="text-sm font-medium text-slate-500">이미지 #{idx + 1}</span>
                    {onUpscale && (
                      <button
                        onClick={() => onUpscale(img)}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors"
                      >
                        <Maximize2 className="w-3 h-3" />
                        업스케일링 (2K)
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(img, idx)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                      title="다운로드"
                    >
                      <Download className="w-5 h-5" />
                    </button>

                    {onSave && (
                      <button
                        onClick={() => handleSave(img, idx)}
                        disabled={savingIndex === idx || savedIndexes.has(idx)}
                        className={`p-2 rounded-lg transition-colors border ${
                          savedIndexes.has(idx)
                            ? 'bg-green-50 border-green-300 text-green-600'
                            : savingIndex === idx
                            ? 'bg-slate-100 border-slate-200 text-slate-400'
                            : 'text-blue-600 hover:bg-blue-50 border-blue-200'
                        }`}
                        title={savedIndexes.has(idx) ? '저장됨' : '클라우드 저장'}
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
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        선택하기
                      </button>
                    )}

                    {!onSelect && (
                      <button
                        onClick={() => handleDownload(img, idx)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
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

        <div className="p-6 bg-white border-t border-slate-100 text-center">
          <p className="text-slate-500 mb-4">마음에 드는 이미지가 없으신가요?</p>
          <button
            onClick={onClose}
            className="text-indigo-600 font-semibold hover:underline"
          >
            돌아가서 다시 생성하기
          </button>
        </div>
      </div>

      {/* 전체 이미지 미리보기 모달 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          {/* 헤더 */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
            <span className="text-white font-medium">이미지 #{previewIndex + 1} 전체 보기</span>
            <button
              onClick={closePreview}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
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
            className="absolute bottom-0 left-0 right-0 p-4 flex justify-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleDownload(previewImage, previewIndex)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-5 h-5" />
              다운로드
            </button>
            {onSave && (
              <button
                onClick={() => handleSave(previewImage, previewIndex)}
                disabled={savingIndex === previewIndex || savedIndexes.has(previewIndex)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  savedIndexes.has(previewIndex)
                    ? 'bg-green-500 text-white'
                    : savingIndex === previewIndex
                    ? 'bg-white/10 text-white/50'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
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
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-lg"
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
