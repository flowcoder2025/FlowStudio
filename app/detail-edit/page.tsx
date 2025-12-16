'use client';

import React, { useState, useRef, useEffect } from 'react';
import NextImage from 'next/image';
import { FilePenLine, Layout, RefreshCw, ZoomIn, ZoomOut, MousePointer2, Hand, Wand2, Type, ImagePlus, Check, FolderOpen, Download, Cloud, Loader2, FilePlus2 } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ImageGalleryModal } from '@/components/ImageGalleryModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppMode, GenerationRequest } from '@/types';
import { generatePreview, extractTextFromImage } from '@/services/geminiService';
import { recordUsage } from '@/services/usageService';

type EditModeSub = 'GENERAL' | 'TEXT' | 'REPLACE';
type ActiveTool = 'SELECT' | 'PAN';

export default function DetailEditPage() {
  return (
    <AuthGuard>
      <DetailEditPageContent />
    </AuthGuard>
  );
}

function DetailEditPageContent() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Selection state
  const [selectionRect, setSelectionRect] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);

  // Edit modes
  const [editModeSub, setEditModeSub] = useState<EditModeSub>('GENERAL');
  const [replacementImage, setReplacementImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [editedSectionOverlay, setEditedSectionOverlay] = useState<{data: string, rect: {x: number, y: number, w: number, h: number}} | null>(null);

  // Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [activeTool, setActiveTool] = useState<ActiveTool>('SELECT');
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{x: number, y: number, scrollLeft: number, scrollTop: number} | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reset zoom when image changes
  useEffect(() => {
    if (uploadedImage) {
      setZoomLevel(1.0);
      setActiveTool('SELECT');
      setSelectionRect(null);
      setEditedSectionOverlay(null);
      setReplacementImage(null);
    }
  }, [uploadedImage]);

  const handleUploadedImageChange = (image: string | null) => {
    setUploadedImage(image);
    setSelectionRect(null);
    setEditedSectionOverlay(null);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.max(0.1, Math.min(5.0, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !scrollContainerRef.current) return;
    e.preventDefault();

    // PAN Tool Logic
    if (activeTool === 'PAN') {
      setIsPanning(true);
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        scrollLeft: scrollContainerRef.current.scrollLeft,
        scrollTop: scrollContainerRef.current.scrollTop
      });
      return;
    }

    // SELECT Tool Logic
    const rect = imageRef.current.getBoundingClientRect();

    // Only start selection if clicking inside the image
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      return;
    }

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    setStartPos({ x, y });
    setIsSelecting(true);
    setSelectionRect({ x: x * scaleX, y: y * scaleY, w: 0, h: 0 });
    setEditedSectionOverlay(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // PAN Move Logic
    if (activeTool === 'PAN' && isPanning && panStart && scrollContainerRef.current) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      scrollContainerRef.current.scrollLeft = panStart.scrollLeft - dx;
      scrollContainerRef.current.scrollTop = panStart.scrollTop - dy;
      return;
    }

    // SELECT Move Logic
    if (activeTool === 'SELECT' && isSelecting && startPos && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();

      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      const scaleX = imageRef.current.naturalWidth / rect.width;
      const scaleY = imageRef.current.naturalHeight / rect.height;

      const constrainedX = Math.max(0, Math.min(currentX, rect.width));
      const constrainedY = Math.max(0, Math.min(currentY, rect.height));

      const width = Math.abs(constrainedX - startPos.x);
      const height = Math.abs(constrainedY - startPos.y);

      const x = Math.min(constrainedX, startPos.x);
      const y = Math.min(constrainedY, startPos.y);

      setSelectionRect({
        x: x * scaleX,
        y: y * scaleY,
        w: width * scaleX,
        h: height * scaleY
      });
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setStartPos(null);
    setIsPanning(false);
    setPanStart(null);
  };

  const getCroppedImage = async (rect: {x: number, y: number, w: number, h: number}): Promise<string | null> => {
    if (!uploadedImage || rect.w < 1 || rect.h < 1) return null;

    const canvas = document.createElement('canvas');
    canvas.width = rect.w;
    canvas.height = rect.h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.w, rect.h);

    const img = new Image();
    img.crossOrigin = "anonymous";  // CORS 지원 (Supabase Storage URL 처리)
    img.src = uploadedImage;

    return new Promise((resolve) => {
      img.onload = () => {
        const sx = Math.max(0, rect.x);
        const sy = Math.max(0, rect.y);
        const sw = Math.min(rect.w - (sx - rect.x), img.width - sx);
        const sh = Math.min(rect.h - (sy - rect.y), img.height - sy);

        const dx = (sx - rect.x);
        const dy = (sy - rect.y);

        if (sw > 0 && sh > 0) {
          ctx.drawImage(img, sx, sy, sw, sh, dx, dy, sw, sh);
        }
        resolve(canvas.toDataURL('image/png'));
      };
    });
  };

  const handleGallerySelect = (imageUrl: string) => {
    setUploadedImage(imageUrl);
    setSelectionRect(null);
    setEditedSectionOverlay(null);
  };

  const handleExtractText = async () => {
    if (!selectionRect) {
      alert("영역을 선택해주세요.");
      return;
    }
    const croppedData = await getCroppedImage(selectionRect);
    if (!croppedData) {
      alert("영역을 선택해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const text = await extractTextFromImage(croppedData);
      setExtractedText(text);
      setPrompt(text);
      setEditModeSub('TEXT');
      recordUsage(1);
    } catch {
      alert("텍스트 추출 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailEditGenerate = async () => {
    if (!selectionRect || !uploadedImage) {
      alert("편집할 영역을 선택해주세요.");
      return;
    }

    if (editModeSub === 'REPLACE' && !replacementImage) {
      alert("교체할 이미지를 업로드해주세요.");
      return;
    }

    if (!prompt) {
      if (editModeSub !== 'REPLACE') {
        alert("요청사항을 입력해주세요.");
        return;
      } else {
        setPrompt("Replace the content seamlessly.");
      }
    }

    setIsLoading(true);
    try {
      // Adaptive Aspect Ratio Logic
      const currentRatio = selectionRect.w / selectionRect.h;

      const targets = [
        { ratio: 1.0, label: "1:1" },
        { ratio: 3 / 4, label: "3:4" },
        { ratio: 4 / 3, label: "4:3" },
        { ratio: 9 / 16, label: "9:16" },
        { ratio: 16 / 9, label: "16:9" }
      ];

      const closest = targets.reduce((prev, curr) =>
        (Math.abs(curr.ratio - currentRatio) < Math.abs(prev.ratio - currentRatio) ? curr : prev)
      );

      let newW = selectionRect.w;
      let newH = selectionRect.h;

      if (currentRatio > closest.ratio) {
        newH = newW / closest.ratio;
      } else {
        newW = newH * closest.ratio;
      }

      const cx = selectionRect.x + selectionRect.w / 2;
      const cy = selectionRect.y + selectionRect.h / 2;
      const expandedRect = {
        x: cx - newW / 2,
        y: cy - newH / 2,
        w: newW,
        h: newH
      };

      const contextImage = await getCroppedImage(expandedRect);

      if (!contextImage) throw new Error("Failed to create context image");

      let fullPrompt = prompt;
      if (editModeSub === 'TEXT') {
        fullPrompt = `Replace the text in the selection with: "${prompt}". Maintain exact background, font style, and layout. High resolution text.`;
      } else if (editModeSub === 'REPLACE') {
        if (!fullPrompt) fullPrompt = "seamlessly replace.";
      } else {
        fullPrompt = `Edit this image section: ${prompt}. Blend seamlessly. High quality product photography.`;
      }

      const request: GenerationRequest = {
        mode: AppMode.DETAIL_EDIT,
        prompt: fullPrompt,
        image: contextImage,
        refImage: editModeSub === 'REPLACE' ? (replacementImage || undefined) : undefined,
        aspectRatio: closest.label
      };

      const result = await generatePreview(request);

      if (result) {
        setEditedSectionOverlay({
          data: result,
          rect: expandedRect
        });
        recordUsage(1);
      } else {
        alert("편집에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyEdit = async () => {
    if (!uploadedImage || !editedSectionOverlay) return;

    const img = new Image();
    img.crossOrigin = "anonymous";  // CORS 지원 (Supabase Storage URL 처리)
    img.src = uploadedImage;
    await new Promise(r => img.onload = r);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw original
    ctx.drawImage(img, 0, 0);

    // Draw overlay
    const overlayImg = new Image();
    overlayImg.crossOrigin = "anonymous";  // CORS 지원
    overlayImg.src = editedSectionOverlay.data;
    await new Promise(r => overlayImg.onload = r);

    ctx.drawImage(
      overlayImg,
      editedSectionOverlay.rect.x,
      editedSectionOverlay.rect.y,
      editedSectionOverlay.rect.w,
      editedSectionOverlay.rect.h
    );

    // Update main image
    setUploadedImage(canvas.toDataURL('image/png'));

    // Cleanup
    setEditedSectionOverlay(null);
    setSelectionRect(null);
  };

  const handleDownloadImage = async () => {
    if (!uploadedImage) return;

    try {
      // URL인 경우 fetch로 blob 변환 (cross-origin 다운로드 지원)
      if (uploadedImage.startsWith('http')) {
        const response = await fetch(uploadedImage);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `detail-edit-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // base64인 경우 직접 다운로드
        const link = document.createElement('a');
        link.href = uploadedImage;
        link.download = `detail-edit-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download error:', error);
      // Fallback: 새 탭에서 열기
      window.open(uploadedImage, '_blank');
    }
  };

  const handleSaveToCloud = async () => {
    if (!uploadedImage) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/images/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [uploadedImage],
          mode: 'DETAIL_EDIT',
          prompt: prompt || '상세페이지 편집',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || '클라우드에 저장되었습니다.');
        // 저장된 URL로 업데이트 (다음 저장 시 중복 방지)
        if (data.urls && data.urls[0]) {
          setUploadedImage(data.urls[0]);
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Cloud save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewProject = () => {
    // 작업 중인 내용이 있으면 확인
    if (uploadedImage || selectionRect || editedSectionOverlay) {
      if (!confirm('현재 작업 중인 내용이 있습니다. 새로 시작하시겠습니까?')) {
        return;
      }
    }

    // 모든 상태 초기화
    setUploadedImage(null);
    setPrompt('');
    setSelectionRect(null);
    setEditedSectionOverlay(null);
    setEditModeSub('GENERAL');
    setReplacementImage(null);
    setExtractedText('');
    setZoomLevel(1.0);
    setActiveTool('SELECT');
  };

  return (
    <>
      <Header currentMode={AppMode.DETAIL_EDIT} />

      <div className="max-w-6xl mx-auto px-4 py-8 pb-32 h-[calc(100vh-64px)] flex flex-col">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <FilePenLine className="text-violet-600 dark:text-violet-400" /> 상세페이지 편집
          </h2>
          {uploadedImage && (
            <button
              onClick={handleNewProject}
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
              title="새로 시작하기"
            >
              <FilePlus2 className="w-4 h-4" />
              새로하기
            </button>
          )}
        </div>

        {/* PC 버전 권장 안내 (모바일에서만 표시) */}
        <div className="md:hidden mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">PC 버전 권장</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
              정밀한 편집 작업을 위해 PC 또는 태블릿 환경에서 사용하시는 것을 권장합니다.
            </p>
          </div>
        </div>

        {!uploadedImage ? (
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="w-full max-w-md p-8">
              <FileDropzone
                value={uploadedImage}
                onChange={handleUploadedImageChange}
                onCompressing={setIsCompressing}
                onError={(msg) => alert(msg)}
                colorTheme="violet"
                icon={<Layout className="w-10 h-10 text-violet-600 dark:text-violet-400" />}
                placeholder="편집할 상세페이지 업로드"
                subPlaceholder="JPG, PNG 파일 지원 (최대 10MB)"
                imageAlt="Detail Page"
                minHeight="min-h-[200px]"
              />
              <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                <button
                  onClick={() => setIsGalleryOpen(true)}
                  className="flex items-center justify-center gap-2 py-3 px-6 min-h-[48px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors w-full"
                >
                  <FolderOpen className="w-5 h-5" />
                  내 이미지에서 불러오기
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Editor Canvas Area */}
            <div className="flex-1 flex flex-col gap-2">
              {/* Toolbar */}
              <div className="bg-white dark:bg-slate-800 p-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-colors">
                <div className="flex items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2">
                  <button
                    onClick={() => handleZoom(-0.1)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
                    title="축소"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium w-12 text-center text-slate-700 dark:text-slate-300">{Math.round(zoomLevel * 100)}%</span>
                  <button
                    onClick={() => handleZoom(0.1)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
                    title="확대"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveTool('SELECT')}
                    className={`p-2 rounded flex items-center gap-1 text-xs font-medium transition-colors ${activeTool === 'SELECT' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    <MousePointer2 className="w-4 h-4" /> 선택
                  </button>
                  <button
                    onClick={() => setActiveTool('PAN')}
                    className={`p-2 rounded flex items-center gap-1 text-xs font-medium transition-colors ${activeTool === 'PAN' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    <Hand className="w-4 h-4" /> 이동(Pan)
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex-1 flex justify-end gap-2">
                  {/* Download Button */}
                  <button
                    onClick={handleDownloadImage}
                    className="flex items-center gap-1 px-3 py-1.5 min-h-[36px] bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded font-medium text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    title="이미지 다운로드"
                  >
                    <Download className="w-3 h-3" /> 다운로드
                  </button>

                  {/* Cloud Save Button */}
                  <button
                    onClick={handleSaveToCloud}
                    disabled={isSaving}
                    className={`flex items-center gap-1 px-3 py-1.5 min-h-[36px] rounded font-medium text-xs transition-colors ${
                      isSaving
                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        : 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50'
                    }`}
                    title="클라우드에 저장"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Cloud className="w-3 h-3" />
                    )}
                    {isSaving ? '저장 중...' : '클라우드 저장'}
                  </button>

                  {/* Apply Edit Button */}
                  {editedSectionOverlay && (
                    <button
                      onClick={handleApplyEdit}
                      className="flex items-center gap-1 px-4 py-1.5 min-h-[36px] bg-green-600 dark:bg-green-500 text-white rounded font-medium text-xs hover:bg-green-700 dark:hover:bg-green-600 shadow-sm animate-pulse transition-colors"
                    >
                      <Check className="w-3 h-3" /> 적용하기
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 bg-slate-200 dark:bg-slate-900 rounded-xl overflow-hidden relative border border-slate-300 dark:border-slate-700 shadow-inner flex flex-col transition-colors">
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-auto custom-scrollbar relative bg-slate-200 dark:bg-slate-900"
                  style={{ cursor: activeTool === 'PAN' ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div className="min-w-fit min-h-fit p-10 flex justify-center">
                    <div
                      className="relative shadow-2xl bg-white dark:bg-slate-800"
                      style={{ width: `${zoomLevel * 100}%`, maxWidth: 'none', transition: isPanning ? 'none' : 'width 0.1s ease-out' }}
                    >
                      <NextImage
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ref={imageRef as any}
                        src={uploadedImage}
                        alt="Detail Page"
                        width={1080}
                        height={1920}
                        className="w-full block select-none pointer-events-none"
                        draggable={false}
                        unoptimized={uploadedImage.startsWith('data:')}
                      />

                      {/* Selection Overlay */}
                      {selectionRect && selectionRect.w > 0 && imageRef.current && !editedSectionOverlay && (
                        <div
                          className="absolute border-2 border-violet-500 dark:border-violet-400 bg-violet-500/10 dark:bg-violet-500/20 z-10 pointer-events-none"
                          style={{
                            left: `${(selectionRect.x / imageRef.current.naturalWidth) * 100}%`,
                            top: `${(selectionRect.y / imageRef.current.naturalHeight) * 100}%`,
                            width: `${(selectionRect.w / imageRef.current.naturalWidth) * 100}%`,
                            height: `${(selectionRect.h / imageRef.current.naturalHeight) * 100}%`,
                          }}
                        >
                          <div className="absolute -top-6 left-0 bg-violet-600 dark:bg-violet-500 text-white text-[10px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                            선택 영역
                          </div>
                        </div>
                      )}

                      {/* Edited Result Overlay */}
                      {editedSectionOverlay && imageRef.current && (
                        <NextImage
                          src={editedSectionOverlay.data}
                          alt="Edited Segment"
                          width={100}
                          height={100}
                          className="absolute z-20 shadow-xl border-2 border-green-400/80 dark:border-green-500/80"
                          style={{
                            left: `${(editedSectionOverlay.rect.x / imageRef.current.naturalWidth) * 100}%`,
                            top: `${(editedSectionOverlay.rect.y / imageRef.current.naturalHeight) * 100}%`,
                            width: `${(editedSectionOverlay.rect.w / imageRef.current.naturalWidth) * 100}%`,
                            height: `${(editedSectionOverlay.rect.h / imageRef.current.naturalHeight) * 100}%`,
                          }}
                          unoptimized={editedSectionOverlay.data.startsWith('data:')}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Control Panel */}
            <div className="w-80 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 flex flex-col transition-colors">
              <div className="mb-6">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                  <MousePointer2 className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                  1. 영역 선택
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  이미지에서 수정하고 싶은 부분을 마우스로 드래그하여 선택하세요.
                </p>
                {!selectionRect ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-600 transition-colors">
                    선택된 영역 없음
                  </div>
                ) : (
                  <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-lg text-center text-xs text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700 font-medium transition-colors">
                    영역 선택됨 ({Math.round(selectionRect.w)}x{Math.round(selectionRect.h)})
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                  2. 편집 도구
                </h3>

                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg mb-4 transition-colors">
                  <button
                    onClick={() => { setEditModeSub('GENERAL'); setPrompt(''); }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editModeSub === 'GENERAL' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    AI 편집
                  </button>
                  <button
                    onClick={() => { setEditModeSub('TEXT'); setPrompt(''); }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editModeSub === 'TEXT' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    텍스트
                  </button>
                  <button
                    onClick={() => { setEditModeSub('REPLACE'); setPrompt(''); }}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${editModeSub === 'REPLACE' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    이미지 교체
                  </button>
                </div>

                {/* Tool-specific controls */}
                {editModeSub === 'TEXT' && (
                  <div className="mb-4">
                    <button
                      onClick={handleExtractText}
                      disabled={!selectionRect || isLoading}
                      className="w-full py-2 px-3 min-h-[40px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                      <Type className="w-4 h-4" />
                      선택 영역의 텍스트 추출
                    </button>
                    {extractedText && (
                      <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 max-h-24 overflow-y-auto transition-colors">
                        추출된 텍스트: {extractedText}
                      </div>
                    )}
                  </div>
                )}

                {editModeSub === 'REPLACE' && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">교체할 이미지</label>
                    <FileDropzone
                      value={replacementImage}
                      onChange={setReplacementImage}
                      onCompressing={setIsCompressing}
                      onError={(msg) => alert(msg)}
                      colorTheme="violet"
                      icon={<ImagePlus className="w-6 h-6 text-violet-400 dark:text-violet-500" />}
                      placeholder="이미지 선택"
                      imageAlt="Replacement"
                      compact
                      minHeight="min-h-[80px]"
                      imageMaxHeight="h-20"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    {editModeSub === 'TEXT' ? '변경할 텍스트' : editModeSub === 'REPLACE' ? '교체 설명 (선택)' : '어떻게 변경할까요?'}
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      editModeSub === 'TEXT'
                        ? '예: 새로운 상품명'
                        : editModeSub === 'REPLACE'
                          ? '예: 자연스럽게 교체'
                          : '예: 배경을 파란색으로, 제품을 좀 더 밝게'
                    }
                    className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 min-h-[100px] text-sm transition-colors"
                  />
                </div>

                <button
                  onClick={handleDetailEditGenerate}
                  disabled={!selectionRect || isLoading}
                  className={`w-full py-3 min-h-[48px] rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                    !selectionRect || isLoading
                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      : 'bg-violet-600 dark:bg-violet-500 text-white hover:bg-violet-700 dark:hover:bg-violet-600'
                  }`}
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {editModeSub === 'GENERAL' ? '선택 영역 변경하기' : editModeSub === 'TEXT' ? '텍스트 교체하기' : '이미지 교체하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <LoadingOverlay isVisible={isLoading} message="AI가 선택 영역을 편집하고 있습니다..." />
      <LoadingOverlay isVisible={isCompressing} message="이미지 압축 중..." />

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={handleGallerySelect}
        title="편집할 상세페이지 선택"
      />
    </>
  );
}
