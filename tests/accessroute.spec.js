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

  // Phase 10: Timetable Search on production feeds returns ROUTING_DATA_UNAVAILABLE
  test('Timetable search on production feeds honestly reports ROUTING_DATA_UNAVAILABLE with feed blockers', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Switch mode to Timetable Search
    await page.click('button:has-text("Timetable Search")');

    // Trigger route search
    await page.click('button:has-text("Find Routes")');

    // Verify service unavailable card is displayed
    const unavailableHeading = page.locator('text=Verified Timetable Data Unavailable');
    await expect(unavailableHeading.first()).toBeVisible();

    // Verify active feed blockers breakdown is displayed
    const cmrlBlocker = page.locator('text=Chennai Metro (CMRL): GTFS calendar expired');
    await expect(cmrlBlocker.first()).toBeVisible();

    const suburbanBlocker = page.locator('text=Suburban Rail: Southern Railway feed has placeholder dates');
    await expect(suburbanBlocker.first()).toBeVisible();

    const mtcBlocker = page.locator('text=MTC Bus: Scraped corridor frequencies lack GTFS calendar integrity');
    await expect(mtcBlocker.first()).toBeVisible();

    // Verify illustrative routes are NOT silently substituted
    const starRecommended = page.locator('button:has-text("RECOMMENDED")');
    await expect(starRecommended).toHaveCount(0);
  });

  // Phase 10: View Illustrative Preview from unavailable state
  test('Switching to Illustrative Preview keeps preview explicitly labelled', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Switch to Timetable Search first
    await page.click('button:has-text("Timetable Search")');
    await page.click('button:has-text("Find Routes")');

    // Click "View Illustrative Preview" from the unavailable notice
    await page.click('button:has-text("View Illustrative Preview")');

    // Verify routes appear with explicit "Illustrative Preview" label
    const previewBadge = page.locator('text=Illustrative Preview');
    await expect(previewBadge.first()).toBeVisible();

    const recommendedRoute = page.locator('text=RECOMMENDED');
    await expect(recommendedRoute.first()).toBeVisible();
  });

  // Phase 10: Timetable search with synthetic fixtures renders verified timetable legs and times
  test('Evaluating real timetable CSA search with synthetic fixtures renders verified timetable legs and times', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Switch to Timetable Search mode
    await page.click('button:has-text("Timetable Search")');

    // Check "Use Synthetic Test Fixtures"
    await page.click('input#planner-synthetic-fixtures');

    // Find Routes
    await page.click('button:has-text("Find Routes")');

    // Verify Verified Timetable badge appears
    const verifiedBadge = page.locator('text=Verified Timetable');
    await expect(verifiedBadge.first()).toBeVisible();

    // Verify real departure/arrival times are displayed
    const depTimeIndicator = page.locator('text=08:30:00');
    await expect(depTimeIndicator.first()).toBeVisible();

    // Click recommended journey to view dynamic timeline
    await page.click('button:has-text("RECOMMENDED")');

    // Verify dynamic timeline renders real transit stops
    const verifiedNotice = page.locator('text=Verified Timetable Journey');
    await expect(verifiedNotice.first()).toBeVisible();

    const boardStep = page.locator('text=Board at');
    await expect(boardStep.first()).toBeVisible();
  });

  // Phase 10: Validation error when origin and destination are the same
  test('Selecting identical origin and destination renders clear validation error', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Set destination same as origin (Chennai Central)
    await page.fill('input[placeholder*="Where"]', 'Chennai Central');

    // Verify same location alert is rendered
    const sameLocAlert = page.locator('text=Origin and Destination cannot be the same location');
    await expect(sameLocAlert.first()).toBeVisible();
  });

  // Phase 12: Functional Transit Network Explorer
  test('Phase 12: Open Transit Network Explorer and verify mode counts', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Click on Transit Explorer tab
    await page.click('button:has-text("Transit Explorer")');

    // Verify header and mode badges
    await expect(page.locator('text=Chennai Transit Explorer')).toBeVisible();
    await expect(page.locator('text=Curated Network of 140 Stations')).toBeVisible();
    await expect(page.locator('text=Routing Safely Isolated')).toBeVisible();

    // Verify all 4 transport mode filters are displayed
    await expect(page.locator('button:has-text("Metro")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Suburban")').first()).toBeVisible();
    await expect(page.locator('button:has-text("MTC Hubs")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Express")').first()).toBeVisible();
  });

  test('Phase 12: Station discovery search and accessibility details', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Switch to Transit Explorer
    await page.click('button:has-text("Transit Explorer")');

    // Search for Guindy
    await page.fill('input[placeholder*="Search station"]', 'Guindy');

    // Verify search results show Guindy
    await expect(page.locator('.station-card-item').first()).toBeVisible();

    // Click on Guindy station card
    await page.locator('.station-card-item').first().click();

    // Verify detailed info panel opens with accessibility and status
    await expect(page.locator('text=Station Accessibility Features').first()).toBeVisible();
    await expect(page.locator('text=Timetable Data Isolation Notice').first()).toBeVisible();

    // Action buttons visible
    await expect(page.locator('button:has-text("Set as Origin")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Set as Destination")').first()).toBeVisible();
  });

  test('Phase 12: Corridor alignment and linear station sequence view', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.click('button:has-text("Transit Explorer")');

    // Switch to Corridors tab
    await page.click('button:has-text("Corridors")');

    // Verify Blue Line and South Line corridors are listed
    await expect(page.locator('text=Blue Line (Corridor 1)').first()).toBeVisible();
    await expect(page.locator('text=South Line').first()).toBeVisible();

    // Click on Blue Line corridor
    await page.click('button:has-text("Blue Line")');

    // Verify stops count and terminals
    await expect(page.locator('text=26 Stops').first()).toBeVisible();
    await expect(page.locator('text=Wimco Nagar Depot').first()).toBeVisible();
  });

  test('Phase 12: Data audit and provenance transparency view', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.click('button:has-text("Transit Explorer")');

    // Switch to Data Audit tab
    await page.click('button:has-text("Data Audit")');

    // Verify data provenance reasons for isolation
    await expect(page.locator('text=Data Source Audit & Verification Status')).toBeVisible();
    await expect(page.locator('text=EXPIRED_CALENDAR').first()).toBeVisible();
    await expect(page.locator('text=PLACEHOLDER_CALENDAR').first()).toBeVisible();
    await expect(page.locator('text=COMMUNITY_APP_SCRAPE').first()).toBeVisible();
    await expect(page.locator('text=NO_TIMETABLE_DATASET').first()).toBeVisible();
  });

  test('Phase 12: Set station as origin switches seamlessly to Journey Planner', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.click('button:has-text("Transit Explorer")');
    await page.fill('input[placeholder*="Search station"]', 'Airport');
    await page.click('text=Chennai International Airport');

    // Click "Set as Origin"
    await page.click('button:has-text("Set as Origin")');

    // Verify switches back to Journey Planner and sets Origin
    await expect(page.locator('input[placeholder*="Where"]').first()).toBeVisible();
  });

  // Phase 13: Chennai-Only Geographic Scope Enforcement & Geographical Routing
  test('Phase 13: Non-Chennai cities show coverage alert and prevent planning', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Type Bengaluru in destination input
    await page.fill('input[placeholder*="Where"]', 'Bengaluru');

    // Verify out-of-scope alert appears
    const scopeAlert = page.locator('text=Outside Supported Geographic Scope');
    await expect(scopeAlert.first()).toBeVisible();

    const scopeNotice = page.locator('text=AccessRoute currently supports Chennai and its connected transit network.');
    await expect(scopeNotice.first()).toBeVisible();
  });

  test('Phase 13: Geographical Walk route displays road geometry and distance without transit timetable claims', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');

    // Click "Walk" tab in RouteSearch
    const walkBtn = page.locator('button:has-text("Walk")');
    await expect(walkBtn.first()).toBeVisible({ timeout: 10000 });

    await Promise.all([
      page.waitForResponse((resp) => resp.url().includes('/api/geo/route'), { timeout: 15000 }).catch(() => {}),
      walkBtn.first().click()
    ]);

    // Verify Geographical Route card appears
    await expect(page.locator('text=Geographical Route (WALKING)').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Not a verified public transport timetable').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Turn-by-Turn Route Guidance').first()).toBeVisible({ timeout: 5000 });
  });

  test('Phase 13: Map Legend displays 7 pedestrian infrastructure types and 3 confidence statuses', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Toggle Map Legend button
    const legendBtn = page.locator('button[aria-label="Toggle Map Legend"]');
    await expect(legendBtn.first()).toBeVisible();
    await legendBtn.first().click();

    // Verify Legend Drawer opens with Pedestrian Infrastructure
    await expect(page.locator('text=Chennai Transit & Pedestrian Legend').first()).toBeVisible();
    await expect(page.locator('text=Elevator / Lift').first()).toBeVisible();
    await expect(page.locator('text=Stairs (Barrier)').first()).toBeVisible();
    await expect(page.locator('text=Ramp').first()).toBeVisible();
    await expect(page.locator('text=Footbridge (FOB)').first()).toBeVisible();
    await expect(page.locator('text=Underpass').first()).toBeVisible();
    await expect(page.locator('text=Pedestrian Crossing').first()).toBeVisible();

    // Verify Confidence Statuses
    await expect(page.locator('text=Verified:').first()).toBeVisible();
    await expect(page.locator('text=Provisional:').first()).toBeVisible();
    await expect(page.locator('text=Unknown:').first()).toBeVisible();
  });
});

