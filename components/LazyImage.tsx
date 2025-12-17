'use client';

/**
 * LazyImage - 지연 로딩 이미지 컴포넌트
 *
 * [성능 최적화] Intersection Observer + blur placeholder
 * - 뷰포트 진입 시에만 이미지 로딩
 * - 로딩 중 blur placeholder 표시
 * - 부드러운 fade-in 애니메이션
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onClick?: () => void;
  rootMargin?: string;
  threshold?: number;
}

// 작은 blur placeholder SVG (인라인으로 사용)
const BLUR_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PC9zdmc+';

// 초기 뷰포트 체크 함수 (렌더 외부에서 안전하게 호출)
function checkInitialVisibility(element: HTMLElement | null): boolean {
  if (!element || typeof window === 'undefined') return false;
  const rect = element.getBoundingClientRect();
  return (
    rect.top < window.innerHeight + 200 &&
    rect.bottom > -200 &&
    rect.left < window.innerWidth + 200 &&
    rect.right > -200
  );
}

export function LazyImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  sizes,
  priority = false,
  onClick,
  rootMargin = '200px', // 200px 전에 미리 로딩 시작
  threshold = 0,
}: LazyImageProps) {
  const imgRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Intersection Observer 설정
  useEffect(() => {
    if (priority || isInView) return;

    const currentRef = imgRef.current;
    if (!currentRef) return;

    // 초기 뷰포트 체크 - requestAnimationFrame으로 래핑하여 cascading render 방지
    const checkVisibility = () => {
      if (checkInitialVisibility(currentRef)) {
        setIsInView(true);
        return true;
      }
      return false;
    };

    // 이미 보이는 경우 다음 프레임에서 상태 업데이트
    const rafId = requestAnimationFrame(() => {
      if (checkVisibility()) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        {
          rootMargin,
          threshold,
        }
      );

      observer.observe(currentRef);

      // cleanup을 위해 observer를 ref에 저장
      (currentRef as HTMLElement & { _observer?: IntersectionObserver })._observer = observer;
    });

    return () => {
      cancelAnimationFrame(rafId);
      const observer = (currentRef as HTMLElement & { _observer?: IntersectionObserver })._observer;
      if (observer) {
        observer.disconnect();
      }
    };
  }, [priority, isInView, rootMargin, threshold]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  // 에러 상태 UI
  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={`flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${className}`}
        onClick={onClick}
      >
        <div className="text-center text-slate-400 dark:text-slate-500">
          <svg
            className="w-8 h-8 mx-auto mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs">로딩 실패</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      onClick={onClick}
    >
      {/* Placeholder/Loading 상태 */}
      <div
        className={`absolute inset-0 bg-slate-200 dark:bg-slate-800 transition-opacity duration-300 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* 실제 이미지 - 뷰포트에 들어왔을 때만 로딩 */}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${fill ? 'object-cover' : ''}`}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
        />
      )}
    </div>
  );
}

/**
 * LazyImageGrid - 이미지 그리드에 최적화된 lazy loading
 * 처음 6개는 priority로 즉시 로딩, 나머지는 lazy loading
 */
interface LazyImageGridItemProps extends Omit<LazyImageProps, 'priority'> {
  index: number;
  priorityCount?: number;
}

export function LazyImageGridItem({
  index,
  priorityCount = 6,
  ...props
}: LazyImageGridItemProps) {
  return <LazyImage {...props} priority={index < priorityCount} />;
}
