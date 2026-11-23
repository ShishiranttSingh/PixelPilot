import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { width: 1440, height: 900, name: '1440x900' },
  { width: 1920, height: 1080, name: '1920x1080' },
];

const SECTIONS = [
  { name: 'full-page', selector: 'body' },
  { name: 'top-nav', selector: 'nav' },
  { name: 'hero', selector: 'section' },
  { name: 'stats', selector: 'div[style*="gridTemplateColumns"]' },
  { name: 'workspace', selector: 'div[style*="1fr 340px"]' },
  { name: 'bottom-widgets', selector: 'section:has-text("Workspace")' },
];

async function captureScreenshots(browser, baseUrl, prefix, outputDir) {
  for (const viewport of VIEWPORTS) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    for (const section of SECTIONS) {
      const vpDir = path.join(outputDir, viewport.name);
      if (!fs.existsSync(vpDir)) fs.mkdirSync(vpDir, { recursive: true });

      let element = page.locator(section.selector).first();
      if (await element.count() === 0) {
        element = page.locator('body');
      }

      await element.screenshot({
        path: path.join(vpDir, `${prefix}-${section.name}.png`),
        animations: 'disabled',
      });
      console.log(`Captured: ${prefix}/${viewport.name}/${section.name}`);
    }
    
    await page.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  
  console.log('Capturing DashboardV2 reference screenshots...');
  await captureScreenshots(browser, 'http://localhost:8444', 'reference', 'D:/PixelPilot/frontend/screenshots/reference');
  
  console.log('Capturing Next.js baseline screenshots...');
  await captureScreenshots(browser, 'http://localhost:3000/dashboard', 'baseline', 'D:/PixelPilot/frontend/screenshots/baseline');
  
  await browser.close();
  console.log('Done!');
}

main().catch(console.error);