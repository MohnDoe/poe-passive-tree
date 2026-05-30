import { assert, describe, expect, it } from "vitest";
import {
  makeDiamondGraph,
  makeForkGraph,
  makeLineGraph,
  makeNode,
  buildGraph,
  makeCustomAscendancyGraph,
} from "@/domain/graph/__tests__/PassiveGraph.fixtures.ts";
import { makeBuildState } from "@/domain/build/__tests__/BuildState.fixtures.ts";
import { Build } from "../Build.ts";

describe("Build.allocate", () => {
  describe("line graph allocatation", () => {
    it("allocates single node with path to root", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = Build.allocate(graph, build, nodes.first.id);

      assert(result.isOk());

      const allocated = result.value.allocatedNodeIds;
      expect(allocated.has(nodes.first.id)).toBe(true);
    });

    it("allocates node at end of line with full path", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = Build.allocate(graph, build, nodes.third.id);

      assert(result.isOk());

      const allocated = result.value.allocatedNodeIds;

      expect(allocated.has(nodes.first.id)).toBe(true);
      expect(allocated.has(nodes.second.id)).toBe(true);
      expect(allocated.has(nodes.third.id)).toBe(true);
    });

    it("includes all intermediate nodes previous nodes in path were allocated", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id, nodes.second.id]),
      });

      const result = Build.allocate(graph, build, nodes.fourth.id);

      assert(result.isOk());
      const allocated = result.value.allocatedNodeIds;
      expect(allocated.has(nodes.first.id)).toBe(true);
      expect(allocated.has(nodes.second.id)).toBe(true);
      expect(allocated.has(nodes.third.id)).toBe(true);
      expect(allocated.has(nodes.fourth.id)).toBe(true);
    });

    it("prefers shortest path in multi-root graph", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = Build.allocate(graph, build, nodes.second.id);

      assert(result.isOk());
      const allocated = result.value.allocatedNodeIds;
      expect(allocated.has(nodes.first.id)).toBe(true);
      expect(allocated.has(nodes.second.id)).toBe(true);

      expect(allocated.has(nodes.third.id)).toBe(false);
      expect(allocated.has(nodes.fourth.id)).toBe(false);
      expect(allocated.has(nodes.fifth.id)).toBe(false);
      expect(allocated.has(nodes.sixth.id)).toBe(false);
    });
  });

  describe("diamond graph allocation", () => {
    it("chooses path in diamon through allocated nodes even if longer in hops", () => {
      const { graph, nodes } = makeDiamondGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.right.first.id, nodes.right.second.id]),
      });

      const result = Build.allocate(graph, build, nodes.end.id);

      assert(result.isOk());

      const allocated = result.value.allocatedNodeIds;

      expect(allocated.has(nodes.end.id)).toBe(true);
      expect(allocated.has(nodes.right.first.id)).toBe(true);
      expect(allocated.has(nodes.right.second.id)).toBe(true);

      expect(allocated.has(nodes.left.first.id)).toBe(false);
    });

    it("prefers shorter path in a diamond when both paths are unallocated", () => {
      const { graph, nodes } = makeDiamondGraph();
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = Build.allocate(graph, build, nodes.end.id);

      assert(result.isOk());

      const allocated = result.value.allocatedNodeIds;
      expect(allocated.has(nodes.end.id)).toBe(true);
      expect(allocated.has(nodes.left.first.id)).toBe(true);
      expect(allocated.has(nodes.right.first.id)).toBe(false);
      expect(allocated.has(nodes.right.second.id)).toBe(false);
    });
  });

  it("handles allocation with empty allocatedNodeIds set", () => {
    const { graph, nodes } = makeLineGraph();
    const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

    const result = Build.allocate(graph, build, nodes.first.id);

    assert(result.isOk());

    expect(result.value.allocatedNodeIds.has(nodes.first.id)).toBe(true);
  });

  it("preserves all budgets during allocation", () => {
    const { graph, nodes } = makeLineGraph();
    const build = makeBuildState({
      activeClassId: 1,
      passivePointsBudget: 50,
      ascendancyPointsBudget: 20,
    });

    const result = Build.allocate(graph, build, nodes.first.id);

    expect(result.isOk()).toBe(true);
    assert(result.isOk());
    expect(result.value.passivePointsBudget).toBe(50);
    expect(result.value.ascendancyPointsBudget).toBe(20);
  });
});

