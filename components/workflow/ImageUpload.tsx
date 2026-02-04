/**
 * Image Upload Component - 참조 이미지 업로드
 * Contract: Phase 8 UI Components
 * Evidence: HANDOFF_2026-01-21_P7.md
 *
 * 2026-02-04: 갤러리 이미지 선택 기능 추가
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  ZoomIn,
  Palette,
  Package,
  LayoutGrid,
  Copy,
  FolderOpen,
  Check,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import type { ReferenceMode } from "@/lib/imageProvider/types";
import type { ImageListItem } from "@/lib/images/list";

// ============================================================
// 타입 정의
// ============================================================

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
  /** Base64 data URL for API calls */
  base64Data?: string;
  uploadedUrl?: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

export interface ImageUploadProps {
  value?: UploadedImage[];
  onChange?: (images: UploadedImage[]) => void;
  onUpload?: (file: File) => Promise<string>;
  maxFiles?: number;
  maxFileSize?: number; // bytes
  acceptedFormats?: string[];
  disabled?: boolean;
  className?: string;
  /** 참조 모드 선택 UI 표시 여부 */
  showReferenceMode?: boolean;
  /** 현재 선택된 참조 모드 */
  referenceMode?: ReferenceMode;
  /** 참조 모드 변경 핸들러 */
  onReferenceModeChange?: (mode: ReferenceMode) => void;
}

// ============================================================
// 기본값
// ============================================================

const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_FORMATS = ["image/jpeg", "image/png", "image/webp"];

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// ============================================================
// 헬퍼 함수
// ============================================================

function generateId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function validateFile(
  file: File,
  acceptedFormats: string[],
  maxFileSize: number
): string | null {
  if (!acceptedFormats.includes(file.type)) {
    return `지원하지 않는 파일 형식입니다. (${acceptedFormats.map((f) => f.split("/")[1]).join(", ")})`;
  }
  if (file.size > maxFileSize) {
    return `파일 크기가 너무 큽니다. (최대 ${formatFileSize(maxFileSize)})`;
  }
  return null;
}

/** File을 base64 data URL로 변환 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================
// 미리보기 컴포넌트
// ============================================================

interface ImagePreviewProps {
  image: UploadedImage;
  onRemove: () => void;
  disabled?: boolean;
}

function ImagePreview({ image, onRemove, disabled }: ImagePreviewProps) {
  const [showFullPreview, setShowFullPreview] = useState(false);

  return (
    <div className="relative group">
      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
        {/* 이미지 */}
        <img
          src={image.previewUrl}
          alt="Preview"
          className="w-full h-full object-cover"
        />

        {/* 업로드 상태 오버레이 */}
        {image.status === "uploading" && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin mb-1" />
            <span className="text-xs text-white">{image.progress}%</span>
          </div>
        )}

        {image.status === "error" && (
          <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
        )}

        {image.status === "success" && (
          <div className="absolute top-1 right-1">
            <CheckCircle className="w-4 h-4 text-green-500 bg-white rounded-full" />
          </div>
        )}

        {/* 호버 액션 */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
            <DialogTrigger asChild>
              <button
                className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-700"
                title="확대 보기"
              >
                <ZoomIn className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-0 bg-transparent border-0">
              <img
                src={image.previewUrl}
                alt="Full preview"
                className="w-full h-auto rounded-lg"
              />
            </DialogContent>
          </Dialog>

          {!disabled && (
            <button
              onClick={onRemove}
              className="w-7 h-7 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30"
              title="삭제"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {image.error && (
        <p className="mt-1 text-xs text-red-500 truncate max-w-24" title={image.error}>
          {image.error}
        </p>
      )}
    </div>
  );
}

// ============================================================
// 갤러리 선택 모달 컴포넌트
// ============================================================

interface GalleryPickerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (images: UploadedImage[]) => void;
  maxSelectable: number;
  alreadySelectedCount: number;
}

