'use client';

import React, { useState, useEffect } from 'react';
import { Settings, BarChart3, History, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppMode } from '@/types';
import { getUsageStats, clearUsageStats } from '@/services/usageService';
import { EXCHANGE_RATE_KRW } from '@/constants';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfilePageContent />
    </AuthGuard>
  );
}

function ProfilePageContent() {
  const [apiKey, setApiKey] = useState('');
  const [usageStats, setUsageStats] = useState(getUsageStats());
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
  const [isKeyConfigured, setIsKeyConfigured] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if API key exists on server
    const checkApiKey = async () => {
      try {
        const response = await fetch('/api/profile/api-key');
        if (response.ok) {
          const data = await response.json();
          setIsKeyConfigured(data.exists);
          // Show masked placeholder if key exists
          if (data.exists) {
            setApiKey('••••••••••••••••••••••••••••••••');
          }
        }
      } catch (error) {
        console.error('Failed to check API key:', error);
      }
    };

    checkApiKey();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim() || apiKey.startsWith('••••')) {
      setErrorMessage('API 키를 입력해주세요.');
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
        setErrorMessage('');
      }, 3000);
      return;
    }

    setSaveStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/profile/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSaveStatus('success');
        setIsKeyConfigured(true);
        // Mask the key after successful save
        setApiKey('••••••••••••••••••••••••••••••••');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setErrorMessage(data.error || 'API 키 저장에 실패했습니다.');
        setSaveStatus('error');
        setTimeout(() => {
          setSaveStatus('idle');
          setErrorMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('API key save error:', error);
      setErrorMessage('네트워크 오류가 발생했습니다.');
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
        setErrorMessage('');
      }, 3000);
    }
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
      <Header currentMode={AppMode.PROFILE} />

      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
            <Settings className="w-8 h-8 text-slate-600 dark:text-slate-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">설정 및 프로필</h2>
          <p className="text-slate-500 dark:text-slate-400">앱 환경설정과 예상 사용량을 확인하세요.</p>
        </div>

        <div className="grid gap-6">
          {/* API Key Configuration */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Key className="w-5 h-5 text-green-600 dark:text-green-400" /> Gemini API 키 설정
              </h3>
              {isKeyConfigured && saveStatus === 'idle' && (
                <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
              )}
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Google AI Studio에서 발급받은 Gemini API 키를 입력하세요. API 키는 서버에 AES-256-GCM으로 암호화되어 안전하게 저장됩니다.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full p-3 pr-24 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 font-mono text-sm transition-colors"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 min-h-[28px] rounded bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors"
                  >
                    {showApiKey ? '숨기기' : '보기'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveApiKey}
                disabled={saveStatus === 'loading'}
                className={`w-full py-3 min-h-[48px] rounded-lg font-medium transition-all ${
                  saveStatus === 'success'
                    ? 'bg-green-600 dark:bg-green-500 text-white'
                    : saveStatus === 'error'
                    ? 'bg-red-600 dark:bg-red-500 text-white'
                    : saveStatus === 'loading'
                    ? 'bg-indigo-400 dark:bg-indigo-500 text-white cursor-wait'
                    : 'bg-indigo-600 dark:bg-indigo-500 text-white hover:bg-indigo-700 dark:hover:bg-indigo-600'
                }`}
              >
                {saveStatus === 'success'
                  ? '✓ 저장 완료'
                  : saveStatus === 'error'
                  ? `✗ ${errorMessage || 'API 키를 입력하세요'}`
                  : saveStatus === 'loading'
                  ? '저장 중...'
                  : 'API 키 저장'}
              </button>

              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors">
                <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>API 키 발급:</strong> <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900 dark:hover:text-blue-100">Google AI Studio</a>에서 발급 받을 수 있습니다.
                  </span>
                </p>
              </div>

              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800 transition-colors">
                <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Tier 1 등급 필요:</strong> 이 앱에서 사용하는 이미지 생성 모델(Gemini 3 Pro Image Preview, Gemini 2.5 Flash Image)은 <strong>무료 티어로는 사용할 수 없습니다.</strong> Google Cloud에{' '}
                    <a href="https://aistudio.google.com/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-900 dark:hover:text-amber-100">결제 카드를 등록</a>하면 자동으로 Tier 1 등급이 적용됩니다.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Usage & Cost Dashboard */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> 사용량 대시보드
              </h3>
              <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-1 min-h-[24px] rounded font-medium transition-colors">Local Estimate</span>
            </div>

            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-100 dark:border-slate-600 transition-colors">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">총 생성 이미지</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{usageStats.totalImages}장</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">오늘: {usageStats.todayUsage}장</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-xl border border-slate-100 dark:border-slate-600 transition-colors">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">예상 비용 (USD)</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">${costUsd}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">약 {costKrw}원</p>
              </div>
            </div>

            <div className="px-6 pb-6">
              <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">최근 활동</h4>
              {usageStats.history.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 italic">아직 생성 내역이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {usageStats.history.slice(0, 5).map((log, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-300 dark:text-slate-600" /> {log.date}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{log.count}장 생성</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleClearStats}
                className="mt-4 text-xs text-red-400 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 underline min-h-[20px]"
              >
                사용량 기록 초기화 (로컬 데이터만 삭제)
              </button>
            </div>
          </div>

          {/* About */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-3">정보</h3>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p><strong>버전:</strong> v1.0.0 (Next.js Edition)</p>
              <p><strong>모델:</strong> Gemini 3 Pro Image Preview</p>
              <p><strong>예상 비용:</strong> 이미지당 약 $0.14 (실제 비용은 다를 수 있습니다)</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
