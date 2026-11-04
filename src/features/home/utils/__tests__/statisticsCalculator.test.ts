import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateStatistics,
  normalizeCity,
  normalizeTheme,
  isEligibleCompletedEvent,
  getEventDedupeKey,
} from "../statisticsCalculator";

describe("Homepage Live Statistics Architecture & Aggregation Rules", () => {
  const baseDate = new Date("2026-10-26T12:00:00.000Z");
  const aug2025Start = new Date("2025-08-01T00:00:00.000Z");

  const sampleStories = [
    {
      _id: "story-1",
      name: "Amina",
      city: "Bengaluru, India",
      story: "My friend always waits on the corner until I text.",
      status: "approved",
      themeTag: "Safety & Care",
    },
    {
      _id: "story-2",
      name: "Marcus",
      city: "Manila, Philippines",
      story: "I keep my headphones at low volume at night.",
      status: "approved",
      themeTag: "After dark",
    },
    {
      _id: "story-3",
      name: "Elena",
      city: "London, UK",
      story: "The night bus driver is always alert.",
      status: "approved",
      themeTag: "Looking out",
    },
  ];

  const sampleEvents = [
    {
      _id: "event-1",
      title: "Zines for Safer Future",
      city: "London",
      date: "2025-08-16T06:30:00.000Z",
      status: "completed",
    },
    {
      _id: "event-2",
      title: "Street Smart",
      city: "Bangalore",
      date: "2025-12-20T06:30:00.000Z",
      status: "completed",
    },
    {
      _id: "event-3",
      title: "Street Smart x Beyond Small Talk",
      city: "Bangalore",
      date: "2026-06-27T06:30:00.000Z",
      status: "completed",
    },
  ];

  // 1. Scenario 1: A new eligible public story is added
  it("1. A new eligible public story is added and increments stories count", () => {
    const initial = calculateStatistics(sampleStories, sampleEvents, aug2025Start, baseDate);
    assert.equal(initial.storiesCount, 3);

    const updatedStories = [
      ...sampleStories,
      {
        _id: "story-4",
        name: "Chloe",
        city: "Paris, France",
        story: "Walking across the bridge with friends.",
        status: "approved",
        themeTag: "Safety & Care",
      },
    ];

    const updated = calculateStatistics(updatedStories, sampleEvents, aug2025Start, baseDate);
    assert.equal(updated.storiesCount, 4);
    assert.equal(updated.citiesCount, 4);
  });

  // 2. Scenario 2: A duplicate or unpublished story is added
  it("2. A duplicate or unpublished story is ignored and does not alter count", () => {
    const initial = calculateStatistics(sampleStories, sampleEvents, aug2025Start, baseDate);

    const withUnpublishedAndDuplicate = [
      ...sampleStories,
      // Unpublished / pending
      {
        _id: "story-pending",
        name: "Pending User",
        city: "Tokyo, Japan",
        story: "Unapproved text submission",
        status: "pending",
        themeTag: "Safety & Care",
      },
      // Draft
      {
        _id: "story-draft",
        name: "Draft User",
        city: "Sydney, Australia",
        story: "Draft note",
        status: "draft",
        themeTag: "Safety & Care",
      },
      // Duplicate by ID
      {
        _id: "story-1",
        name: "Duplicate ID",
        city: "Bengaluru, India",
        story: "Different text with duplicate ID",
        status: "approved",
        themeTag: "Safety & Care",
      },
      // Duplicate by exact story text
      {
        _id: "story-different-id",
        name: "Different ID",
        city: "Bengaluru, India",
        story: "My friend always waits on the corner until I text.",
        status: "approved",
        themeTag: "Safety & Care",
      },
    ];

    const after = calculateStatistics(
      withUnpublishedAndDuplicate,
      sampleEvents,
      aug2025Start,
      baseDate,
    );
    assert.equal(after.storiesCount, 3);
    assert.equal(after.citiesCount, 3);
  });

  // 3. Scenario 3: A story from an already represented city is added
  it("3. A story from an already represented city increments stories but keeps city count unchanged", () => {
    const initial = calculateStatistics(sampleStories, sampleEvents, aug2025Start, baseDate);
    assert.equal(initial.citiesCount, 3);

    // Add another story from Bangalore (which normalizes to bengaluru)
    const withExistingCity = [
      ...sampleStories,
      {
        _id: "story-bengaluru-2",
        name: "Deepak",
        city: "Bangalore, India", // alias for bengaluru
        story: "Auto rickshaw driver kept headlights on.",
        status: "approved",
        themeTag: "Safety & Care",
      },
    ];

    const after = calculateStatistics(withExistingCity, sampleEvents, aug2025Start, baseDate);
    assert.equal(after.storiesCount, 4);
    assert.equal(after.citiesCount, 3); // Unchanged!
  });

  // 4. Scenario 4: A story from a new city is added
  it("4. A story from a new city increments both stories and distinct cities count", () => {
    const initial = calculateStatistics(sampleStories, sampleEvents, aug2025Start, baseDate);
    assert.equal(initial.citiesCount, 3);

    const withNewCity = [
      ...sampleStories,
      {
        _id: "story-nairobi",
        name: "Zawadi",
        city: "Nairobi, Kenya",
        story: "Matatu stage lights guide the path home.",
        status: "approved",
        themeTag: "Looking out",
      },
    ];

    const after = calculateStatistics(withNewCity, sampleEvents, aug2025Start, baseDate);
    assert.equal(after.storiesCount, 4);
    assert.equal(after.citiesCount, 4);
  });

  // 5. Scenario 5: A new theme is introduced
  it("5. A new theme is recognized and increases theme count dynamically", () => {
    const initial = calculateStatistics(sampleStories, sampleEvents, aug2025Start, baseDate);
    assert.equal(initial.themesCount, 3); // Safety & Care, After dark, Looking out

    const withNewTheme = [
      ...sampleStories,
      {
        _id: "story-transit",
        name: "Yuki",
        city: "Tokyo, Japan",
        story: "Subway platform staff was watchful.",
        status: "approved",
        themeTag: "Public Transit Safety", // dynamic new theme
      },
    ];

    const after = calculateStatistics(withNewTheme, sampleEvents, aug2025Start, baseDate);
    assert.equal(after.themesCount, 4);
  });

  // 6. Scenario 6: A completed walk or workshop is added
  it("6. A completed walk or workshop in the date window increments walks count", () => {
    const initial = calculateStatistics(sampleStories, sampleEvents, aug2025Start, baseDate);
    assert.equal(initial.walksCount, 3);

    const withNewWalk = [
      ...sampleEvents,
      {
        _id: "event-4",
        title: "Street Smart x City Girls",
        city: "Bangalore",
        date: "2026-09-13T06:30:00.000Z",
        status: "completed",
      },
    ];

    const after = calculateStatistics(sampleStories, withNewWalk, aug2025Start, baseDate);
    assert.equal(after.walksCount, 4);
  });

  // 7. Scenario 7: An upcoming event is added but has not happened yet
  it("7. An upcoming event (published status or future date) is NOT counted as completed walk", () => {
    const initial = calculateStatistics(sampleStories, sampleEvents, aug2025Start, baseDate);
    assert.equal(initial.walksCount, 3);

    const withUpcoming = [
      ...sampleEvents,
      // Future date event (beyond baseDate)
      {
        _id: "event-future",
        title: "Future Walk 2027",
        city: "London",
        date: "2027-01-01T06:30:00.000Z",
        status: "completed",
      },
      // Status 'published' (upcoming, not completed)
      {
        _id: "event-published",
        title: "Upcoming Community Walk",
        city: "Hyderabad",
        date: "2026-10-15T06:30:00.000Z",
        status: "published",
      },
    ];

    const after = calculateStatistics(sampleStories, withUpcoming, aug2025Start, baseDate);
    assert.equal(after.walksCount, 3); // Unchanged!
  });

  // 8. Scenario 8: A cancelled or unpublished event exists
  it("8. A cancelled or draft event is excluded from walks count", () => {
    const initial = calculateStatistics(sampleStories, sampleEvents, aug2025Start, baseDate);

    const withCancelledAndDraft = [
      ...sampleEvents,
      {
        _id: "event-cancelled",
        title: "Cancelled Walk",
        city: "London",
        date: "2026-05-01T06:30:00.000Z",
        status: "cancelled",
      },
      {
        _id: "event-draft",
        title: "Draft Workshop",
        city: "London",
        date: "2026-05-01T06:30:00.000Z",
        status: "draft",
      },
      // Prior to August 2025
      {
        _id: "event-too-old",
        title: "Historical Walk 2024",
        city: "London",
        date: "2024-05-01T06:30:00.000Z",
        status: "completed",
      },
    ];

    const after = calculateStatistics(sampleStories, withCancelledAndDraft, aug2025Start, baseDate);
    assert.equal(after.walksCount, 3);
  });

  // 9. Scenario 9: The CMS returns an empty result
  it("9. Handles empty CMS results gracefully with zeros without crashing", () => {
    const empty = calculateStatistics([], [], aug2025Start, baseDate);
    assert.deepEqual(empty, {
      storiesCount: 0,
      citiesCount: 0,
      walksCount: 0,
      themesCount: 0,
      timestamp: empty.timestamp,
    });
  });

  // 10. Scenario 10: Event deduplication
  it("10. Duplicate event records with same title, date, and city are counted only once", () => {
    const duplicateEvents = [
      ...sampleEvents,
      // Duplicate of event-3
      {
        _id: "event-3-duplicate",
        title: "Street Smart x Beyond Small Talk",
        city: "Bangalore",
        date: "2026-06-27T06:30:00.000Z",
        status: "completed",
      },
    ];

    const res = calculateStatistics(sampleStories, duplicateEvents, aug2025Start, baseDate);
    assert.equal(res.walksCount, 3); // Deduplicated to 3!
  });

  // 11. Scenario 11: City normalization edge cases
  it("11. Normalizes cities with diacritics, extra sentences, and alias mappings", () => {
    assert.equal(normalizeCity("São Paulo, Brazil"), "sao paulo");
    assert.equal(normalizeCity("Bogotá, Colombia"), "bogota");
    assert.equal(normalizeCity("Bangalore, India"), "bengaluru");
    assert.equal(normalizeCity("Bengaluru, India"), "bengaluru");
    assert.equal(normalizeCity("New Delhi, India"), "delhi");
    assert.equal(normalizeCity("Nigeria, Lagos"), "lagos");
    assert.equal(normalizeCity("Singapore I'm tamil and..."), "singapore");
    assert.equal(normalizeCity("London, UK I always share my live location..."), "london");
    assert.equal(normalizeCity(""), null);
    assert.equal(normalizeCity(null), null);
    assert.equal(normalizeCity("India"), null); // Exclude standalone country
  });

  // 12. Scenario 12: Theme normalization
  it("12. Normalizes canonical themes and supports dynamic variations", () => {
    assert.equal(normalizeTheme("Safety & Care"), "safety-care");
    assert.equal(normalizeTheme("safety-care"), "safety-care");
    assert.equal(normalizeTheme("Across distance"), "known-distance");
    assert.equal(normalizeTheme("After dark"), "after-dark");
    assert.equal(normalizeTheme("A random incident"), "random-incident");
    assert.equal(normalizeTheme("random-incident"), "random-incident");
    assert.equal(normalizeTheme("Looking out"), "walking-us");
    assert.equal(normalizeTheme("Others"), "others");
    assert.equal(normalizeTheme(""), null);
    assert.equal(normalizeTheme(null), null);
    assert.equal(normalizeTheme("Street Art"), "street art"); // Custom theme
  });
});
