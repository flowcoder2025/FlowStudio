/**
 * Workflow Wizard Page with StepFlow and ImageUpload Integration
 * Contract: INTEGRATION_DESIGN_WORKFLOW_WIZARD
 * Evidence: Phase 10 Page Integration
 */

"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles, Upload, Eye } from "lucide-react";
import { getIndustryInfo, isValidIndustry, Industry } from "@/lib/workflow/industries";
import { getAction, ActionInput } from "@/lib/workflow/actions";
import { generateDynamicGuide, StepType, DynamicGuide } from "@/lib/workflow/guide";
import { ExpressionIntent } from "@/lib/workflow/intents";
import { PromptPreview } from "@/components/workflow/PromptPreview";
import { StepFlow, MiniStepIndicator } from "@/components/workflow/StepFlow";
import { GuideChat } from "@/components/workflow/GuideChat";
import { ImageUpload, UploadedImage } from "@/components/workflow/ImageUpload";
import { useWorkflowStore } from "@/lib/workflow/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  params: Promise<{ industry: string; action: string }>;
}

export default function WorkflowWizardPage({ params }: Props) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { industry, action: actionId } = resolvedParams;

  // URL에서 intent 파라미터 읽기
  const intentParam = searchParams.get("intent") as ExpressionIntent | null;

  // Local state - ALL hooks must be called before any conditional returns
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "guide">("form");
  const [localGuide, setLocalGuide] = useState<DynamicGuide | null>(null);

  // Zustand store
  const storeInputs = useWorkflowStore((state) => state.inputs);
  const referenceImages = useWorkflowStore((state) => state.referenceImages);
  const setReferenceImages = useWorkflowStore((state) => state.setReferenceImages);
  const setStoreInput = useWorkflowStore((state) => state.setInput);
  const startGeneration = useWorkflowStore((state) => state.startGeneration);
  const setGenerationResult = useWorkflowStore((state) => state.setGenerationResult);
  const addToHistory = useWorkflowStore((state) => state.addToHistory);

  // Get action before hooks that depend on it
  const action = getAction(actionId);
  const industryInfo = isValidIndustry(industry) ? getIndustryInfo(industry) : null;

  // Initialize guide when intent is provided
  useEffect(() => {
    if (intentParam && !localGuide && isValidIndustry(industry)) {
      // generateDynamicGuide expects (intent, industry) order
      const guide = generateDynamicGuide(intentParam, industry as Industry);
      setLocalGuide(guide);
      setActiveTab("guide");
    }
  }, [intentParam, industry, localGuide]);

  // Sync local inputs with store
  useEffect(() => {
    const mergedInputs = { ...inputs };
    Object.entries(storeInputs).forEach(([key, value]) => {
      if (typeof value === "string") {
        mergedInputs[key] = value;
      }
    });
    if (JSON.stringify(mergedInputs) !== JSON.stringify(inputs)) {
      setInputs(mergedInputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeInputs]);

  const handleInputChange = useCallback(
    (inputId: string, value: string) => {
      setInputs((prev) => ({ ...prev, [inputId]: value }));
      setStoreInput(inputId, value);
    },
    [setStoreInput]
  );

  const handleImageChange = useCallback(
    (images: UploadedImage[]) => {
      setReferenceImages(images);
    },
    [setReferenceImages]
  );

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    // Simulate upload - in production, upload to Supabase
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(URL.createObjectURL(file));
      }, 1000);
    });
  }, []);

  const isFormValid = useCallback(() => {
    if (!action) return false;
    return action.inputs
      .filter((input) => input.required)
      .every((input) => inputs[input.id]?.trim());
  }, [action, inputs]);

  // Guide step completion handler
  const handleGuideStepComplete = useCallback(
    (_stepId: StepType, value: unknown) => {
      if (!localGuide) return;

      // Update local inputs
      if (typeof value === "string") {
        handleInputChange(_stepId, value);
      }

      // Update guide state
      setLocalGuide((prev) => {
        if (!prev) return null;
        const newCompletedSteps = [...prev.completedSteps, _stepId];
        return {
          ...prev,
          currentStep: Math.min(prev.currentStep + 1, prev.totalSteps),
          completedSteps: newCompletedSteps,
        };
      });
    },
    [localGuide, handleInputChange]
  );

  const handleGuideComplete = useCallback(() => {
    // Switch to form tab to review before generating
    setActiveTab("form");
  }, []);

  const handleGuideReset = useCallback(() => {
    if (!localGuide) return;
    setLocalGuide({
      ...localGuide,
      currentStep: 0,
      completedSteps: [],
    });
    setInputs({});
  }, [localGuide]);

  const handleStepClick = useCallback((stepId: StepType) => {
    setLocalGuide((prev) => {
      if (!prev) return null;
      const stepIndex = prev.steps.findIndex((s) => s.id === stepId);
      if (stepIndex !== -1 && stepIndex <= prev.currentStep) {
        return { ...prev, currentStep: stepIndex };
      }
      return prev;
    });
  }, []);


  // Validation - AFTER all hooks
  if (!isValidIndustry(industry) || !industryInfo) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">존재하지 않는 업종입니다.</p>
        <Button variant="outline" onClick={() => router.push("/")} className="mt-4">
          홈으로 돌아가기
        </Button>
      </div>
    );
  }

  if (!action) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">존재하지 않는 액션입니다.</p>
        <Button
          variant="outline"
          onClick={() => router.push(`/workflow/${industry}`)}
          className="mt-4"
        >
          액션 선택으로 돌아가기
        </Button>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (!isFormValid()) {
      setError("필수 항목을 모두 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    startGeneration();

    try {
      // Create session and generate
      const sessionRes = await fetch("/api/workflows/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry,
          action: actionId,
          inputs,
          referenceImages: referenceImages.map((img) => img.uploadedUrl || img.previewUrl),
        }),
      });

      if (!sessionRes.ok) {
        const data = await sessionRes.json();
        throw new Error(data.error || "세션 생성에 실패했습니다");
      }

      const session = await sessionRes.json();

      // Add to history
      addToHistory({
        industry: industry as Industry,
        action: actionId,
        intent: intentParam ?? undefined,
      });

      // Navigate to result page
      router.push(`/result?sessionId=${session.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "오류가 발생했습니다";
      setError(errorMessage);
      setGenerationResult({
        success: false,
        images: [],
        creditsUsed: 0,
        provider: "",
        model: "",
        error: errorMessage,
      });
      setIsGenerating(false);
    }
  };

  const renderInput = (input: ActionInput) => {
    const value = inputs[input.id] || "";

    switch (input.type) {
      case "textarea":
        return (
          <textarea
            id={input.id}
            value={value}
            onChange={(e) => handleInputChange(input.id, e.target.value)}
            placeholder={input.placeholder}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
          />
        );

      case "select":
        return (
          <select
            id={input.id}
            value={value}
            onChange={(e) => handleInputChange(input.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">선택하세요</option>
            {input.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type={input.type}
            id={input.id}
            value={value}
            onChange={(e) => handleInputChange(input.id, e.target.value)}
            placeholder={input.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.push(`/workflow/${industry}`)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>액션 선택으로 돌아가기</span>
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>{industryInfo.icon}</span>
          <span>{industryInfo.nameKo}</span>
          <span>/</span>
          <span>{action.nameKo}</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">이미지 정보 입력</h1>
        <p className="text-sm text-gray-500 mt-1">{action.description}</p>
      </div>

      {/* Mini Step Indicator (when guide is active) */}
      {localGuide && (
        <div className="mb-6">
          <MiniStepIndicator
            currentStep={localGuide.currentStep}
            totalSteps={localGuide.totalSteps}
          />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Panel - Input Form / Guide */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "form" | "guide")}>
            <TabsList className="mb-4">
              <TabsTrigger value="form" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                직접 입력
              </TabsTrigger>
              {localGuide && (
                <TabsTrigger value="guide" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  가이드 모드
                </TabsTrigger>
              )}
            </TabsList>

            {/* Direct Input Tab */}
            <TabsContent value="form">
              <Card>
                <CardContent className="pt-6 space-y-5">
                  {action.inputs.map((input) => (
                    <div key={input.id}>
                      <label
                        htmlFor={input.id}
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        {input.label}
                        {input.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderInput(input)}
                    </div>
                  ))}

                  {/* Reference Image Upload */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <Upload className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        참조 이미지 (선택)
                      </span>
                    </div>
                    <ImageUpload
                      value={referenceImages}
                      onChange={handleImageChange}
                      onUpload={handleImageUpload}
                      maxFiles={3}
                      maxFileSize={5 * 1024 * 1024}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      참조 이미지를 업로드하면 더 정확한 결과를 얻을 수 있습니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Guide Mode Tab - 대화형 가이드 */}
            {localGuide && (
              <TabsContent value="guide">
                <GuideChat
                  guide={localGuide}
                  onStepComplete={handleGuideStepComplete}
                  onGuideComplete={handleGuideComplete}
                  onReset={handleGuideReset}
                />

                {/* 진행 상황 미니 뷰 */}
                <Card className="mt-4">
                  <CardContent className="pt-4">
                    <StepFlow
                      guide={localGuide}
                      onStepClick={handleStepClick}
                      showProgress={false}
                      collapsible={true}
                      orientation="horizontal"
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !isFormValid()}
            className="mt-6 w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>이미지 생성 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                <span>이미지 생성하기 ({action.creditCost} 크레딧)</span>
              </>
            )}
          </Button>
        </div>

        {/* Right Panel - Preview */}
        <div className="md:col-span-1">
          <div className="sticky top-8">
            <PromptPreview template={action.promptTemplate} inputs={inputs} action={action} />

            {/* Reference Images Preview */}
            {referenceImages.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">참조 이미지</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {referenceImages.map((img) => (
                      <div
                        key={img.id}
                        className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100"
                      >
                        <img
                          src={img.previewUrl}
                          alt="Reference"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
