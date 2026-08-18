import { test, expect } from '@playwright/test';

test.describe('AccessRoute E2E Test Suite', () => {
  test('Complete demo flow: Chennai Central → Guindy with wheelchair', async ({ page }) => {
    // 1. Open application
    await page.goto('http://localhost:3000');

    // 2. Search: Chennai Central → Guindy
    await page.fill('input[placeholder*="Where"]', 'Guindy');
    await page.click('button:has-text("Find Routes")');

    // 3. Select accessibility preferences
    await page.click('input[type="checkbox"]:has(+ label:has-text("Wheelchair"))');
    await page.click('input[type="checkbox"]:has(+ label:has-text("Avoid stairs"))');

    // 4. Verify routes appear
    const recommendedRoute = page.locator('text=RECOMMENDED');
    await expect(recommendedRoute.first()).toBeVisible();

    const fastestRoute = page.locator('text=FASTEST');
    await expect(fastestRoute.first()).toBeVisible();

    // 5. Verify accessibility badges
    const highlyAccessible = page.locator('text=Highly Accessible');
    await expect(highlyAccessible.first()).toBeVisible();

    const limitedAccessibility = page.locator('text=Limited accessibility');
    await expect(limitedAccessibility.first()).toBeVisible();

    // 6. Click recommended route to see details
    await page.click('button:has-text("RECOMMENDED")');

    // 7. Verify journey steps appear
    const journeyStepsTab = page.locator('text=Steps');
    await expect(journeyStepsTab.first()).toBeVisible();
    await page.click('text=Steps');

    const walkStep = page.locator('text=Walk 120m');
    await expect(walkStep.first()).toBeVisible();

    // 8. Verify accessibility markers in journey steps
    const elevatorStep = page.locator('text=Elevator B');
    await expect(elevatorStep.first()).toBeVisible();

    // 9. Open assisted travel
    const assistedTravelBtn = page.locator('text=Assisted Travel');
    if (await assistedTravelBtn.first().isVisible()) {
      await page.click('text=Assisted Travel');
      const voiceBtn = page.locator('text=Play directions');
      await expect(voiceBtn.first()).toBeVisible();
    }

    // 10. Verify fare and savings
    const fare = page.locator('text=₹25');
    await expect(fare.first()).toBeVisible();

    const savings = page.locator('text=₹140 cheaper');
    await expect(savings.first()).toBeVisible();
  });

  // Test mobile responsiveness
  test('Mobile view: route options visible on small screen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');

    // Routes should stack vertically on mobile
    const routeCards = page.locator('[class*="route-card"]');
    const count = await routeCards.count();
    expect(count).toBe(3); // RECOMMENDED, FASTEST, LOWEST COST
  });

  // Test desktop view
  test('Desktop view: map and routes side-by-side', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:3000');

    const mapContainer = page.locator('[id*="map"]');
    const routePanel = page.locator('[class*="route-panel"]');

    // Both should be visible
    await expect(mapContainer.first()).toBeVisible();
    await expect(routePanel.first()).toBeVisible();
  });

  // Test accessibility preference changes
  test('Changing preferences updates routes', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('input[placeholder*="Where"]', 'Guindy');

    // Initial routes loaded
    const initialRecommended = await page.locator('text=38 min').count();
    expect(initialRecommended).toBeGreaterThan(0);

    // Toggle wheelchair
    await page.click('input[type="checkbox"]:has(+ label:has-text("Wheelchair"))');

    // Routes should update
    await page.waitForTimeout(500);
    const updatedRoutes = page.locator('[class*="route-card"]');
    const count = await updatedRoutes.count();
    expect(count).toBe(3);
  });

  // Test voice input (if implemented)
  test('Voice input extracts preferences', async ({ page }) => {
    // Mock speech recognition (Playwright doesn't support real microphone hardware)
    await page.addInitScript(() => {
      window.SpeechRecognition = class MockRecognition {
        constructor() {
          this.lang = 'en-IN';
          this.continuous = false;
          this.interimResults = false;
        }
        start() {
          if (this.onstart) this.onstart();
          setTimeout(() => {
            if (this.onresult) {
              this.onresult({
                resultIndex: 0,
                results: [[{ transcript: "I'm in a wheelchair and want to go to Guindy without stairs." }]]
              });
            }
            if (this.onend) this.onend();
          }, 50);
        }
        stop() {
          if (this.onend) this.onend();
        }
        abort() {
          if (this.onend) this.onend();
        }
      };
      window.webkitSpeechRecognition = window.SpeechRecognition;
    });

    await page.goto('http://localhost:3000');
    
    // Open preferences or assisted travel and click Voice
    await page.click('button:has-text("Assisted Travel")');
    await page.click('button:has-text("Voice")');

    // Verify preferences understood card appears
    const preferencesCard = page.locator('text=Preferences understood');
    await expect(preferencesCard.first()).toBeVisible();
  });
});
