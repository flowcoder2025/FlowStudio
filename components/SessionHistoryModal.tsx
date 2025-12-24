'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X, Clock, History, Check, ChevronDown, ChevronUp, ZoomIn, ImageIcon, Download, Cloud, Loader2 } from 'lucide-react';

export interface HistorySession {
  id: string;
  images: string[];
  prompt: string;
  timestamp: Date;
  usedImageIndex?: number; // 이미 사용된 이미지 인덱스
}

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: HistorySession[];
  onSelectImage: (image: string, sessionId: string, imageIndex: number) => void;
  onSaveImage?: (image: string) => Promise<void>;
  title?: string;
  subtitle?: string;
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectImage,
  onSaveImage,
  title = '이미지 히스토리',
  subtitle = '이번 세션에서 생성된 이미지들입니다. 원하는 이미지를 선택하여 교체할 수 있습니다.',
}) => {
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [savingImages, setSavingImages] = useState<Set<string>>(new Set());
  const [savedImages, setSavedImages] = useState<Set<string>>(new Set());

  // 다운로드 함수
  const handleDownload = (image: string, sessionIdx: number, imgIdx: number) => {
    const timestamp = Date.now();
    const link = document.createElement('a');
    link.href = image;
    link.download = `detail-page-session${sessionIdx + 1}-${imgIdx + 1}-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 저장소 저장 함수
  const handleSave = async (image: string) => {
    if (!onSaveImage || savingImages.has(image) || savedImages.has(image)) return;

    setSavingImages(prev => new Set([...prev, image]));
    try {
      await onSaveImage(image);
      setSavedImages(prev => new Set([...prev, image]));
    } catch (error) {
      console.error('Failed to save image:', error);
    } finally {
      setSavingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(image);
        return newSet;
      });
    }
  };

  if (!isOpen) return null;

  const toggleSession = (sessionId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const totalImages = sessions.reduce((sum, s) => sum + s.images.length, 0);
  const usedImages = sessions.reduce((sum, s) => sum + (s.usedImageIndex !== undefined ? 1 : 0), 0);

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl transition-colors animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {sessions.length}개 세션 • {totalImages}장 생성 • {usedImages}장 사용됨
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Subtitle */}
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {subtitle}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
                <ImageIcon className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-lg font-medium mb-1">아직 생성된 이미지가 없습니다</p>
                <p className="text-sm">섹션을 생성하면 여기에 히스토리가 표시됩니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session, sessionIdx) => {
                  const isExpanded = expandedSessions.has(session.id);
                  const hasUsedImage = session.usedImageIndex !== undefined;

                  return (
                    <div
                      key={session.id}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors"
                    >
                      {/* Session Header */}
                      <button
                        onClick={() => toggleSession(session.id)}
                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {formatTime(session.timestamp)}
                            </span>
                          </div>
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                            {session.prompt || `세션 #${sessions.length - sessionIdx}`}
                          </span>
                          {hasUsedImage && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                              사용됨
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {session.images.length}장
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Session Images */}
                      {isExpanded && (
                        <div className="p-4 pt-0 bg-slate-50 dark:bg-slate-900/30">
                          <div className="grid grid-cols-4 gap-2">
                            {session.images.map((img, imgIdx) => {
                              const isUsed = session.usedImageIndex === imgIdx;

                              return (
                                <div
                                  key={imgIdx}
                                  className="relative group aspect-[9/16] rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700"
                                >
                                  <Image
                                    src={img}
                                    alt={`Session ${sessionIdx + 1} Image ${imgIdx + 1}`}
                                    fill
                                    className="object-cover"
                                    unoptimized={img.startsWith('data:')}
                                  />

                                  {/* Used Badge */}
                                  {isUsed && (
                                    <div className="absolute top-1.5 right-1.5 p-1 bg-green-500 rounded-full">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}

                                  {/* Hover Overlay */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {/* 미리보기 */}
                                      <button
                                        onClick={() => setPreviewImage(img)}
                                        className="p-1.5 bg-white/90 rounded-lg shadow-sm hover:bg-white transition-colors"
                                        title="미리보기"
                                      >
                                        <ZoomIn className="w-3.5 h-3.5 text-slate-700" />
                                      </button>
                                      {/* 다운로드 */}
                                      <button
                                        onClick={() => handleDownload(img, sessionIdx, imgIdx)}
                                        className="p-1.5 bg-white/90 rounded-lg shadow-sm hover:bg-white transition-colors"
                                        title="다운로드"
                                      >
                                        <Download className="w-3.5 h-3.5 text-slate-700" />
                                      </button>
                                      {/* 저장소 저장 */}
                                      {onSaveImage && (
                                        <button
                                          onClick={() => handleSave(img)}
                                          disabled={savingImages.has(img) || savedImages.has(img)}
                                          className={`p-1.5 rounded-lg shadow-sm transition-colors ${
                                            savedImages.has(img)
                                              ? 'bg-green-500 cursor-default'
                                              : savingImages.has(img)
                                              ? 'bg-blue-400 cursor-wait'
                                              : 'bg-blue-500 hover:bg-blue-600'
                                          }`}
                                          title={savedImages.has(img) ? '저장됨' : '저장소에 저장'}
                                        >
                                          {savingImages.has(img) ? (
                                            <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                                          ) : savedImages.has(img) ? (
                                            <Check className="w-3.5 h-3.5 text-white" />
                                          ) : (
                                            <Cloud className="w-3.5 h-3.5 text-white" />
                                          )}
                                        </button>
                                      )}
                                      {/* 선택 (사용되지 않은 이미지만) */}
                                      {!isUsed && (
                                        <button
                                          onClick={() => onSelectImage(img, session.id, imgIdx)}
                                          className="p-1.5 bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
                                          title="선택"
                                        >
                                          <Check className="w-3.5 h-3.5 text-white" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Image Index */}
                                  <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 text-white text-xs rounded">
                                    #{imgIdx + 1}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                💡 페이지를 나가면 히스토리가 초기화됩니다. 필요한 이미지는 저장소에 저장해주세요.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 min-h-[36px] bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setPreviewImage(null)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          <Image
            src={previewImage}
            alt="Preview"
            width={540}
            height={960}
            className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg"
            unoptimized={previewImage.startsWith('data:')}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
