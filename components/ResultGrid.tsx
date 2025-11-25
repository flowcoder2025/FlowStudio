'use client';

import React from 'react';
import { Download, X, Check } from 'lucide-react';

interface ResultGridProps {
  images: string[];
  onClose: () => void;
  onSelect?: (image: string) => void;
}

export const ResultGrid: React.FC<ResultGridProps> = ({ images, onClose, onSelect }) => {
  if (images.length === 0) return null;

  const handleDownload = (base64Data: string, index: number) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = `biz-ai-generated-${Date.now()}-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
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

      <div className="flex-1 p-4 bg-slate-50">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {images.map((img, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group flex flex-col">
              <div className="aspect-square relative overflow-hidden bg-slate-100">
                <img
                  src={img}
                  alt={`Generated ${idx}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4 flex justify-between items-center mt-auto">
                <span className="text-sm font-medium text-slate-500">이미지 #{idx + 1}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(img, idx)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="다운로드"
                  >
                    <Download className="w-5 h-5" />
                  </button>

                  {onSelect && (
                    <button
                      onClick={() => onSelect(img)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      선택하기
                    </button>
                  )}

                  {!onSelect && (
                    <button
                      onClick={() => handleDownload(img, idx)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
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
  );
};
