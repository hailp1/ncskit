import { chromium } from 'playwright';
import fs from 'fs';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('[Browser]', msg.type(), msg.text()));

  console.log('Navigating to http://localhost:3000/generate-report');
  await page.goto('http://localhost:3000/generate-report', { timeout: 60000 });
  
  console.log('Waiting for #final-report textarea to appear (this runs all 22 tests and might take 3-5 minutes)...');
  await page.waitForSelector('#final-report', { timeout: 600000 }); // Wait up to 10 minutes
  
  const reportText = await page.$eval('#final-report', (el) => (el as HTMLTextAreaElement).value);
  
  fs.writeFileSync('REPORT_22_ANALYSES.md', reportText);
  console.log('Successfully saved to REPORT_22_ANALYSES.md');
  
  await browser.close();
}

run().catch(console.error);
