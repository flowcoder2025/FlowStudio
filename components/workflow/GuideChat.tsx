/**
 * Guide Chat Component - 대화형 가이드 UI
 * Contract: Phase 8 UI Components
 * Evidence: HANDOFF_2026-01-21_P7.md
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DynamicGuide,
  GuideStep,
  StepType,
  StepOption,
} from "@/lib/workflow/guide";

// ============================================================
// 타입 정의
// ============================================================

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  step?: GuideStep;
  options?: StepOption[];
  selectedOption?: string | string[];
  timestamp: Date;
}

export interface GuideChatProps {
  guide: DynamicGuide;
  onStepComplete: (stepId: StepType, value: unknown) => void;
  onGuideComplete: () => void;
  onReset?: () => void;
  className?: string;
}

// ============================================================
// 헬퍼 함수
// ============================================================

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function formatStepAsMessage(step: GuideStep): string {
  let message = `${step.titleKo}\n\n${step.description}`;

  if (step.helperText) {
    message += `\n\n💡 ${step.helperText}`;
  }

  return message;
}

// ============================================================
// 컴포넌트
// ============================================================

export function GuideChat({
  guide,
  onStepComplete,
  onGuideComplete,
  onReset,
  className,
}: GuideChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 현재 단계 가져오기
  const currentStep = guide.steps[guide.currentStep];
  const isComplete = guide.currentStep >= guide.totalSteps;

  // 초기 메시지 설정
  useEffect(() => {
    if (messages.length === 0 && currentStep) {
      const welcomeMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: "안녕하세요! 원하시는 이미지를 만들기 위해 몇 가지 질문을 드릴게요.",
        timestamp: new Date(),
      };

      const stepMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: formatStepAsMessage(currentStep),
        step: currentStep,
        options: currentStep.options,
        timestamp: new Date(),
      };

      setMessages([welcomeMessage, stepMessage]);
    }
  }, [currentStep, messages.length]);

  // 스크롤 관리
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 스크롤 버튼 표시 여부
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  }, []);

  // 옵션 선택 핸들러
  const handleOptionSelect = async (option: StepOption) => {
    if (!currentStep) return;

    setIsLoading(true);

    // 사용자 선택 메시지 추가
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: option.label,
      selectedOption: option.id,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // 단계 완료 콜백
    await new Promise((resolve) => setTimeout(resolve, 300));
    onStepComplete(currentStep.id, option.id);

    // 다음 단계 또는 완료 처리
    await new Promise((resolve) => setTimeout(resolve, 500));

    const nextStep = guide.steps[guide.currentStep + 1];

    if (nextStep) {
      const nextMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: formatStepAsMessage(nextStep),
        step: nextStep,
        options: nextStep.options,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, nextMessage]);
    } else {
      const completeMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: "모든 정보 입력이 완료되었습니다! 이제 이미지를 생성할 준비가 되었어요. 🎉",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, completeMessage]);
      onGuideComplete();
    }

    setIsLoading(false);
  };

  // 텍스트 입력 핸들러
  const handleTextSubmit = async () => {
    if (!currentStep || !inputValue.trim()) return;

    const value = inputValue.trim();
    setIsLoading(true);

    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: value,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // 유효성 검사
    const validation = currentStep.validation;
    if (validation) {
      if (validation.minLength && value.length < validation.minLength) {
        const errorMessage: ChatMessage = {
          id: generateMessageId(),
          role: "assistant",
          content: `조금 더 자세히 설명해주세요. (최소 ${validation.minLength}자 이상)`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }
      if (validation.maxLength && value.length > validation.maxLength) {
        const errorMessage: ChatMessage = {
          id: generateMessageId(),
          role: "assistant",
          content: `텍스트가 너무 길어요. (최대 ${validation.maxLength}자)`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }
    }

    // 단계 완료
    await new Promise((resolve) => setTimeout(resolve, 300));
    onStepComplete(currentStep.id, value);

    // 다음 단계
    await new Promise((resolve) => setTimeout(resolve, 500));

    const nextStep = guide.steps[guide.currentStep + 1];

    if (nextStep) {
      const nextMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: formatStepAsMessage(nextStep),
        step: nextStep,
        options: nextStep.options,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, nextMessage]);
    } else {
      const completeMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: "모든 정보 입력이 완료되었습니다! 이제 이미지를 생성할 준비가 되었어요. 🎉",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, completeMessage]);
      onGuideComplete();
    }

    setIsLoading(false);
  };

  // 리셋 핸들러
  const handleReset = () => {
    setMessages([]);
    onReset?.();
  };

  return (
    <Card className={cn("flex flex-col h-[600px]", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary-500" />
          <span className="font-medium text-sm">촬영 가이드</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {guide.currentStep + 1} / {guide.totalSteps}
          </span>
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-7 w-7 p-0"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* 메시지 영역 */}
      <CardContent
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" && "flex-row-reverse"
            )}
          >
            {/* 아바타 */}
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                message.role === "assistant"
                  ? "bg-primary-100 text-primary-600"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {message.role === "assistant" ? (
                <Bot className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>

            {/* 메시지 내용 */}
            <div
              className={cn(
                "max-w-[80%] rounded-xl px-4 py-3",
                message.role === "assistant"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-primary-500 text-white"
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {/* 옵션 버튼들 */}
              {message.options && message.options.length > 0 && !message.selectedOption && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.options.map((option) => (
                    <Button
                      key={option.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleOptionSelect(option)}
                      disabled={isLoading}
                      className="bg-white hover:bg-gray-50"
                    >
                      {option.icon && <span className="mr-1">{option.icon}</span>}
                      {option.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-gray-100 rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* 스크롤 버튼 */}
      {showScrollButton && (
        <Button
          variant="secondary"
          size="sm"
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 rounded-full shadow-lg"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      )}

      {/* 입력 영역 */}
      {!isComplete && currentStep && (currentStep.type === "text" || currentStep.type === "textarea") && (
        <div className="p-4 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTextSubmit();
            }}
            className="flex gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={currentStep.placeholder || "입력해주세요..."}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}

      {/* 완료 상태 */}
      {isComplete && (
        <div className="p-4 border-t bg-green-50">
          <p className="text-sm text-green-700 text-center">
            ✅ 가이드가 완료되었습니다
          </p>
        </div>
      )}
    </Card>
  );
}
