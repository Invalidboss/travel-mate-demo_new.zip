import { describe, it, expect } from "vitest";
import { sortTrips, SortKey } from "./App";

describe("sortTrips", () => {
  it("sorts by expense total", () => {
    const trips = [
      { id: "t1", startDate: "2025-01-01", destination: "A" },
      { id: "t2", startDate: "2025-01-02", destination: "B" },
    ];
    const expenses = [
      { id: "e1", tripId: "t1", date: "", category: "Other", amount: 10, currency: "EUR" },
      { id: "e2", tripId: "t2", date: "", category: "Other", amount: 20, currency: "EUR" },
    ];
    const sorted = sortTrips(trips as any, expenses as any, "expense" as SortKey);
    expect(sorted[0].id).toBe("t2");
  });
});
