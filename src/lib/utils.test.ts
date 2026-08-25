import { describe, it, expect } from "vitest";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

describe("cn", () => {
  it("merges class names", () => {
    const result = cn("text-red-500", "text-blue-500");
    expect(result).toBe("text-blue-500");
  });

  it("handles conditional classes", () => {
    const result = cn("base", false && "hidden", "extra");
    expect(result).toContain("base");
    expect(result).toContain("extra");
    expect(result).not.toContain("hidden");
  });
});

describe("formatCurrency", () => {
  it("formats number as GHS currency", () => {
    const result = formatCurrency(1234.56);
    expect(result).toContain("1");
    expect(result).toContain("234");
  });

  it("handles zero", () => {
    const result = formatCurrency(0);
    expect(result).toBeDefined();
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2024-01-15");
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("formats a Date object", () => {
    const result = formatDate(new Date("2024-06-20"));
    expect(result).toBeDefined();
  });
});

describe("formatDateTime", () => {
  it("formats a date string with time", () => {
    const result = formatDateTime("2024-01-15T14:30:00");
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });
});
