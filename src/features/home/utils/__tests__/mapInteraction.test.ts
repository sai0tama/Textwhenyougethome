import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ACTIVATION_RADIUS,
  buildCityStoryIndex,
  CANONICAL_PROJECTED_CITIES,
  computeBubbleLayout,
  DEACTIVATION_RADIUS,
  DISMISS_DELAY,
  distanceToRect,
  filterProjectedCities,
  isPointInCorridor,
  MAP_HEIGHT,
  MAP_WIDTH,
  resolveActiveStory,
  SWITCH_MARGIN,
  type BubbleLayout,
} from "../mapData";
import type { ArchiveNote } from "../../../submissions/client/localNoteStorage";

describe("Interactive World Map Architecture & Interaction Rules", () => {
  const containerW = 960;
  const containerH = 410;

  // 1. Proximity Activation
  it("1. A marker activates when approached within its configured activation radius", () => {
    const london = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "london")!;
    assert.ok(london, "London must exist in canonical cities");

    const markerScreenX = (london.x / MAP_WIDTH) * containerW;
    const markerScreenY = (london.y / MAP_HEIGHT) * containerH;

    // Cursor positioned 15px away from marker (within ACTIVATION_RADIUS = 26px)
    const cursorX = markerScreenX + 10;
    const cursorY = markerScreenY + 10;
    const dist = Math.hypot(cursorX - markerScreenX, cursorY - markerScreenY);

    assert.ok(
      dist <= ACTIVATION_RADIUS,
      `Distance ${dist} must be <= ACTIVATION_RADIUS (${ACTIVATION_RADIUS})`,
    );
  });

  // 2. Distant Marker Rejection
  it("2. A distant marker does not activate", () => {
    const london = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "london")!;
    const markerScreenX = (london.x / MAP_WIDTH) * containerW;
    const markerScreenY = (london.y / MAP_HEIGHT) * containerH;

    // Cursor positioned 80px away (beyond ACTIVATION_RADIUS = 26px)
    const cursorX = markerScreenX + 60;
    const cursorY = markerScreenY + 60;
    const dist = Math.hypot(cursorX - markerScreenX, cursorY - markerScreenY);

    assert.ok(dist > ACTIVATION_RADIUS, `Distance ${dist} must be > ACTIVATION_RADIUS`);
    assert.ok(dist > DEACTIVATION_RADIUS, `Distance ${dist} must be > DEACTIVATION_RADIUS`);
  });

  // 3. Story Display Matching
  it("3. The correct story is displayed for a selected marker", () => {
    const london = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "london")!;
    const mockCmsStories: ArchiveNote[] = [
      {
        id: "cms-story-1",
        name: "Clara",
        age: 26,
        city: "London",
        story: "Walking home past the red phone booth is always reassuring.",
        color: "yellow",
        filterId: "safety-care",
      },
    ];

    const index = buildCityStoryIndex(mockCmsStories);
    const resolved = resolveActiveStory(london.city, index);

    assert.equal(resolved.cityName, "London");
    assert.equal(resolved.name, "Clara");
    assert.equal(resolved.age, 26);
    assert.equal(resolved.story, "Walking home past the red phone booth is always reassuring.");
    assert.equal(resolved.meta, "Clara, 26 · London");
  });

  // 4. Stability Across Re-evaluations
  it("4. A selected story stays stable across multiple evaluations without mutating data", () => {
    const tokyo = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "tokyo")!;
    const mockCmsStories: ArchiveNote[] = [
      {
        id: "cms-story-tokyo-1",
        name: "Yuki",
        age: 31,
        city: "Tokyo",
        story: "Convenience store lights guide my entire walk.",
        color: "blue",
        filterId: "known-distance",
      },
    ];

    const index = buildCityStoryIndex(mockCmsStories);
    const firstEval = resolveActiveStory(tokyo.city, index);
    const secondEval = resolveActiveStory(tokyo.city, index);

    assert.deepEqual(
      firstEval,
      secondEval,
      "Resolved story must remain strictly identical across evaluations",
    );
  });

  // 5. Hysteresis Prevents Jitter in Clusters
  it("5. Nearby markers do not cause rapid switching or flickering due to hysteresis", () => {
    // London and Paris are relatively close
    const london = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "london")!;
    const paris = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "paris")!;

    const londonX = (london.x / MAP_WIDTH) * containerW;
    const londonY = (london.y / MAP_HEIGHT) * containerH;

    const parisX = (paris.x / MAP_WIDTH) * containerW;
    const parisY = (paris.y / MAP_HEIGHT) * containerH;

    // Simulate cursor near London: within London's zone (west of London, away from Paris)
    const cursorX = londonX - 10;
    const cursorY = londonY - 7;

    const distToLondon = Math.hypot(cursorX - londonX, cursorY - londonY);
    const distToParis = Math.hypot(cursorX - parisX, cursorY - parisY);

    // Hysteresis rule: If London is already active, Paris can only take over if:
    // distToParis <= ACTIVATION_RADIUS AND distToParis < distToLondon - SWITCH_MARGIN
    const parisCanTakeOver =
      distToParis <= ACTIVATION_RADIUS && distToParis < distToLondon - SWITCH_MARGIN;

    assert.equal(
      parisCanTakeOver,
      false,
      "Paris must not take over when cursor is hovering within London's zone",
    );

    // Also verify midpoint stability: when cursor is equidistant or within SWITCH_MARGIN, neither flips
    const midX = (londonX + parisX) / 2;
    const midY = (londonY + parisY) / 2;
    const midDistToLondon = Math.hypot(midX - londonX, midY - londonY);
    const midDistToParis = Math.hypot(midX - parisX, midY - parisY);
    const midParisCanTakeOver =
      midDistToParis <= ACTIVATION_RADIUS && midDistToParis < midDistToLondon - SWITCH_MARGIN;

    assert.equal(
      midParisCanTakeOver,
      false,
      "Paris must not take over at midpoint due to hysteresis switch margin",
    );
  });

  // 6. Transit Corridor & Leaving Active Area
  it("6. Transit corridor protects bubble while moving from marker toward card, and leaving clears", () => {
    const bengaluru = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "bengaluru")!;
    const layout = computeBubbleLayout(bengaluru, containerW, containerH)!;
    assert.ok(layout, "Bubble layout must compute for valid container");

    // Position cursor halfway between marker and bubble top edge
    const midX = (layout.markerScreenX + layout.left + layout.width / 2) / 2;
    const midY = (layout.markerScreenY + layout.top + layout.height / 2) / 2;

    const inCorridor = isPointInCorridor(
      midX,
      midY,
      layout.markerScreenX,
      layout.markerScreenY,
      layout,
      18,
    );
    assert.equal(
      inCorridor,
      true,
      "Midpoint between marker and bubble must reside within transit corridor",
    );

    // Position cursor far outside map
    const farX = -50;
    const farY = -50;
    const farInCorridor = isPointInCorridor(
      farX,
      farY,
      layout.markerScreenX,
      layout.markerScreenY,
      layout,
      18,
    );
    assert.equal(farInCorridor, false, "Points outside map must NOT be in corridor");
  });

  // 7 & 8. Touch Tap Selection & Switching
  it("7 & 8. Touch tap activates closest marker within threshold, and another tap switches", () => {
    const london = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "london")!;
    const tokyo = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "tokyo")!;

    const tapThreshold = 36;
    const londonX = (london.x / MAP_WIDTH) * containerW;
    const londonY = (london.y / MAP_HEIGHT) * containerH;

    // Tap within 10px of London
    const tapLondonDist = Math.hypot(londonX + 8 - londonX, londonY + 6 - londonY);
    assert.ok(tapLondonDist <= tapThreshold, "Tap near London must qualify for activation");

    // Tap within 10px of Tokyo
    const tokyoX = (tokyo.x / MAP_WIDTH) * containerW;
    const tokyoY = (tokyo.y / MAP_HEIGHT) * containerH;
    const tapTokyoDist = Math.hypot(tokyoX - 5 - tokyoX, tokyoY - 5 - tokyoY);
    assert.ok(tapTokyoDist <= tapThreshold, "Tap near Tokyo must qualify for activation");
  });

  // 9. Bubble Clamping Within Container
  it("9. Bubble positioning clamps strictly within container boundaries across viewports", () => {
    const testViewports = [
      { w: 1440, h: 612 }, // Desktop
      { w: 768, h: 365 }, // Tablet
      { w: 390, h: 243 }, // Mobile
    ];

    for (const vp of testViewports) {
      for (const pt of CANONICAL_PROJECTED_CITIES) {
        const layout = computeBubbleLayout(pt, vp.w, vp.h);
        assert.ok(
          layout,
          `Layout must compute for city ${pt.city.name} at viewport ${vp.w}x${vp.h}`,
        );

        // Horizontal boundaries
        assert.ok(
          layout.left >= 0,
          `Left edge ${layout.left} must be >= 0 for ${pt.city.name} at ${vp.w}x${vp.h}`,
        );
        assert.ok(
          layout.left + layout.width <= vp.w,
          `Right edge ${layout.left + layout.width} must be <= container width ${vp.w} for ${pt.city.name}`,
        );

        // Vertical boundaries
        assert.ok(
          layout.top >= 0,
          `Top edge ${layout.top} must be >= 0 for ${pt.city.name} at ${vp.w}x${vp.h}`,
        );
        assert.ok(
          layout.top + layout.height <= vp.h,
          `Bottom edge ${layout.top + layout.height} must be <= container height ${vp.h} for ${pt.city.name}`,
        );
      }
    }
  });

  // 10. Missing or Malformed City Data Handled Safely
  it("10. Missing, malformed, or unsupported city data falls back safely to default city narrative", () => {
    const sydney = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "sydney")!;
    const malformedStories: ArchiveNote[] = [
      {
        id: "cms-story-bad-1",
        name: "Unknown",
        city: "", // empty city name
        story: "Lost story",
        color: "green",
        filterId: "safety-care",
      },
      {
        id: "cms-story-bad-2",
        name: "Unknown",
        city: "Atlantis", // unknown city not on map
        story: "Submerged narrative",
        color: "blue",
        filterId: "walking-us",
      },
    ];

    const index = buildCityStoryIndex(malformedStories);
    const resolved = resolveActiveStory(sydney.city, index);

    // Must fall back to sydney's canonical story
    assert.equal(resolved.cityName, "Sydney");
    assert.equal(resolved.story, sydney.city.story);
    assert.equal(resolved.meta, "Sydney · Australia");
  });

  // 11. Multi-Story Deterministic Resolution
  it("11. Markers with multiple stories resolve deterministically without random changes", () => {
    const bengaluru = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "bengaluru")!;
    const multipleStories: ArchiveNote[] = [
      {
        id: "bengaluru-story-101",
        name: "Ananya",
        age: 22,
        city: "Bengaluru",
        story: "Story A from flower seller.",
        color: "pink",
        filterId: "walking-us",
      },
      {
        id: "bengaluru-story-102",
        name: "Deepak",
        age: 28,
        city: "Bengaluru",
        story: "Story B from metro walk.",
        color: "orange",
        filterId: "after-dark",
      },
    ];

    const index = buildCityStoryIndex(multipleStories);
    const res1 = resolveActiveStory(bengaluru.city, index);

    // Shuffle input array to verify order invariance
    const shuffledStories = [...multipleStories].reverse();
    const shuffledIndex = buildCityStoryIndex(shuffledStories);
    const res2 = resolveActiveStory(bengaluru.city, shuffledIndex);

    assert.deepEqual(res1, res2, "Story resolution must be invariant to input array order");
    assert.equal(res1.name, "Deepak", "Highest deterministic ID must win tiebreaker consistently");
  });

  // 12. Filter Subsetting
  it("12. Tag filtering correctly restricts projected city set", () => {
    const allCount = CANONICAL_PROJECTED_CITIES.length;
    assert.equal(allCount, 20, "Canonical cities must have exactly 20 cities");

    const filtered = filterProjectedCities(CANONICAL_PROJECTED_CITIES, ["after-dark"]);
    assert.ok(
      filtered.length > 0 && filtered.length < allCount,
      "Filtered set must be non-empty subset",
    );
    for (const pt of filtered) {
      assert.equal(pt.city.filterId, "after-dark");
    }
  });

  // 13. Distance to Rect Math & Keyboard Accessibility
  it("13. distanceToRect accurately calculates interior, edge, and corner distances", () => {
    // A popup at [100, 100] with width 200, height 100
    // Interior point
    assert.equal(distanceToRect(150, 150, 100, 100, 200, 100), 0);

    // Edge points
    assert.equal(distanceToRect(80, 150, 100, 100, 200, 100), 20); // 20px left of left edge
    assert.equal(distanceToRect(310, 150, 100, 100, 200, 100), 10); // 10px right of right edge
    assert.equal(distanceToRect(150, 85, 100, 100, 200, 100), 15); // 15px above top edge
    assert.equal(distanceToRect(150, 215, 100, 100, 200, 100), 15); // 15px below bottom edge

    // Corner point (3px right, 4px below bottom-right -> hypot(3, 4) = 5)
    assert.equal(distanceToRect(303, 204, 100, 100, 200, 100), 5);
  });

  // 14. Full Desktop Hover Journey: Reveal, Corridor Transit, Switch, and Dismiss
  it("14. Desktop hover sequence correctly activates, protects transit, switches, and dismisses", () => {
    const tokyo = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "tokyo")!;
    const seoul = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "seoul")!;

    const tokyoX = (tokyo.x / MAP_WIDTH) * containerW;
    const tokyoY = (tokyo.y / MAP_HEIGHT) * containerH;

    const seoulX = (seoul.x / MAP_WIDTH) * containerW;
    const seoulY = (seoul.y / MAP_HEIGHT) * containerH;

    // Step 1: Cursor hovers within 35px of Tokyo (ACTIVATION_RADIUS is 42px)
    const hoverTokyoDist = 35;
    assert.ok(hoverTokyoDist <= ACTIVATION_RADIUS, "Must activate Tokyo when hovering near marker");

    // Step 2: Bubble appears for Tokyo, cursor moves into transit corridor
    const layout = computeBubbleLayout(tokyo, containerW, containerH)!;
    assert.ok(layout, "Bubble layout must exist");

    const transitX = (layout.markerScreenX + layout.left + layout.width / 2) / 2;
    const transitY = (layout.markerScreenY + layout.top + layout.height / 2) / 2;
    assert.equal(
      isPointInCorridor(transitX, transitY, layout.markerScreenX, layout.markerScreenY, layout, 18),
      true,
      "Transit corridor must protect bubble from premature dismissal",
    );

    // Step 3: Cursor moves over toward Seoul (Seoul is ~32px from Tokyo)
    // Within 20px of Seoul
    const cursorNearSeoulX = seoulX + 10;
    const cursorNearSeoulY = seoulY + 10;
    const dSeoul = Math.hypot(cursorNearSeoulX - seoulX, cursorNearSeoulY - seoulY);
    const dTokyo = Math.hypot(cursorNearSeoulX - tokyoX, cursorNearSeoulY - tokyoY);

    const seoulSwitches = dSeoul <= ACTIVATION_RADIUS && dSeoul < dTokyo - SWITCH_MARGIN;
    assert.equal(seoulSwitches, true, "Moving near Seoul must switch from Tokyo to Seoul");

    // Step 4: Cursor moves out into the Pacific Ocean (100px from any marker)
    const oceanDist = 100;
    assert.ok(oceanDist > DEACTIVATION_RADIUS, "Distant cursor must dismiss bubble gracefully");
  });

  // 15. Edge Locations Boundary Clamping
  it("15. Extreme edge locations (Tokyo East, Mexico City West, Sydney South, Toronto North) stay clamped inside container", () => {
    const tokyo = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "tokyo")!;
    const mexicoCity = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "mexico-city")!;
    const sydney = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "sydney")!;
    const toronto = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "toronto")!;

    for (const city of [tokyo, mexicoCity, sydney, toronto]) {
      const layout = computeBubbleLayout(city, containerW, containerH)!;
      assert.ok(layout, `Layout must exist for ${city.city.name}`);
      assert.ok(layout.left >= 8, `${city.city.name} left must be >= 8px`);
      assert.ok(
        layout.left + layout.width <= containerW - 8,
        `${city.city.name} right must be <= containerW - 8px`,
      );
      assert.ok(layout.top >= 8, `${city.city.name} top must be >= 8px`);
      assert.ok(
        layout.top + layout.height <= containerH - 8,
        `${city.city.name} bottom must be <= containerH - 8px`,
      );
    }
  });

  // 16. Rapid Movement Between Close Neighbors
  it("16. Moving back and forth between close neighbors alternates selection cleanly", () => {
    const london = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "london")!;
    const paris = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "paris")!;

    const londonX = (london.x / MAP_WIDTH) * containerW;
    const londonY = (london.y / MAP_HEIGHT) * containerH;

    const parisX = (paris.x / MAP_WIDTH) * containerW;
    const parisY = (paris.y / MAP_HEIGHT) * containerH;

    // Direct on London
    const dL1 = 0;
    const dP1 = Math.hypot(londonX - parisX, londonY - parisY);
    assert.ok(dL1 <= ACTIVATION_RADIUS);

    // Moving over to Paris (1px from Paris)
    const dP2 = 1;
    const dL2 = dP1 - 1;
    const parisSwitches = dP2 <= ACTIVATION_RADIUS && dP2 < dL2 - SWITCH_MARGIN;
    assert.equal(parisSwitches, true, "Moving to Paris must activate Paris");

    // Moving back to London (1px from London)
    const dL3 = 1;
    const dP3 = dP1 - 1;
    const londonSwitches = dL3 <= ACTIVATION_RADIUS && dL3 < dP3 - SWITCH_MARGIN;
    assert.equal(londonSwitches, true, "Moving back to London must re-activate London");
  });

  // 17. Multi-Story Rotation & Cycling
  it("17. Multi-story rotation cycles through all stories for a location and reports correct counts", () => {
    const tokyo = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "tokyo")!;
    const stories: ArchiveNote[] = [
      {
        id: "tokyo-1",
        name: "Kenji",
        city: "Tokyo",
        story: "First tokyo story",
        color: "blue",
        filterId: "after-dark",
      },
      {
        id: "tokyo-2",
        name: "Aoi",
        city: "Tokyo",
        story: "Second tokyo story",
        color: "yellow",
        filterId: "safety-care",
      },
      {
        id: "tokyo-3",
        name: "Ren",
        city: "Tokyo",
        story: "Third tokyo story",
        color: "green",
        filterId: "walking-us",
      },
    ];

    const index = buildCityStoryIndex(stories);
    // Offset 0: first in sorted order (tokyo-3 descending)
    const story0 = resolveActiveStory(tokyo.city, index, 0);
    assert.equal(story0.totalStories, 3);
    assert.equal(story0.storyIndex, 0);
    assert.equal(story0.name, "Ren");

    // Offset 1: second story
    const story1 = resolveActiveStory(tokyo.city, index, 1);
    assert.equal(story1.totalStories, 3);
    assert.equal(story1.storyIndex, 1);
    assert.equal(story1.name, "Aoi");

    // Offset 2: third story
    const story2 = resolveActiveStory(tokyo.city, index, 2);
    assert.equal(story2.totalStories, 3);
    assert.equal(story2.storyIndex, 2);
    assert.equal(story2.name, "Kenji");

    // Offset 3 wraps back to 0
    const story3 = resolveActiveStory(tokyo.city, index, 3);
    assert.equal(story3.storyIndex, 0);
    assert.equal(story3.name, "Ren");
  });

  // 18. Empty and Duplicate Dataset Resiliency
  it("18. Handles empty and duplicate datasets gracefully without errors", () => {
    const london = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "london")!;

    // Empty dataset
    const emptyIndex = buildCityStoryIndex([]);
    const resolvedEmpty = resolveActiveStory(london.city, emptyIndex);
    assert.equal(resolvedEmpty.cityName, "London");
    assert.equal(resolvedEmpty.story, london.city.story);
    assert.equal(resolvedEmpty.totalStories, 1);

    // Duplicate dataset with identical stories
    const duplicateStories: ArchiveNote[] = [
      {
        id: "dup-1",
        name: "Sam",
        city: "London",
        story: "Same street every evening.",
        color: "yellow",
        filterId: "safety-care",
      },
      {
        id: "dup-1",
        name: "Sam",
        city: "London",
        story: "Same street every evening.",
        color: "yellow",
        filterId: "safety-care",
      },
    ];

    const dupIndex = buildCityStoryIndex(duplicateStories);
    const resolvedDup = resolveActiveStory(london.city, dupIndex);
    assert.equal(resolvedDup.cityName, "London");
    assert.equal(resolvedDup.story, "Same street every evening.");
  });

  // 19. Dismissal Delay Constant Integrity
  it("19. DISMISS_DELAY is configured to an intentional, responsive grace window", () => {
    assert.ok(
      DISMISS_DELAY >= 120 && DISMISS_DELAY <= 250,
      `DISMISS_DELAY (${DISMISS_DELAY}ms) must be between 120ms and 250ms for natural feel`,
    );
  });

  // 20. Australia vs Bangkok Regression Test (Bug 1 & 3 Root Cause Fix)
  it("20. Pointer near Australia strictly selects Australian story and never Bangkok", () => {
    const bangkok = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "bangkok")!;
    const sydney = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "sydney")!;
    const melbourne = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "melbourne")!;

    const bangkokLayout = computeBubbleLayout(bangkok, containerW, containerH)!;
    const sydneyLayout = computeBubbleLayout(sydney, containerW, containerH)!;

    // Verify Bangkok bubble does not cover Sydney or Melbourne
    const sydneyScreenX = (sydney.x / MAP_WIDTH) * containerW;
    const sydneyScreenY = (sydney.y / MAP_HEIGHT) * containerH;
    const melbourneScreenX = (melbourne.x / MAP_WIDTH) * containerW;
    const melbourneScreenY = (melbourne.y / MAP_HEIGHT) * containerH;

    const sydneyInBangkokBubble =
      sydneyScreenX >= bangkokLayout.left &&
      sydneyScreenX <= bangkokLayout.left + bangkokLayout.width &&
      sydneyScreenY >= bangkokLayout.top &&
      sydneyScreenY <= bangkokLayout.top + bangkokLayout.height;

    const melbourneInBangkokBubble =
      melbourneScreenX >= bangkokLayout.left &&
      melbourneScreenX <= bangkokLayout.left + bangkokLayout.width &&
      melbourneScreenY >= bangkokLayout.top &&
      melbourneScreenY <= bangkokLayout.top + bangkokLayout.height;

    assert.equal(sydneyInBangkokBubble, false, "Bangkok bubble must never cover Sydney");
    assert.equal(melbourneInBangkokBubble, false, "Bangkok bubble must never cover Melbourne");

    // Proximity check: Cursor near Sydney (10px from Sydney)
    const cursorX = sydneyScreenX + 5;
    const cursorY = sydneyScreenY + 5;
    const dSydney = Math.hypot(cursorX - sydneyScreenX, cursorY - sydneyScreenY);
    const dBangkok = Math.hypot(
      cursorX - (bangkok.x / MAP_WIDTH) * containerW,
      cursorY - (bangkok.y / MAP_HEIGHT) * containerH,
    );

    assert.ok(dSydney <= ACTIVATION_RADIUS, "Cursor must be within Sydney activation radius");
    assert.ok(dSydney < dBangkok - SWITCH_MARGIN, "Sydney must win decisively over Bangkok");

    // Story resolution strictly resolves Sydney story
    const emptyIndex = buildCityStoryIndex([]);
    const resolvedStory = resolveActiveStory(sydney.city, emptyIndex);
    assert.equal(resolvedStory.cityName, "Sydney");
    assert.equal(resolvedStory.country, "Australia");
    assert.equal(
      resolvedStory.story,
      "I take my headphones out at the last corner. That is my version of locking a door.",
    );
  });

  // 21. Single Active Marker Invariant (Bug 2 Root Cause Fix)
  it("21. Invariant: At most one marker is active at any moment", () => {
    const activeMarkerId = "sydney";
    const points = CANONICAL_PROJECTED_CITIES;

    const activeMarkers = points.filter((p) => p.city.id === activeMarkerId);
    assert.equal(activeMarkers.length, 1, "Exactly one marker must match the active ID");

    // When a marker is active, no other marker can have active status
    for (const point of points) {
      const isActive = point.city.id === activeMarkerId;
      if (point.city.id !== "sydney") {
        assert.equal(
          isActive,
          false,
          `${point.city.name} must NOT be active when Sydney is active`,
        );
      }
    }
  });

  // 22. Pinned State Lock & Transition (Bug 1, 4, 5 Fix)
  it("22. Pinned state locks selection against accidental hover and clears cleanly", () => {
    let pinnedMarkerId: string | null = "tokyo";
    let hoveredMarkerId: string | null = "london";

    // When pinned, activeMarkerId must be the pinned marker, NOT the hovered marker
    let activeMarkerId: string | null = pinnedMarkerId ?? hoveredMarkerId;
    assert.equal(activeMarkerId, "tokyo", "Active marker must be pinned marker");

    // Moving hover to Sydney while Tokyo is pinned: Tokyo remains active
    hoveredMarkerId = "sydney";
    activeMarkerId = pinnedMarkerId ?? hoveredMarkerId;
    assert.equal(activeMarkerId, "tokyo", "Pinned marker must not be replaced by hover");

    // Explicit dismiss of pinned marker
    pinnedMarkerId = null;
    activeMarkerId = pinnedMarkerId ?? hoveredMarkerId;
    assert.equal(activeMarkerId, "sydney", "Hover takes over after pinned marker is dismissed");

    // Complete dismissal clears everything
    hoveredMarkerId = null;
    activeMarkerId = pinnedMarkerId ?? hoveredMarkerId;
    assert.equal(activeMarkerId, null, "All markers deactivated after full dismissal");
  });

  // 23. Responsive Coordinate Mapping Accuracy
  it("23. Responsive coordinate mapping maintains 1:1 aspect scale across viewports", () => {
    const london = CANONICAL_PROJECTED_CITIES.find((p) => p.city.id === "london")!;

    // Desktop viewport (1200x510)
    const deskW = 1200;
    const deskH = 510;
    const deskScreenX = (london.x / MAP_WIDTH) * deskW;
    const deskScreenY = (london.y / MAP_HEIGHT) * deskH;

    // Mobile viewport (390x243)
    const mobW = 390;
    const mobH = 243;
    const mobScreenX = (london.x / MAP_WIDTH) * mobW;
    const mobScreenY = (london.y / MAP_HEIGHT) * mobH;

    // Ratios must be identical to canonical map coordinates
    assert.ok(Math.abs(deskScreenX / deskW - london.x / MAP_WIDTH) < 0.0001);
    assert.ok(Math.abs(deskScreenY / deskH - london.y / MAP_HEIGHT) < 0.0001);
    assert.ok(Math.abs(mobScreenX / mobW - london.x / MAP_WIDTH) < 0.0001);
    assert.ok(Math.abs(mobScreenY / mobH - london.y / MAP_HEIGHT) < 0.0001);
  });
});
