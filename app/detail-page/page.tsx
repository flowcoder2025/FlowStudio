'use client';

import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { Layout, Camera, Eye, X, Plus, Trash2, Grid, Columns, Square, MoveDiagonal2, FolderOpen, Save, FileText, Clock, FilePlus2 } from 'lucide-react';
import { FileDropzone } from '@/components/FileDropzone';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { ImageGalleryModal } from '@/components/ImageGalleryModal';
import { ResultGrid } from '@/components/ResultGrid';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppMode, Category, StyleOption, LayoutOption, GenerationRequest } from '@/types';
import { DETAIL_PAGE_CATEGORIES, LAYOUT_OPTIONS } from '@/constants';
import { generateImageVariations } from '@/services/geminiService';

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

  // Section candidate selection state (4장 생성 후 선택, 추가 생성 가능)
  const [candidateImages, setCandidateImages] = useState<string[]>([]);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  // Fetch drafts when load modal opens
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
      alert('초안 제목을 입력해주세요.');
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
        // Update existing draft
        response = await fetch(`/api/detail-page-drafts/${currentDraftId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(draftData),
        });
      } else {
        // Create new draft
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
        alert('초안이 저장되었습니다.');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      alert('저장 중 오류가 발생했습니다.');
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

        // Restore state from draft
        setCurrentDraftId(draft.id);
        setCurrentDraftTitle(draft.title);
        setDraftTitle(draft.title);

        // Find and set category
        const category = DETAIL_PAGE_CATEGORIES.find(c => c.id === draft.selectedCategoryId);
        setSelectedCategory(category || null);

        // Find and set style (from category's styles)
        if (category && draft.selectedStyleId) {
          const style = category.styles.find(s => s.id === draft.selectedStyleId);
          setSelectedStyle(style || null);
        } else {
          setSelectedStyle(null);
        }

        // Find and set layout
        const layout = LAYOUT_OPTIONS.find(l => l.id === draft.selectedLayoutId);
        setSelectedLayout(layout || null);

        setPrompt(draft.prompt || '');
        setUploadedImage(draft.uploadedImage || null);
        setRefImage(draft.refImage || null);
        setDetailPageSegments(draft.detailPageSegments || []);

        setIsLoadModalOpen(false);
        alert(`"${draft.title}" 초안을 불러왔습니다.`);
      } else {
        alert('초안을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      alert('불러오기 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteDraft = async (draftId: string, draftTitleToDelete: string) => {
    if (!confirm(`"${draftTitleToDelete}" 초안을 삭제하시겠습니까?`)) return;

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
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const openSaveModal = () => {
    setDraftTitle(currentDraftTitle || `상세페이지 ${new Date().toLocaleDateString('ko-KR')}`);
    setIsSaveModalOpen(true);
  };

  const handleNewProject = () => {
    if (detailPageSegments.length > 0 || uploadedImage || selectedCategory) {
      if (!confirm('현재 작업 중인 내용이 있습니다. 새로 시작하시겠습니까?')) {
        return;
      }
    }

    // Reset all state
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
      alert('제품 사진을 업로드해주세요.');
      return;
    }

    if (!selectedCategory) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const request: GenerationRequest = {
        mode: AppMode.DETAIL_PAGE,
        prompt: prompt || (detailPageSegments.length === 0 ? '제품 인트로 섹션' : '제품 설명 섹션'),
        image: uploadedImage,
        refImage: refImage || undefined,
        category: selectedCategory,
        style: selectedStyle || undefined,
        layout: selectedLayout || undefined,
        aspectRatio: '9:16'
      };

      const images = await generateImageVariations(request);
      if (images.length > 0) {
        setCandidateImages(images);
        setIsSelectionModalOpen(true);
        // Usage is now tracked server-side in /api/generate
      } else {
        alert('섹션 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
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
        prompt: prompt || (detailPageSegments.length === 0 ? '제품 인트로 섹션' : '제품 설명 섹션'),
        image: uploadedImage,
        refImage: refImage || undefined,
        category: selectedCategory,
        style: selectedStyle || undefined,
        layout: selectedLayout || undefined,
        aspectRatio: '9:16'
      };

      const images = await generateImageVariations(request);
      if (images.length > 0) {
        setCandidateImages(prev => [...prev, ...images]);
      } else {
        alert('섹션 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCandidate = async (image: string) => {
    // Save the selected image to cloud storage
    try {
      const response = await fetch('/api/images/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [image],
          mode: 'DETAIL_PAGE',
          prompt: prompt || '상세페이지 섹션',
          category: selectedCategory?.id,
          style: selectedStyle?.id,
          aspectRatio: '9:16',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Use the cloud URL instead of base64
        const savedUrl = data.urls[0];
        setDetailPageSegments([...detailPageSegments, savedUrl]);
      } else {
        // Fallback to base64 if save fails
        setDetailPageSegments([...detailPageSegments, image]);
        console.error('Failed to save image to cloud, using base64');
      }
    } catch (error) {
      // Fallback to base64 on error
      setDetailPageSegments([...detailPageSegments, image]);
      console.error('Error saving image:', error);
    }

    setCandidateImages([]);
    setIsSelectionModalOpen(false);
    setPrompt(''); // Clear prompt for next section
  };

  const handleCloseSelection = () => {
    setCandidateImages([]);
    setIsSelectionModalOpen(false);
  };

  const removeSegment = (index: number) => {
    if (confirm('이 섹션을 삭제하시겠습니까?')) {
      setDetailPageSegments(detailPageSegments.filter((_, i) => i !== index));
    }
  };

  return (
    <>
      <Header currentMode={AppMode.DETAIL_PAGE} />

      <div className="max-w-5xl mx-auto px-3 lg:px-4 pt-4 lg:pt-6 pb-20 flex flex-col md:flex-row gap-4 lg:gap-6">
        {/* Left Panel: Controls */}
        <div className="md:w-1/2 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2 md:gap-3">
            <div>
              <h2 className="text-lg lg:text-xl font-bold mb-1 flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Layout className="w-5 h-5 text-blue-600 dark:text-blue-400" /> 상세페이지 빌더
                {currentDraftTitle && (
                  <span className="hidden sm:inline-flex text-sm font-normal text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {currentDraftTitle}
                  </span>
                )}
              </h2>
              <p className="hidden md:block text-slate-600 dark:text-slate-300 text-xs">
                원하는 섹션을 순서대로 생성하여 쌓아올리세요. (가로 1080px 기준)
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={handleNewProject}
                className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 min-h-[36px] bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors"
                title="새로 시작하기"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">새로하기</span>
              </button>
              <button
                onClick={() => setIsLoadModalOpen(true)}
                className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 min-h-[36px] bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors"
                title="불러오기"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">불러오기</span>
              </button>
              <button
                onClick={openSaveModal}
                className="flex items-center gap-1 px-2 md:px-2.5 py-1.5 min-h-[36px] bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors"
                title="저장하기"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">저장하기</span>
              </button>
            </div>
          </div>

          {/* Global Product Upload */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h3 className="font-semibold text-sm lg:text-base mb-2 text-slate-800 dark:text-slate-100">1. 메인 제품 사진 (필수)</h3>
            <FileDropzone
              value={uploadedImage}
              onChange={setUploadedImage}
              onCompressing={setIsCompressing}
              onError={(msg) => alert(msg)}
              colorTheme="blue"
              icon={<Camera className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              placeholder="제품 사진을 끌어다 놓거나 클릭해서 업로드하세요"
              subPlaceholder="모든 섹션 생성시 참조됩니다."
              imageAlt="Main Product"
              compact
              minHeight="min-h-[80px]"
              imageMaxHeight="h-14"
            />

            {/* Divider with "또는" */}
            <div className="relative flex items-center my-3">
              <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
              <span className="flex-shrink-0 mx-3 text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2">
                또는
              </span>
              <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            </div>

            {/* Gallery Button */}
            <button
              onClick={() => setGalleryTarget('main')}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 min-h-[36px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-xs transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              이미지 저장소에서 불러오기
            </button>
          </div>

          {/* Category & Style */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <h3 className="font-semibold text-sm lg:text-base mb-2 text-slate-800 dark:text-slate-100">2. 컨셉 설정</h3>
            <div className="mb-3">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">카테고리</label>
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
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">스타일</label>
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
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">레이아웃 (선택)</label>
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
            <h3 className="font-semibold text-sm lg:text-base mb-2 text-slate-800 dark:text-slate-100">3. 스타일 참조 이미지 (선택)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">다른 상세페이지의 스타일을 참조하여 비슷한 분위기로 생성합니다.</p>
            <FileDropzone
              value={refImage}
              onChange={setRefImage}
              onCompressing={setIsCompressing}
              onError={(msg) => alert(msg)}
              colorTheme="purple"
              icon={<Eye className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              placeholder="참조 이미지를 끌어다 놓거나 클릭해서 업로드하세요 (선택)"
              subPlaceholder="이 이미지의 스타일을 참조합니다."
              imageAlt="Reference"
              compact
              minHeight="min-h-[80px]"
              imageMaxHeight="h-14"
            />

            {/* Divider with "또는" */}
            <div className="relative flex items-center my-3">
              <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
              <span className="flex-shrink-0 mx-3 text-xs font-medium text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2">
                또는
              </span>
              <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
            </div>

            {/* Gallery Button */}
            <button
              onClick={() => setGalleryTarget('ref')}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 min-h-[36px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-xs transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              이미지 저장소에서 불러오기
            </button>
          </div>

          {/* Section Generation */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 transition-colors">
            <h3 className="font-semibold text-sm lg:text-base mb-2 text-slate-800 dark:text-slate-100">
              {detailPageSegments.length === 0 ? '4. 첫번째 섹션(인트로) 만들기' : `4. ${detailPageSegments.length + 1}번째 섹션 추가하기`}
            </h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={detailPageSegments.length === 0
                ? "예: 제품 이름이 크게 들어간 임팩트 있는 인트로. '순수 비타민 세럼' 텍스트 포함."
                : "예: 핵심 성분을 설명하는 섹션. 비타민 C의 효능을 강조하는 그래프와 아이콘."}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[80px] mb-3 text-sm transition-colors"
            />

            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || !selectedCategory || isLoading}
              className={`w-full py-2.5 min-h-[44px] rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                !uploadedImage || !selectedCategory || isLoading
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-blue-200 dark:hover:shadow-blue-900'
              }`}
            >
              {isLoading ? '생성 중...' : (detailPageSegments.length === 0 ? '인트로 생성하기' : '다음 섹션 생성하기')}
              {!isLoading && <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Right Panel: Canvas */}
        <div className="md:w-1/2 bg-slate-200 dark:bg-slate-900 rounded-xl p-4 overflow-hidden flex flex-col min-h-[400px] lg:min-h-[500px] border border-slate-300 dark:border-slate-700 transition-colors">
          <h3 className="text-center text-slate-600 dark:text-slate-300 font-semibold text-sm mb-3 flex items-center justify-center gap-1.5">
            <Eye className="w-3.5 h-3.5" /> 미리보기 (1080px 기준)
          </h3>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-300/50 dark:bg-slate-800/50 rounded-lg p-3 flex flex-col items-center gap-0.5">
            {detailPageSegments.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-3 py-12">
                <div className="w-16 h-24 border-2 border-dashed border-slate-400 dark:border-slate-600 rounded-md"></div>
                <p className="text-xs text-center">생성된 상세페이지가<br />여기에 순서대로 쌓입니다.</p>
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
                  <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => removeSegment(idx)}
                      className="p-1 bg-red-600 dark:bg-red-500 text-white rounded-md shadow-md hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
                      title="섹션 삭제"
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
                onClick={() => alert("브라우저의 '이미지 저장' 기능을 이용해 개별 섹션을 저장한 후 포토샵 등에서 연결해주세요. (전체 병합 다운로드 기능 준비중)")}
                className="text-xs text-slate-500 dark:text-slate-400 underline hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                전체 이미지 다운로드 가이드
              </button>
            </div>
          )}
        </div>
      </div>

      <LoadingOverlay isVisible={isLoading} message="상세페이지 섹션 4장을 생성하고 있습니다..." />
      <LoadingOverlay isVisible={isCompressing} message="이미지 압축 중..." />

      {/* 4장 생성 결과에서 선택 */}
      {isSelectionModalOpen && (
        <ResultGrid
          images={candidateImages}
          onClose={handleCloseSelection}
          onSelect={handleSelectCandidate}
          onGenerateMore={handleGenerateMore}
        />
      )}

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={galleryTarget !== null}
        onClose={() => setGalleryTarget(null)}
        onSelect={handleGallerySelect}
        title={galleryTarget === 'main' ? '제품 이미지 선택' : '참조 이미지 선택'}
      />

      {/* Save Draft Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Save className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                초안 저장하기
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
                초안 제목
              </label>
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="예: 비타민 세럼 상세페이지"
                className="w-full p-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
              />
            </div>
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm text-slate-600 dark:text-slate-300 transition-colors">
              <p className="font-medium mb-1">저장되는 정보:</p>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>카테고리 및 스타일 설정</li>
                <li>제품 사진 및 참조 이미지</li>
                <li>생성된 섹션 {detailPageSegments.length}개</li>
                <li>현재 프롬프트</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsSaveModalOpen(false)}
                className="flex-1 py-2.5 px-4 min-h-[44px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving || !draftTitle.trim()}
                className="flex-1 py-2.5 px-4 min-h-[44px] bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white disabled:text-slate-500 rounded-lg font-medium transition-colors"
              >
                {isSaving ? '저장 중...' : currentDraftId ? '덮어쓰기' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Draft Modal */}
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-xl transition-colors">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                저장된 초안 불러오기
              </h3>
              <button
                onClick={() => setIsLoadModalOpen(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingDrafts ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                </div>
              ) : drafts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p>저장된 초안이 없습니다.</p>
                  <p className="text-sm mt-1">작업 중인 상세페이지를 저장해보세요.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {drafts.map((draft) => {
                    const categoryLabel = DETAIL_PAGE_CATEGORIES.find(c => c.id === draft.selectedCategoryId)?.label;
                    return (
                      <div
                        key={draft.id}
                        className="group border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-300 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => handleLoadDraft(draft.id)}
                          >
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">{draft.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              {categoryLabel && (
                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{categoryLabel}</span>
                              )}
                              <span>{draft.detailPageSegments.length}개 섹션</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(draft.updatedAt).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleLoadDraft(draft.id)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-sm font-medium transition-colors"
                            >
                              불러오기
                            </button>
                            <button
                              onClick={() => handleDeleteDraft(draft.id, draft.title)}
                              className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {draft.detailPageSegments.length > 0 && (
                          <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
                            {draft.detailPageSegments.slice(0, 4).map((segment, idx) => (
                              <div key={idx} className="relative w-12 h-16 flex-shrink-0">
                                <NextImage
                                  src={segment}
                                  alt={`Section ${idx + 1}`}
                                  fill
                                  className="object-cover rounded border border-slate-200 dark:border-slate-700"
                                  unoptimized={segment.startsWith('data:')}
                                />
                              </div>
                            ))}
                            {draft.detailPageSegments.length > 4 && (
                              <div className="w-12 h-16 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                                +{draft.detailPageSegments.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setIsLoadModalOpen(false)}
                className="w-full py-2.5 px-4 min-h-[44px] bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
