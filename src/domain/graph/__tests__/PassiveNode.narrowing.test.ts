import { describe, expect, expectTypeOf, it } from "vitest";
import type { PassiveNode, PassiveMasteryNode, PassiveNormalNode, PassiveKeystoneNode, PassiveProxyNode } from "../PassiveNode";

describe("discriminated union type narrowing", () => {
  it("kind-specific properties require narrowing", () => {
    const node: PassiveNode = {
      kind: "mastery",
      id: "test",
      name: "",
      stats: [],
      orbit: 0,
      orbitIndex: 0,
      out: [],
      in: [],
    };
    // @ts-expect-error - activeIcon not on base type
    node.activeIcon;
  });

  it("narrowed mastery node allows activeIcon access", () => {
    const node: PassiveNode = {
      kind: "mastery",
      id: "test",
      name: "",
      stats: [],
      orbit: 0,
      orbitIndex: 0,
      out: [],
      in: [],
    };
    if (node.kind === "mastery") {
      // activeIcon is string | undefined, so toUpperCase() would error on undefined
      // but accessing the property itself should compile
      expectTypeOf(node.activeIcon).toEqualTypeOf<string | undefined>();
      const icon: string | undefined = node.activeIcon;
      expect(icon).toBeUndefined();
    }
  });

  it("narrowed keystone node allows flavourText access", () => {
    const node: PassiveNode = {
      kind: "keystone",
      id: "test",
      name: "",
      stats: [],
      orbit: 0,
      orbitIndex: 0,
      out: [],
      in: [],
    };
    if (node.kind === "keystone") {
      expectTypeOf(node.flavourText).toEqualTypeOf<string[] | undefined>();
      const text: string[] | undefined = node.flavourText;
      expect(text).toBeUndefined();
    }
  });

  it("narrowed normal node allows grantedStrength access", () => {
    const node: PassiveNode = {
      kind: "normal",
      id: "test",
      name: "",
      stats: [],
      orbit: 0,
      orbitIndex: 0,
      out: [],
      in: [],
    };
    if (node.kind === "normal") {
      expectTypeOf(node.grantedStrength).toEqualTypeOf<number | undefined>();
      const strength: number | undefined = node.grantedStrength;
      expect(strength).toBeUndefined();
    }
  });

  it("narrowed proxy node does not allow expansionJewel access", () => {
    const node: PassiveNode = {
      kind: "proxy",
      id: "test",
      name: "",
      stats: [],
      orbit: 0,
      orbitIndex: 0,
      out: [],
      in: [],
    };
    if (node.kind === "proxy") {
      // @ts-expect-error - expansionJewel not on proxy nodes
      node.expansionJewel;
    }
  });

  it("mastery node is not assignable to normal node", () => {
    const mastery: PassiveMasteryNode = {
      kind: "mastery",
      id: "test",
      name: "",
      stats: [],
      orbit: 0,
      orbitIndex: 0,
      out: [],
      in: [],
    };
    // @ts-expect-error - not a normal node
    const normal: PassiveNormalNode = mastery;
  });

  it("keystone node is not assignable to normal node", () => {
    const keystone: PassiveKeystoneNode = {
      kind: "keystone",
      id: "test",
      name: "",
      stats: [],
      orbit: 0,
      orbitIndex: 0,
      out: [],
      in: [],
    };
    // @ts-expect-error - not a normal node
    const normal: PassiveNormalNode = keystone;
  });
});
