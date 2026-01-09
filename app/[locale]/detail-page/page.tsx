'use client';

import React, { useState, useEffect, useCallback } from 'react';
import NextImage from 'next/image';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Layout, Camera, Eye, X, Plus, Trash2, Grid, Columns, Square, MoveDiagonal2, FolderOpen, Save, FileText, Clock, FilePlus2, History, RefreshCw } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CreditSelectorDropdown, CreditType } from '@/components/CreditSelectorDropdown';
import { ImageCountSelector, getRequiredCredits } from '@/components/ImageCountSelector';
import { AppMode, Category, StyleOption, LayoutOption, GenerationRequest } from '@/types';
import { DETAIL_PAGE_CATEGORIES, LAYOUT_OPTIONS } from '@/constants';
import { generateImageVariations } from '@/services/geminiService';
import type { HistorySession } from '@/components/SessionHistoryModal';

const ImageGalleryModal = dynamic(() => import('@/components/ImageGalleryModal').then(mod => mod.ImageGalleryModal));
const ResultGrid = dynamic(() => import('@/components/ResultGrid').then(mod => mod.ResultGrid));
const ConfirmationDialog = dynamic(() => import('@/components/ConfirmationDialog').then(mod => mod.ConfirmationDialog));
const SessionHistoryModal = dynamic(() => import('@/components/SessionHistoryModal').then(mod => mod.SessionHistoryModal));

// Draft type for the list
interface DraftSummary {
  id: string;
  title: string;
  selectedCategoryId: string | null;
  detailPageSegments: string[];
  createdAt: string;
  updatedAt: string;
}

// Icon mapping for layout options
const layoutIcons: Record<string, React.ReactNode> = {
  square: <Square className="w-4 h-4" />,
  columns: <Columns className="w-4 h-4" />,
  grid: <Grid className="w-4 h-4" />,
  'move-diagonal-2': <MoveDiagonal2 className="w-4 h-4" />,
};

export default function DetailPagePage() {
  return (
    <AuthGuard>
      <DetailPageContent />
    </AuthGuard>
  );
}

