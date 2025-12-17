'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon } from 'lucide-react';
import { compressImageWithStats, isFileTooLarge } from '@/lib/utils/imageCompression';

export interface FileDropzoneProps {
  /** 현재 업로드된 이미지 (base64 또는 URL) */
  value: string | null;
  /** 이미지 변경 시 콜백 */
  onChange: (image: string | null) => void;
  /** 압축 중 상태 콜백 (외부에서 로딩 오버레이 표시용) */
  onCompressing?: (isCompressing: boolean) => void;
  /** 에러 발생 시 콜백 */
  onError?: (message: string) => void;
  /** 색상 테마 (테두리, 배경 등) */
  colorTheme?: 'indigo' | 'emerald' | 'blue' | 'violet' | 'rose' | 'amber' | 'purple';
  /** 업로드 아이콘 */
  icon?: React.ReactNode;
  /** 플레이스홀더 텍스트 (첫 번째 줄) */
  placeholder?: string;
  /** 플레이스홀더 서브텍스트 (두 번째 줄) */
  subPlaceholder?: string;
  /** 업로드된 이미지 alt 텍스트 */
  imageAlt?: string;
  /** 이미지 최대 높이 클래스 */
  imageMaxHeight?: string;
  /** 추가 className */
  className?: string;
  /** 드랍존 최소 높이 */
  minHeight?: string;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 압축 사용 여부 */
  enableCompression?: boolean;
  /** 압축 시작 크기 (MB) */
  compressionThreshold?: number;
  /** 압축 목표 크기 (MB) */
  compressionTarget?: number;
  /** 컴팩트 모드 (작은 사이즈) */
  compact?: boolean;
}

const colorThemes = {
  indigo: {
    active: 'border-indigo-500 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20',
    drag: 'border-indigo-500 dark:border-indigo-400 bg-indigo-100 dark:bg-indigo-900/40 scale-[1.02]',
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm',
    ring: 'ring-indigo-500 dark:ring-indigo-400',
    iconHover: 'group-hover:text-indigo-500 dark:group-hover:text-indigo-400',
  },
  emerald: {
    active: 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
    drag: 'border-emerald-500 dark:border-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 scale-[1.02]',
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm',
    ring: 'ring-emerald-500 dark:ring-emerald-400',
    iconHover: 'group-hover:text-emerald-500 dark:group-hover:text-emerald-400',
  },
  blue: {
    active: 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30',
    drag: 'border-blue-500 dark:border-blue-400 bg-blue-100 dark:bg-blue-900/40 scale-[1.02]',
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm',
    ring: 'ring-blue-500 dark:ring-blue-400',
    iconHover: 'group-hover:text-blue-500 dark:group-hover:text-blue-400',
  },
  violet: {
    active: 'border-violet-500 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20',
    drag: 'border-violet-500 dark:border-violet-400 bg-violet-100 dark:bg-violet-900/40 scale-[1.02]',
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm',
    ring: 'ring-violet-500 dark:ring-violet-400',
    iconHover: 'group-hover:text-violet-500 dark:group-hover:text-violet-400',
  },
  rose: {
    active: 'border-rose-500 dark:border-rose-400 bg-rose-50 dark:bg-rose-900/20',
    drag: 'border-rose-500 dark:border-rose-400 bg-rose-100 dark:bg-rose-900/40 scale-[1.02]',
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm',
    ring: 'ring-rose-500 dark:ring-rose-400',
    iconHover: 'group-hover:text-rose-500 dark:group-hover:text-rose-400',
  },
  amber: {
    active: 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/20',
    drag: 'border-amber-500 dark:border-amber-400 bg-amber-100 dark:bg-amber-900/40 scale-[1.02]',
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm',
    ring: 'ring-amber-500 dark:ring-amber-400',
    iconHover: 'group-hover:text-amber-500 dark:group-hover:text-amber-400',
  },
  purple: {
    active: 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30',
    drag: 'border-purple-500 dark:border-purple-400 bg-purple-100 dark:bg-purple-900/40 scale-[1.02]',
    hover: 'hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-sm',
    ring: 'ring-purple-500 dark:ring-purple-400',
    iconHover: 'group-hover:text-purple-500 dark:group-hover:text-purple-400',
  },
};