function GalleryPickerModal({
  isOpen,
  onOpenChange,
  onSelect,
  maxSelectable,
  alreadySelectedCount,
}: GalleryPickerModalProps) {
  const t = useTranslations("workflow.ui");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const remainingSlots = maxSelectable - alreadySelectedCount;

  // SWR로 갤러리 이미지 목록 가져오기
  const { data, isLoading, error } = useSWR<{
    success: boolean;
    images: ImageListItem[];
    total: number;
  }>(isOpen ? "/api/images/list?limit=50&sortBy=createdAt&sortOrder=desc" : null, fetcher);

  const images = data?.images || [];
  const hasImages = images.length > 0;

  // 이미지 선택 토글
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else if (newSet.size < remainingSlots) {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 선택 완료 핸들러
  const handleConfirm = () => {
    const selectedImages: UploadedImage[] = images
      .filter((img) => selectedIds.has(img.id))
      .map((img) => ({
        id: `gallery_${img.id}`,
        file: new File([], img.title || "gallery-image"),
        previewUrl: img.imageUrl || "",
        base64Data: undefined, // 갤러리 이미지는 URL로 전달
        uploadedUrl: img.imageUrl || undefined,
        status: "success" as const,
        progress: 100,
      }));

    onSelect(selectedImages);
    setSelectedIds(new Set());
    onOpenChange(false);
  };

  // 모달 닫힐 때 선택 초기화
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedIds(new Set());
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t("galleryPickerTitle")}
          </DialogTitle>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("galleryPickerDesc")}
          </p>
        </DialogHeader>

        {/* 선택 현황 */}
        <div className="flex items-center justify-between px-1 py-2 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("galleryPickerSelected", { count: selectedIds.size })}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {t("galleryPickerMaxSelect", { count: remainingSlots })}
          </span>
        </div>

        {/* 이미지 그리드 */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : error || !data?.success ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>{t("galleryPickerError")}</p>
            </div>
          ) : !hasImages ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 dark:text-zinc-400">
              <ImageIcon className="w-12 h-12 mb-2" />
              <p className="text-center">
                {t("galleryPickerEmpty")}
                <br />
                <span className="text-sm">{t("galleryPickerEmptyDesc")}</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-1">
              {images.map((img) => {
                const isSelected = selectedIds.has(img.id);
                const canSelect = isSelected || selectedIds.size < remainingSlots;

                return (
                  <button
                    key={img.id}
                    onClick={() => toggleSelect(img.id)}
                    disabled={!canSelect && !isSelected}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                      isSelected
                        ? "border-primary-500 ring-2 ring-primary-500/30"
                        : canSelect
                        ? "border-transparent hover:border-zinc-300 dark:hover:border-zinc-600"
                        : "border-transparent opacity-50 cursor-not-allowed"
                    )}
                  >
                    <img
                      src={img.thumbnailUrl || img.imageUrl || ""}
                      alt={img.title || "Gallery image"}
                      className="w-full h-full object-cover"
                    />
                    {/* 선택 체크 표시 */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary-500/30 flex items-center justify-center">
                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    )}
                    {/* 호버 오버레이 */}
                    {!isSelected && canSelect && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 text-zinc-700" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
          >
            {selectedIds.size > 0
              ? t("galleryPickerConfirm", { count: selectedIds.size })
              : t("galleryPickerConfirm", { count: 0 })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 참조 모드 선택 컴포넌트
// ============================================================

interface ReferenceModeOption {
  value: ReferenceMode;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const REFERENCE_MODE_OPTIONS: ReferenceModeOption[] = [
  {
    value: "style",
    label: "스타일",
    description: "색감, 분위기만 참조",
    icon: <Palette className="w-4 h-4" />,
  },
  {
    value: "product",
    label: "제품 유지",
    description: "제품은 그대로, 배경 변경",
    icon: <Package className="w-4 h-4" />,
  },
  {
    value: "composition",
    label: "구도",
    description: "레이아웃만 참조",
    icon: <LayoutGrid className="w-4 h-4" />,
  },
  {
    value: "full",
    label: "전체 참조",
    description: "최대한 유사하게",
    icon: <Copy className="w-4 h-4" />,
  },
];

interface ReferenceModeSelectorProps {
  value: ReferenceMode;
  onChange: (mode: ReferenceMode) => void;
  disabled?: boolean;
}

function ReferenceModeSelector({ value, onChange, disabled }: ReferenceModeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        참조 방식
      </label>
      <div className="grid grid-cols-2 gap-2">
        {REFERENCE_MODE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            className={cn(
              "flex items-start gap-2 p-3 rounded-lg border text-left transition-all",
              value === option.value
                ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                value === option.value
                  ? "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              )}
            >
              {option.icon}
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  value === option.value
                    ? "text-violet-700 dark:text-violet-300"
                    : "text-zinc-700 dark:text-zinc-300"
                )}
              >
                {option.label}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {option.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function ImageUpload({
  value = [],
  onChange,
  onUpload,
  maxFiles = DEFAULT_MAX_FILES,
  maxFileSize = DEFAULT_MAX_SIZE,
  acceptedFormats = DEFAULT_FORMATS,
  disabled = false,
  className,
  showReferenceMode = false,
  referenceMode = "full",
  onReferenceModeChange,
}: ImageUploadProps) {
  const t = useTranslations("workflow.ui");
  const [images, setImages] = useState<UploadedImage[]>(value);
  const [isDragging, setIsDragging] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = images.length < maxFiles;

  // 이미지 업데이트
  const updateImages = useCallback(
    (newImages: UploadedImage[]) => {
      setImages(newImages);
      onChange?.(newImages);
    },
    [onChange]
  );

  // 파일 처리
  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remainingSlots = maxFiles - images.length;

      if (remainingSlots <= 0) {
        return;
      }

      const filesToProcess = fileArray.slice(0, remainingSlots);

      // 새 이미지 객체 생성
      const newImages: UploadedImage[] = [];

      for (const file of filesToProcess) {
        const error = validateFile(file, acceptedFormats, maxFileSize);
        const previewUrl = error ? "" : URL.createObjectURL(file);
        // base64 변환 (에러가 없을 때만)
        const base64Data = error ? undefined : await fileToBase64(file);

        newImages.push({
          id: generateId(),
          file,
          previewUrl,
          base64Data,
          status: error ? "error" : "pending",
          progress: 0,
          error: error || undefined,
        });
      }

      const allImages = [...images, ...newImages];
      updateImages(allImages);

      // 업로드 (onUpload가 제공된 경우)
      if (onUpload) {
        for (const img of newImages) {
          if (img.status === "error") continue;

          // 업로드 시작
          const updatedImages = allImages.map((i) =>
            i.id === img.id ? { ...i, status: "uploading" as const, progress: 0 } : i
          );
          updateImages(updatedImages);

          try {
            // 시뮬레이션된 진행률 (실제 업로드 API에 따라 조정 필요)
            const uploadedUrl = await onUpload(img.file);

            const finalImages = allImages.map((i) =>
              i.id === img.id
                ? { ...i, status: "success" as const, progress: 100, uploadedUrl }
                : i
            );
            updateImages(finalImages);
          } catch (err) {
            const errorImages = allImages.map((i) =>
              i.id === img.id
                ? {
                    ...i,
                    status: "error" as const,
                    error: err instanceof Error ? err.message : "업로드 실패",
                  }
                : i
            );
            updateImages(errorImages);
          }
        }
      } else {
        // onUpload가 없으면 바로 success
        const successImages = allImages.map((img) =>
          img.status === "pending"
            ? { ...img, status: "success" as const, progress: 100 }
            : img
        );
        updateImages(successImages);
      }
    },
    [images, maxFiles, acceptedFormats, maxFileSize, onUpload, updateImages]
  );

  // 파일 선택 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && canAddMore) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || !canAddMore) return;

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      acceptedFormats.includes(file.type)
    );

    if (files.length > 0) {
      processFiles(files);
    }
  };

  // 이미지 제거
  const handleRemove = (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove?.previewUrl) {
      URL.revokeObjectURL(imageToRemove.previewUrl);
    }
    const newImages = images.filter((img) => img.id !== id);
    updateImages(newImages);
  };

  // 갤러리에서 선택한 이미지 추가
  const handleGallerySelect = useCallback(
    (selectedImages: UploadedImage[]) => {
      const allImages = [...images, ...selectedImages];
      updateImages(allImages);
    },
    [images, updateImages]
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* 업로드 / 갤러리 선택 영역 - 동일 크기 양자택일 */}
      <div className={cn(
        "grid grid-cols-2 gap-3",
        !canAddMore && "opacity-50"
      )}>
        {/* 파일 업로드 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-4 text-center transition-all min-h-[120px] flex flex-col items-center justify-center",
            isDragging && "border-primary-500 bg-primary-50 dark:bg-primary-900/20",
            disabled
              ? "bg-zinc-50 dark:bg-zinc-800 cursor-not-allowed"
              : "cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          )}
          onClick={() => !disabled && canAddMore && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(",")}
            multiple={maxFiles > 1}
            onChange={handleFileSelect}
            disabled={disabled || !canAddMore}
            className="hidden"
          />

          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center mb-2",
              isDragging ? "bg-primary-100 dark:bg-primary-900/30" : "bg-zinc-100 dark:bg-zinc-800"
            )}
          >
            <Upload
              className={cn(
                "w-5 h-5",
                isDragging ? "text-primary-500" : "text-zinc-400"
              )}
            />
          </div>

          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {isDragging ? "여기에 놓으세요" : "업로드 또는 드래그앤드랍"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {acceptedFormats.map((f) => f.split("/")[1].toUpperCase()).join(", ")} • {formatFileSize(maxFileSize)}
          </p>
        </div>

        {/* 갤러리에서 선택 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled && canAddMore) {
              setShowGalleryPicker(true);
            }
          }}
          disabled={disabled || !canAddMore}
          className={cn(
            "border-2 border-dashed rounded-xl p-4 text-center transition-all min-h-[120px] flex flex-col items-center justify-center",
            disabled
              ? "bg-zinc-50 dark:bg-zinc-800 cursor-not-allowed"
              : "cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          )}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-zinc-100 dark:bg-zinc-800">
            <FolderOpen className="w-5 h-5 text-zinc-400" />
          </div>

          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("selectFromGallery")}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            이전 생성 이미지
          </p>
        </button>
      </div>

      {/* 최대 개수 안내 */}
      {!canAddMore && (
        <p className="text-xs text-orange-500 text-center">
          최대 {maxFiles}개까지 업로드할 수 있습니다
        </p>
      )}

      {/* 갤러리 선택 모달 */}
      <GalleryPickerModal
        isOpen={showGalleryPicker}
        onOpenChange={setShowGalleryPicker}
        onSelect={handleGallerySelect}
        maxSelectable={maxFiles}
        alreadySelectedCount={images.length}
      />

      {/* 이미지 미리보기 목록 */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((image) => (
            <ImagePreview
              key={image.id}
              image={image}
              onRemove={() => handleRemove(image.id)}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {/* 참조 모드 선택 */}
      {showReferenceMode && onReferenceModeChange && (
        <div className="space-y-2">
          <ReferenceModeSelector
            value={referenceMode}
            onChange={onReferenceModeChange}
            disabled={disabled || images.length === 0}
          />
          {images.length === 0 && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center">
              이미지를 업로드하면 참조 방식을 선택할 수 있습니다
            </p>
          )}
        </div>
      )}

      {/* 업로드 카운터 */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            {images.filter((i) => i.status === "success").length}개 업로드됨
          </span>
          <span>
            {images.length} / {maxFiles}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 단순 썸네일 컴포넌트 (읽기 전용)
// ============================================================

export interface ImageThumbnailListProps {
  images: string[];
  maxVisible?: number;
  className?: string;
}

export function ImageThumbnailList({
  images,
  maxVisible = 4,
  className,
}: ImageThumbnailListProps) {
  const visibleImages = images.slice(0, maxVisible);
  const remainingCount = images.length - maxVisible;

  if (images.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-zinc-400 dark:text-zinc-500", className)}>
        <ImageIcon className="w-4 h-4" />
        <span className="text-sm">이미지 없음</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {visibleImages.map((url, index) => (
        <div
          key={index}
          className="w-8 h-8 rounded overflow-hidden bg-zinc-100 dark:bg-zinc-800"
        >
          <img src={url} alt="" className="w-full h-full object-cover" />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="w-8 h-8 rounded bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
}
