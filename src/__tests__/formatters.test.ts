import { describe, it, expect } from "vitest";
import { formatNumber, formatCurrency, formatGrowthRate, formatDate } from "@/lib/formatters";

describe("formatNumber", () => {
  it("formats numbers below 1000 with locale string", () => {
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(0)).toBe("0");
  });

  it("formats thousands with K suffix", () => {
    expect(formatNumber(1000)).toBe("1.0K");
    expect(formatNumber(1500)).toBe("1.5K");
    expect(formatNumber(9999)).toBe("10.0K");
  });

  it("formats ten-thousands with 만 suffix", () => {
    expect(formatNumber(10000)).toBe("1.0만");
    expect(formatNumber(1234567)).toBe("123.5만");
    expect(formatNumber(50000)).toBe("5.0만");
  });

  it("formats hundred-millions with 억 suffix", () => {
    expect(formatNumber(100000000)).toBe("1.0억");
    expect(formatNumber(250000000)).toBe("2.5억");
  });
});

describe("formatCurrency", () => {
  it("formats small numbers with won sign", () => {
    expect(formatCurrency(5000)).toBe("₩5,000");
  });

  it("formats 만 unit", () => {
    expect(formatCurrency(50000)).toBe("₩5만");
    expect(formatCurrency(123456)).toBe("₩12만");
  });

  it("formats 억 unit", () => {
    expect(formatCurrency(100000000)).toBe("₩1.0억");
  });

  it("uses custom currency prefix", () => {
    expect(formatCurrency(5000, "$")).toBe("$5,000");
  });
});

describe("formatGrowthRate", () => {
  it("formats positive rate with + prefix", () => {
    expect(formatGrowthRate(12.34)).toBe("+12.3%");
  });

  it("formats negative rate with - prefix", () => {
    expect(formatGrowthRate(-5.67)).toBe("-5.7%");
  });

  it("formats zero as +0.0%", () => {
    expect(formatGrowthRate(0)).toBe("+0.0%");
  });
});

describe("formatDate", () => {
  it("returns '오늘' for today's date", () => {
    const today = new Date().toISOString();
    expect(formatDate(today)).toBe("오늘");
  });

  it("returns '어제' for yesterday's date", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(formatDate(yesterday)).toBe("어제");
  });

  it("returns 'N일 전' for dates within a week", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    expect(formatDate(threeDaysAgo)).toBe("3일 전");
  });

  it("returns 'N주 전' for dates within a month", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    expect(formatDate(twoWeeksAgo)).toBe("2주 전");
  });
});
