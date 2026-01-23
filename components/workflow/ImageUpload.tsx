/**
 * Image Upload Component - 참조 이미지 업로드
 * Contract: Phase 8 UI Components
 * Evidence: HANDOFF_2026-01-21_P7.md
 */

"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ============================================================
// 타입 정의
// ============================================================

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
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
}

// ============================================================
// 기본값
// ============================================================

const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_FORMATS = ["image/jpeg", "image/png", "image/webp"];

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
}: ImageUploadProps) {
  const [images, setImages] = useState<UploadedImage[]>(value);
  const [isDragging, setIsDragging] = useState(false);
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

        newImages.push({
          id: generateId(),
          file,
          previewUrl,
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

  return (
    <div className={cn("space-y-4", className)}>
      {/* 업로드 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all",
          isDragging && "border-primary-500 bg-primary-50 dark:bg-primary-900/20",
          disabled
            ? "bg-zinc-50 dark:bg-zinc-800 cursor-not-allowed"
            : "cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
          !canAddMore && "opacity-50"
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

        <div className="flex flex-col items-center gap-2">
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              isDragging ? "bg-primary-100 dark:bg-primary-900/30" : "bg-zinc-100 dark:bg-zinc-800"
            )}
          >
            <Upload
              className={cn(
                "w-6 h-6",
                isDragging ? "text-primary-500" : "text-zinc-400"
              )}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {isDragging ? "여기에 놓으세요" : "클릭하거나 드래그하여 업로드"}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {acceptedFormats.map((f) => f.split("/")[1].toUpperCase()).join(", ")} • 최대{" "}
              {formatFileSize(maxFileSize)}
            </p>
          </div>

          {!canAddMore && (
            <p className="text-xs text-orange-500">
              최대 {maxFiles}개까지 업로드할 수 있습니다
            </p>
          )}
        </div>
      </div>

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
