/**
 * Credit Badge Component
 * Contract: CREDIT_DESIGN_HEADER
 * Evidence: IMPLEMENTATION_PLAN.md Phase 2
 */

"use client";

import { useState, useEffect } from "react";
import { Coins } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface CreditData {
  balance: number;
  pendingHolds: number;
}

export function CreditBadge() {
  const [credit, setCredit] = useState<CreditData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCreditBalance();
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full animate-pulse">
        <div className="w-4 h-4 bg-gray-300 rounded" />
        <div className="w-10 h-4 bg-gray-300 rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
      <Coins className="w-4 h-4 text-amber-600" />
      <span className="text-sm font-medium text-amber-700">
        {credit ? formatNumber(credit.balance) : 0}
      </span>
      {credit && credit.pendingHolds > 0 && (
        <span className="text-xs text-amber-500">
          (-{formatNumber(credit.pendingHolds)})
        </span>
      )}
    </div>
  );
}