describe("Build.allocate errors", () => {
  it("returns NODE_NOT_ALLOCATABLE when no path exists to node", () => {
    const rootA = makeNode({ id: "root-a", kind: "classStart" });
    const rootB = makeNode({ id: "root-b", kind: "classStart" });
    const connected = makeNode({ id: "connected" });
    const island = makeNode({ id: "island" });

    const graph = buildGraph({
      nodes: [rootA, rootB, connected, island],
      edgePairs: [
        [rootA.id, connected.id],
        [rootB.id, connected.id],
      ],
    });

    const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
    const result = Build.allocate(graph, build, island.id);

    expect(result.isErr()).toBe(true);

    assert(result.isErr());
    expect(result.error).toBe("NODE_NOT_ALLOCATABLE");
  });

  it("returns NODE_NOT_ALLOCATABLE when target already allocated with full path", () => {
    const { graph, nodes } = makeLineGraph();
    const build = makeBuildState({
      activeClassId: 1,
      allocatedNodeIds: new Set([nodes.first.id, nodes.second.id]),
    });

    const result = Build.allocate(graph, build, nodes.first.id);

    assert(result.isErr());

    expect(result.error).toBe("NODE_NOT_ALLOCATABLE");
  });

  it("returns NODE_NOT_ALLOCATABLE when target is start node", () => {
    const { graph, nodes } = makeLineGraph();
    const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

    const result = Build.allocate(graph, build, nodes.start.id);

    assert(result.isErr());

    expect(result.error).toBe("NODE_NOT_ALLOCATABLE");
  });

  it("returns NODE_NOT_ALLOCATABLE when no classStart root node for class", () => {
    const startA = makeNode({ id: "start-a", kind: "classStart", classStartIndex: 2 });
    const middle = makeNode({ id: "middle" });

    const graph = buildGraph({
      nodes: [startA, middle],
      edgePairs: [[startA.id, middle.id]],
    });

    const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
    const result = Build.allocate(graph, build, middle.id);

    assert(result.isErr());

    expect(result.error).toBe("NODE_NOT_ALLOCATABLE");
  });

  it("returns NODE_NOT_ALLOCATABLE when no root nodes in graph", () => {
    const nodeA = makeNode({ id: "node-a" });
    const middle = makeNode({ id: "middle" });

    const graph = buildGraph({
      nodes: [nodeA, middle],
      edgePairs: [[nodeA.id, middle.id]],
    });

    const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });
    const result = Build.allocate(graph, build, middle.id);

    assert(result.isErr());

    expect(result.error).toBe("NODE_NOT_ALLOCATABLE");
  });

  it("returns NO_ACTIVE_CLASS when no class is active", () => {
    const { graph, nodes } = makeLineGraph();
    const build = makeBuildState({ activeClassId: null, allocatedNodeIds: new Set() });

    const result = Build.allocate(graph, build, nodes.first.id);

    assert(result.isErr());

    expect(result.error).toBe("NO_ACTIVE_CLASS");
  });
});

