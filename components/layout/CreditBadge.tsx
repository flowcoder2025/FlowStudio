/**
 * Credit Badge Component
 * Contract: CREDIT_DESIGN_HEADER
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 */

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Coins } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface CreditData {
  balance: number;
  pendingHolds: number;
}

export function CreditBadge() {
  const { data: session, status } = useSession();
  const [credit, setCredit] = useState<CreditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로그인한 경우에만 크레딧 조회
    if (status === "authenticated" && session?.user) {
      fetchCreditBalance();
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status, session]);

  const fetchCreditBalance = async () => {
    try {
      const response = await fetch("/api/credits/balance");
      if (response.ok) {
        const data = await response.json();
        setCredit(data);
      }
    } catch (error) {
      console.error("Failed to fetch credit balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인하지 않은 경우 표시하지 않음
  if (status === "unauthenticated") {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full animate-pulse">
        <div className="w-4 h-4 bg-zinc-300 dark:bg-zinc-600 rounded" />
        <div className="w-10 h-4 bg-zinc-300 dark:bg-zinc-600 rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-full">
      <Coins className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
        {credit ? formatNumber(credit.balance) : 0}
      </span>
      {credit && credit.pendingHolds > 0 && (
        <span className="text-xs text-amber-500 dark:text-amber-400">
          (-{formatNumber(credit.pendingHolds)})
        </span>
      )}
    </div>
  );
}
