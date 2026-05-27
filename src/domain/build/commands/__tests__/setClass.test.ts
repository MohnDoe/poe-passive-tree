import { describe, expect, it } from "vitest";
import { makeBuildState } from "@/domain/build/__tests__/BuildState.fixtures.ts";
import { setClass } from "../setClass.ts";

describe("setClass", () => {
  describe("when changing to a different class", () => {
    it("resets activeAscendancy to null", () => {
      const build = makeBuildState({
        activeClassId: 1,
        activeAscendancy: "ascendancyA",
        allocatedNodeIds: new Set(["1"]),
      });

      const result = setClass(build, 2);

      expect(result.activeAscendancy).toBeNull();
    });

    it("clears all allocatedNodeIds", () => {
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set(["1", "2", "3"]),
      });

      const result = setClass(build, 2);

      expect(result.allocatedNodeIds.size).toBe(0);
    });

    it("updates activeClassId to the new class", () => {
      const build = makeBuildState({ activeClassId: 1 });
      expect(build.activeClassId).toBe(1);

      const result = setClass(build, 2);
      expect(result.activeClassId).toBe(2);
    });

    it("preserves point budgets when changing class", () => {
      const build = makeBuildState({
        activeClassId: 1,
        passivePointsBudget: 50,
        ascendancyPointsBudget: 10,
      });

      const result = setClass(build, 2);

      expect(result.passivePointsBudget).toBe(50);
      expect(result.ascendancyPointsBudget).toBe(10);
    });

    it("works when changing from null class to a valid class", () => {
      const build = makeBuildState({
        activeClassId: null,
        allocatedNodeIds: new Set(["1"]),
      });

      const result = setClass(build, 1);

      expect(result.activeClassId).toBe(1);
      expect(result.allocatedNodeIds.size).toBe(0); // Should still clear allocations even from null state
    });
  });

  describe("edge cases", () => {
    it("returns unchanged build when activeClassId already equals target", () => {
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set(["1"]),
        activeAscendancy: "ascendancyA",
      });

      const result = setClass(build, 1);

      expect(result).toBe(build);
    });

    it("handles null activeAscendancy correctly when changing classes", () => {
      const build = makeBuildState({
        activeClassId: 1,
        activeAscendancy: "ascendancyA",
        allocatedNodeIds: new Set(["1"]),
      });

      const result = setClass(build, 2);

      expect(result.activeAscendancy).toBeNull();
      expect(result.allocatedNodeIds.size).toBe(0);
    });

    it("handles empty allocatedNodeIds when changing classes", () => {
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = setClass(build, 2);

      expect(result.allocatedNodeIds.size).toBe(0);
    });

    it("preserves budgets when changing classes from null state", () => {
      const build = makeBuildState({
        activeClassId: null,
        passivePointsBudget: 99,
        ascendancyPointsBudget: 33,
      });

      const result = setClass(build, 1);

      expect(result.passivePointsBudget).toBe(99);
      expect(result.ascendancyPointsBudget).toBe(33);
    });
  });
});