describe("Build.refund", () => {
  describe("line graph refund", () => {
    it("refunds a leaf node without dependents", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id, nodes.second.id, nodes.third.id]),
      });

      const result = Build.refund(graph, build, nodes.third.id);

      assert(result.isOk());
      const allocated = result.value.allocatedNodeIds;

      expect(allocated.has(nodes.first.id)).toBe(true);
      expect(allocated.has(nodes.second.id)).toBe(true);
      expect(allocated.has(nodes.third.id)).toBe(false);
    });
  });

  describe("fork graph refund", () => {
    it("refunds leaf on one branch, preserves the other", () => {
      const { graph, nodes } = makeForkGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([
          nodes.first.id,
          nodes.left.first.id,
          nodes.left.second.id,
          nodes.right.first.id,
          nodes.right.second.id,
        ]),
      });

      const result = Build.refund(graph, build, nodes.left.second.id);

      assert(result.isOk());

      const allocated = result.value.allocatedNodeIds;
      expect(allocated.has(nodes.first.id)).toBe(true);
      expect(allocated.has(nodes.left.first.id)).toBe(true);

      expect(allocated.has(nodes.left.second.id)).toBe(false);

      expect(allocated.has(nodes.right.first.id)).toBe(true);
      expect(allocated.has(nodes.right.second.id)).toBe(true);
    });

    it("refunds all dependents when removing branching node", () => {
      const { graph, nodes } = makeForkGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([
          nodes.first.id,
          nodes.left.first.id,
          nodes.left.second.id,
          nodes.right.first.id,
          nodes.right.second.id,
        ]),
      });

      const result = Build.refund(graph, build, nodes.first.id);

      assert(result.isOk());

      const allocated = result.value.allocatedNodeIds;
      expect(allocated.has(nodes.first.id)).toBe(false);
      expect(allocated.has(nodes.left.first.id)).toBe(false);
      expect(allocated.has(nodes.left.second.id)).toBe(false);
      expect(allocated.has(nodes.right.first.id)).toBe(false);
      expect(allocated.has(nodes.right.second.id)).toBe(false);
    });
  });

  describe("diamond graph refund", () => {
    it("handles diamond graph: refunds node with no dependants", () => {
      const { graph, nodes } = makeDiamondGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([
          nodes.left.first.id,
          nodes.right.first.id,
          nodes.right.second.id,
          nodes.end.id,
        ]),
      });

      const result = Build.refund(graph, build, nodes.left.first.id);

      assert(result.isOk());

      const allocated = result.value.allocatedNodeIds;
      expect(allocated.has(nodes.left.first.id)).toBe(false);
      expect(allocated.has(nodes.right.first.id)).toBe(true);
      expect(allocated.has(nodes.right.second.id)).toBe(true);
      expect(allocated.has(nodes.end.id)).toBe(true);
    });

    it("refunds single node in a diamond when alternative path exists", () => {
      const { graph, nodes } = makeDiamondGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([
          nodes.left.first.id,
          nodes.right.first.id,
          nodes.right.second.id,
          nodes.end.id,
        ]),
      });

      const result = Build.refund(graph, build, nodes.right.second.id);

      assert(result.isOk());

      const allocated = result.value.allocatedNodeIds;

      expect(allocated.has(nodes.right.first.id)).toBe(true);

      expect(allocated.has(nodes.right.second.id)).toBe(false);

      expect(allocated.has(nodes.left.first.id)).toBe(true);
      expect(allocated.has(nodes.end.id)).toBe(true);
    });

    it("handles refund when only one node allocated", () => {
      const { graph, nodes } = makeLineGraph();
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set([nodes.first.id]),
      });

      const result = Build.refund(graph, build, nodes.first.id);

      assert(result.isOk());

      expect(result.value.allocatedNodeIds.size).toBe(0);
    });
  });
});

describe("Build.toggle", () => {
  it("returns NODE_NOT_FOUND for non-existent node", () => {
    const { graph } = makeLineGraph();
    const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

    const result = Build.toggle(graph, build, "nonexistent");

    assert(result.isErr());
    expect(result.error).toBe("NODE_NOT_FOUND");
  });

  it("allocated an unallocated node", () => {
    const { graph, nodes } = makeLineGraph();
    const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

    const result = Build.toggle(graph, build, nodes.first.id);

    assert(result.isOk());
    expect(result.value.allocatedNodeIds.has(nodes.first.id)).toBe(true);
  });

  it("refunds an allocated node", () => {
    const { graph, nodes } = makeLineGraph();
    const build = makeBuildState({
      activeClassId: 1,
      allocatedNodeIds: new Set([nodes.first.id]),
    });

    const result = Build.toggle(graph, build, nodes.first.id);

    assert(result.isOk());
    expect(result.value.allocatedNodeIds.has(nodes.first.id)).toBe(false);
  });
});

describe("Build.setClass", () => {
  describe("when changing to a different class", () => {
    it("resets activeAscendancy to null", () => {
      const build = makeBuildState({
        activeClassId: 1,
        activeAscendancy: "ascendancyA",
        allocatedNodeIds: new Set(["1"]),
      });

      const result = Build.setClass(build, 2);

      assert(result.isOk());
      expect(result.value.activeAscendancy).toBeNull();
    });

    it("clears all allocatedNodeIds", () => {
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set(["1", "2", "3"]),
      });

      const result = Build.setClass(build, 2);

      assert(result.isOk());
      expect(result.value.allocatedNodeIds.size).toBe(0);
    });

    it("updates activeClassId to the new class", () => {
      const build = makeBuildState({ activeClassId: 1 });
      expect(build.activeClassId).toBe(1);

      const result = Build.setClass(build, 2);

      assert(result.isOk());
      expect(result.value.activeClassId).toBe(2);
    });

    it("preserves point budgets when changing class", () => {
      const build = makeBuildState({
        activeClassId: 1,
        passivePointsBudget: 50,
        ascendancyPointsBudget: 10,
      });

      const result = Build.setClass(build, 2);

      assert(result.isOk());
      expect(result.value.passivePointsBudget).toBe(50);
      expect(result.value.ascendancyPointsBudget).toBe(10);
    });

    it("works when changing from null class to a valid class", () => {
      const build = makeBuildState({
        activeClassId: null,
        allocatedNodeIds: new Set(["1"]),
      });

      const result = Build.setClass(build, 1);

      assert(result.isOk());
      expect(result.value.activeClassId).toBe(1);
      expect(result.value.allocatedNodeIds.size).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("returns unchanged build when activeClassId already equals target", () => {
      const build = makeBuildState({
        activeClassId: 1,
        allocatedNodeIds: new Set(["1"]),
        activeAscendancy: "ascendancyA",
      });

      const result = Build.setClass(build, 1);

      assert(result.isErr());
      expect(result.error).toBe("NO_CHANGE");
    });

    it("handles null activeAscendancy correctly when changing classes", () => {
      const build = makeBuildState({
        activeClassId: 1,
        activeAscendancy: "ascendancyA",
        allocatedNodeIds: new Set(["1"]),
      });

      const result = Build.setClass(build, 2);

      assert(result.isOk());
      expect(result.value.activeAscendancy).toBeNull();
      expect(result.value.allocatedNodeIds.size).toBe(0);
    });

    it("handles empty allocatedNodeIds when changing classes", () => {
      const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

      const result = Build.setClass(build, 2);

      assert(result.isOk());
      expect(result.value.allocatedNodeIds.size).toBe(0);
    });

    it("preserves budgets when changing classes from null state", () => {
      const build = makeBuildState({
        activeClassId: null,
        passivePointsBudget: 99,
        ascendancyPointsBudget: 33,
      });

      const result = Build.setClass(build, 1);

      assert(result.isOk());
      expect(result.value.passivePointsBudget).toBe(99);
      expect(result.value.ascendancyPointsBudget).toBe(33);
    });
  });
});

