'use client';

/**
 * ImageDropzone - Single image upload with drag-and-drop + gallery select
 * Used by: Edit, Poster, Detail Edit pages
 */

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UPLOAD_LIMITS } from '@/lib/tools/constants';
import { GalleryPicker } from './GalleryPicker';

export interface ImageDropzoneProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Show gallery picker button */
  showGalleryPicker?: boolean;
  /** Aspect ratio hint for preview */
  previewAspect?: 'square' | 'video' | 'auto';
}

export function ImageDropzone({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  className,
  showGalleryPicker = true,
  previewAspect = 'auto',
}: ImageDropzoneProps) {
  const t = useTranslations('tools.dropzone');
  const [isDragging, setIsDragging] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!(UPLOAD_LIMITS.acceptedFormats as readonly string[]).includes(file.type)) return;
      if (file.size > UPLOAD_LIMITS.maxFileSize) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [onChange]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith('image/')) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClear = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleGallerySelect = useCallback(
    (imageUrl: string) => {
      onChange(imageUrl);
      setShowGallery(false);
    },
    [onChange]
  );

  const aspectClass =
    previewAspect === 'square'
      ? 'aspect-square'
      : previewAspect === 'video'
      ? 'aspect-video'
      : 'aspect-[4/3]';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label */}
      {label && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {label}
          </span>
          <span className={cn(
            'text-xs px-1.5 py-0.5 rounded',
            required
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
          )}>
            {required ? t('required') : t('optional')}
          </span>
        </div>
      )}

      {/* Image Preview or Upload Area */}
      {value ? (
        <div className="relative group">
          <div className={cn(
            'bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700',
            aspectClass
          )}>
            <img
              src={value}
              alt="Uploaded"
              className="w-full h-full object-contain"
            />
          </div>
          {/* Actions overlay */}
          {!disabled && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-md text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
              >
                {t('selectAnother')}
              </button>
              <button
                onClick={handleClear}
                className="w-8 h-8 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={UPLOAD_LIMITS.acceptedFormats.join(',')}
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
          />
        </div>
      ) : (
        <div className={cn(
          'grid gap-3',
          showGalleryPicker ? 'grid-cols-2' : 'grid-cols-1'
        )}>
          {/* File Upload */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px]',
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center mb-2',
              isDragging ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-zinc-100 dark:bg-zinc-800'
            )}>
              <Upload className={cn('w-5 h-5', isDragging ? 'text-blue-500' : 'text-zinc-400')} />
            </div>
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {isDragging ? t('dragActive') : t('dragOrClick')}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {t('supportedFormats')}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={UPLOAD_LIMITS.acceptedFormats.join(',')}
              onChange={handleInputChange}
              disabled={disabled}
              className="hidden"
            />
          </div>

          {/* Gallery Select */}
          {showGalleryPicker && (
            <button
              type="button"
              onClick={() => !disabled && setShowGallery(true)}
              disabled={disabled}
              className={cn(
                'border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px]',
                'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-zinc-100 dark:bg-zinc-800">
                <FolderOpen className="w-5 h-5 text-zinc-400" />
              </div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('selectFromGallery')}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {t('previousImages')}
              </p>
            </button>
          )}
        </div>
      )}

      {/* Gallery Picker Dialog */}
      {showGalleryPicker && (
        <GalleryPicker
          isOpen={showGallery}
          onOpenChange={setShowGallery}
          onSelect={handleGallerySelect}
          maxSelectable={1}
        />
      )}
    </div>
  );
}
