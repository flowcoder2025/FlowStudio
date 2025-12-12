'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, Coins, CreditCard, TrendingUp, BarChart3, Calendar, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppMode } from '@/types';
import { useRouter } from 'next/navigation';

interface CreditTransaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
}

const ITEMS_PER_PAGE = 20;

export default function CreditHistoryPage() {
  return (
    <AuthGuard>
      <CreditHistoryContent />
    </AuthGuard>
  );
}

function CreditHistoryContent() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('');

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        offset: ((page - 1) * ITEMS_PER_PAGE).toString(),
      });
      if (typeFilter) {
        params.append('type', typeFilter);
      }

      const response = await fetch(`/api/credits/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setTotal(data.total || 0);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error('Failed to fetch credit history:', error);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getTransactionDisplay = (transaction: CreditTransaction) => {
    const isPositive = transaction.amount > 0;

    let icon = <Coins className="w-4 h-4" />;
    let colorClass = 'text-slate-600 dark:text-slate-400';
    let bgClass = 'bg-slate-100 dark:bg-slate-700';
    let label = transaction.type;

    switch (transaction.type) {
      case 'PURCHASE':
        icon = <CreditCard className="w-4 h-4" />;
        colorClass = 'text-green-600 dark:text-green-400';
        bgClass = 'bg-green-100 dark:bg-green-900/30';
        label = '충전';
        break;
      case 'BONUS':
        icon = <TrendingUp className="w-4 h-4" />;
        colorClass = 'text-blue-600 dark:text-blue-400';
        bgClass = 'bg-blue-100 dark:bg-blue-900/30';
        label = '보너스';
        break;
      case 'REFERRAL':
        icon = <TrendingUp className="w-4 h-4" />;
        colorClass = 'text-purple-600 dark:text-purple-400';
        bgClass = 'bg-purple-100 dark:bg-purple-900/30';
        label = '추천인 보상';
        break;
      case 'GENERATION':
        icon = <BarChart3 className="w-4 h-4" />;
        colorClass = 'text-orange-600 dark:text-orange-400';
        bgClass = 'bg-orange-100 dark:bg-orange-900/30';
        label = '이미지 생성';
        break;
      case 'UPSCALE':
        icon = <BarChart3 className="w-4 h-4" />;
        colorClass = 'text-orange-600 dark:text-orange-400';
        bgClass = 'bg-orange-100 dark:bg-orange-900/30';
        label = '업스케일링';
        break;
    }

    return { icon, colorClass, bgClass, isPositive, label };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTypeFilterChange = (type: string) => {
    setTypeFilter(type);
    setPage(1);
  };

  return (
    <>
      <Header currentMode={AppMode.PROFILE} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/profile')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">프로필로 돌아가기</span>
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <History className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            크레딧 사용 내역
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            전체 {total}건의 거래 내역
          </p>
        </div>

        {/* 필터 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {[
            { value: '', label: '전체' },
            { value: 'PURCHASE', label: '충전' },
            { value: 'BONUS', label: '보너스' },
            { value: 'REFERRAL', label: '추천인' },
            { value: 'GENERATION', label: '생성' },
            { value: 'UPSCALE', label: '업스케일' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => handleTypeFilterChange(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                typeFilter === filter.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* 거래 내역 목록 */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 animate-pulse"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24" />
                    </div>
                  </div>
                  <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">
                {typeFilter ? '해당 유형의 거래 내역이 없습니다' : '크레딧 사용 내역이 없습니다'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {transactions.map((transaction) => {
                const { icon, colorClass, bgClass, isPositive, label } = getTransactionDisplay(transaction);
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bgClass}`}>
                        <span className={colorClass}>{icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {transaction.description || label}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded ${bgClass} ${colorClass}`}>
                            {label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-base font-bold ${
                      isPositive
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {isPositive ? '+' : ''}{transaction.amount} 크레딧
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        )}

        {/* 페이지 정보 */}
        {totalPages > 1 && (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-3">
            {page} / {totalPages} 페이지
          </p>
        )}
      </div>
    </>
  );
}
