import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Run Admin Auto Tests and extract results', async ({ page }) => {
  test.setTimeout(300000); // Allow up to 5 minutes for WebR initialization and tests
  
  // Navigate to the test page
  await page.goto('/test-runner');

  // Wait for the start button to be visible and click it
  const startBtn = page.locator('#run-test-btn');
  await expect(startBtn).toBeEnabled({ timeout: 15000 });
  await startBtn.click();

  // Wait for the "Total Tests" summary to appear (indicates tests are done)
  // This might take a few minutes as it downloads WebR and runs 20 tests
  await expect(page.locator('text=Total Tests')).toBeVisible({ timeout: 300000 });

  // Extract the results
  const results = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.divide-y > div'));
    return rows.map(row => {
      const name = row.querySelector('.font-medium')?.textContent?.trim() || '';
      const isPass = row.textContent?.includes('Pass');
      const isError = row.textContent?.includes('Failed') || row.querySelector('.text-red-600') !== null;
      let status = 'unknown';
      if (isPass) status = 'success';
      if (isError) status = 'error';
      const summaryBlock = row.querySelector('.bg-slate-50.text-slate-800');
      const asigSummary = summaryBlock ? summaryBlock.textContent?.trim() : '';
      return { analysisId: name, status, summary: asigSummary };
    });
  });

  console.log(`Extracted ${results.length} test results from WebR engine.`);
  
  // Write to a JSON file
  const outPath = path.join(process.cwd(), 'webr_results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Saved WebR results to ${outPath}`);
  
  // Basic validation to ensure they actually ran
  expect(results.length).toBeGreaterThan(10);
  const passed = results.filter(r => r.status === 'success');
  console.log(`${passed.length} out of ${results.length} tests passed on the real system.`);
  // Note: We don't assert 100% pass here because we want the pipeline to proceed to compare_engines.js
});
