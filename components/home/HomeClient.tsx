/**
 * HomeClient Component - Client-side Home Page Logic
 * Contract: INTEGRATION_DESIGN_WORKFLOW_HOME
 * Evidence: Phase 10 Page Integration
 *
 * Optimizations applied:
 * - Separated from Server Component (Vercel Best Practice: server-client separation)
 * - Map lookup for O(1) industry access (Vercel Best Practice: js-set-map-lookups)
 * - startTransition for non-urgent updates (Vercel Best Practice: rerender-transitions)
 * - Hoisted static JSX (Vercel Best Practice: rendering-hoist-jsx)
 */

"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import { Search, ArrowRight, Sparkles, Clock } from "lucide-react";
import { IndustryInfo, Industry } from "@/lib/workflow/industries";
import { analyzeIntent } from "@/lib/workflow/intentAnalyzer";
import { useWorkflowStore } from "@/lib/workflow/store";
import { matchIntent } from "@/lib/workflow/intents";
import {
  generateRecommendations,
  WorkflowRecommendation,
} from "@/lib/workflow/recommend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpressionIntent } from "@/lib/workflow/intents";

// Dynamic import for modal component (bundle optimization)
const ImmersiveInputForm = dynamic(
  () => import("@/components/workflow/ImmersiveInputForm").then(mod => mod.ImmersiveInputForm),
  { ssr: false }
);

// Hoisted static JSX icons (Vercel Best Practice: rendering-hoist-jsx)
const SearchIcon = <Search className="w-5 h-5" />;
const ArrowRightIcon = <ArrowRight className="w-4 h-4" />;
const SparklesIcon = <Sparkles className="w-4 h-4 text-primary-500" />;
const ClockIcon = <Clock className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />;

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.95 }
};

interface HomeClientProps {
  industries: IndustryInfo[];
}

