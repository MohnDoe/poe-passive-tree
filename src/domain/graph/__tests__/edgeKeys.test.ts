import { describe, expect, it } from "vitest";
import { makeEdgeKey, makeEdgeKeysFromPath } from "../edgeKeys";
import type { NodeId } from "../PassiveNode";

describe("makeEdgeKey", () => {
  it("creates an edge key from 2 Ids correctly", () => {
    const aId = "1";
    const bId = "2";

    const key = makeEdgeKey(aId, bId);

    expect(key).toBe("1-2");
  });

  it("order the IDs correctly", () => {
    expect(makeEdgeKey("1", "a")).toBe("a-1");
    expect(makeEdgeKey("a", "aa")).toBe("aa-a");
  });

  it("orders the IDs in ascending order", () => {
    const aId = "22382098";
    const bId = "112331";

    const key = makeEdgeKey(aId, bId);

    expect(key).toBe("112331-22382098");
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
    expect(fifth).toBe("4-12");
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
