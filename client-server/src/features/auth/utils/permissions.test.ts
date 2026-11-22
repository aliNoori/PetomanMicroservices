import { describe, expect, it } from "vitest";

import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
} from "./permissions";

describe("permissions", () => {
  const userPermissions = [
    "product.read",
    "product.create",
    "order.read",
  ];

  describe("hasPermission", () => {
    it("returns true when the user has the permission", () => {
      expect(
        hasPermission(userPermissions, "product.read"),
      ).toBe(true);
    });

    it("returns false when the user does not have the permission", () => {
      expect(
        hasPermission(userPermissions, "product.delete"),
      ).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns true when the user has all required permissions", () => {
      expect(
        hasAllPermissions(userPermissions, [
          "product.read",
          "product.create",
        ]),
      ).toBe(true);
    });

    it("returns false when at least one permission is missing", () => {
      expect(
        hasAllPermissions(userPermissions, [
          "product.read",
          "product.delete",
        ]),
      ).toBe(false);
    });

    it("returns true when no permissions are required", () => {
      expect(
        hasAllPermissions(userPermissions, []),
      ).toBe(true);
    });
  });

  describe("hasAnyPermission", () => {
    it("returns true when the user has at least one required permission", () => {
      expect(
        hasAnyPermission(userPermissions, [
          "product.delete",
          "order.read",
        ]),
      ).toBe(true);
    });

    it("returns false when the user has none of the required permissions", () => {
      expect(
        hasAnyPermission(userPermissions, [
          "product.delete",
          "order.update",
        ]),
      ).toBe(false);
    });

    it("returns false when no permissions are required", () => {
      expect(
        hasAnyPermission(userPermissions, []),
      ).toBe(false);
    });
  });
});