function DetailPageContent() {
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations('detailPage');
  const tCommon = useTranslations('common');

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StyleOption | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<LayoutOption | null>(null);
  const [prompt, setPrompt] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [detailPageSegments, setDetailPageSegments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [galleryTarget, setGalleryTarget] = useState<'main' | 'ref' | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Draft management state
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [currentDraftTitle, setCurrentDraftTitle] = useState<string>('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false);

  // Section candidate selection state
  const [candidateImages, setCandidateImages] = useState<string[]>([]);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [creditType, setCreditType] = useState<CreditType>('auto');
  const [willHaveWatermark, setWillHaveWatermark] = useState(false);
  const [imageCount, setImageCount] = useState(1);
  const [isMerging, setIsMerging] = useState(false);

  // Session history state
  const [sessionHistory, setSessionHistory] = useState<HistorySession[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [replaceSegmentIndex, setReplaceSegmentIndex] = useState<number | null>(null);

  // Confirmation dialog state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingSelectImage, setPendingSelectImage] = useState<string | null>(null);
  const [pendingSelectIndex, setPendingSelectIndex] = useState<number | null>(null);
  const [isSelectProcessing, setIsSelectProcessing] = useState(false);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const handleCreditSelect = (type: CreditType, hasWatermark: boolean) => {
    setCreditType(type);
    setWillHaveWatermark(hasWatermark);
  };

  useEffect(() => {
    if (isLoadModalOpen) {
      fetchDrafts();
    }
  }, [isLoadModalOpen]);

  const fetchDrafts = async () => {
    setIsLoadingDrafts(true);
    try {
      const response = await fetch('/api/detail-page-drafts');
      if (response.ok) {
        const data = await response.json();
        setDrafts(data.drafts || []);
      }
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      setIsLoadingDrafts(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!draftTitle.trim()) {
      alert(t('alertEnterDraftTitle'));
      return;
    }

    setIsSaving(true);
    try {
      const draftData = {
        title: draftTitle,
        selectedCategoryId: selectedCategory?.id || null,
        selectedStyleId: selectedStyle?.id || null,
        selectedLayoutId: selectedLayout?.id || null,
        prompt,
        uploadedImage,
        refImage,
        detailPageSegments,
      };

      let response;
      if (currentDraftId) {
        response = await fetch(`/api/detail-page-drafts/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftData),
        });
      } else {
        response = await fetch('/api/detail-page-drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftData),
        });
      }

      if (response.ok) {
        const data = await response.json();
        setCurrentDraftId(data.draft.id);
        setCurrentDraftTitle(draftTitle);
        setIsSaveModalOpen(false);
        alert(t('alertDraftSaved'));
      } else {
        const errorData = await response.json();
        alert(errorData.error || t('alertSaveFailed'));
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      alert(t('alertSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadDraft = async (draftId: string) => {
    try {
      const response = await fetch(`/api/detail-page-drafts/${draftId}`);
      if (response.ok) {
        const data = await response.json();
        const draft = data.draft;

        setCurrentDraftId(draft.id);
        setCurrentDraftTitle(draft.title);
        setDraftTitle(draft.title);

        const category = DETAIL_PAGE_CATEGORIES.find(c => c.id === draft.selectedCategoryId);
        setSelectedCategory(category || null);

        if (category && draft.selectedStyleId) {
          const style = category.styles.find(s => s.id === draft.selectedStyleId);
          setSelectedStyle(style || null);
        } else {
          setSelectedStyle(null);
        }

        const layout = LAYOUT_OPTIONS.find(l => l.id === draft.selectedLayoutId);
        setSelectedLayout(layout || null);

        setPrompt(draft.prompt || '');
        setUploadedImage(draft.uploadedImage || null);
        setRefImage(draft.refImage || null);
        setDetailPageSegments(draft.detailPageSegments || []);

        setIsLoadModalOpen(false);
        alert(t('alertDraftLoaded', { title: draft.title }));
      } else {
        alert(t('alertLoadFailed'));
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      alert(t('alertLoadError'));
    }
  };

  const handleDeleteDraft = async (draftId: string, draftTitleToDelete: string) => {
    if (!confirm(t('confirmDeleteDraft', { title: draftTitleToDelete }))) return;

    try {
      const response = await fetch(`/api/detail-page-drafts/${draftId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDrafts(drafts.filter(d => d.id !== draftId));
        if (currentDraftId === draftId) {
          setCurrentDraftId(null);
          setCurrentDraftTitle('');
        }
      } else {
        alert(t('alertDeleteFailed'));
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
      alert(t('alertDeleteError'));
    }
  };

  const openSaveModal = () => {
    setDraftTitle(currentDraftTitle || `${t('defaultDraftTitle')} ${new Date().toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US')}`);
    setIsSaveModalOpen(true);
  };

  const handleNewProject = () => {
    if (detailPageSegments.length > 0 || uploadedImage || selectedCategory) {
      if (!confirm(t('confirmNewProject'))) {
        return;
      }
    }

    setSelectedCategory(null);
    setSelectedStyle(null);
    setSelectedLayout(null);
    setPrompt('');
    setUploadedImage(null);
    setRefImage(null);
    setDetailPageSegments([]);
    setCurrentDraftId(null);
    setCurrentDraftTitle('');
    setDraftTitle('');
  };

  const handleGallerySelect = (imageUrl: string) => {
    if (galleryTarget === 'main') {
      setUploadedImage(imageUrl);
    } else if (galleryTarget === 'ref') {
      setRefImage(imageUrl);
    }
    setGalleryTarget(null);
  };

  const handleGenerate = async () => {
    if (!uploadedImage) {
      alert(t('alertUploadProduct'));
      return;
    }

    if (!selectedCategory) {
      alert(t('alertSelectCategory'));
      return;
    }

    if (willHaveWatermark) {
      const confirmed = confirm(t('confirmWatermark'));
      if (!confirmed) return;
    }

    setIsLoading(true);
    try {
      const request: GenerationRequest = {
        mode: AppMode.DETAIL_PAGE,
        prompt: prompt || (detailPageSegments.length === 0 ? t('defaultIntroPrompt') : t('defaultSectionPrompt')),
        image: uploadedImage,
        refImage: refImage || undefined,
        category: selectedCategory,
        style: selectedStyle || undefined,
        layout: selectedLayout || undefined,
        aspectRatio: '9:16'
      };

      const images = await generateImageVariations(request, creditType, imageCount);
      if (images.length > 0) {
        const newSessionId = `session_${Date.now()}`;
        setCurrentSessionId(newSessionId);

        const newSession: HistorySession = {
          id: newSessionId,
          images: images,
          prompt: prompt || (detailPageSegments.length === 0 ? t('defaultIntroPrompt') : t('defaultSectionPrompt')),
          timestamp: new Date(),
        };
        setSessionHistory(prev => [newSession, ...prev]);

        setCandidateImages(images);
        setIsSelectionModalOpen(true);
      } else {
        alert(t('alertGenerationFailed'));
      }
    } catch (error) {
      console.error(error);
      alert(t('alertError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMore = async () => {
    if (!uploadedImage || !selectedCategory) return;

    setIsLoading(true);
    try {
      const request: GenerationRequest = {
        mode: AppMode.DETAIL_PAGE,
        prompt: prompt || (detailPageSegments.length === 0 ? t('defaultIntroPrompt') : t('defaultSectionPrompt')),
        image: uploadedImage,
        refImage: refImage || undefined,
        category: selectedCategory,
        style: selectedStyle || undefined,
        layout: selectedLayout || undefined,
        aspectRatio: '9:16'
      };

      const images = await generateImageVariations(request, creditType, imageCount);
      if (images.length > 0) {
        setCandidateImages(prev => [...prev, ...images]);

        if (currentSessionId) {
          setSessionHistory(prev => prev.map(session =>
            session.id === currentSessionId
              ? { ...session, images: [...session.images, ...images] }
              : session
          ));
        }
      } else {
        alert(t('alertGenerationFailed'));
      }
    } catch (error) {
      console.error(error);
      alert(t('alertError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCandidateClick = useCallback((image: string) => {
    const imageIndex = candidateImages.indexOf(image);
    const unsavedCount = candidateImages.length - 1;

    setPendingSelectImage(image);
    setPendingSelectIndex(imageIndex);

    if (unsavedCount > 0) {
      setIsConfirmDialogOpen(true);
    } else {
      processSelectCandidate(image, imageIndex);
    }
  }, [candidateImages]);

  const processSelectCandidate = async (image: string, imageIndex: number) => {
    setIsSelectProcessing(true);
    try {
      const response = await fetch('/api/images/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [image],
          mode: 'DETAIL_PAGE',
          prompt: prompt || t('defaultSectionPrompt'),
          category: selectedCategory?.id,
          style: selectedStyle?.id,
          aspectRatio: '9:16',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const savedUrl = data.urls[0];
        setDetailPageSegments([...detailPageSegments, savedUrl]);
      } else {
        setDetailPageSegments([...detailPageSegments, image]);
        console.error('Failed to save image to cloud, using base64');
      }

      if (currentSessionId) {
        setSessionHistory(prev => prev.map(session =>
          session.id === currentSessionId
            ? { ...session, usedImageIndex: imageIndex }
            : session
        ));
      }
    } catch (error) {
      setDetailPageSegments([...detailPageSegments, image]);
      console.error('Error saving image:', error);
    } finally {
      setIsSelectProcessing(false);
      setIsConfirmDialogOpen(false);
      setPendingSelectImage(null);
      setPendingSelectIndex(null);
    }

    setCandidateImages([]);
    setIsSelectionModalOpen(false);
    setPrompt('');
  };

  const handleConfirmSelect = () => {
    if (pendingSelectImage !== null && pendingSelectIndex !== null) {
      processSelectCandidate(pendingSelectImage, pendingSelectIndex);
    }
  };

  const handleCancelSelect = () => {
    setIsConfirmDialogOpen(false);
    setPendingSelectImage(null);
    setPendingSelectIndex(null);
  };

  const handleSelectFromHistory = async (image: string, sessionId: string, imageIndex: number) => {
    if (replaceSegmentIndex === null) {
      try {
        const response = await fetch('/api/images/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: [image],
            mode: 'DETAIL_PAGE',
            prompt: t('selectedFromHistory'),
            category: selectedCategory?.id,
            style: selectedStyle?.id,
            aspectRatio: '9:16',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setDetailPageSegments(prev => [...prev, data.urls[0]]);
        } else {
          setDetailPageSegments(prev => [...prev, image]);
        }
      } catch {
        setDetailPageSegments(prev => [...prev, image]);
      }
    } else {
      try {
        const response = await fetch('/api/images/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: [image],
            mode: 'DETAIL_PAGE',
            prompt: t('replacedFromHistory'),
            category: selectedCategory?.id,
            style: selectedStyle?.id,
            aspectRatio: '9:16',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setDetailPageSegments(prev => {
            const newSegments = [...prev];
            newSegments[replaceSegmentIndex] = data.urls[0];
            return newSegments;
          });
        } else {
          setDetailPageSegments(prev => {
            const newSegments = [...prev];
            newSegments[replaceSegmentIndex] = image;
            return newSegments;
          });
        }
      } catch {
        setDetailPageSegments(prev => {
          const newSegments = [...prev];
          newSegments[replaceSegmentIndex] = image;
          return newSegments;
        });
      }
    }

    setSessionHistory(prev => prev.map(session =>
      session.id === sessionId
        ? { ...session, usedImageIndex: imageIndex }
        : session
    ));

    setIsHistoryModalOpen(false);
    setReplaceSegmentIndex(null);
  };

  const startReplaceSegment = (index: number) => {
    setReplaceSegmentIndex(index);
    setIsHistoryModalOpen(true);
  };

  const handleCloseSelection = () => {
    setCandidateImages([]);
    setIsSelectionModalOpen(false);
  };

  const handleSaveToCloud = async (image: string) => {
    try {
      const response = await fetch('/api/images/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [image],
          mode: 'DETAIL_PAGE',
          prompt: prompt || t('defaultSectionPrompt'),
          category: selectedCategory?.id,
          style: selectedStyle?.id,
          aspectRatio: '9:16',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || t('alertSavedToStorage'));
      } else {
        const errorData = await response.json();
        alert(errorData.error || t('alertSaveFailed'));
      }
    } catch (error) {
      console.error('Cloud save error:', error);
      alert(t('alertSaveError'));
    }
  };

  const handleMergeDownload = async () => {
    if (detailPageSegments.length === 0) {
      alert(t('alertNoSections'));
      return;
    }

    setIsMerging(true);
    try {
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      const images = await Promise.all(detailPageSegments.map(loadImage));

      const maxWidth = Math.max(...images.map(img => img.width));
      const totalHeight = images.reduce((sum, img) => sum + img.height, 0);

      const canvas = document.createElement('canvas');
      canvas.width = maxWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, maxWidth, totalHeight);

      let y = 0;
      for (const img of images) {
        const x = (maxWidth - img.width) / 2;
        ctx.drawImage(img, x, y);
        y += img.height;
      }

      const link = document.createElement('a');
      link.download = `detail-page-merged-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(t('alertMergeComplete', { count: detailPageSegments.length }));
    } catch (error) {
      console.error('Merge download error:', error);
      alert(t('alertMergeError'));
    } finally {
      setIsMerging(false);
    }
  };

  const removeSegment = (index: number) => {
    if (confirm(t('confirmDeleteSection'))) {
      setDetailPageSegments(detailPageSegments.filter((_, i) => i !== index));
    }
  };

  return (
    <>
      <Header currentMode={AppMode.DETAIL_PAGE} />

      <div className="max-w-5xl mx-auto px-3 lg:px-4 pt-4 lg:pt-6 pb-20 flex flex-col md:flex-row gap-4 lg:gap-6">
        {/* Left Panel: Controls */}
        <div className="md:w-1/2 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg lg:text-xl font-bold mb-1 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Layout className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span className="truncate">{t('pageTitle')}</span>
                  {currentDraftTitle && (
                    <span className="hidden md:inline-flex text-sm font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded truncate max-w-[120px]">
                      {currentDraftTitle}
                    </span>
                  )}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-xs">
                  {t('pageDescription')}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={handleNewProject}
                  className="flex items-center justify-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 min-h-[32px] min-w-[32px] sm:min-w-0 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors"
                  title={t('newProject')}
                >
                  <FilePlus2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('new')}</span>
                </button>
                <button
                  onClick={() => setIsLoadModalOpen(true)}
                  className="flex items-center justify-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 min-h-[32px] min-w-[32px] sm:min-w-0 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors"
                  title={t('loadDraft')}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('open')}</span>
                </button>
                {sessionHistory.length > 0 && (
                  <button
                    onClick={() => { setReplaceSegmentIndex(null); setIsHistoryModalOpen(true); }}
                    className="flex items-center justify-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 min-h-[32px] min-w-[32px] sm:min-w-0 bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-600 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium transition-colors"
                    title={t('imageHistory')}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{sessionHistory.reduce((sum, s) => sum + s.images.length, 0)}</span>
                  </button>
                )}
                <button
                  onClick={openSaveModal}
                  className="flex items-center justify-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 min-h-[32px] min-w-[32px] sm:min-w-0 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                  title={t('saveDraft')}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tCommon('save')}</span>
                </button>
              </div>
          </div>

          {/* Global Product Upload */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h3 className="font-semibold text-sm lg:text-base mb-2 text-slate-800 dark:text-slate-100">{t('step1Title')}</h3>
            <FileDropzone
              value={uploadedImage}
              onChange={setUploadedImage}
              onCompressing={setIsCompressing}
              onError={(msg) => alert(msg)}
              colorTheme="blue"
              icon={<Camera className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              placeholder={t('step1Placeholder')}
              subPlaceholder={t('step1SubPlaceholder')}
              imageAlt="Main Product"
              compact
              minHeight="min-h-[80px]"
              imageMaxHeight="h-14"
            />

            <div className="relative flex items-center my-3">
              <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
              <span className="flex-shrink-0 mx-3 text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2">
                {t('or')}
              </span>
              <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            </div>

            <button
              onClick={() => setGalleryTarget('main')}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 min-h-[36px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-xs transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              {t('loadFromGallery')}
            </button>
          </div>

          {/* Category & Style */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h3 className="font-semibold text-sm lg:text-base mb-2 text-slate-800 dark:text-slate-100">{t('step2Title')}</h3>
            <div className="mb-3">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">{t('categoryLabel')}</label>
              <div className="grid grid-cols-2 gap-1.5">
                {DETAIL_PAGE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat); setSelectedStyle(null); }}
                    className={`p-2 rounded-lg text-left text-xs transition-all border ${
                      selectedCategory?.id === cat.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 ring-1 ring-blue-500 dark:ring-blue-400 text-slate-900 dark:text-slate-100'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-400 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {selectedCategory && (
              <div className="mb-3">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">{t('styleLabel')}</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {selectedCategory.styles.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style)}
                      className={`p-1.5 rounded-lg text-center text-xs transition-all border ${
                        selectedStyle?.id === style.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300 font-bold'
                          : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Layout Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">{t('layoutLabel')}</label>
              <div className="grid grid-cols-2 gap-1.5">
                {LAYOUT_OPTIONS.map(layout => (
                  <button
                    key={layout.id}
                    onClick={() => setSelectedLayout(selectedLayout?.id === layout.id ? null : layout)}
                    className={`p-2 rounded-lg text-left text-xs transition-all border flex items-start gap-1.5 ${
                      selectedLayout?.id === layout.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 ring-1 ring-blue-500 dark:ring-blue-400'
                        : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-400'
                    }`}
                  >
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">
                      {layoutIcons[layout.icon] || <Square className="w-4 h-4" />}
                    </span>
                    <div>
                      <span className="block font-semibold text-slate-800 dark:text-slate-100 text-xs">{layout.label}</span>
                      <span className="block text-slate-500 dark:text-slate-400 text-[10px]">{layout.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reference Image (Optional) */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h3 className="font-semibold text-sm lg:text-base mb-2 text-slate-800 dark:text-slate-100">{t('step3Title')}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('step3Description')}</p>
            <FileDropzone
              value={refImage}
              onChange={setRefImage}
              onCompressing={setIsCompressing}
              onError={(msg) => alert(msg)}
              colorTheme="purple"
              icon={<Eye className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              placeholder={t('step3Placeholder')}
              subPlaceholder={t('step3SubPlaceholder')}
              imageAlt="Reference"
              compact
              minHeight="min-h-[80px]"
              imageMaxHeight="h-14"
            />

            <div className="relative flex items-center my-3">
              <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
              <span className="flex-shrink-0 mx-3 text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2">
                {t('or')}
              </span>
              <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            </div>

            <button
              onClick={() => setGalleryTarget('ref')}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 min-h-[36px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-xs transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              {t('loadFromGallery')}
            </button>
          </div>

          {/* Section Generation */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 transition-colors">
            <h3 className="font-semibold text-sm lg:text-base mb-2 text-slate-800 dark:text-slate-100">
              {detailPageSegments.length === 0 ? t('step4TitleFirst') : t('step4TitleNext', { num: detailPageSegments.length + 1 })}
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={detailPageSegments.length === 0 ? t('promptPlaceholderIntro') : t('promptPlaceholderSection')}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[80px] mb-3 text-sm transition-colors"
            />

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              {selectedCategory ? selectedCategory.label : t('selectCategoryPlaceholder')}
              {selectedStyle ? ` > ${selectedStyle.label}` : ''}
              {selectedLayout ? ` > ${selectedLayout.label}` : ''}
            </p>

            <div className="flex items-center gap-2">
              <ImageCountSelector
                value={imageCount}
                onChange={setImageCount}
                disabled={isLoading}
              />
              <CreditSelectorDropdown
                requiredCredits={getRequiredCredits(imageCount)}
                selectedType={creditType}
                onSelect={handleCreditSelect}
              />
              <button
                onClick={handleGenerate}
                disabled={!uploadedImage || !selectedCategory || isLoading}
                className={`px-4 py-2 min-h-[40px] rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                  !uploadedImage || !selectedCategory || isLoading
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-blue-200 dark:hover:shadow-blue-900'
                }`}
              >
                {isLoading ? t('generating') : (detailPageSegments.length === 0 ? t('generateIntro') : t('generateNextSection'))}
                {!isLoading && <Plus className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Canvas */}
        <div className="md:w-1/2 bg-slate-200 dark:bg-slate-900 rounded-xl p-4 overflow-hidden flex flex-col min-h-[400px] lg:min-h-[500px] border border-slate-300 dark:border-slate-700 transition-colors">
          <h3 className="text-center text-slate-600 dark:text-slate-300 font-semibold text-sm mb-3 flex items-center justify-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> {t('previewTitle')}
          </h3>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-300/50 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col items-center gap-0.5">
            {detailPageSegments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-3 py-12">
                <div className="w-16 h-24 border-2 border-dashed border-slate-400 dark:border-slate-600 rounded-md"></div>
                <p className="text-xs text-center">{t('emptyPreviewMessage')}</p>
              </div>
            ) : (
              detailPageSegments.map((segment, idx) => (
                <div key={idx} className="relative group w-full max-w-[280px] lg:max-w-[320px] shadow-lg">
                  <NextImage
                    src={segment}
                    alt={`Section ${idx}`}
                    width={320}
                    height={568}
                    className="w-full h-auto block"
                    unoptimized={segment.startsWith('data:')}
                  />
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {sessionHistory.length > 0 && (
                      <button
                        onClick={() => startReplaceSegment(idx)}
                        className="p-1 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                        title={t('replaceWithOther')}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => removeSegment(idx)}
                      className="p-1 bg-red-600 dark:bg-red-500 text-white rounded-md shadow-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                      title={t('deleteSection')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-black/50 dark:bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">#{idx + 1}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {detailPageSegments.length > 0 && (
            <div className="mt-3 text-center">
              <button
                onClick={handleMergeDownload}
                disabled={isMerging}
                className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[36px] bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                {isMerging ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('merging')}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    {t('mergeDownload', { count: detailPageSegments.length })}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <LoadingOverlay isVisible={isLoading} message={t('loadingMessage')} />
      <LoadingOverlay isVisible={isCompressing} message={t('compressingMessage')} />

      {isSelectionModalOpen && (
        <ResultGrid
          images={candidateImages}
          onClose={handleCloseSelection}
          onSelect={handleSelectCandidateClick}
          onSave={handleSaveToCloud}
          onGenerateMore={handleGenerateMore}
        />
      )}

      <ImageGalleryModal
        isOpen={galleryTarget !== null}
        onClose={() => setGalleryTarget(null)}
        onSelect={handleGallerySelect}
        title={galleryTarget === 'main' ? t('selectProductImage') : t('selectRefImage')}
      />

      {/* Save Draft Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Save className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {t('saveDraftModalTitle')}
              </h3>
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('draftTitleLabel')}
              </label>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder={t('draftTitlePlaceholder')}
                className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="flex-1 py-2.5 min-h-[40px] px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex-1 py-2.5 min-h-[40px] px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('saving')}
                  </>
                ) : (
                  tCommon('save')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Draft Modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-xl transition-colors">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                {t('loadDraftModalTitle')}
              </h3>
              <button
                onClick={() => setIsLoadModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
              {isLoadingDrafts ? (
                <div className="flex items-center justify-center py-8">
                  <svg className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : drafts.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t('noDrafts')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {drafts.map(draft => (
                    <div
                      key={draft.id}
                      className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => handleLoadDraft(draft.id)}
                          className="flex-1 text-left"
                        >
                          <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">{draft.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(draft.updatedAt).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                            {draft.detailPageSegments.length > 0 && (
                              <span className="ml-2">{t('sectionCount', { count: draft.detailPageSegments.length })}</span>
                            )}
                          </p>
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(draft.id, draft.title)}
                          className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Session History Modal */}
      <SessionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => { setIsHistoryModalOpen(false); setReplaceSegmentIndex(null); }}
        sessions={sessionHistory}
        onSelectImage={handleSelectFromHistory}
        title={replaceSegmentIndex !== null ? t('selectReplacementImage') : t('selectFromHistory')}
      />

      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onConfirm={handleConfirmSelect}
        onClose={handleCancelSelect}
        title={t('confirmSelectTitle')}
        message={t('confirmSelectMessage', { count: candidateImages.length - 1 })}
        confirmText={tCommon('confirm')}
        cancelText={tCommon('cancel')}
        isLoading={isSelectProcessing}
      />
    </>
  );
}