export function HomeClient({ industries }: HomeClientProps) {
  const router = useRouter();
  const { status } = useSession();
  const t = useTranslations("pages.home");
  const tWorkflow = useTranslations("workflow.industries");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{
    industry: IndustryInfo | null;
    message: string;
  } | null>(null);
  // searchRecommendations state preserved for potential card-based fallback display
  const [, setSearchRecommendations] = useState<WorkflowRecommendation[]>([]);
  // 통합 몰입형 상태 (AI 추천 + 입력 폼)
  const [isImmersiveOpen, setIsImmersiveOpen] = useState(false);
  const [immersiveRecommendations, setImmersiveRecommendations] = useState<WorkflowRecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<WorkflowRecommendation | null>(null);
  const [currentRecommendationIndex, setCurrentRecommendationIndex] = useState(0);

  // useTransition for non-urgent state updates (Vercel Best Practice: rerender-transitions)
  const [isPending, startTransition] = useTransition();

  // Zustand store
  const selectIndustry = useWorkflowStore((state) => state.selectIndustry);
  const selectIntent = useWorkflowStore((state) => state.selectIntent);
  const recentWorkflows = useWorkflowStore((state) => state.recentWorkflows);
  const setCurrentStep = useWorkflowStore((state) => state.setCurrentStep);
  const setInitialQuery = useWorkflowStore((state) => state.setInitialQuery);

  // Map for O(1) industry lookup (Vercel Best Practice: js-set-map-lookups)
  const industryMap = useMemo(
    () => new Map(industries.map(i => [i.id, i])),
    [industries]
  );

  // Search handler with startTransition for non-urgent updates
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      startTransition(() => {
        setSearchRecommendations([]);
        setSuggestions(null);
      });
      return;
    }

    const result = analyzeIntent(searchQuery);

    // Generate recommendations using matchIntent
    const intentResult = matchIntent(searchQuery);
    const recommendationResult = generateRecommendations(intentResult);

    // Collect all recommendations
    const allRecs = [
      ...(recommendationResult.primary ? [recommendationResult.primary] : []),
      ...recommendationResult.alternatives,
      ...recommendationResult.crossIndustry,
    ].filter(Boolean);

    // Use Map for O(1) lookup instead of Array.find()
    const industryInfo = result.suggestedIndustry
      ? industryMap.get(result.suggestedIndustry)
      : null;

    // Non-critical UI updates wrapped in startTransition
    startTransition(() => {
      if (result.suggestedIndustry && industryInfo) {
        setSuggestions({
          industry: industryInfo,
          message: t("keywordsFound", { keywords: result.extractedKeywords.join(", ") }),
        });
      } else {
        setSuggestions({
          industry: null,
          message: t("noIndustryFound"),
        });
      }

      // Also update the card list for fallback display
      setSearchRecommendations(allRecs.slice(0, 4));
    });

    // Open immersive overlay if recommendations exist (urgent, not in transition)
    if (allRecs.length > 0) {
      // Save initial query for auto-fill in input form
      setInitialQuery(searchQuery.trim());
      setImmersiveRecommendations(allRecs);
      setSelectedRecommendation(allRecs[0]);
      setCurrentRecommendationIndex(0);
      selectIndustry(allRecs[0].industry);
      selectIntent(allRecs[0].intent);
      setIsImmersiveOpen(true);
    }
  }, [searchQuery, industryMap, selectIndustry, selectIntent, setInitialQuery, t]);

  // Handle industry click
  const handleIndustryClick = useCallback(
    (industryId: string) => {
      if (status !== "authenticated") {
        router.push("/login?callbackUrl=/");
        return;
      }
      selectIndustry(industryId as Industry);
      setCurrentStep("action-select");
      router.push(`/workflow/${industryId}`);
    },
    [status, router, selectIndustry, setCurrentStep]
  );

  // Handle recommendation selection with startTransition
  const handleRecommendationSelect = useCallback(
    (recommendation: WorkflowRecommendation) => {
      if (status !== "authenticated") {
        router.push("/login?callbackUrl=/");
        return;
      }

      // Critical updates - immediate
      selectIndustry(recommendation.industry);
      selectIntent(recommendation.intent);
      setSelectedRecommendation(recommendation);

      // Non-critical UI update - use startTransition
      startTransition(() => {
        const newIndex = immersiveRecommendations.findIndex(
          (r) => r.industry === recommendation.industry && r.intent === recommendation.intent
        );
        if (newIndex >= 0) {
          setCurrentRecommendationIndex(newIndex);
        }
      });
    },
    [status, router, selectIndustry, selectIntent, immersiveRecommendations]
  );

  // 입력 폼에서 생성 완료 시
  const handleInputFormGenerate = useCallback(
    (sessionId: string) => {
      setIsImmersiveOpen(false);
      setSelectedRecommendation(null);
      setImmersiveRecommendations([]);
      router.push(`/result?sessionId=${sessionId}`);
    },
    [router]
  );

  // 통합 모달 닫기
  const handleImmersiveClose = useCallback(() => {
    setIsImmersiveOpen(false);
    setSelectedRecommendation(null);
    setImmersiveRecommendations([]);
  }, []);

  // Handle recent workflow click
  const handleRecentClick = useCallback(
    (workflow: { industry: Industry; action: string }) => {
      if (status !== "authenticated") {
        router.push("/login?callbackUrl=/");
        return;
      }
      selectIndustry(workflow.industry);
      router.push(`/workflow/${workflow.industry}/${workflow.action}`);
    },
    [status, router, selectIndustry]
  );

  return (
    <>
      {/* 통합 몰입형 모달 - AI 추천 + 입력 폼 (스와이프로 이동 가능) */}
      {selectedRecommendation ? (
        <ImmersiveInputForm
          isOpen={isImmersiveOpen}
          onClose={handleImmersiveClose}
          industry={selectedRecommendation.industry}
          intent={selectedRecommendation.intent as ExpressionIntent}
          onGenerate={handleInputFormGenerate}
          recommendations={immersiveRecommendations}
          onRecommendationSelect={handleRecommendationSelect}
          currentRecommendationIndex={currentRecommendationIndex}
          initialQuery={searchQuery}
        />
      ) : null}

      <motion.div
        className="max-w-4xl mx-auto px-4 py-16 md:py-24"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Hero Section */}
        <motion.div className="text-center mb-20" variants={itemVariants}>
          {/* Logo Image */}
          <motion.div
            className="flex justify-center mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Image
              src="/FlowStudio_logo.png"
              alt="FlowStudio"
              width={240}
              height={120}
              priority
              className="h-16 md:h-20 w-auto object-contain"
            />
          </motion.div>
          {/* Text Logo */}
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          >
            FlowStudio
          </motion.h1>
          {/* Description */}
          <motion.p
            className="text-base md:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {t("subtitle")}
          </motion.p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          className={`max-w-2xl mx-auto ${recentWorkflows.length > 0 ? "mb-16" : "mb-10"}`}
          variants={itemVariants}
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={t("searchPlaceholder")}
              className="w-full px-5 py-4 pr-12 border border-zinc-300 dark:border-zinc-700 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-shadow"
            />
            <button
              onClick={handleSearch}
              disabled={isPending}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {SearchIcon}
            </button>
          </motion.div>

          {/* Search Suggestions */}
          {suggestions ? (
            <motion.div
              className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{suggestions.message}</p>
              {suggestions.industry ? (
                <motion.button
                  onClick={() => handleIndustryClick(suggestions.industry!.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{suggestions.industry.icon}</span>
                  <span>{tWorkflow(`${suggestions.industry.id}.name`)}</span>
                  {ArrowRightIcon}
                </motion.button>
              ) : null}
            </motion.div>
          ) : null}
        </motion.div>

        {/* Recent Workflows (if user has history) */}
        {recentWorkflows.length > 0 ? (
          <motion.div variants={itemVariants}>
            <Card className="mb-16 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  {ClockIcon}
                  <CardTitle className="text-base text-zinc-900 dark:text-zinc-100">{t("recentWorkflows")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {recentWorkflows.slice(0, 5).map((workflow, index) => {
                    // Use Map for O(1) lookup
                    const industryInfo = industryMap.get(workflow.industry);
                    return (
                      <motion.button
                        key={index}
                        onClick={() => handleRecentClick(workflow)}
                        className="flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <span>{industryInfo?.icon}</span>
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                          {tWorkflow(`${workflow.industry}.name`)} - {workflow.action}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        {/* Industry Grid */}
        <motion.div className="mb-6" variants={itemVariants}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              {SparklesIcon}
            </motion.span>
            <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t("browseByIndustry")}</h2>
          </div>
          <motion.div
            className="flex flex-wrap gap-2 justify-center"
            variants={containerVariants}
          >
            {industries.map((industry, index) => (
              <motion.button
                key={industry.id}
                onClick={() => handleIndustryClick(industry.id)}
                className="group flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950 transition-all"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                custom={index}
              >
                <span className="text-lg">{industry.icon}</span>
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                  {tWorkflow(`${industry.id}.name`)}
                </span>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Footer Info */}
        <motion.div
          className="text-center"
          variants={itemVariants}
        >
          <div className="inline-flex items-center gap-8 text-sm text-zinc-500 dark:text-zinc-400">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <motion.span
                className="w-2 h-2 bg-green-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
              <span>{t("creditsPerImage")}</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <motion.span
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 0.3 }}
              />
              <span>{t("support4K")}</span>
            </motion.div>
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <motion.span
                className="w-2 h-2 bg-purple-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 0.6 }}
              />
              <span>{t("commercialUse")}</span>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

export default HomeClient;
