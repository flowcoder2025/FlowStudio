/**
 * Prompt Preview Component
 * Contract: WORKFLOW_DESIGN_PREVIEW
 * Evidence: IMPLEMENTATION_PLAN.md Phase 3
 */

"use client";

import { useMemo } from "react";
import { Eye, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Action } from "@/lib/workflow/actions";

interface PromptPreviewProps {
  template: string;
  inputs: Record<string, string>;
  action: Action;
}

export function PromptPreview({ template, inputs, action }: PromptPreviewProps) {
  const [copied, setCopied] = useState(false);

  const generatedPrompt = useMemo(() => {
    let prompt = template;

    for (const [key, value] of Object.entries(inputs)) {
      const placeholder = `{{${key}}}`;
      // Find the label for the value if it's a select input
      const input = action.inputs.find((i) => i.id === key);
      let displayValue = value;

      if (input?.type === "select" && input.options) {
        const option = input.options.find((o) => o.value === value);
        if (option) {
          displayValue = option.label;
        }
      }

      prompt = prompt.replace(new RegExp(placeholder, "g"), displayValue || `[${key}]`);
    }

    // Highlight remaining placeholders
    prompt = prompt.replace(/\{\{(\w+)\}\}/g, "[$1]");

    return prompt;
  }, [template, inputs, action.inputs]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const completionPercentage = useMemo(() => {
    const requiredInputs = action.inputs.filter((i) => i.required);
    const filledInputs = requiredInputs.filter((i) => inputs[i.id]?.trim());
    return Math.round((filledInputs.length / requiredInputs.length) * 100) || 0;
  }, [action.inputs, inputs]);

  return (
    <div className="sticky top-24">
      <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-700">
              <Eye className="w-4 h-4" />
              <span className="font-medium text-sm">프롬프트 미리보기</span>
            </div>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="프롬프트 복사"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 py-2 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>입력 완성도</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Prompt Content */}
        <div className="p-4">
          <p className="text-sm text-gray-700 leading-relaxed font-mono whitespace-pre-wrap break-words">
            {generatedPrompt}
          </p>
        </div>

        {/* Info */}
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>크레딧: {action.creditCost}</span>
            <span>모델: AI 자동 선택</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700 font-medium mb-2">💡 팁</p>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• 상품 설명을 구체적으로 입력할수록 더 좋은 결과를 얻을 수 있어요</li>
          <li>• 색상, 소재, 스타일을 포함하면 정확도가 높아져요</li>
          <li>• 생성된 이미지가 마음에 들지 않으면 다시 생성할 수 있어요</li>
        </ul>
      </div>
    </div>
  );
}
