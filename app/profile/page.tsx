'use client';

import React, { useState, useEffect } from 'react';
import { Settings, BarChart3, History, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { AppMode } from '@/types';
import { getUsageStats, clearUsageStats } from '@/services/usageService';
import { EXCHANGE_RATE_KRW } from '@/constants';

export default function ProfilePage() {
  const [apiKey, setApiKey] = useState('');
  const [usageStats, setUsageStats] = useState(getUsageStats());
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    // Load API key from localStorage
    if (typeof window !== 'undefined') {
      const storedKey = localStorage.getItem('gemini_api_key') || '';
      setApiKey(storedKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (typeof window === 'undefined') return;

    if (!apiKey.trim()) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }

    localStorage.setItem('gemini_api_key', apiKey.trim());
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleClearStats = () => {
    if (confirm('사용량 기록을 초기화하시겠습니까? (로컬 데이터만 삭제됩니다)')) {
      clearUsageStats();
      setUsageStats(getUsageStats());
    }
  };

  // Format Cost
  const costUsd = usageStats.totalCostUsd.toFixed(2);
  const costKrw = (usageStats.totalCostUsd * EXCHANGE_RATE_KRW).toLocaleString();

  return (
    <>
      <Header currentMode={AppMode.PROFILE} onNavigate={(mode) => {
        if (mode === AppMode.HOME) window.location.href = '/';
        else if (mode === AppMode.CREATE) window.location.href = '/create';
        else if (mode === AppMode.EDIT) window.location.href = '/edit';
        else if (mode === AppMode.DETAIL_PAGE) window.location.href = '/detail-page';
        else if (mode === AppMode.DETAIL_EDIT) window.location.href = '/detail-edit';
        else if (mode === AppMode.PROFILE) window.location.href = '/profile';
      }} />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">설정 및 프로필</h2>
          <p className="text-slate-500">앱 환경설정과 예상 사용량을 확인하세요.</p>
        </div>

        <div className="grid gap-6">
          {/* API Key Configuration */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Key className="w-5 h-5 text-green-600" /> Gemini API 키 설정
              </h3>
              {apiKey && saveStatus === 'idle' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Google AI Studio에서 발급받은 Gemini API 키를 입력하세요. API 키는 브라우저 로컬 스토리지에만 저장되며 서버로 전송되지 않습니다.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full p-3 pr-24 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200"
                  >
                    {showApiKey ? '숨기기' : '보기'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveApiKey}
                className={`w-full py-3 rounded-lg font-medium transition-all ${
                  saveStatus === 'success'
                    ? 'bg-green-600 text-white'
                    : saveStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {saveStatus === 'success' ? '✓ 저장 완료' : saveStatus === 'error' ? '✗ API 키를 입력하세요' : 'API 키 저장'}
              </button>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>API 키 발급:</strong> <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Google AI Studio</a>에서 무료로 발급 받을 수 있습니다.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Usage & Cost Dashboard */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" /> 사용량 대시보드
              </h3>
              <span className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded font-medium">Local Estimate</span>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">총 생성 이미지</p>
                <p className="text-2xl font-bold text-slate-900">{usageStats.totalImages}장</p>
                <p className="text-xs text-slate-400 mt-1">오늘: {usageStats.todayUsage}장</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">예상 비용 (USD)</p>
                <p className="text-2xl font-bold text-slate-900">${costUsd}</p>
                <p className="text-xs text-slate-400 mt-1">약 {costKrw}원</p>
              </div>
            </div>

            <div className="px-6 pb-6">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">최근 활동</h4>
              {usageStats.history.length === 0 ? (
                <p className="text-sm text-slate-400 italic">아직 생성 내역이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {usageStats.history.slice(0, 5).map((log, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 rounded-lg">
                      <span className="text-slate-600 flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-300" /> {log.date}
                      </span>
                      <span className="font-medium text-slate-800">{log.count}장 생성</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleClearStats}
                className="mt-4 text-xs text-red-400 hover:text-red-600 underline"
              >
                사용량 기록 초기화 (로컬 데이터만 삭제)
              </button>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-3">정보</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p><strong>버전:</strong> v1.0.0 (Next.js Edition)</p>
              <p><strong>모델:</strong> Gemini 3 Pro Image Preview</p>
              <p><strong>예상 비용:</strong> 이미지당 약 $0.04 (실제 비용은 다를 수 있습니다)</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
