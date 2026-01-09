'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import NextImage from 'next/image';
import nextDynamic from 'next/dynamic';
import { FilePenLine, Layout, RefreshCw, ZoomIn, ZoomOut, MousePointer2, Hand, Wand2, Type, ImagePlus, Check, FolderOpen, Download, Cloud, Loader2, FilePlus2, Undo2, Redo2 } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreditSelectorDropdown, CreditType } from '@/components/CreditSelectorDropdown';
import { useToast } from '@/components/Toast';
import { AppMode, GenerationRequest } from '@/types';
import { generatePreview, extractTextFromImage } from '@/services/geminiService';
import { recordUsage } from '@/services/usageService';

const ImageGalleryModal = nextDynamic(() => import('@/components/ImageGalleryModal').then(mod => mod.ImageGalleryModal));

type EditModeSub = 'GENERAL' | 'TEXT' | 'REPLACE';
type ActiveTool = 'SELECT' | 'PAN';

// 히스토리 최대 크기 (메모리 관리)
const MAX_HISTORY_SIZE = 20;

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

  // ============ 히스토리 관리 (Ctrl+Z 지원) ============
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 히스토리에 이미지 추가
  const pushToHistory = useCallback((imageData: string) => {
    setImageHistory(prev => {
      // 현재 인덱스 이후의 히스토리는 삭제 (새로운 분기 생성)
      const newHistory = [...prev.slice(0, historyIndex + 1), imageData];
      // 최대 크기 제한
      if (newHistory.length > MAX_HISTORY_SIZE) {
        return newHistory.slice(-MAX_HISTORY_SIZE);
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [historyIndex]);

  // 되돌리기 (Ctrl+Z)
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setUploadedImage(imageHistory[newIndex]);
      setEditedSectionOverlay(null);
      setSelectionRect(null);
    }
  }, [historyIndex, imageHistory]);

  // 다시 실행 (Ctrl+Shift+Z / Ctrl+Y)
  const handleRedo = useCallback(() => {
    if (historyIndex < imageHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setUploadedImage(imageHistory[newIndex]);
      setEditedSectionOverlay(null);
      setSelectionRect(null);
    }
  }, [historyIndex, imageHistory]);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z 또는 Cmd+Z (되돌리기)
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z 또는 Cmd+Shift+Z 또는 Ctrl+Y (다시 실행)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

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
  const [creditType, setCreditType] = useState<CreditType>('auto');
  const [willHaveWatermark, setWillHaveWatermark] = useState(false);

  const { showToast } = useToast();

  const handleCreditSelect = (type: CreditType, hasWatermark: boolean) => {
    setCreditType(type);
    setWillHaveWatermark(hasWatermark);
  };

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

  // 이미지 업로드 시 히스토리 초기화
  const handleUploadedImageChange = (image: string | null) => {
    if (image) {
      setImageHistory([image]);
      setHistoryIndex(0);
    } else {
      setImageHistory([]);
      setHistoryIndex(-1);
    }
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

  /**
   * 마스크 이미지 생성: 원본 이미지 위에 선택 영역을 빨간색 반투명 오버레이로 표시
   * Gemini에게 편집할 영역을 시각적으로 명확하게 전달하기 위함
   */
  const createMaskImage = async (rect: {x: number, y: number, w: number, h: number}): Promise<string | null> => {
    if (!uploadedImage || rect.w < 1 || rect.h < 1) return null;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = uploadedImage;

    return new Promise((resolve) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        // 1. 원본 이미지 그리기
        ctx.drawImage(img, 0, 0);

        // 2. 선택 영역에 빨간색 반투명 오버레이 그리기
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

        // 3. 선택 영역 테두리 강조 (더 명확하게)
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
        ctx.lineWidth = 4;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
    });
  };

  const handleGallerySelect = (imageUrl: string) => {
    // 갤러리에서 선택 시 히스토리 초기화
    setImageHistory([imageUrl]);
    setHistoryIndex(0);
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
      console.log('[handleExtractText] Calling extractTextFromImage...');
      const text = await extractTextFromImage(croppedData);
      console.log('[handleExtractText] Extracted text:', text);
      console.log('[handleExtractText] Text length:', text?.length);

      if (text && text.trim()) {
        setExtractedText(text);
        setPrompt(text);
        setEditModeSub('TEXT');
        recordUsage(1);
        console.log('[handleExtractText] ✅ Text set to prompt successfully');
      } else {
        console.log('[handleExtractText] ⚠️ Empty text returned');
        alert('이미지에서 텍스트를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('[handleExtractText] Error:', error);
      const errorMsg = error instanceof Error ? error.message : '텍스트 추출 실패';
      alert(errorMsg);
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

    // 워터마크 적용 확인
    if (willHaveWatermark) {
      const confirmed = confirm(
        '무료 크레딧 사용 시 생성된 이미지에 워터마크가 적용됩니다.\n\n계속 진행하시겠습니까?'
      );
      if (!confirmed) return;
    }

    setIsLoading(true);
    try {
      // ============ 개선된 마스크 기반 편집 방식 ============
      // 원본 전체 이미지 + 마스크 이미지(편집 영역 표시) + 프롬프트를 전송
      // Gemini가 전체 컨텍스트를 보고 선택 영역만 정확히 편집

      // 1. 마스크 이미지 생성 (선택 영역에 빨간 오버레이)
      const maskImage = await createMaskImage(selectionRect);
      if (!maskImage) throw new Error("마스크 이미지 생성에 실패했습니다.");

      // 2. 원본 이미지의 종횡비 계산
      const imgWidth = imageRef.current?.naturalWidth || 1000;
      const imgHeight = imageRef.current?.naturalHeight || 1000;
      const originalRatio = imgWidth / imgHeight;

      // 가장 가까운 표준 비율 찾기
      const targets = [
        { ratio: 1.0, label: "1:1" },
        { ratio: 3 / 4, label: "3:4" },
        { ratio: 4 / 3, label: "4:3" },
        { ratio: 9 / 16, label: "9:16" },
        { ratio: 16 / 9, label: "16:9" }
      ];

      const closest = targets.reduce((prev, curr) =>
        (Math.abs(curr.ratio - originalRatio) < Math.abs(prev.ratio - originalRatio) ? curr : prev)
      );

      // 3. 프롬프트 구성 (마스크 영역 설명 포함)
      let fullPrompt = prompt;

      if (editModeSub === 'TEXT') {
        fullPrompt = `Replace the text in the red-marked area with: "${prompt}".
Keep the exact same font style, size, background colors and design. Only change the text content.`;
      } else if (editModeSub === 'REPLACE') {
        fullPrompt = `Replace the content in the red-marked area with the provided reference image.
User instruction: ${prompt || 'seamlessly replace'}.
Blend naturally with surrounding context, match lighting and perspective.`;
      } else {
        // GENERAL 모드
        fullPrompt = `Edit the red-marked area as follows: ${prompt}.
Only modify the marked area. Keep everything else exactly the same.`;
      }

      const request: GenerationRequest = {
        mode: AppMode.DETAIL_EDIT,
        prompt: fullPrompt,
        image: uploadedImage,  // 원본 전체 이미지
        maskImage: maskImage,  // 마스크 이미지 (편집 영역 표시)
        refImage: editModeSub === 'REPLACE' ? (replacementImage || undefined) : undefined,
        aspectRatio: closest.label
      };

      const result = await generatePreview(request, creditType);

      if (result) {
        // 전체 이미지가 반환되므로 오버레이 대신 전체 교체 준비
        // 사용자가 "적용" 버튼을 눌러야 최종 반영됨
        setEditedSectionOverlay({
          data: result,
          rect: { x: 0, y: 0, w: imgWidth, h: imgHeight }  // 전체 이미지 영역
        });
        recordUsage(1);
      } else {
        alert("편집에 실패했습니다.");
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : '오류가 발생했습니다.';
      alert(errorMessage);
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

    // Draw overlay (편집된 이미지)
    const overlayImg = new Image();
    overlayImg.crossOrigin = "anonymous";  // CORS 지원
    overlayImg.src = editedSectionOverlay.data;
    await new Promise(r => overlayImg.onload = r);

    // 전체 이미지 편집인지 확인 (마스크 기반 편집)
    const isFullImageEdit = editedSectionOverlay.rect.x === 0 && editedSectionOverlay.rect.y === 0;

    if (isFullImageEdit) {
      // 전체 이미지 편집: 편집된 이미지를 캔버스 전체에 스케일링하여 그리기
      // Gemini가 반환한 이미지 크기가 원본과 다를 수 있으므로, 원본 크기에 맞게 스케일링
      ctx.drawImage(overlayImg, 0, 0, img.width, img.height);
    } else {
      // 부분 편집: 원본 이미지 위에 오버레이
      ctx.drawImage(img, 0, 0);
      ctx.drawImage(
        overlayImg,
        editedSectionOverlay.rect.x,
        editedSectionOverlay.rect.y,
        editedSectionOverlay.rect.w,
        editedSectionOverlay.rect.h
      );
    }

    // 새 이미지 생성
    const newImage = canvas.toDataURL('image/png');

    // 히스토리에 저장 (되돌리기 지원)
    pushToHistory(newImage);

    // Update main image
    setUploadedImage(newImage);

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
        showToast(data.message || '이미지 저장소에 저장되었습니다.', 'success');
        // 저장된 URL로 업데이트 (다음 저장 시 중복 방지)
        if (data.urls && data.urls[0]) {
          setUploadedImage(data.urls[0]);
        }
      } else {
        const errorData = await response.json();
        showToast(errorData.error || '저장에 실패했습니다.', 'error');
      }
    } catch (error) {
      console.error('Cloud save error:', error);
      showToast('저장 중 오류가 발생했습니다.', 'error');
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

      <div className="max-w-5xl mx-auto px-3 lg:px-4 pt-4 lg:pt-6 pb-20 h-[calc(100vh-56px)] flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg lg:text-xl font-bold mb-1 flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <FilePenLine className="w-5 h-5 text-violet-600 dark:text-violet-400" /> 상세페이지 편집
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-xs">상세페이지의 특정 영역을 AI로 편집합니다</p>
          </div>
          {uploadedImage && (
            <button
              onClick={handleNewProject}
              className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 min-h-[36px] bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors"
              title="새로 시작하기"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              새로하기
            </button>
          )}
        </div>

        {/* PC 버전 권장 안내 (모바일에서만 표시) */}
        <div className="md:hidden mb-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 flex items-start gap-2">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 text-xs">
            <p className="font-semibold text-amber-800 dark:text-amber-300 mb-0.5">PC 버전 권장</p>
            <p className="text-amber-700 dark:text-amber-400 text-[10px] leading-relaxed">
              정밀한 편집 작업을 위해 PC 또는 태블릿 환경에서 사용하시는 것을 권장합니다.
            </p>
          </div>
        </div>

        {!uploadedImage ? (
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="w-full max-w-lg p-6">
              <FileDropzone
                value={uploadedImage}
                onChange={handleUploadedImageChange}
                onCompressing={setIsCompressing}
                onError={(msg) => alert(msg)}
                colorTheme="violet"
                icon={<Layout className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
                placeholder="편집할 상세페이지를 끌어다 놓거나 클릭해서 업로드하세요"
                subPlaceholder="JPG, PNG 파일 지원 (최대 10MB)"
                imageAlt="Detail Page"
                compact
                minHeight="min-h-[160px]"
              />

              {/* Divider with "또는" */}
              <div className="relative flex items-center my-4">
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
                <span className="flex-shrink-0 mx-3 text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2">
                  또는
                </span>
                <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
              </div>

              <button
                onClick={() => setIsGalleryOpen(true)}
                className="flex items-center justify-center gap-2 py-2.5 px-4 min-h-[40px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-sm transition-colors w-full"
              >
                <FolderOpen className="w-4 h-4" />
                이미지 저장소에서 불러오기
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex gap-4 overflow-hidden">
            {/* Editor Canvas Area */}
            <div className="flex-1 flex flex-col gap-1.5">
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

                {/* 되돌리기/다시실행 버튼 */}
                <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className={`p-1.5 rounded transition-colors ${
                      historyIndex > 0
                        ? 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                        : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    }`}
                    title="되돌리기 (Ctrl+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= imageHistory.length - 1}
                    className={`p-1.5 rounded transition-colors ${
                      historyIndex < imageHistory.length - 1
                        ? 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                        : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    }`}
                    title="다시 실행 (Ctrl+Shift+Z)"
                  >
                    <Redo2 className="w-4 h-4" />
                  </button>
                  {imageHistory.length > 1 && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                      {historyIndex + 1}/{imageHistory.length}
                    </span>
                  )}
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
                    title="이미지 저장소에 저장"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Cloud className="w-3 h-3" />
                    )}
                    {isSaving ? '저장 중...' : '이미지 저장소에 저장'}
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
                      {editedSectionOverlay && imageRef.current && (() => {
                        // 전체 이미지 편집인지 확인 (마스크 기반 편집)
                        const isFullImageEdit = editedSectionOverlay.rect.x === 0 && editedSectionOverlay.rect.y === 0;
                        return (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={editedSectionOverlay.data}
                            alt="Edited Segment"
                            className="absolute z-20 shadow-xl border-2 border-green-400/80 dark:border-green-500/80"
                            style={isFullImageEdit ? {
                              // 전체 이미지 편집: 100%로 덮기
                              left: 0,
                              top: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            } : {
                              // 부분 편집: 정확한 위치/크기 계산
                              left: `${(editedSectionOverlay.rect.x / imageRef.current.naturalWidth) * 100}%`,
                              top: `${(editedSectionOverlay.rect.y / imageRef.current.naturalHeight) * 100}%`,
                              width: `${(editedSectionOverlay.rect.w / imageRef.current.naturalWidth) * 100}%`,
                              height: `${(editedSectionOverlay.rect.h / imageRef.current.naturalHeight) * 100}%`,
                            }}
                          />
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Control Panel */}
            <div className="w-72 lg:w-80 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 flex flex-col transition-colors">
              <div className="mb-4">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 mb-1.5 flex items-center gap-1.5">
                  <MousePointer2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                  1. 영역 선택
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2">
                  이미지에서 수정하고 싶은 부분을 드래그하여 선택하세요.
                </p>
                {!selectionRect ? (
                  <div className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-center text-[10px] text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-600 transition-colors">
                    선택된 영역 없음
                  </div>
                ) : (
                  <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg text-center text-[10px] text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700 font-medium transition-colors">
                    영역 선택됨 ({Math.round(selectionRect.w)}x{Math.round(selectionRect.h)})
                  </div>
                )}
              </div>

              <div className="flex-1 flex flex-col">
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
                  2. 편집 도구
                </h3>

                <div className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg mb-3 transition-colors">
                  <button
                    onClick={() => { setEditModeSub('GENERAL'); setPrompt(''); }}
                    className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-all ${editModeSub === 'GENERAL' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    AI 편집
                  </button>
                  <button
                    onClick={() => { setEditModeSub('TEXT'); setPrompt(''); }}
                    className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-all ${editModeSub === 'TEXT' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    텍스트
                  </button>
                  <button
                    onClick={() => { setEditModeSub('REPLACE'); setPrompt(''); }}
                    className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-all ${editModeSub === 'REPLACE' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    이미지 교체
                  </button>
                </div>

                {/* Tool-specific controls */}
                {editModeSub === 'TEXT' && (
                  <div className="mb-3">
                    <button
                      onClick={handleExtractText}
                      disabled={!selectionRect || isLoading}
                      className="w-full py-1.5 px-2 min-h-[32px] bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-[10px] font-medium rounded-lg hover:bg-violet-200 dark:hover:bg-violet-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Type className="w-3.5 h-3.5" />
                      선택 영역의 텍스트 추출
                    </button>
                    {extractedText && (
                      <div className="mt-1.5 p-1.5 bg-slate-50 dark:bg-slate-700/50 rounded text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 max-h-20 overflow-y-auto transition-colors">
                        추출된 텍스트: {extractedText}
                      </div>
                    )}
                  </div>
                )}

                {editModeSub === 'REPLACE' && (
                  <div className="mb-3">
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">교체할 이미지</label>
                    <FileDropzone
                      value={replacementImage}
                      onChange={setReplacementImage}
                      onCompressing={setIsCompressing}
                      onError={(msg) => alert(msg)}
                      colorTheme="violet"
                      icon={<ImagePlus className="w-5 h-5 text-violet-400 dark:text-violet-500" />}
                      placeholder="이미지 선택"
                      imageAlt="Replacement"
                      compact
                      minHeight="min-h-[60px]"
                      imageMaxHeight="h-16"
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
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
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 min-h-[70px] text-xs transition-colors"
                  />
                </div>

                {/* 크레딧 선택 + 생성 버튼 */}
                <div className="flex items-center gap-2">
                  <CreditSelectorDropdown
                    requiredCredits={5}
                    selectedType={creditType}
                    onSelect={handleCreditSelect}
                  />
                  <button
                    onClick={handleDetailEditGenerate}
                    disabled={!selectionRect || isLoading}
                    className={`px-3 py-2 min-h-[40px] rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all ${
                      !selectionRect || isLoading
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                        : 'bg-violet-600 dark:bg-violet-500 text-white hover:bg-violet-700 dark:hover:bg-violet-600'
                    }`}
                  >
                    {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                    {editModeSub === 'GENERAL' ? '변경하기' : editModeSub === 'TEXT' ? '교체하기' : '교체하기'}
                  </button>
                </div>
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
