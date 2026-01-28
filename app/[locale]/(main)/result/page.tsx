/**
 * Image Generation Result Page with SimilarWorkflows & ImmersiveResult
 * Contract: INTEGRATION_DESIGN_WORKFLOW_RESULT
 * Evidence: Phase 10 Page Integration + Phase E Immersive Result
 */

'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Download, Share2, RefreshCw, ZoomIn, Heart, ArrowLeft, Sparkles, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useWorkflowStore, GenerationResult } from '@/lib/workflow/store';
import { SimilarWorkflows, CrossIndustryList } from '@/components/workflow/SimilarWorkflows';
import { generateRecommendations, WorkflowRecommendation } from '@/lib/workflow/recommend';
import { matchIntent } from '@/lib/workflow/intents';
import type { ExpressionIntent } from '@/lib/workflow/intents';

// Dynamic import for modal component (bundle optimization)
const ImmersiveResult = dynamic(
  () => import('@/components/workflow/ImmersiveResult').then(mod => mod.ImmersiveResult),
  { ssr: false }
);

// =====================================================
// Types
// =====================================================

interface GeneratedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  provider: string;
  model: string;
}

// =====================================================
// Loading Component
// =====================================================

function LoadingState({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">{message || 'Loading...'}</p>
      </div>
    </div>
  );
}

