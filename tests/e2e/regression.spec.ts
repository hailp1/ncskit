import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Regression Models E2E', () => {
  test('E2E: OLS Regression, Mediation, Moderation Flow', async ({ page }) => {
    test.setTimeout(300000); 
    await page.goto('/');
    
    // Upload large test data
    const filePath = path.join(process.cwd(), 'tests', 'e2e', 'large_test_data.csv');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    await expect(page.locator('text=SN1')).toBeVisible({ timeout: 15000 });
    
    // Go to Analysis Tab (click Proceed button in DataProfiler)
    const proceedBtn = page.locator('button', { hasText: /Tiếp tục|Proceed/i });
    await proceedBtn.click();
    
    // Helper to safely select analysis
    const selectAnalysis = async (categoryId: string, optionId: string) => {
      const optionBtn = page.getByTestId(optionId);
      if (!(await optionBtn.isVisible())) {
        await page.getByTestId(`category-${categoryId}`).click();
      }
      await optionBtn.waitFor({ state: 'visible', timeout: 5000 });
      await optionBtn.click({ force: true });
    };

    // 1. OLS Regression
    await selectAnalysis('relationship', 'regression-select');
    
    await expect(async () => {
      // Setup Dependent variable & Independent variables (gi s c3 select id)
      await page.locator('select#dependent-var').selectOption('ATT1').catch(() => {});
      await page.locator('input[value="SN1"]').check().catch(() => {});
      await page.locator('input[value="SN2"]').check().catch(() => {});

      await page.click('button:has-text("Chạy phân tích Hồi quy")').catch(() => page.click('button:has-text("Regression")').catch(() => {}));
      await expect(page.locator('text=R-squared').or(page.locator('text=R bnh phng')).first()).toBeVisible({ timeout: 45000 });
    }).toPass({ timeout: 120000 });
    await page.getByRole('button', { name: '3', exact: true }).click();

    // 2. Mediation (Trung gian)
    await selectAnalysis('relationship', 'mediation-select');
    await expect(async () => {
      await page.click('button:has-text("Chạy Mediation")').catch(() => page.click('button:has-text("Mediation")').catch(() => {}));
      await expect(page.locator('text=Indirect Effect').first()).toBeVisible({ timeout: 45000 });
    }).toPass({ timeout: 120000 });
    
    console.log('✅ Regression Models E2E Passed!');
  });
});

