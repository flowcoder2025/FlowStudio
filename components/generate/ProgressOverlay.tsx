/**
 * Image Generation Progress Overlay
 * Contract: IMAGE_DESIGN_PROGRESS
 */

'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, ImagePlus, Wand2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// =====================================================
// Types
// =====================================================

export type GenerationStep = 'preparing' | 'generating' | 'processing' | 'uploading' | 'complete';

export interface ProgressOverlayProps {
  isOpen: boolean;
  step: GenerationStep;
  progress?: number;
  imageCount?: number;
  imagesCompleted?: number;
  estimatedTime?: number; // in seconds
  provider?: string;
  onCancel?: () => void;
}

// =====================================================
// Step Configuration
// =====================================================

const STEP_CONFIG: Record<
  GenerationStep,
  { label: string; description: string; icon: React.ReactNode }
> = {
  preparing: {
    label: '준비 중',
    description: '이미지 생성을 준비하고 있습니다...',
    icon: <Sparkles className="w-6 h-6" />,
  },
  generating: {
    label: '이미지 생성 중',
    description: 'AI가 이미지를 생성하고 있습니다...',
    icon: <Wand2 className="w-6 h-6" />,
  },
  processing: {
    label: '처리 중',
    description: '생성된 이미지를 처리하고 있습니다...',
    icon: <Loader2 className="w-6 h-6 animate-spin" />,
  },
  uploading: {
    label: '업로드 중',
    description: '이미지를 저장하고 있습니다...',
    icon: <ImagePlus className="w-6 h-6" />,
  },
  complete: {
    label: '완료',
    description: '이미지 생성이 완료되었습니다!',
    icon: <Sparkles className="w-6 h-6" />,
  },
};

// =====================================================
// Animation Helpers
// =====================================================

const ANIMATION_MESSAGES = [
  '창의적인 영감을 불어넣는 중...',
  'AI가 열심히 그리는 중...',
  '픽셀 하나하나를 정성껏 배치 중...',
  '색상과 형태를 조합하는 중...',
  '마법을 부리는 중...',
  '상상력을 현실로 만드는 중...',
  '당신만의 작품을 완성하는 중...',
];

// =====================================================
// Component
// =====================================================

export function ProgressOverlay({
  isOpen,
  step,
  progress = 0,
  imageCount = 1,
  imagesCompleted = 0,
  estimatedTime,
  provider,
  onCancel,
}: ProgressOverlayProps) {
  const [animationIndex, setAnimationIndex] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  // Cycle through animation messages
  useEffect(() => {
    if (!isOpen || step === 'complete') return;

    const interval = setInterval(() => {
      setAnimationIndex((prev) => (prev + 1) % ANIMATION_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, step]);

  // Smooth progress animation
  useEffect(() => {
    const target = progress;
    const step = target > displayProgress ? 1 : -1;

    if (Math.abs(target - displayProgress) > 1) {
      const timer = setTimeout(() => {
        setDisplayProgress((prev) => prev + step);
      }, 20);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(target);
    }
  }, [progress, displayProgress]);

  if (!isOpen) return null;

  const config = STEP_CONFIG[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card border rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center',
                step === 'complete'
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-primary/10 text-primary'
              )}
            >
              {config.icon}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-center mb-2">
            {config.label}
          </h3>

          {/* Description */}
          <p className="text-center text-muted-foreground mb-6">
            {step === 'generating'
              ? ANIMATION_MESSAGES[animationIndex]
              : config.description}
          </p>

          {/* Progress Bar */}
          {step !== 'complete' && (
            <div className="space-y-2 mb-4">
              <Progress value={displayProgress} className="h-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{Math.round(displayProgress)}%</span>
                {estimatedTime !== undefined && estimatedTime > 0 && (
                  <span>약 {Math.ceil(estimatedTime)}초 남음</span>
                )}
              </div>
            </div>
          )}

          {/* Image Count */}
          {imageCount > 1 && step !== 'complete' && (
            <p className="text-center text-sm text-muted-foreground mb-4">
              {imagesCompleted} / {imageCount} 이미지 완료
            </p>
          )}

          {/* Provider Info */}
          {provider && (
            <p className="text-center text-xs text-muted-foreground/60">
              {provider === 'google' ? 'Google Gemini' : 'OpenRouter Flux'}로 생성 중
            </p>
          )}

          {/* Cancel Button */}
          {onCancel && step !== 'complete' && (
            <button
              onClick={onCancel}
              className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              취소
            </button>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
      </div>
    </div>
  );
}

// =====================================================
// Hook for Progress Management
// =====================================================

export interface UseGenerationProgressOptions {
  onComplete?: () => void;
}

export function useGenerationProgress(options: UseGenerationProgressOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<GenerationStep>('preparing');
  const [progress, setProgress] = useState(0);
  const [imageCount, setImageCount] = useState(1);
  const [imagesCompleted, setImagesCompleted] = useState(0);
  const [provider, setProvider] = useState<string | undefined>();

  const start = (count: number = 1, providerName?: string) => {
    setIsOpen(true);
    setStep('preparing');
    setProgress(0);
    setImageCount(count);
    setImagesCompleted(0);
    setProvider(providerName);
  };

  const updateProgress = (
    newStep: GenerationStep,
    newProgress: number,
    completed?: number
  ) => {
    setStep(newStep);
    setProgress(newProgress);
    if (completed !== undefined) {
      setImagesCompleted(completed);
    }
  };

  const complete = () => {
    setStep('complete');
    setProgress(100);
    setImagesCompleted(imageCount);

    // Auto-close after 1 second
    setTimeout(() => {
      setIsOpen(false);
      options.onComplete?.();
    }, 1000);
  };

  const cancel = () => {
    setIsOpen(false);
    setStep('preparing');
    setProgress(0);
  };

  return {
    isOpen,
    step,
    progress,
    imageCount,
    imagesCompleted,
    provider,
    start,
    updateProgress,
    complete,
    cancel,
    props: {
      isOpen,
      step,
      progress,
      imageCount,
      imagesCompleted,
      provider,
      onCancel: cancel,
    },
  };
}

export default ProgressOverlay;
