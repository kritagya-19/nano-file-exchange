import { test, expect } from "@playwright/test";

test.describe("Landing Page E2E", () => {
  test("should load the landing page successfully", async ({ page }) => {
    await page.goto("/");
    // Verify title contains NanoFile
    await expect(page).toHaveTitle(/NanoFile/);
    
    // Verify hero section heading is visible
    const heroHeading = page.locator("h1", { hasText: /File sharing/i });
    await expect(heroHeading).toBeVisible();
  });

  test("should navigate to login page when clicking login button", async ({ page }) => {
    await page.goto("/");
    const loginLink = page.locator("a", { hasText: /Log in/i }).first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/.*login/);
  });
});
