import { describe, expect, it } from "vitest";
import type { PassiveMasteryNode, PassiveProxyNode, PassiveNormalNode, PassiveKeystoneNode, PassiveJewelSocketNode, PassiveClassStartNode } from "../PassiveNode";
import { makeNode } from "./PassiveGraph.fixtures";
import type { ClassId } from "../PassiveClass";

describe("makeNode fixture helper", () => {
  describe("kind-specific property assignment", () => {
    it("creates a valid PassiveMasteryNode", () => {
      const node = makeNode({ id: "test", kind: "mastery" }) as PassiveMasteryNode;
      expect(node.kind).toBe("mastery");
      expect(node.id).toBe("test");
    });

    it("creates a valid PassiveProxyNode", () => {
      const node = makeNode({ id: "test", kind: "proxy" }) as PassiveProxyNode;
      expect(node.kind).toBe("proxy");
      expect(node.id).toBe("test");
    });

    it("includes stat grants for normal nodes", () => {
      const node = makeNode({ id: "test", kind: "normal", grantedStrength: 10 }) as PassiveNormalNode;
      expect(node.kind).toBe("normal");
      expect(node.grantedStrength).toBe(10);
    });

    it("includes flavourText for keystone nodes", () => {
      const node = makeNode({ id: "test", kind: "keystone", flavourText: ["text"] }) as PassiveKeystoneNode;
      expect(node.kind).toBe("keystone");
      expect(node.flavourText).toEqual(["text"]);
    });

    it("includes expansionJewel for jewel nodes", () => {
      const node = makeNode({
        id: "test",
        kind: "jewel",
        expansionJewel: { size: 1, index: 5, proxy: "proxy-id", parent: "parent-id" },
      }) as PassiveJewelSocketNode;
      expect(node.kind).toBe("jewel");
      expect(node.expansionJewel).toEqual({
        size: 1,
        index: 5,
        proxy: "proxy-id",
        parent: "parent-id",
      });
    });

    it("includes classStartIndex for classStart nodes", () => {
      const node = makeNode({ id: "test", kind: "classStart", classStartIndex: 3 as ClassId }) as PassiveClassStartNode;
      expect(node.kind).toBe("classStart");
      expect(node.classStartIndex).toBe(3);
    });
  });
});
