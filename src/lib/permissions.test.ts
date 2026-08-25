import { describe, it, expect } from "vitest";
import { PERMISSIONS, ALL_PERMISSION_KEYS, MODULES, getPermissionsForModule } from "@/lib/permissions";

describe("PERMISSIONS", () => {
  it("has permissions defined", () => {
    expect(PERMISSIONS.length).toBeGreaterThan(0);
  });

  it("each permission has required fields", () => {
    for (const perm of PERMISSIONS) {
      expect(perm.key).toBeDefined();
      expect(perm.module).toBeDefined();
      expect(perm.action).toBeDefined();
      expect(perm.description).toBeDefined();
      expect(perm.key).toMatch(/^\w+\.\w+$/);
    }
  });
});

describe("ALL_PERMISSION_KEYS", () => {
  it("contains all permission keys", () => {
    expect(ALL_PERMISSION_KEYS.length).toBe(PERMISSIONS.length);
    for (const perm of PERMISSIONS) {
      expect(ALL_PERMISSION_KEYS).toContain(perm.key);
    }
  });
});

describe("MODULES", () => {
  it("has modules defined", () => {
    expect(MODULES.length).toBeGreaterThan(0);
  });
});

describe("getPermissionsForModule", () => {
  it("returns permissions for a valid module", () => {
    const leadPerms = getPermissionsForModule("leads");
    expect(leadPerms.length).toBeGreaterThan(0);
    for (const perm of leadPerms) {
      expect(perm.module).toBe("leads");
    }
  });

  it("returns empty array for invalid module", () => {
    const result = getPermissionsForModule("nonexistent");
    expect(result).toEqual([]);
  });
});
