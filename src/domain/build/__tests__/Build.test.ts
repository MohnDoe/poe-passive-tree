import { assert, describe, expect, it } from "vitest";
import {
  makeDiamondGraph,
  makeForkGraph,
  makeLineGraph,
  makeNode,
  buildGraph,
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

      expect(result.isOk()).toBe(true);
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

  it("returns NODE_NOT_ALLOCATABLE when target is root", () => {
    const { graph, nodes } = makeLineGraph();
    const build = makeBuildState({ activeClassId: 1, allocatedNodeIds: new Set() });

    const result = Build.allocate(graph, build, nodes.start.id);

    assert(result.isErr());

    expect(result.error).toBe("NODE_NOT_ALLOCATABLE");
  });

  it("returns NODE_NOT_ALLOCATABLE when no classStart root node for class", () => {
    const rootA = makeNode({ id: "root-a", kind: "classStart", classStartIndex: 2 });
    const middle = makeNode({ id: "middle" });

    const graph = buildGraph({
      nodes: [rootA, middle],
      edgePairs: [[rootA.id, middle.id]],
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
