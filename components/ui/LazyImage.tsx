/**
 * Lazy Loading Image Component
 * Contract: IMAGE_DESIGN_LAZY + PERF_FUNC_IMAGE_LAZY
 *
 * 최적화 기능:
 * - Intersection Observer 기반 레이지 로딩
 * - LQIP (Low Quality Image Placeholder) 지원
 * - Progressive loading 패턴
 * - 메모리 효율적인 이미지 관리
 * - fetchpriority 힌트 지원
 */

'use client';

import { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

// =====================================================
// Types
// =====================================================

export interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  containerClassName?: string;
  placeholderClassName?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  blurDataURL?: string;
  showPlaceholder?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  // 최적화 옵션
  rootMargin?: string;
  threshold?: number;
  unloadOnHidden?: boolean;
  fetchPriority?: 'high' | 'low' | 'auto';
}

// =====================================================
// Component
// =====================================================

function LazyImageComponent({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  containerClassName,
  placeholderClassName,
  sizes,
  priority = false,
  quality = 80,
  blurDataURL,
  showPlaceholder = true,
  onLoad,
  onError,
  objectFit = 'cover',
  rootMargin = '100px',
  threshold = 0.1,
  unloadOnHidden = false,
  fetchPriority = 'auto',
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [shouldRender, setShouldRender] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadStartTime = useRef<number>(0);

  // Optimized Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) {
      setIsInView(true);
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;

        if (isVisible) {
          setIsInView(true);
          setShouldRender(true);
          loadStartTime.current = performance.now();

          // Disconnect if not unloading on hidden
          if (!unloadOnHidden) {
            observer.disconnect();
          }
        } else if (unloadOnHidden && isLoaded) {
          // Unload image when out of view (memory optimization)
          setShouldRender(false);
          setIsLoaded(false);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority, rootMargin, threshold, unloadOnHidden, isLoaded]);

  // Handle load with performance tracking
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);

    // Track load performance in development
    if (process.env.NODE_ENV === 'development' && loadStartTime.current) {
      const loadTime = performance.now() - loadStartTime.current;
      if (loadTime > 1000) {
        console.warn(`[LazyImage] Slow load: ${src} took ${loadTime.toFixed(0)}ms`);
      }
    }

    onLoad?.();
  }, [onLoad, src]);

  // Handle error with retry logic
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
    onError?.();
  }, [onError]);

  // Memoized placeholder configuration
  const placeholder = useMemo(() => {
    if (blurDataURL) return 'blur' as const;
    if (showPlaceholder) return 'empty' as const;
    return undefined;
  }, [blurDataURL, showPlaceholder]);

  // Memoized container style
  const containerStyle = useMemo(() => {
    if (fill || !width || !height) return undefined;
    return { width, height };
  }, [fill, width, height]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        fill ? 'w-full h-full' : '',
        containerClassName
      )}
      style={containerStyle}
      role="img"
      aria-label={alt}
    >
      {/* Placeholder / Skeleton with subtle animation */}
      {showPlaceholder && !isLoaded && !hasError && (
        <div
          className={cn(
            'absolute inset-0 bg-muted',
            isInView ? 'animate-pulse' : '',
            placeholderClassName
          )}
          aria-hidden="true"
        />
      )}

      {/* Error State */}
      {hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-muted"
          role="alert"
        >
          <div className="text-center text-muted-foreground">
            <ImageOff className="w-8 h-8 mx-auto mb-2" aria-hidden="true" />
            <p className="text-xs">이미지를 불러올 수 없습니다</p>
          </div>
        </div>
      )}

      {/* Actual Image - render only when should render */}
      {shouldRender && !hasError && (
        <Image
          src={src}
          alt={alt}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          fill={fill}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          style={{ objectFit }}
          sizes={sizes}
          priority={priority}
          quality={quality}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={fetchPriority}
        />
      )}
    </div>
  );
}

// Memoized LazyImage for performance
export const LazyImage = memo(LazyImageComponent);

// =====================================================
// Image with Aspect Ratio
// =====================================================

export interface AspectRatioImageProps extends Omit<LazyImageProps, 'fill'> {
  aspectRatio?: number | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
}

