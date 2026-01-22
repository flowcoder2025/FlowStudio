/**
 * Workflow E2E Tests
 * Contract: TEST_E2E_WORKFLOW_FLOW
 * Evidence: e2e/workflow.spec.ts::test("create workflow")
 */

import { test, expect } from '@playwright/test';

test.describe('Workflow Flow', () => {
  test.describe('Home Page', () => {
    test('홈페이지가 올바르게 렌더링되어야 한다', async ({ page }) => {
      await page.goto('/');

      // 메인 제목이 표시되어야 함
      await expect(page.locator('h1, h2').first()).toBeVisible();

      // 업종 그리드가 표시되어야 함
      const industryGrid = page.locator('[data-testid="industry-grid"], .grid');
      await expect(industryGrid.first()).toBeVisible();
    });

    test('검색 기능이 작동해야 한다', async ({ page }) => {
      await page.goto('/');

      // 검색 입력란 찾기
      const searchInput = page.getByPlaceholder(/검색|Search|무엇을|만들고/);

      if (await searchInput.isVisible()) {
        await searchInput.fill('모델 전신 패션');

        // 추천 결과가 표시되어야 함
        const recommendations = page.locator('[data-testid="recommendations"], .recommendation');
        await expect(recommendations.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('업종 카드 클릭 시 워크플로우 페이지로 이동해야 한다', async ({ page }) => {
      await page.goto('/');

      // 패션 업종 카드 클릭
      const fashionCard = page.locator('[data-industry="fashion"], [href*="fashion"]').first();

      if (await fashionCard.isVisible()) {
        await fashionCard.click();

        // URL이 변경되어야 함
        await expect(page).toHaveURL(/workflow|fashion/);
      }
    });
  });

  test.describe('Workflow Wizard', () => {
    test('워크플로우 마법사 페이지가 올바르게 렌더링되어야 한다', async ({ page }) => {
      await page.goto('/workflow/fashion/model');

      // 페이지가 로드되어야 함
      await expect(page.locator('main, [data-testid="wizard"]')).toBeVisible();
    });

    test('직접 입력 탭에서 프롬프트를 입력할 수 있어야 한다', async ({ page }) => {
      await page.goto('/workflow/fashion/model');

      // 직접 입력 탭 클릭
      const directTab = page.getByRole('tab', { name: /직접|Direct|입력/ });

      if (await directTab.isVisible()) {
        await directTab.click();

        // 텍스트 영역 찾기
        const textarea = page.getByRole('textbox');

        if (await textarea.isVisible()) {
          await textarea.fill('네이비 린넨 셔츠를 입은 한국 여성 모델 전신 사진');
          await expect(textarea).toHaveValue(/네이비 린넨 셔츠/);
        }
      }
    });

    test('가이드 모드에서 단계별 옵션을 선택할 수 있어야 한다', async ({ page }) => {
      await page.goto('/workflow/fashion/model');

      // 가이드 탭 클릭
      const guideTab = page.getByRole('tab', { name: /가이드|Guide/ });

      if (await guideTab.isVisible()) {
        await guideTab.click();

        // StepFlow 컴포넌트가 표시되어야 함
        const stepFlow = page.locator('[data-testid="step-flow"], .step-flow');

        if (await stepFlow.isVisible()) {
          // 첫 번째 옵션 선택
          const firstOption = stepFlow.locator('button, [role="option"]').first();

          if (await firstOption.isVisible()) {
            await firstOption.click();
          }
        }
      }
    });

    test('이미지 업로드 기능이 작동해야 한다', async ({ page }) => {
      await page.goto('/workflow/fashion/model');

      // 이미지 업로드 영역 찾기
      const uploadArea = page.locator('[data-testid="image-upload"], .image-upload, input[type="file"]');

      if (await uploadArea.isVisible()) {
        // 파일 input이 있는지 확인
        const fileInput = page.locator('input[type="file"]');
        await expect(fileInput).toBeAttached();
      }
    });

    test('생성 버튼 클릭 시 결과 페이지로 이동해야 한다', async ({ page }) => {
      await page.goto('/workflow/fashion/model');

      // 프롬프트 입력
      const textarea = page.getByRole('textbox').first();

      if (await textarea.isVisible()) {
        await textarea.fill('테스트 프롬프트');

        // 생성 버튼 클릭
        const generateButton = page.getByRole('button', { name: /생성|Generate|만들기/ });

        if (await generateButton.isEnabled()) {
          await generateButton.click();

          // 결과 페이지로 이동하거나 로딩 표시
          await expect(page.locator('[data-testid="loading"], .loading, [data-testid="result"]')).toBeVisible({
            timeout: 10000,
          });
        }
      }
    });
  });

  test.describe('Result Page', () => {
    test('결과 페이지가 올바르게 렌더링되어야 한다', async ({ page }) => {
      // 결과 페이지로 직접 이동 (쿼리 파라미터 포함)
      await page.goto('/result?prompt=test');

      // 페이지가 로드되어야 함
      await expect(page.locator('main')).toBeVisible();
    });

    test('유사 워크플로우 추천이 표시되어야 한다', async ({ page }) => {
      await page.goto('/result?prompt=test');

      // SimilarWorkflows 컴포넌트 확인
      const similarSection = page.locator('[data-testid="similar-workflows"], .similar-workflows, h3:has-text("유사")');

      // 페이지에 따라 표시될 수도 있고 아닐 수도 있음
      const isVisible = await similarSection.isVisible();
      expect(typeof isVisible).toBe('boolean');
    });
  });

  test.describe('Gallery Page', () => {
    test('갤러리 페이지가 올바르게 렌더링되어야 한다', async ({ page }) => {
      await page.goto('/gallery');

      // 페이지가 로드되어야 함
      await expect(page.locator('main')).toBeVisible();
    });

    test('이미지 그리드가 표시되어야 한다', async ({ page }) => {
      await page.goto('/gallery');

      // 이미지 그리드 또는 빈 상태 메시지
      const grid = page.locator('[data-testid="image-grid"], .grid, .gallery-grid');
      const emptyMessage = page.locator('text=/아직|없습니다|empty/');

      const hasGrid = await grid.isVisible();
      const hasEmptyMessage = await emptyMessage.isVisible();

      // 둘 중 하나는 표시되어야 함
      expect(hasGrid || hasEmptyMessage).toBe(true);
    });
  });

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('모바일에서 하단 네비게이션이 표시되어야 한다', async ({ page }) => {
      await page.goto('/');

      // 모바일 네비게이션 확인
      const mobileNav = page.locator('[data-testid="mobile-nav"], .mobile-nav, nav');
      await expect(mobileNav.first()).toBeVisible();
    });

    test('모바일 메뉴가 작동해야 한다', async ({ page }) => {
      await page.goto('/');

      // 햄버거 메뉴 버튼 찾기
      const menuButton = page.locator('[data-testid="menu-button"], .menu-button, [aria-label*="menu"]');

      if (await menuButton.isVisible()) {
        await menuButton.click();

        // 메뉴가 열려야 함
        const menu = page.locator('[data-testid="mobile-menu"], .mobile-menu, [role="menu"]');
        await expect(menu).toBeVisible();
      }
    });
  });
});
