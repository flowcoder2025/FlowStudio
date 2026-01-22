/**
 * Workflow Guide System Unit Tests
 * Contract: TEST_FUNC_WORKFLOW
 * Evidence: tests/workflow/guide.test.ts::describe("DynamicGuide")
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateDynamicGuide,
  updateGuideSteps,
  isGuideComplete,
  getNextStep,
  calculateProgress,
  DynamicGuide,
  StepType,
} from '@/lib/workflow/guide/dynamic';
import {
  matchIntent,
  suggestIntentsForCategory,
  quickSuggestIntents,
} from '@/lib/workflow/intents/matcher';
import type { Industry } from '@/lib/workflow/industries';
import type { ExpressionIntent } from '@/lib/workflow/intents/taxonomy';

describe('DynamicGuide', () => {
  describe('generateDynamicGuide', () => {
    it('모델 전신 의도에 대해 올바른 단계를 생성해야 한다', () => {
      const guide = generateDynamicGuide('with-person.model-fullbody', 'fashion');

      expect(guide).toBeDefined();
      expect(guide.intent).toBe('with-person.model-fullbody');
      expect(guide.industry).toBe('fashion');
      expect(guide.steps.length).toBeGreaterThan(0);
      expect(guide.currentStep).toBe(0);
      expect(guide.completedSteps).toHaveLength(0);

      // 모델 전신은 model-details 단계가 포함되어야 함
      const hasModelDetails = guide.steps.some(s => s.id === 'model-details');
      expect(hasModelDetails).toBe(true);
    });

    it('제품 단독 의도에 대해 model-details 단계가 없어야 한다', () => {
      const guide = generateDynamicGuide('product-only.hero-front', 'fashion');

      const hasModelDetails = guide.steps.some(s => s.id === 'model-details');
      expect(hasModelDetails).toBe(false);
    });

    it('모든 가이드에 product-description 단계가 있어야 한다', () => {
      const intents: ExpressionIntent[] = [
        'with-person.model-fullbody',
        'product-only.hero-front',
        'detail-focus.texture',
        'mood-styling.seasonal-spring',
      ];

      for (const intent of intents) {
        const guide = generateDynamicGuide(intent, 'fashion');
        const hasProductDesc = guide.steps.some(s => s.id === 'product-description');
        expect(hasProductDesc).toBe(true);
      }
    });

    it('모든 가이드에 final-review 단계가 있어야 한다', () => {
      const guide = generateDynamicGuide('with-person.model-fullbody', 'fashion');
      const hasFinalReview = guide.steps.some(s => s.id === 'final-review');
      expect(hasFinalReview).toBe(true);
    });

    it('업종에 따라 detail-focus 옵션이 달라야 한다', () => {
      const foodGuide = generateDynamicGuide('detail-focus.texture', 'food');
      const beautyGuide = generateDynamicGuide('detail-focus.texture', 'beauty');

      const foodDetailStep = foodGuide.steps.find(s => s.id === 'detail-focus');
      const beautyDetailStep = beautyGuide.steps.find(s => s.id === 'detail-focus');

      if (foodDetailStep?.options && beautyDetailStep?.options) {
        // food에는 cross-section 옵션이 있어야 함
        const foodHasCrossSection = foodDetailStep.options.some(o => o.id === 'cross-section');
        expect(foodHasCrossSection).toBe(true);

        // beauty에는 swatch 옵션이 있어야 함
        const beautyHasSwatch = beautyDetailStep.options.some(o => o.id === 'swatch');
        expect(beautyHasSwatch).toBe(true);
      }
    });
  });

  describe('updateGuideSteps', () => {
    let guide: DynamicGuide;

    beforeEach(() => {
      guide = generateDynamicGuide('with-person.model-fullbody', 'fashion');
    });

    it('사용자 선택을 올바르게 저장해야 한다', () => {
      const stepWithOptions = guide.steps.find(s => s.options && s.options.length > 0);
      if (stepWithOptions && stepWithOptions.options) {
        const updatedGuide = updateGuideSteps(
          guide,
          stepWithOptions.id,
          stepWithOptions.options[0].id
        );

        expect(updatedGuide.userSelections[stepWithOptions.id]).toBe(stepWithOptions.options[0].id);
        expect(updatedGuide.completedSteps).toContain(stepWithOptions.id);
      }
    });

    it('triggersSteps 옵션 선택 시 새 단계가 추가되어야 한다', () => {
      // subject-selection 단계가 있는 가이드 생성
      const subjectStep = guide.steps.find(s => s.id === 'subject-selection');
      if (subjectStep && subjectStep.options) {
        const modelOption = subjectStep.options.find(o => o.triggersSteps?.includes('model-details'));
        if (modelOption) {
          const originalLength = guide.steps.length;
          const updatedGuide = updateGuideSteps(guide, 'subject-selection', modelOption.id);

          // model-details가 없었다면 추가되어야 함
          const hadModelDetails = guide.steps.some(s => s.id === 'model-details');
          if (!hadModelDetails) {
            expect(updatedGuide.steps.length).toBeGreaterThan(originalLength);
          }
        }
      }
    });

    it('skipsSteps 옵션 선택 시 해당 단계가 제거되어야 한다', () => {
      const subjectStep = guide.steps.find(s => s.id === 'subject-selection');
      if (subjectStep && subjectStep.options) {
        const productOnlyOption = subjectStep.options.find(o => o.skipsSteps?.includes('model-details'));
        if (productOnlyOption) {
          const updatedGuide = updateGuideSteps(guide, 'subject-selection', productOnlyOption.id);
          const hasModelDetails = updatedGuide.steps.some(s => s.id === 'model-details');
          expect(hasModelDetails).toBe(false);
        }
      }
    });
  });

  describe('isGuideComplete', () => {
    it('필수 단계가 모두 완료되면 true를 반환해야 한다', () => {
      const guide = generateDynamicGuide('product-only.hero-front', 'fashion');

      // 모든 필수 단계를 완료 처리
      const requiredSteps = guide.steps.filter(s => s.required).map(s => s.id);
      const completedGuide: DynamicGuide = {
        ...guide,
        completedSteps: requiredSteps,
      };

      expect(isGuideComplete(completedGuide)).toBe(true);
    });

    it('필수 단계가 완료되지 않으면 false를 반환해야 한다', () => {
      const guide = generateDynamicGuide('product-only.hero-front', 'fashion');
      expect(isGuideComplete(guide)).toBe(false);
    });
  });

  describe('getNextStep', () => {
    it('완료되지 않은 첫 번째 단계를 반환해야 한다', () => {
      const guide = generateDynamicGuide('product-only.hero-front', 'fashion');
      const nextStep = getNextStep(guide);

      expect(nextStep).toBeDefined();
      expect(nextStep?.id).toBe(guide.steps[0].id);
    });

    it('첫 단계가 완료되면 두 번째 단계를 반환해야 한다', () => {
      const guide = generateDynamicGuide('product-only.hero-front', 'fashion');
      const guideWithFirstComplete: DynamicGuide = {
        ...guide,
        completedSteps: [guide.steps[0].id],
      };

      const nextStep = getNextStep(guideWithFirstComplete);
      expect(nextStep?.id).toBe(guide.steps[1].id);
    });

    it('모든 단계가 완료되면 null을 반환해야 한다', () => {
      const guide = generateDynamicGuide('product-only.hero-front', 'fashion');
      const allCompleteGuide: DynamicGuide = {
        ...guide,
        completedSteps: guide.steps.map(s => s.id),
      };

      const nextStep = getNextStep(allCompleteGuide);
      expect(nextStep).toBeNull();
    });
  });

  describe('calculateProgress', () => {
    it('빈 가이드는 0%를 반환해야 한다', () => {
      const guide = generateDynamicGuide('product-only.hero-front', 'fashion');
      expect(calculateProgress(guide)).toBe(0);
    });

    it('절반 완료 시 약 50%를 반환해야 한다', () => {
      const guide = generateDynamicGuide('product-only.hero-front', 'fashion');
      const halfCompleted = guide.steps.slice(0, Math.floor(guide.steps.length / 2)).map(s => s.id);

      const halfCompleteGuide: DynamicGuide = {
        ...guide,
        completedSteps: halfCompleted,
      };

      const progress = calculateProgress(halfCompleteGuide);
      expect(progress).toBeGreaterThanOrEqual(40);
      expect(progress).toBeLessThanOrEqual(60);
    });

    it('모두 완료 시 100%를 반환해야 한다', () => {
      const guide = generateDynamicGuide('product-only.hero-front', 'fashion');
      const allCompleteGuide: DynamicGuide = {
        ...guide,
        completedSteps: guide.steps.map(s => s.id),
      };

      expect(calculateProgress(allCompleteGuide)).toBe(100);
    });
  });
});

describe('IntentMatcher', () => {
  describe('matchIntent', () => {
    it('패션 키워드를 올바르게 감지해야 한다', () => {
      const result = matchIntent('모델이 셔츠를 입은 전신 사진이 필요해요');

      expect(result.industry.detected).toBe('fashion');
      expect(result.industry.confidence).toBeGreaterThan(0);
      expect(result.industry.matchedKeywords.length).toBeGreaterThan(0);
    });

    it('음식 키워드를 올바르게 감지해야 한다', () => {
      const result = matchIntent('케이크 단면 사진 촬영');

      expect(result.industry.detected).toBe('food');
    });

    it('화장품 키워드를 올바르게 감지해야 한다', () => {
      const result = matchIntent('립스틱 발색 클로즈업');

      expect(result.industry.detected).toBe('beauty');
    });

    it('표현 방식 의도를 감지해야 한다', () => {
      const result = matchIntent('모델 전신 착용샷');

      expect(result.expression.intent).toBeDefined();
      expect(result.expression.category).toBe('with-person');
    });

    it('목적 의도를 감지해야 한다', () => {
      const result = matchIntent('스마트스토어 상품등록용 사진');

      expect(result.purpose.intent).toBe('ecommerce');
    });

    it('복합 의도를 올바르게 분석해야 한다', () => {
      const result = matchIntent('인스타그램 피드용 고급스러운 향수 플랫레이 촬영');

      expect(result.industry.detected).toBe('beauty');
      expect(result.purpose.intent).toBe('social-marketing');
      expect(result.expression.intent).toContain('flat-lay');
    });

    it('낮은 신뢰도일 때 명확화 질문을 생성해야 한다', () => {
      const result = matchIntent('사진 찍어주세요');

      expect(result.meta.needsClarification).toBe(true);
      expect(result.meta.clarificationQuestions.length).toBeGreaterThan(0);
    });

    it('추천 워크플로우를 생성해야 한다', () => {
      const result = matchIntent('원피스 모델 착용 전신 사진');

      expect(result.recommendations.primary).toBeDefined();
      if (result.recommendations.primary) {
        expect(result.recommendations.primary.industry).toBe('fashion');
        expect(result.recommendations.primary.confidence).toBeGreaterThan(0);
      }
    });
  });

  describe('suggestIntentsForCategory', () => {
    it('카테고리에 맞는 의도 목록을 반환해야 한다', () => {
      const intents = suggestIntentsForCategory('with-person');

      expect(intents.length).toBeGreaterThan(0);
      intents.forEach(intent => {
        expect(intent).toContain('with-person');
      });
    });

    it('업종을 지정하면 호환되는 의도만 반환해야 한다', () => {
      const intents = suggestIntentsForCategory('with-person', 'fashion');

      expect(intents.length).toBeGreaterThan(0);
    });
  });

  describe('quickSuggestIntents', () => {
    it('업종에 맞는 추천 의도 목록을 반환해야 한다', () => {
      const suggestions = quickSuggestIntents('fashion', 6);

      expect(suggestions.length).toBeLessThanOrEqual(6);
      suggestions.forEach(suggestion => {
        expect(suggestion.intent).toBeDefined();
        expect(suggestion.info).toBeDefined();
        expect(suggestion.score).toBeGreaterThan(0);
      });
    });

    it('각 업종에 대해 다른 추천을 반환해야 한다', () => {
      const fashionSuggestions = quickSuggestIntents('fashion', 3);
      const foodSuggestions = quickSuggestIntents('food', 3);

      // 최소한 일부는 다른 추천이어야 함
      const fashionIntents = fashionSuggestions.map(s => s.intent);
      const foodIntents = foodSuggestions.map(s => s.intent);

      const overlap = fashionIntents.filter(i => foodIntents.includes(i));
      expect(overlap.length).toBeLessThan(3);
    });
  });
});