export function FileDropzone({
  value,
  onChange,
  onCompressing,
  onError,
  colorTheme = 'indigo',
  icon,
  placeholder = '이미지를 끌어다 놓거나 클릭해서 업로드하세요',
  subPlaceholder = 'PNG, JPG (최대 10MB)',
  imageAlt = 'Uploaded image',
  imageMaxHeight = 'h-48',
  className = '',
  minHeight = 'min-h-[200px]',
  disabled = false,
  enableCompression = true,
  compressionThreshold = 3,
  compressionTarget = 2,
  compact = false,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const theme = colorThemes[colorTheme];

  // compact 모드에서 minHeight 자동 조정
  const effectiveMinHeight = compact ? 'min-h-[80px]' : minHeight;

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError?.('이미지 파일만 업로드 가능합니다.');
      return;
    }

    try {
      if (enableCompression && isFileTooLarge(file, compressionThreshold)) {
        onCompressing?.(true);
        console.log(`🖼️ 이미지 압축 시작: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);

        const result = await compressImageWithStats(file, {
          maxSizeMB: compressionTarget,
          maxWidthOrHeight: 2048,
        });

        console.log(`✅ 압축 완료: ${result.originalSizeMB.toFixed(2)}MB → ${result.compressedSizeMB.toFixed(2)}MB (${result.reductionPercent.toFixed(1)}% 감소)`);
        onChange(result.compressed);
        onCompressing?.(false);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('이미지 처리 오류:', error);
      onCompressing?.(false);
      onError?.('이미지 처리 중 오류가 발생했습니다. 다른 이미지를 시도해주세요.');
    }
  }, [enableCompression, compressionThreshold, compressionTarget, onChange, onCompressing, onError]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input value to allow re-uploading same file
    e.target.value = '';
  }, [processFile]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current -= 1;
    if (dragCountRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current = 0;
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  }, [disabled, processFile]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  }, [onChange]);

  const getDropzoneClasses = () => {
    const baseClasses = `border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-200 flex items-center justify-center ${effectiveMinHeight}`;

    if (disabled) {
      return `${baseClasses} border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-not-allowed opacity-60`;
    }

    if (isDragging) {
      return `${baseClasses} ${theme.drag}`;
    }

    if (value) {
      return `${baseClasses} ${theme.active}`;
    }

    return `${baseClasses} border-slate-300 dark:border-slate-600 ${theme.hover}`;
  };

  const paddingClass = compact ? 'p-3' : 'p-8';

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group ${getDropzoneClasses()} ${paddingClass} ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={placeholder}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />

      {value ? (
        <div className={`relative ${compact ? 'h-16' : imageMaxHeight} w-full flex items-center justify-center`}>
          <Image
            src={value}
            alt={imageAlt}
            fill
            className="object-contain rounded-lg shadow-sm"
            unoptimized={value.startsWith('data:')}
          />
          <button
            onClick={handleRemove}
            className={`absolute top-0 right-0 ${compact ? '-mt-1 -mr-1' : '-mt-2 -mr-2'} bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-md transition-colors z-10`}
            aria-label="이미지 제거"
          >
            <X className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
          </button>
        </div>
      ) : (
        <div className={`flex ${compact ? 'flex-row gap-3' : 'flex-col gap-3'} items-center justify-center`}>
          {icon ? (
            <span className={`transition-colors ${theme.iconHover}`}>{icon}</span>
          ) : (isDragging ? (
            <Upload className={`${compact ? 'w-5 h-5' : 'w-10 h-10'} text-${colorTheme}-500 dark:text-${colorTheme}-400 animate-bounce`} />
          ) : (
            <ImageIcon className={`${compact ? 'w-5 h-5' : 'w-10 h-10'} text-slate-400 dark:text-slate-500 transition-colors ${theme.iconHover}`} />
          ))}
          <div className={compact ? 'flex items-center' : ''}>
            <p className={`text-slate-600 dark:text-slate-300 font-medium transition-colors group-hover:text-slate-800 dark:group-hover:text-slate-100 ${compact ? 'text-sm' : 'text-center'}`}>
              {isDragging ? '여기에 놓으세요!' : placeholder}
            </p>
            {subPlaceholder && !isDragging && !compact && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 transition-colors group-hover:text-slate-500 dark:group-hover:text-slate-400">{subPlaceholder}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileDropzone;