// =====================================================
// Main Content Component
// =====================================================

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const t = useTranslations("pages.result");

  // Zustand store - state selectors only (rerender-defer-reads)
  // Actions are accessed via getState() in callbacks to avoid unnecessary re-renders
  const storeResult = useWorkflowStore((state) => state.generationResult);
  const selectedIndustry = useWorkflowStore((state) => state.selectedIndustry);
  const selectedIntent = useWorkflowStore((state) => state.selectedIntent);
  const showImmersiveResult = useWorkflowStore((state) => state.showImmersiveResult);

  const [result, setResult] = useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [similarWorkflows, setSimilarWorkflows] = useState<WorkflowRecommendation[]>([]);

  // Load result from store or session storage
  useEffect(() => {
    const loadResult = () => {
      // Try store first
      if (storeResult) {
        setResult(storeResult);
        setLoading(false);
        return;
      }

      // Try session storage
      const cached = sessionStorage.getItem('generationResult');
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as GenerationResult;
          setResult(parsed);
          setLoading(false);
          return;
        } catch {
          // Invalid cached data
        }
      }

      // If no result, redirect to home
      if (!sessionId) {
        router.push('/');
        return;
      }

      setLoading(false);
    };

    loadResult();
  }, [sessionId, router, storeResult]);

  // Auto-open immersive result when result is loaded
  useEffect(() => {
    if (result?.success && result.images.length > 0) {
      // 결과가 로드되면 자동으로 몰입형 모드 열기 (getState for action)
      useWorkflowStore.getState().openImmersiveResult();
    }
  }, [result]);

  // Load similar workflows based on current selection
  useEffect(() => {
    if (selectedIndustry) {
      // Create a search query based on industry and intent
      const searchQuery = `${selectedIndustry} ${selectedIntent ?? ''}`.trim();
      const intentResult = matchIntent(searchQuery);
      const recommendations = generateRecommendations(intentResult);
      const allRecs = [
        ...(recommendations.primary ? [recommendations.primary] : []),
        ...recommendations.alternatives,
      ];
      setSimilarWorkflows(allRecs.slice(0, 10));
    }
  }, [selectedIndustry, selectedIntent]);

  // Handle download
  const handleDownload = useCallback(async (image: GeneratedImage) => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flowstudio_${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  }, []);

  // Handle regenerate
  const handleRegenerate = useCallback(() => {
    sessionStorage.removeItem('generationResult');
    router.back();
  }, [router]);

  // Handle save to gallery
  const handleSave = useCallback(async (image: GeneratedImage) => {
    try {
      const response = await fetch('/api/images/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: image.url,
          title: `Generated Image`,
          prompt: image.prompt,
          negativePrompt: image.negativePrompt,
          provider: image.provider,
          model: image.model,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(t("savedToGallery"));
      } else {
        alert(data.error || t("saveFailed"));
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert(t("saveError"));
    }
  }, [t]);

  // Handle similar workflow selection (using getState for actions)
  const handleSimilarSelect = useCallback(
    (recommendation: WorkflowRecommendation) => {
      const store = useWorkflowStore.getState();
      store.selectIndustry(recommendation.industry);
      store.selectIntent(recommendation.intent);
      store.setCurrentStep('guide');
      router.push(`/workflow/${recommendation.industry}?intent=${recommendation.intent}`);
    },
    [router]
  );

  // Handle create new (using getState for action)
  const handleCreateNew = useCallback(() => {
    useWorkflowStore.getState().resetWorkflow();
    router.push('/');
  }, [router]);

  // Loading state
  if (loading) {
    return <LoadingState message={t("loadingResult")} />;
  }

  // No result
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">{t("noResult")}</p>
        <Button asChild>
          <Link href="/">{t("goHome")}</Link>
        </Button>
      </div>
    );
  }

  // Error state
  if (!result.success) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-destructive mb-2">
                {t("generationFailed")}
              </h2>
              <p className="text-muted-foreground mb-4">{result.error}</p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("goBack")}
                </Button>
                <Button onClick={handleRegenerate}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t("tryAgain")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">
            {t("imagesGenerated", { count: result.images.length })} • {t("creditsUsed", { credits: result.creditsUsed })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => useWorkflowStore.getState().openImmersiveResult()}>
            <Maximize2 className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("immersiveMode")}</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleCreateNew}>
            <Sparkles className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("createNew")}</span>
          </Button>
          <Button size="sm" onClick={handleRegenerate}>
            <RefreshCw className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("regenerate")}</span>
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      <div
        className={cn(
          'grid gap-4 mb-8',
          result.images.length === 1
            ? 'grid-cols-1 max-w-2xl mx-auto'
            : result.images.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-2 lg:grid-cols-2'
        )}
      >
        {result.images.map((image) => (
          <Card key={image.id} className="overflow-hidden group">
            <CardContent className="p-0 relative">
              {/* Image */}
              <div
                className="relative aspect-square cursor-pointer"
                onClick={() => {
                  setSelectedImage(image);
                  setLightboxOpen(true);
                }}
              >
                <Image
                  src={image.url}
                  alt={image.prompt}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ZoomIn className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Actions */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleSave(image);
                    }}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleDownload(image);
                    }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generation Info */}
      <div className="p-4 bg-muted rounded-lg mb-8">
        <h3 className="font-medium mb-2">{t("prompt")}</h3>
        <p className="text-sm text-muted-foreground">{result.images[0]?.prompt}</p>
        {result.images[0]?.negativePrompt && (
          <>
            <h3 className="font-medium mt-4 mb-2">{t("negativePrompt")}</h3>
            <p className="text-sm text-muted-foreground">
              {result.images[0].negativePrompt}
            </p>
          </>
        )}
        <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
          <span>{t("provider")}: {result.provider}</span>
          <span>{t("model")}: {result.model}</span>
          {result.duration && (
            <span>{t("generationTime", { seconds: (result.duration / 1000).toFixed(1) })}</span>
          )}
        </div>
      </div>

      {/* Similar Workflows Section */}
      {selectedIndustry && similarWorkflows.length > 0 && (
        <SimilarWorkflows
          currentIndustry={selectedIndustry}
          currentIntent={selectedIntent ?? ('model_wearing' as ExpressionIntent)}
          recommendations={similarWorkflows}
          onSelect={handleSimilarSelect}
          title={t("similarWorkflows")}
          showReason={true}
          maxItems={8}
          className="mb-8"
        />
      )}

      {/* Cross Industry Recommendations */}
      {selectedIndustry && similarWorkflows.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <CrossIndustryList
            recommendations={similarWorkflows}
            currentIndustry={selectedIndustry}
            onSelect={handleSimilarSelect}
          />
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("imageDetail")}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative aspect-square w-full">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.prompt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 80vw"
                />
              </div>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => handleSave(selectedImage)}>
                  <Heart className="w-4 h-4 mr-2" />
                  {t("saveToGallery")}
                </Button>
                <Button variant="outline" onClick={() => handleDownload(selectedImage)}>
                  <Download className="w-4 h-4 mr-2" />
                  {t("download")}
                </Button>
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  {t("share")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Immersive Result Modal */}
      {result && (
        <ImmersiveResult
          isOpen={showImmersiveResult}
          onClose={() => useWorkflowStore.getState().closeImmersiveResult()}
          result={result}
          onRegenerate={handleRegenerate}
          onCreateNew={handleCreateNew}
        />
      )}
    </div>
  );
}

// =====================================================
// Page Component with Suspense
// =====================================================

export default function ResultPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResultContent />
    </Suspense>
  );
}
