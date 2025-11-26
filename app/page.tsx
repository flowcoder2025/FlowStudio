'use client';

import React from 'react';
import { Sparkles, Layout, FilePenLine, Wand2, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { AppMode } from '@/types';

export default function HomePage() {
  return (
    <>
      <Header currentMode={AppMode.HOME} />

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            BizAI 스튜디오
          </h1>
          <p className="text-slate-600 text-lg">
            복잡한 포토샵 없이, 전문가급 제품 사진과 홍보물을 30초 만에 만들어보세요.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Create Card */}
          <div
            onClick={() => window.location.href = '/create'}
            className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer"
          >
            <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">새로운 이미지</h3>
            <p className="text-slate-500 mb-3 text-xs h-10">
              제품 사진이나 컨셉만으로 SNS 홍보물, 메뉴판, 포스터용 이미지를 생성합니다.
            </p>
            <div className="flex items-center text-indigo-600 font-medium text-xs">
              시작하기 <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Detail Page Card */}
          <div
            onClick={() => window.location.href = '/detail-page'}
            className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer"
          >
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layout className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">상세페이지 제작</h3>
            <p className="text-slate-500 mb-3 text-xs h-10">
              모바일 최적화된 긴 상세페이지를 섹션별로 나누어 생성하고 연결합니다.
            </p>
            <div className="flex items-center text-blue-600 font-medium text-xs">
              제작하기 <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Detail Edit Card */}
          <div
            onClick={() => window.location.href = '/detail-edit'}
            className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-violet-200 transition-all cursor-pointer"
          >
            <div className="bg-violet-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FilePenLine className="w-6 h-6 text-violet-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">상세페이지 편집</h3>
            <p className="text-slate-500 mb-3 text-xs h-10">
              기존 상세페이지의 특정 부분을 선택하여 텍스트를 수정하거나 이미지를 교체합니다.
            </p>
            <div className="flex items-center text-violet-600 font-medium text-xs">
              편집하기 <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Edit Card */}
          <div
            onClick={() => window.location.href = '/edit'}
            className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-200 transition-all cursor-pointer"
          >
            <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Wand2 className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">간편 편집</h3>
            <p className="text-slate-500 mb-3 text-xs h-10">
              &ldquo;레트로 필터 씌워줘&rdquo;, &ldquo;배경에 사람 지워줘&rdquo; 등 말 한마디로 사진을 전체 수정합니다.
            </p>
            <div className="flex items-center text-emerald-600 font-medium text-xs">
              편집하기 <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
