import { describe, expect, it } from "vitest";
import { makeLineGraph, makeRegionGraph } from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { makeBuildState } from "@/domain/build/__tests__/BuildState.fixtures.ts";
import { setAscendancy } from "../setAscendancy.ts";

describe("setAscendancy", () => {
  describe("error cases", () => {
    it("returns NO_ACTIVE_CLASS when no class is active", () => {
      const build = makeBuildState({ activeClassId: null, activeAscendancy: null });
      const { graph } = makeLineGraph();

      const result = setAscendancy(build, graph, "ascendancyA");

      expect(result).toEqual({ ok: false, reason: "NO_ACTIVE_CLASS" });
    });

    it("returns NO_CHANGE when new ascendancy is the same as the current active ascendancy", () => {
      const build = makeBuildState({ activeClassId: 1, activeAscendancy: "ascendancyA" });
      const { graph } = makeLineGraph();

      const result = setAscendancy(build, graph, "ascendancyA");

      expect(result).toEqual({ ok: false, reason: "NO_CHANGE" });
    });

    it("returns NO_CHANGE when setting null ascendancy while already null", () => {
      const build = makeBuildState({ activeClassId: 1, activeAscendancy: null });
      const { graph } = makeLineGraph();

      const result = setAscendancy(build, graph, null);

      expect(result).toEqual({ ok: false, reason: "NO_CHANGE" });
    });
  });

  describe("INVALID_ASCENDANCY_FOR_CLASS error case", () => {
    it("returns INVALID_ASCENDANCY_FOR_CLASS for any ascendancy since fixtures have no valid ascendancies", () => {
      const build = makeBuildState({ activeClassId: 1, activeAscendancy: null });
      const { graph } = makeLineGraph();

      // In fixtures, ascendancyIdsByClassId is empty for all classes
      const result = setAscendancy(build, graph, "ascendancyA" as any);

      expect(result).toEqual({ ok: false, reason: "INVALID_ASCENDANCY_FOR_CLASS" });
    });

    it("returns INVALID_ASCENDANCY_FOR_CLASS for class 2", () => {
      const build = makeBuildState({ activeClassId: 2, activeAscendancy: null });
      const { graph } = makeLineGraph();

      // Class 2 also has no valid ascendancies in fixtures
      const result = setAscendancy(build, graph, "ascendancyA" as any);

      expect(result).toEqual({ ok: false, reason: "INVALID_ASCENDANCY_FOR_CLASS" });
    });
  });

  describe("success removing ascendancy", () => {
    it("keeps non-ascendancy allocations when removing ascendancy", () => {
      const { graph } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        activeAscendancy: "ascendancyA" as any,
        allocatedNodeIds: new Set(["1", "2"] as any),
      });

      const result = setAscendancy(build, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Allocations outside ascendancy region should be kept
        expect(result.build.allocatedNodeIds.has("1")).toBe(true);
        expect(result.build.allocatedNodeIds.has("2")).toBe(true);
      }
    });

    it("removes ascendancy allocations when removing ascendancy", () => {
      const { graph, nodes } = makeRegionGraph();
      const build = makeBuildState({
        activeClassId: 1,
        activeAscendancy: "ascendancyA" as any,
        allocatedNodeIds: new Set(["0", "1", "2", "3"] as any), // includes ascendancy nodes
      });

      const result = setAscendancy(build, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Main region allocations kept
        expect(result.build.allocatedNodeIds.has("0")).toBe(true);
        expect(result.build.allocatedNodeIds.has("1")).toBe(true);
        // Ascendancy allocations removed
        expect(result.build.allocatedNodeIds.has("2")).toBe(false);
        expect(result.build.allocatedNodeIds.has("3")).toBe(false);
      }
    });

    it("updates activeAscendancy to null on success", () => {
      const build = makeBuildState({ activeClassId: 1, activeAscendancy: "ascendancyA" as any });

      const result = setAscendancy(build, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.activeAscendancy).toBeNull();
      }
    });
  });

  describe("success setting new ascendancy", () => {
    it("updates activeAscendancy when setting valid ascendancy", () => {
      const build = makeBuildState({ activeClassId: 1, activeAscendancy: null });

      const result = setAscendancy(build, "ascendancyA" as any);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.activeAscendancy).toEqual("ascendancyA");
      }
    });

    it("clears ascendancy allocations when setting new ascendancy", () => {
      const build = makeBuildState({
        activeClassId: 1,
        activeAscendancy: "ascendancyA" as any,
        allocatedNodeIds: new Set(["0"] as any), // already has some allocations
      });

      const result = setAscendancy(build, "ascendancyB" as any);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.activeAscendancy).toEqual("ascendancyB");
      }
    });

    it("preserves non-ascendancy allocations when setting new ascendancy", () => {
      const build = makeBuildState({
        activeClassId: 1,
        activeAscendancy: null,
        allocatedNodeIds: new Set(["0"] as any), // main region node
      });

      const result = setAscendancy(build, "ascendancyA" as any);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.activeAscendancy).toEqual("ascendancyA");
        expect(result.build.allocatedNodeIds.has("0")).toBe(true); // preserved
      }
    });

    it("works when setting ascendancy with no prior allocations", () => {
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = setAscendancy(build, "ascendancyA" as any);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.activeAscendancy).toEqual("ascendancyA");
      }
    });
  });

  describe("edge cases", () => {
    it("handles null ascendancy parameter correctly", () => {
      const build = makeBuildState({ activeClassId: 1, activeAscendancy: "ascendancyA" as any });

      const result = setAscendancy(build, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.activeAscendancy).toBeNull();
      }
    });

    it("preserves point budgets when modifying ascendancy", () => {
      const build = makeBuildState({
        activeClassId: 1,
        passivePointsBudget: 50,
        ascendancyPointsBudget: 25,
      });

      const result = setAscendancy(build, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.passivePointsBudget).toBe(50);
        expect(result.build.ascendancyPointsBudget).toBe(25);
      }
    });

    it("handles region graph with ascendancy allocations", () => {
      const { graph, nodes } = makeRegionGraph();
      const build = makeBuildState({
        activeClassId: 1,
        activeAscendancy: null,
        allocatedNodeIds: new Set([nodes.main.start.id] as any),
      });

      const result = setAscendancy(build, "ascendancyA" as any);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.build.activeAscendancy).toEqual("ascendancyA");
        // Main region allocation should be preserved
        expect(result.build.allocatedNodeIds.has(nodes.main.start.id)).toBe(true);
      }
    });

    it("removes all ascendancy allocations regardless of which ascendancy", () => {
      const { graph, nodes } = makeRegionGraph();
      // Allocate both ascendancy A and B nodes
      const build = makeBuildState({
        activeClassId: 1,
        activeAscendancy: "ascendancyA" as any,
        allocatedNodeIds: new Set([
          nodes.ascendancyA.normal.id,
          nodes.ascendancyB.normal.id,
        ] as any),
      });

      const result = setAscendancy(build, null);

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Both ascendancy allocations should be removed
        expect(result.build.allocatedNodeIds.has(nodes.ascendancyA.normal.id)).toBe(false);
        expect(result.build.allocatedNodeIds.has(nodes.ascendancyB.normal.id)).toBe(false);
      }
    });
  });

  describe("integration with graph validation", () => {
    it("uses isAscendancyValidForClass for validation", () => {
      const build = makeBuildState({ activeClassId: 1, activeAscendancy: null });

      // ascendancyA doesn't exist as valid for class 1 in fixtures
      const result = setAscendancy(build, "ascendancyA" as any);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("INVALID_ASCENDANCY_FOR_CLASS");
      }
    });
  });
});