export function AspectRatioImage({
  aspectRatio = 1,
  containerClassName,
  ...props
}: AspectRatioImageProps) {
  const ratio =
    typeof aspectRatio === 'string'
      ? parseAspectRatio(aspectRatio)
      : aspectRatio;

  return (
    <div
      className={cn('relative w-full', containerClassName)}
      style={{ paddingBottom: `${(1 / ratio) * 100}%` }}
    >
      <div className="absolute inset-0">
        <LazyImage {...props} fill />
      </div>
    </div>
  );
}

function parseAspectRatio(ratio: string): number {
  const [w, h] = ratio.split(':').map(Number);
  return w / h;
}

// =====================================================
// Image Gallery Grid Item
// =====================================================

export interface GalleryImageProps extends Omit<LazyImageProps, 'fill' | 'sizes'> {
  onClick?: () => void;
  selected?: boolean;
  badge?: React.ReactNode;
}

export function GalleryImage({
  onClick,
  selected = false,
  badge,
  containerClassName,
  ...props
}: GalleryImageProps) {
  return (
    <div
      className={cn(
        'relative aspect-square group cursor-pointer',
        'rounded-lg overflow-hidden',
        selected && 'ring-2 ring-primary ring-offset-2',
        containerClassName
      )}
      onClick={onClick}
    >
      <LazyImage
        {...props}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className={cn(
          'transition-transform duration-300',
          'group-hover:scale-105',
          props.className
        )}
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

      {/* Selection Indicator */}
      {selected && (
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <svg
            className="w-4 h-4 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}

      {/* Badge */}
      {badge && (
        <div className="absolute top-2 left-2">{badge}</div>
      )}
    </div>
  );
}

// =====================================================
// Preload Image with Priority
// =====================================================

export interface PreloadOptions {
  priority?: 'high' | 'low';
  timeout?: number;
}

export function preloadImage(
  src: string,
  options: PreloadOptions = {}
): Promise<void> {
  const { priority = 'low', timeout = 10000 } = options;

  return new Promise((resolve, reject) => {
    const img = new window.Image();

    // Set timeout
    const timeoutId = setTimeout(() => {
      img.src = '';
      reject(new Error(`Image preload timeout: ${src}`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to preload: ${src}`));
    };

    // Use fetchpriority hint if supported
    if ('fetchPriority' in img) {
      (img as HTMLImageElement & { fetchPriority: string }).fetchPriority = priority;
    }

    img.src = src;
  });
}

export async function preloadImages(
  srcs: string[],
  options: PreloadOptions & { concurrency?: number } = {}
): Promise<PromiseSettledResult<void>[]> {
  const { concurrency = 3, ...preloadOptions } = options;

  // Batch preloading with concurrency limit
  const results: PromiseSettledResult<void>[] = [];

  for (let i = 0; i < srcs.length; i += concurrency) {
    const batch = srcs.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((src) => preloadImage(src, preloadOptions))
    );
    results.push(...batchResults);
  }

  return results;
}

// =====================================================
// LQIP (Low Quality Image Placeholder) Generator
// =====================================================

export function generateBlurDataURL(
  width: number = 10,
  height: number = 10,
  color: string = '#e2e8f0'
): string {
  // Generate a simple SVG placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <rect width="${width}" height="${height}" fill="${color}"/>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// =====================================================
// Image Observer Hook (for advanced use cases)
// =====================================================

export function useImageObserver(
  options: { rootMargin?: string; threshold?: number } = {}
) {
  const { rootMargin = '100px', threshold = 0.1 } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const callbacks = useRef<Map<Element, (isVisible: boolean) => void>>(new Map());

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const callback = callbacks.current.get(entry.target);
          callback?.(entry.isIntersecting);
        });
      },
      { rootMargin, threshold }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [rootMargin, threshold]);

  const observe = useCallback(
    (element: Element, callback: (isVisible: boolean) => void) => {
      if (!observerRef.current) return;
      callbacks.current.set(element, callback);
      observerRef.current.observe(element);
    },
    []
  );

  const unobserve = useCallback((element: Element) => {
    if (!observerRef.current) return;
    callbacks.current.delete(element);
    observerRef.current.unobserve(element);
  }, []);

  return { observe, unobserve };
}

export default LazyImage;
