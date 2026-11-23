import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { width: 1440, height: 900, name: '1440x900' },
  { width: 1920, height: 1080, name: '1920x1080' },
];

const SECTIONS = [
  { name: 'full-page', selector: 'body' },
  { name: 'top-nav', selector: 'nav[style*="sticky"]' },
  { name: 'hero', selector: 'section:has(h1:has-text("Good morning"))' },
  { name: 'stats', selector: 'div[style*="gridTemplateColumns"][style*="repeat(4"]' },
  { name: 'workspace', selector: 'div[style*="gridTemplateColumns"][style*="1fr 340px"]' },
  { name: 'image-workspace', selector: 'div[style*="borderRadius"][style*="minHeight"]:has-text("mountain")' },
  { name: 'workflow', selector: 'div[style*="flex"][style*="flexDirection"][style*="gap"]:has-text("Workflow Builder")' },
  { name: 'activity', selector: 'div[style*="flex"][style*="flexDirection"][style*="gap"]:has-text("Recent Activity")' },
  { name: 'bottom-widgets', selector: 'section:has-text("Workspace")' },
];

test.describe('DashboardV2 Reference Screenshots', () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const section of SECTIONS) {
        test(`DashboardV2 - ${section.name}`, async ({ page }) => {
          await page.goto('http://localhost:8444', { waitUntil: 'networkidle' });
          await page.waitForTimeout(1000);

          let element = page.locator(section.selector).first();
          if (await element.count() === 0) {
            element = page.locator('body');
          }

          await element.screenshot({
            path: `D:/PixelPilot/frontend/screenshots/reference/${viewport.name}/${section.name}.png`,
            animations: 'disabled',
          });
        });
      }
    });
  }
});

test.describe('Next.js Dashboard Baseline Screenshots', () => {
  for (const viewport of VIEWPORTS) {
    test.describe(`${viewport.name}`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const section of SECTIONS) {
        test(`Next.js - ${section.name}`, async ({ page }) => {
          await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });
          await page.waitForTimeout(1000);

          let element = page.locator(section.selector).first();
          if (await element.count() === 0) {
            element = page.locator('body');
          }

          await element.screenshot({
            path: `D:/PixelPilot/frontend/screenshots/baseline/${viewport.name}/${section.name}.png`,
            animations: 'disabled',
          });
        });
      }
    });
  }
});