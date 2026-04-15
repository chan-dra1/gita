import { test, expect } from '@playwright/test';

test.describe('Web smoke', () => {
  test('root loads and React mounts', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible({ timeout: 60_000 });
    await expect(page).toHaveTitle(/Bhagavad Gita/i);
  });

  test('deep-linked sloka route renders verse UI', async ({ page }) => {
    await page.goto('/sloka/2/47');
    await expect(page.getByText(/CHAPTER\s*2/i).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/VERSE\s*47|Verse\s*47/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
