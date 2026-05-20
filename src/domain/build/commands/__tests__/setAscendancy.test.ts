import { makeBuildState } from "@/domain/build/__tests__/BuildState.fixtures.ts";
import { makeCustomAscendancyGraph } from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import type { ClassId } from "@/domain/graph/PassiveClass.ts";
import { assert, describe, expect, it } from "vitest";
import { setAscendancy } from "../setAscendancy.ts";

describe("setAscendancy", () => {
  const classWithNoAscendancy: ClassId = 1;
  const classWithOneAscendancy: ClassId = 2; // ascendancyA
  const classWithTwoAscendancies: ClassId = 3; // ascendancyB + ascendancyC

  describe("error cases", () => {
    it("returns NO_ACTIVE_CLASS when no class is active", () => {
      const build = makeBuildState({ activeClassId: null, activeAscendancy: null });
      const { graph } = makeCustomAscendancyGraph();

      const result = setAscendancy(build, graph, "ascendancyA");

      expect(result).toEqual({ ok: false, reason: "NO_ACTIVE_CLASS" });
    });

    it("returns NO_CHANGE when new ascendancy is the same as the current active ascendancy", () => {
      const build = makeBuildState({
        activeClassId: classWithOneAscendancy,
        activeAscendancy: "ascendancyA",
      });
      const { graph } = makeCustomAscendancyGraph();

      const result = setAscendancy(build, graph, "ascendancyA");

      expect(result).toEqual({ ok: false, reason: "NO_CHANGE" });
    });

    it("returns NO_CHANGE when setting null ascendancy while already null", () => {
      const build = makeBuildState({
        activeClassId: classWithOneAscendancy,
        activeAscendancy: null,
      });
      const { graph } = makeCustomAscendancyGraph();

      const result = setAscendancy(build, graph, null);

      expect(result).toEqual({ ok: false, reason: "NO_CHANGE" });
    });

    it("returns INVALID_ASCENDANCY_FOR_CLASS for any ascendancy for class with no ascendancy", () => {
      const build = makeBuildState({
        activeClassId: classWithNoAscendancy,
        activeAscendancy: null,
      });
      const { graph } = makeCustomAscendancyGraph();

      const targetAscendancy = "ascendancyA";

      const result = setAscendancy(build, graph, targetAscendancy);

      expect(result).toEqual({ ok: false, reason: "INVALID_ASCENDANCY_FOR_CLASS" });
    });

    it("returns INVALID_ASCENDANCY_FOR_CLASS for wrong ascendancy", () => {
      const build = makeBuildState({
        activeClassId: classWithOneAscendancy,
        activeAscendancy: null,
      });
      const { graph } = makeCustomAscendancyGraph();

      const result = setAscendancy(build, graph, "ascendancyB");

      expect(result).toEqual({ ok: false, reason: "INVALID_ASCENDANCY_FOR_CLASS" });
    });
  });

  describe("success removing ascendancy", () => {
    it("keeps non-ascendancy allocations when removing ascendancy", () => {
      const { graph, nodes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classWithOneAscendancy,
        activeAscendancy: "ascendancyA",
        allocatedNodeIds: new Set([nodes.main.normal.id]),
      });

      const result = setAscendancy(build, graph, null);

      assert(result.ok);

      expect(result.build.allocatedNodeIds.has(nodes.main.normal.id)).toBe(true);
    });

    it("removes ascendancy allocations when removing ascendancy", () => {
      const { graph, nodes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classWithOneAscendancy,
        activeAscendancy: "ascendancyA",
        allocatedNodeIds: new Set([nodes.main.normal.id, nodes.ascendancyA.normal.id]),
      });

      const result = setAscendancy(build, graph, null);

      assert(result.ok);
      // Main region allocations kept
      expect(result.build.allocatedNodeIds.has(nodes.main.normal.id)).toBe(true);
      // Ascendancy allocations removed
      expect(result.build.allocatedNodeIds.has(nodes.ascendancyA.normal.id)).toBe(false);
    });

    it("updates activeAscendancy to null on success", () => {
      const { graph } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classWithOneAscendancy,
        activeAscendancy: "ascendancyA",
      });

      const result = setAscendancy(build, graph, null);

      assert(result.ok);
      expect(result.build.activeAscendancy).toBeNull();
    });
  });

  describe("success setting new ascendancy", () => {
    it("updates activeAscendancy when setting valid ascendancy", () => {
      const { graph } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classWithOneAscendancy,
        activeAscendancy: null,
      });

      const result = setAscendancy(build, graph, "ascendancyA");

      assert(result.ok);
      expect(result.build.activeAscendancy).toEqual("ascendancyA");
    });

    it("clears ascendancy allocations when setting new ascendancy", () => {
      const { graph, nodes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classWithTwoAscendancies,
        activeAscendancy: "ascendancyB",
        allocatedNodeIds: new Set([nodes.ascendancyB.normal.id]),
      });

      const result = setAscendancy(build, graph, "ascendancyC");

      assert(result.ok);
      expect(result.build.activeAscendancy).toBe("ascendancyC");
      expect(result.build.allocatedNodeIds.has(nodes.ascendancyB.normal.id)).toBe(false);
    });

    it("preserves non-ascendancy allocations when setting new ascendancy", () => {
      const { graph, nodes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classWithOneAscendancy,
        activeAscendancy: null,
        allocatedNodeIds: new Set([nodes.main.normal.id]),
      });

      const result = setAscendancy(build, graph, "ascendancyA");

      assert(result.ok);
      expect(result.build.activeAscendancy).toEqual("ascendancyA");
      expect(result.build.allocatedNodeIds.has(nodes.main.normal.id)).toBe(true);
    });

    it("works when setting ascendancy with no prior allocations", () => {
      const { graph } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classWithOneAscendancy,
        allocatedNodeIds: new Set(),
      });

      const result = setAscendancy(build, graph, "ascendancyA");

      assert(result.ok);
      expect(result.build.activeAscendancy).toEqual("ascendancyA");
    });
  });

  describe("edge cases", () => {
    it("handles null ascendancy parameter correctly", () => {
      const { graph } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classWithOneAscendancy,
        activeAscendancy: "ascendancyA",
      });

      const result = setAscendancy(build, graph, null);

      assert(result.ok);
      expect(result.build.activeAscendancy).toBeNull();
    });

    it("preserves point budgets when modifying ascendancy", () => {
      const { graph } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classWithOneAscendancy,
        passivePointsBudget: 50,
      });

      const result = setAscendancy(build, graph, "ascendancyA");

      assert(result.ok);
      expect(result.build.passivePointsBudget).toBe(50);
    });

    it("removes all ascendancy allocations regardless of which ascendancy", () => {
      const { graph, nodes } = makeCustomAscendancyGraph();

      const build = makeBuildState({
        activeClassId: classWithOneAscendancy,
        activeAscendancy: "ascendancyA",
        allocatedNodeIds: new Set([nodes.ascendancyA.normal.id, nodes.ascendancyB.normal.id]),
      });

      const result = setAscendancy(build, graph, null);

      assert(result.ok);
      // Both ascendancy allocations should be removed
      expect(result.build.allocatedNodeIds.has(nodes.ascendancyA.normal.id)).toBe(false);
      expect(result.build.allocatedNodeIds.has(nodes.ascendancyB.normal.id)).toBe(false);
    });
  });
});
