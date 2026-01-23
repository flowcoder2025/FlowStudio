'use client';

/**
 * Color Correction Studio Page
 * Contract: HYBRID_DESIGN_STUDIO
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, Image as ImageIcon, Wand2, Palette, Eraser, Layers } from 'lucide-react';
import { FilterTab } from '@/components/studio/FilterTab';
import { ColorTransferTab } from '@/components/studio/ColorTransferTab';
import { BackgroundRemovalTab } from '@/components/studio/BackgroundRemovalTab';

// =====================================================
// Types
// =====================================================

type StudioTab = 'filter' | 'transfer' | 'background' | 'colorway';

interface ImageState {
  original: string | null;
  processed: string | null;
  isProcessing: boolean;
  progress: number;
}

// =====================================================
// Component
// =====================================================

export default function ColorCorrectionPage() {
  const [activeTab, setActiveTab] = useState<StudioTab>('filter');
  const [imageState, setImageState] = useState<ImageState>({
    original: null,
    processed: null,
    isProcessing: false,
    progress: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageState({
        original: dataUrl,
        processed: null,
        isProcessing: false,
        progress: 0,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageState({
        original: dataUrl,
        processed: null,
        isProcessing: false,
        progress: 0,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  // Handle processed image update
  const handleProcessedImage = useCallback((processedUrl: string | null) => {
    setImageState((prev) => ({
      ...prev,
      processed: processedUrl,
      isProcessing: false,
      progress: 100,
    }));
  }, []);

  // Handle progress update
  const handleProgress = useCallback((progress: number) => {
    setImageState((prev) => ({
      ...prev,
      isProcessing: progress < 100,
      progress,
    }));
  }, []);

  // Handle reset
  const handleReset = useCallback(() => {
    setImageState((prev) => ({
      ...prev,
      processed: null,
      isProcessing: false,
      progress: 0,
    }));
  }, []);

  // Tab configuration
  const tabs: Array<{ id: StudioTab; label: string; icon: React.ReactNode }> = [
    { id: 'filter', label: '필터', icon: <Wand2 className="w-4 h-4" /> },
    { id: 'transfer', label: '색 전이', icon: <Palette className="w-4 h-4" /> },
    { id: 'background', label: '배경 제거', icon: <Eraser className="w-4 h-4" /> },
    { id: 'colorway', label: '컬러웨이', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            이미지 스튜디오
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            필터, 색 전이, 배경 제거 등 이미지 편집 도구
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Image Upload & Preview */}
          <div className="lg:col-span-2 space-y-4">
            {/* Image Preview Area */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {!imageState.original ? (
                /* Upload Area */
                <div
                  className="aspect-video flex flex-col items-center justify-center p-8 border-2 border-dashed border-zinc-300 dark:border-zinc-600 m-4 rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <Upload className="w-12 h-12 text-zinc-400 mb-4" />
                  <p className="text-zinc-600 dark:text-zinc-300 text-center">
                    이미지를 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-sm text-zinc-400 mt-2">
                    PNG, JPG, WebP 지원
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              ) : (
                /* Image Comparison */
                <div className="relative">
                  {/* Processing Overlay */}
                  {imageState.isProcessing && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 text-center">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-zinc-900 dark:text-white font-medium">
                          처리 중... {imageState.progress}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Images Grid */}
                  <div className="grid grid-cols-2 gap-4 p-4">
                    {/* Original */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          원본
                        </span>
                      </div>
                      <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
                        <img
                          src={imageState.original}
                          alt="Original"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Processed */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          결과
                        </span>
                        {imageState.processed && (
                          <a
                            href={imageState.processed}
                            download="processed-image.png"
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            다운로드
                          </a>
                        )}
                      </div>
                      <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
                        {imageState.processed ? (
                          <img
                            src={imageState.processed}
                            alt="Processed"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-zinc-400">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm">처리된 이미지가 여기에 표시됩니다</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center px-4 pb-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      다른 이미지 선택
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {imageState.processed && (
                      <button
                        onClick={handleReset}
                        className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                      >
                        초기화
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Tools Panel */}
          <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-2">
              <div className="flex flex-wrap gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                      }
                    `}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-4">
              {!imageState.original ? (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
                  <p>먼저 이미지를 업로드해주세요</p>
                </div>
              ) : (
                <>
                  {activeTab === 'filter' && (
                    <FilterTab
                      imageUrl={imageState.original}
                      onProcessed={handleProcessedImage}
                      onProgress={handleProgress}
                      disabled={imageState.isProcessing}
                    />
                  )}
                  {activeTab === 'transfer' && (
                    <ColorTransferTab
                      imageUrl={imageState.original}
                      onProcessed={handleProcessedImage}
                      onProgress={handleProgress}
                      disabled={imageState.isProcessing}
                    />
                  )}
                  {activeTab === 'background' && (
                    <BackgroundRemovalTab
                      imageUrl={imageState.original}
                      onProcessed={handleProcessedImage}
                      onProgress={handleProgress}
                      disabled={imageState.isProcessing}
                    />
                  )}
                  {activeTab === 'colorway' && (
                    <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                      <Layers className="w-12 h-12 mx-auto mb-4 text-zinc-400" />
                      <p>컬러웨이 기능 준비 중</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
