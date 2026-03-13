import { describe, it, expect } from "vitest";
import { estimateMonthlyRevenue, estimateAdPrice } from "@/domain/revenueEstimate";

describe("estimateMonthlyRevenue", () => {
  it("calculates revenue using CPM formula: (dailyViews * 30 / 1000) * baseCPM * categoryMultiplier", () => {
    // KR base CPM = 2.0, entertainment multiplier = 0.8
    const result = estimateMonthlyRevenue({
      dailyViews: 10000,
      country: "KR",
      category: "entertainment",
    });
    // (10000 * 30 / 1000) * 2.0 * 0.8 = 300 * 2.0 * 0.8 = 480
    expect(result).toBe(480);
  });

  it("uses default CPM for unknown country", () => {
    // default CPM = 1.5, default category multiplier = 1.0
    const result = estimateMonthlyRevenue({
      dailyViews: 10000,
      country: "XX",
      category: "unknown",
    });
    // (10000 * 30 / 1000) * 1.5 * 1.0 = 450
    expect(result).toBe(450);
  });

  it("uses US CPM correctly", () => {
    // US CPM = 4.0, tech multiplier = 1.5
    const result = estimateMonthlyRevenue({
      dailyViews: 5000,
      country: "US",
      category: "tech",
    });
    // (5000 * 30 / 1000) * 4.0 * 1.5 = 150 * 4.0 * 1.5 = 900
    expect(result).toBe(900);
  });

  it("returns 0 for 0 daily views", () => {
    const result = estimateMonthlyRevenue({
      dailyViews: 0,
      country: "KR",
      category: "tech",
    });
    expect(result).toBe(0);
  });

  it("handles high daily views", () => {
    const result = estimateMonthlyRevenue({
      dailyViews: 1000000,
      country: "US",
      category: "education",
    });
    // (1000000 * 30 / 1000) * 4.0 * 1.3 = 30000 * 4.0 * 1.3 = 156000
    expect(result).toBe(156000);
  });
});

describe("estimateAdPrice", () => {
  it("calculates ad price based on subscriber count and engagement rate", () => {
    // base = 100000 * 0.01 = 1000
    // engagementMultiplier = 1 + (3.0 - 2) * 0.1 = 1.1
    // result = Math.round(Math.max(1000 * 1.1, 50000)) = 50000 (min floor)
    const result = estimateAdPrice(100000, 3.0);
    expect(result).toBe(50000);
  });

  it("returns minimum 50000 for small channels", () => {
    const result = estimateAdPrice(1000, 2.0);
    // base = 10, engMult = 1.0, 10 * 1.0 = 10 < 50000
    expect(result).toBe(50000);
  });

  it("scales with large subscriber counts", () => {
    const result = estimateAdPrice(10000000, 5.0);
    // base = 100000, engMult = 1 + (5.0 - 2) * 0.1 = 1.3
    // 100000 * 1.3 = 130000
    expect(result).toBe(130000);
  });
});
