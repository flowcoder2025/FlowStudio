'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Download,
  Trash2,
  Tag,
  X,
  Check,
  Loader2,
  AlertCircle,
  ImageIcon,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Header } from '@/components/Header';
import { AppMode } from '@/types';

interface ImageProject {
  id: string;
  title: string;
  description: string | null;
  mode: string;
  resultImages: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function GalleryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [projects, setProjects] = useState<ImageProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 인증 확인
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 이미지 목록 불러오기
  useEffect(() => {
    if (status === 'authenticated') {
      fetchProjects();
    }
  }, [status]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/images');

      if (!response.ok) {
        throw new Error('이미지 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 이미지 다운로드
  const handleDownload = async (imageUrl: string, projectTitle: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectTitle}_${index + 1}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('이미지 다운로드에 실패했습니다.');
    }
  };

  // 프로젝트 삭제
  const handleDelete = async (projectId: string) => {
    if (!confirm('이 프로젝트를 삭제하시겠습니까?')) {
      return;
    }

    try {
      setDeletingId(projectId);
      const response = await fetch(`/api/images/${projectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제에 실패했습니다.');
      }

      // 목록에서 제거
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  // 태그 편집 시작
  const startEditingTags = (project: ImageProject) => {
    setEditingTags(project.id);
    setTagInput(project.tags.join(', '));
  };

  // 태그 저장
  const saveTags = async (projectId: string) => {
    try {
      const tags = tagInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await fetch(`/api/images/${projectId}/tags`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tags }),
      });

      if (!response.ok) {
        throw new Error('태그 저장에 실패했습니다.');
      }

      const data = await response.json();

      // 로컬 상태 업데이트
      setProjects(projects.map(p =>
        p.id === projectId ? { ...p, tags: data.project.tags } : p
      ));

      setEditingTags(null);
      setTagInput('');
    } catch (err) {
      alert(err instanceof Error ? err.message : '태그 저장 중 오류가 발생했습니다.');
    }
  };

  // 태그 편집 취소
  const cancelEditingTags = () => {
    setEditingTags(null);
    setTagInput('');
  };

  // 모드 레이블 변환
  const getModeLabel = (mode: string) => {
    const labels: Record<string, string> = {
      'CREATE': '생성',
      'EDIT': '편집',
      'DETAIL_PAGE': '상세페이지',
      'DETAIL_EDIT': '상세 편집',
      'POSTER': '포스터',
      'COLOR_CORRECTION': '색감 보정',
    };
    return labels[mode] || mode;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header currentMode={AppMode.HOME} />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header currentMode={AppMode.HOME} />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            이미지 저장소
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            생성한 모든 이미지를 관리하고 다운로드할 수 있습니다.
          </p>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">오류 발생</p>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-16">
            <ImageIcon className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              저장된 이미지가 없습니다
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              이미지를 생성하고 저장하면 여기에 표시됩니다.
            </p>
            <button
              onClick={() => router.push('/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              이미지 생성하러 가기
            </button>
          </div>
        )}

        {/* 이미지 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* 썸네일 */}
              <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                {project.resultImages.length > 0 ? (
                  <Image
                    src={project.resultImages[0]}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                  </div>
                )}
              </div>

              {/* 정보 */}
              <div className="p-4">
                <div className="mb-3">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {project.title}
                  </h3>
                  {project.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* 메타 정보 */}
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded">
                    {getModeLabel(project.mode)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(project.createdAt)}
                  </span>
                </div>

                {/* 태그 */}
                <div className="mb-3">
                  {editingTags === project.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="태그를 쉼표로 구분하여 입력"
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveTags(project.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          저장
                        </button>
                        <button
                          onClick={cancelEditingTags}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditingTags(project)}
                      className="w-full flex items-start gap-2 p-2 text-left rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                    >
                      <Tag className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        {project.tags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {project.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400">
                            태그 추가하기
                          </span>
                        )}
                      </div>
                    </button>
                  )}
                </div>

                {/* 액션 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(project.resultImages[0], project.title, 0)}
                    disabled={project.resultImages.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    다운로드
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    disabled={deletingId === project.id}
                    className="px-4 py-2 text-sm bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingId === project.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
