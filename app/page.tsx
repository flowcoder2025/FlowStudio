'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sparkles, Layout, FilePenLine, Wand2, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { ContactModal } from '@/components/ContactModal';
import { AppMode } from '@/types';

export default function HomePage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  return (
    <>
      <Header currentMode={AppMode.HOME} />

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Image
            src="/FlowStudio-removebg.png"
            alt="FlowStudio"
            width={280}
            height={140}
            className="mx-auto mb-6"
            priority
          />
          <p className="text-slate-600 dark:text-slate-300 text-lg">
            복잡한 포토샵 없이, 전문가급 제품 사진과 홍보물을 30초 만에 만들어보세요.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Create Card */}
          <div
            onClick={() => window.location.href = '/create'}
            className="group bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-500 transition-all cursor-pointer min-h-[200px]"
          >
            <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">이미지 생성</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-3 text-xs h-10">
              제품 사진이나 컨셉만으로 SNS 홍보물, 메뉴판, 포스터용 이미지를 생성합니다.
            </p>
            <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium text-xs">
              시작하기 <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Edit Card */}
          <div
            onClick={() => window.location.href = '/edit'}
            className="group bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-500 transition-all cursor-pointer min-h-[200px]"
          >
            <div className="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Wand2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">이미지 편집</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-3 text-xs h-10">
              &ldquo;레트로 필터 씌워줘&rdquo;, &ldquo;배경에 사람 지워줘&rdquo; 등 말 한마디로 사진을 전체 수정합니다.
            </p>
            <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium text-xs">
              편집하기 <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Detail Page Card */}
          <div
            onClick={() => window.location.href = '/detail-page'}
            className="group bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-500 transition-all cursor-pointer min-h-[200px]"
          >
            <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Layout className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">상세페이지 제작</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-3 text-xs h-10">
              모바일 최적화된 긴 상세페이지를 섹션별로 나누어 생성하고 연결합니다.
            </p>
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-xs">
              제작하기 <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>

          {/* Detail Edit Card */}
          <div
            onClick={() => window.location.href = '/detail-edit'}
            className="group bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-violet-200 dark:hover:border-violet-500 transition-all cursor-pointer min-h-[200px]"
          >
            <div className="bg-violet-100 dark:bg-violet-900/30 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FilePenLine className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">상세페이지 편집</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-3 text-xs h-10">
              기존 상세페이지의 특정 부분을 선택하여 텍스트를 수정하거나 이미지를 교체합니다.
            </p>
            <div className="flex items-center text-violet-600 dark:text-violet-400 font-medium text-xs">
              편집하기 <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center text-sm text-slate-500 dark:text-slate-400 space-y-2">
            <p className="font-medium text-slate-600 dark:text-slate-300">
              © 2025 FlowCoder. All rights reserved.
            </p>
            <p>
              주식회사 테크트리아이엔씨 (636-81-00865) | 통신판매번호: 2021-대구중구-0666
            </p>
            <p>
              박현일 | 대구광역시 중구 동덕로 115, 9층 902호 내 512(삼덕동2가)
            </p>
            <p>
              문의 사항이 있으신가요?{' '}
              <a
                href="mailto:flowcoder25@gmail.com"
                className="text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                flowcoder25@gmail.com
              </a>
              로 연락해주세요
            </p>
            <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
              <a href="/privacy" className="hover:text-slate-700 dark:hover:text-slate-300 hover:underline">
                개인정보 처리방침
              </a>
              <span>/</span>
              <a href="/terms" className="hover:text-slate-700 dark:hover:text-slate-300 hover:underline">
                서비스 이용약관
              </a>
              <span>/</span>
              <a href="/refund" className="hover:text-slate-700 dark:hover:text-slate-300 hover:underline">
                환불약관
              </a>
              <span>/</span>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
              >
                고객센터
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 고객센터 모달 */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </>
  );
}
