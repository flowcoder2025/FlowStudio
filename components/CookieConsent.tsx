'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, X, AlertCircle } from 'lucide-react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAccepted, setIsAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    // 쿠키 동의 상태 확인 (비동기 처리로 cascading render 방지)
    queueMicrotask(() => {
      const consent = localStorage.getItem('cookie-consent');
      if (consent === null) {
        setIsVisible(true);
      } else {
        setIsAccepted(consent === 'accepted');
      }
    });
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setIsAccepted(true);
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setIsAccepted(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* 쿠키 동의 팝업 */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] animate-slideUp">
        <div className="bg-white dark:bg-slate-800 border-t-2 border-indigo-500 dark:border-indigo-400 shadow-2xl">
          <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* 아이콘 및 메시지 */}
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Cookie className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1">
                    쿠키 사용 안내
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    FlowStudio는 사용자 경험 개선을 위해 쿠키를 사용합니다.
                    쿠키를 거부하시면 일부 기능(API 키 저장, 프로젝트 관리 등)을 사용하실 수 없습니다.
                  </p>
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleDecline}
                  className="flex-1 sm:flex-none px-4 py-2.5 min-h-[44px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  거부
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 sm:flex-none px-6 py-2.5 min-h-[44px] bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm"
                >
                  동의
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 쿠키 거부 시 알림 배너 */}
      {isAccepted === false && (
        <div className="fixed top-0 left-0 right-0 z-[99] bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">
                쿠키를 거부하셨습니다. 일부 기능이 제한될 수 있습니다.
              </p>
              <button
                onClick={() => setIsAccepted(null)}
                className="p-1 hover:bg-amber-100 dark:hover:bg-amber-800 rounded transition-colors"
                aria-label="닫기"
              >
                <X className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
