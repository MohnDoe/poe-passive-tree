import { describe, expect, it } from "vitest";
import { makeEdgeKey, makeEdgeKeysFromPath } from "../edgeKeys";
import type { NodeId } from "../PassiveNode";

describe("makeEdgeKey", () => {
  it("order the IDs correctly in numerical ascending order", () => {
    expect(makeEdgeKey("2", "1")).toBe("1-2");
    expect(makeEdgeKey("1", "2")).toBe("1-2");
    expect(makeEdgeKey("10", "1")).toBe("1-10");
    // sorted numerically 112331 < 22382098
    expect(makeEdgeKey("22382098", "112331")).toBe("112331-22382098");
  });
});

describe("makeEdgeKeysFromPath", () => {
  // 0 -- 1 -- 2 -- 3 -- 12 -- 4
  const path: NodeId[] = ["0", "1", "2", "3", "12", "4"];

  it("creates edges following the provided path", () => {
    const edges = makeEdgeKeysFromPath({ path });

    expect(edges.size).toBe(5);
    const [first, second, third, fourth, fifth] = edges;
    expect(first).toBe("0-1");
    expect(second).toBe("1-2");
    expect(third).toBe("2-3");
    expect(fourth).toBe("3-12");
    // even if the path is -- 12 -- 4, it's sorted numerically : 4 < 12
    expect(fifth).toBe("4-12");
  });

  it("creates no edges from an empty path", () => {
    const edges = makeEdgeKeysFromPath({ path: [] });

    expect(edges.size).toBe(0);
  });

  it("creates no edges from single node path", () => {
    const edges = makeEdgeKeysFromPath({ path: ["0"] });
    expect(edges.size).toBe(0);
  });

  it("does not create keys if no IDs are allowed", () => {
    const allowedNodeIds = new Set<NodeId>();

    const edges = makeEdgeKeysFromPath({
      path,
      allowedNodeIds,
    });

    expect(edges.size).toBe(0);
  });

  it("only creates keys with atleast one end allowed", () => {
    const allowedNodeIds = new Set<NodeId>(["2", "4"]);

    const edges = makeEdgeKeysFromPath({
      path,
      allowedNodeIds,
    });

    expect(edges.size).toBe(3);
    const [first, second, third] = edges;
    expect(first).toBe("1-2");
    expect(second).toBe("2-3");
    expect(third).toBe("4-12");
  });
});