describe("Build.setAscendancy", () => {
  describe("error cases", () => {
    it("returns NO_ACTIVE_CLASS when no class is active", () => {
      const build = makeBuildState({ activeClassId: null, activeAscendancy: null });
      const { graph } = makeCustomAscendancyGraph();

      const result = Build.setAscendancy(graph, build, "ascendancyA");

      assert(result.isErr());
      expect(result.error).toBe("NO_ACTIVE_CLASS");
    });

    it("returns NO_CHANGE when new ascendancy is the same as the current active ascendancy", () => {
      const { graph, classes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classes.oneAscendancy,
        activeAscendancy: "ascendancyA",
      });

      const result = Build.setAscendancy(graph, build, "ascendancyA");

      assert(result.isErr());
      expect(result.error).toBe("NO_CHANGE");
    });

    it("returns NO_CHANGE when setting null ascendancy while already null", () => {
      const { graph, classes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classes.oneAscendancy,
        activeAscendancy: null,
      });

      const result = Build.setAscendancy(graph, build, null);

      assert(result.isErr());
      expect(result.error).toBe("NO_CHANGE");
    });

    it("returns INVALID_ASCENDANCY_FOR_CLASS for any ascendancy for class with no ascendancy", () => {
      const { graph, classes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classes.noAscendancy,
        activeAscendancy: null,
      });

      const targetAscendancy = "ascendancyA";

      const result = Build.setAscendancy(graph, build, targetAscendancy);

      assert(result.isErr());
      expect(result.error).toBe("INVALID_ASCENDANCY_FOR_CLASS");
    });

    it("returns INVALID_ASCENDANCY_FOR_CLASS for wrong ascendancy", () => {
      const { graph, classes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classes.oneAscendancy,
        activeAscendancy: null,
      });

      const result = Build.setAscendancy(graph, build, "ascendancyB");

      assert(result.isErr());
      expect(result.error).toBe("INVALID_ASCENDANCY_FOR_CLASS");
    });
  });

  describe("success removing ascendancy", () => {
    it("keeps non-ascendancy allocations when removing ascendancy", () => {
      const { graph, nodes, classes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classes.oneAscendancy,
        activeAscendancy: "ascendancyA",
        allocatedNodeIds: new Set([nodes.main.normal.id]),
      });

      const result = Build.setAscendancy(graph, build, null);

      assert(result.isOk());
      expect(result.value.allocatedNodeIds.has(nodes.main.normal.id)).toBe(true);
    });

    it("removes ascendancy allocations when removing ascendancy", () => {
      const { graph, nodes, classes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classes.oneAscendancy,
        activeAscendancy: "ascendancyA",
        allocatedNodeIds: new Set([nodes.main.normal.id, nodes.ascendancyA.normal.id]),
      });

      const result = Build.setAscendancy(graph, build, null);

      assert(result.isOk());
      expect(result.value.allocatedNodeIds.has(nodes.main.normal.id)).toBe(true);
      expect(result.value.allocatedNodeIds.has(nodes.ascendancyA.normal.id)).toBe(false);
    });

    it("updates activeAscendancy to null on success", () => {
      const { graph, classes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classes.oneAscendancy,
        activeAscendancy: "ascendancyA",
      });

      const result = Build.setAscendancy(graph, build, null);

      assert(result.isOk());
      expect(result.value.activeAscendancy).toBeNull();
    });
  });

  describe("success setting new ascendancy", () => {
    it("updates activeAscendancy when setting valid ascendancy", () => {
      const { graph, classes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classes.oneAscendancy,
        activeAscendancy: null,
      });

      const result = Build.setAscendancy(graph, build, "ascendancyA");

      assert(result.isOk());
      expect(result.value.activeAscendancy).toEqual("ascendancyA");
    });

    it("clears ascendancy allocations when setting new ascendancy", () => {
      const { graph, nodes, classes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classes.twoAscendancies,
        activeAscendancy: "ascendancyB",
        allocatedNodeIds: new Set([nodes.ascendancyB.normal.id]),
      });

      const result = Build.setAscendancy(graph, build, "ascendancyC");

      assert(result.isOk());
      expect(result.value.activeAscendancy).toBe("ascendancyC");
      expect(result.value.allocatedNodeIds.has(nodes.ascendancyB.normal.id)).toBe(false);
    });

    it("preserves non-ascendancy allocations when setting new ascendancy", () => {
      const { graph, nodes, classes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classes.oneAscendancy,
        activeAscendancy: null,
        allocatedNodeIds: new Set([nodes.main.normal.id]),
      });

      const result = Build.setAscendancy(graph, build, "ascendancyA");

      assert(result.isOk());
      expect(result.value.activeAscendancy).toEqual("ascendancyA");
      expect(result.value.allocatedNodeIds.has(nodes.main.normal.id)).toBe(true);
    });

    it("works when setting ascendancy with no prior allocations", () => {
      const { graph, classes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classes.oneAscendancy,
        allocatedNodeIds: new Set(),
      });

      const result = Build.setAscendancy(graph, build, "ascendancyA");

      assert(result.isOk());
      expect(result.value.activeAscendancy).toEqual("ascendancyA");
    });
  });

  describe("edge cases", () => {
    it("handles null ascendancy parameter correctly", () => {
      const { graph, classes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classes.oneAscendancy,
        activeAscendancy: "ascendancyA",
      });

      const result = Build.setAscendancy(graph, build, null);

      assert(result.isOk());
      expect(result.value.activeAscendancy).toBeNull();
    });

    it("preserves point budgets when modifying ascendancy", () => {
      const { graph, classes } = makeCustomAscendancyGraph();
      const build = makeBuildState({
        activeClassId: classes.oneAscendancy,
        passivePointsBudget: 50,
      });

      const result = Build.setAscendancy(graph, build, "ascendancyA");

      assert(result.isOk());
      expect(result.value.passivePointsBudget).toBe(50);
    });

    it("removes all ascendancy allocations regardless of which ascendancy", () => {
      const { graph, nodes, classes } = makeCustomAscendancyGraph();

      const build = makeBuildState({
        activeClassId: classes.oneAscendancy,
        activeAscendancy: "ascendancyA",
        allocatedNodeIds: new Set([nodes.ascendancyA.normal.id, nodes.ascendancyB.normal.id]),
      });

      const result = Build.setAscendancy(graph, build, null);

      assert(result.isOk());
      expect(result.value.allocatedNodeIds.has(nodes.ascendancyA.normal.id)).toBe(false);
      expect(result.value.allocatedNodeIds.has(nodes.ascendancyB.normal.id)).toBe(false);
    });
  });
});

describe("Build.refund errors", () => {
  it("returns NODE_NOT_FOUND when node does not exist", () => {
    const { graph } = makeLineGraph();
    const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

    const result = Build.refund(graph, build, "unknown-node-id");

    assert(result.isErr());

    expect(result.error).toBe("NODE_NOT_FOUND");
  });

  it("returns NODE_NOT_ALLOCATED for node that exists but isn't allocated", () => {
    const { graph, nodes } = makeLineGraph();
    const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

    const result = Build.refund(graph, build, nodes.first.id);

    assert(result.isErr());

    expect(result.error).toBe("NODE_NOT_ALLOCATED");
  });

  it("returns NO_ACTIVE_CLASS when no class is active", () => {
    const { graph, nodes } = makeLineGraph();
    const build = makeBuildState({ activeClassId: null, allocatedNodeIds: new Set() });

    const result = Build.refund(graph, build, nodes.first.id);

    assert(result.isErr());

    expect(result.error).toBe("NO_ACTIVE_CLASS");
  });
});
