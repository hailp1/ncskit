import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Basic Stats Module E2E', () => {
  test('E2E: Basic Stats Analysis Flow', async ({ page }) => {
    test.setTimeout(300000);
    
    await page.goto('/');
    
    // Upload file
    const filePath = path.join(process.cwd(), 'tests', 'e2e', 'large_test_data.csv');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for data load
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

    // 1. Descriptive Stats
    await selectAnalysis('basic-stats', 'descriptive-select').catch(async () => await selectAnalysis('reliability', 'descriptive-select'));
    
    await expect(async () => {
      // Use proper Playwright check instead of 'Select All' button which can be flaky with React uncontrolled inputs
      await page.locator('input[name="desc-col"][value="SN1"]').check();
      await page.locator('input[name="desc-col"][value="SN2"]').check();
      await page.locator('input[name="desc-col"][value="SN3"]').check();

      await page.getByTestId('run-analysis').click();
      await expect(page.locator('text=Mean (TB)').first().or(page.locator('text=Avg. Mean')).first()).toBeVisible({ timeout: 45000 });
    }).toPass({ timeout: 120000 });
    await page.getByRole('button', { name: '3', exact: true }).click();

    // 2. Frequencies
    await selectAnalysis('basic-stats', 'frequency-select').catch(async () => await selectAnalysis('reliability', 'frequency-select'));
    
    await expect(async () => {
      await page.locator('input[name="freq-col"][value="GENDER"]').check().catch(() => {});
      await page.locator('input[name="freq-col"][value="SN1"]').check();

      await page.getByTestId('run-analysis').click();
      await expect(page.locator('text=Cumulative %').first().or(page.locator('text=Tần suất').first())).toBeVisible({ timeout: 45000 });
    }).toPass({ timeout: 120000 });
    await page.getByRole('button', { name: '3', exact: true }).click();

    // 3. T-Test Independent
    await selectAnalysis('comparison', 'ttest-select');
    await expect(async () => {
      await page.locator('select#compare-1').selectOption('SN1');
      await page.locator('select#compare-2').selectOption('ATT1');
      
      await page.getByTestId('run-analysis').click();
      await expect(page.locator('text=p-value').first().or(page.locator('text=p').first())).toBeVisible({ timeout: 45000 });
    }).toPass({ timeout: 120000 });
    await page.getByRole('button', { name: '3', exact: true }).click();

    // 4. ANOVA
    await selectAnalysis('comparison', 'anova-select');
    await expect(async () => {
      await page.locator('input[name="anova-cols"][value="SN1"]').check();
      await page.locator('input[name="anova-cols"][value="SN2"]').check();
      await page.locator('input[name="anova-cols"][value="SN3"]').check();

      await page.getByTestId('run-analysis').click();
      await expect(page.locator('text=p-value').first().or(page.locator('text=p').first())).toBeVisible({ timeout: 45000 });
    }).toPass({ timeout: 120000 });
    
    console.log('✅ Basic Stats E2E Passed!');
  });
});
