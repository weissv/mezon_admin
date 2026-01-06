import { renderHook, waitFor } from "@testing-library/react";
import { vi, type Mock } from "vitest";
import { useLmsClasses } from "./useLmsClasses";
import { lmsApi } from "../../lib/lms-api";

vi.mock("../../lib/lms-api", () => ({
  lmsApi: {
    getClasses: vi.fn(),
  },
}));

describe("useLmsClasses", () => {
  it("fetches classes on mount and exposes data", async () => {
    const mockClasses = [{ id: 1, name: "1A" }];
    (lmsApi.getClasses as Mock).mockResolvedValue(mockClasses);

    const { result } = renderHook(() => useLmsClasses({ isActive: true }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.classes).toEqual(mockClasses);
      expect(result.current.error).toBeNull();
    });
  });

  it("handles errors and sets error state", async () => {
    (lmsApi.getClasses as Mock).mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useLmsClasses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });
});
