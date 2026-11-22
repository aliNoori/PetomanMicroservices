import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAuth } from "./useAuth";
import { usePermissions } from "./usePermissions";

vi.mock("./useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("usePermissions", () => {
  it("exposes the current permissions", () => {
    vi.mocked(useAuth).mockReturnValue({
      permissions: ["product.read", "product.create", "order.read"],
    } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.permissions).toEqual([
      "product.read",
      "product.create",
      "order.read",
    ]);
  });

  it("checks a single permission", () => {
    vi.mocked(useAuth).mockReturnValue({
      permissions: ["product.read"],
    } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission("product.read")).toBe(true);
    expect(result.current.hasPermission("product.delete")).toBe(false);
  });

  it("checks whether all permissions are available", () => {
    vi.mocked(useAuth).mockReturnValue({
      permissions: ["product.read", "product.create"],
    } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() => usePermissions());

    expect(
      result.current.hasAllPermissions([
        "product.read",
        "product.create",
      ]),
    ).toBe(true);

    expect(
      result.current.hasAllPermissions([
        "product.read",
        "product.delete",
      ]),
    ).toBe(false);
  });

  it("checks whether at least one permission is available", () => {
    vi.mocked(useAuth).mockReturnValue({
      permissions: ["order.read"],
    } as ReturnType<typeof useAuth>);

    const { result } = renderHook(() => usePermissions());

    expect(
      result.current.hasAnyPermission([
        "product.delete",
        "order.read",
      ]),
    ).toBe(true);

    expect(
      result.current.hasAnyPermission([
        "product.delete",
        "order.update",
      ]),
    ).toBe(false);
  });
});