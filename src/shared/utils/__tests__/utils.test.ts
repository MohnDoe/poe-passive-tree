import { describe, it, expect } from "vitest";
import { setsEqual, makeShallowEqual } from "../utils";

describe("setsEqual", () => {
  it("returns true for two empty sets", () => {
    expect(setsEqual(new Set(), new Set())).toBe(true);
  });

  it("returns true for sets with the same elements in different insertion order", () => {
    const a = new Set([1, 2, 3]);
    const b = new Set([3, 2, 1]);
    expect(setsEqual(a, b)).toBe(true);
  });

  it("returns false when sizes differ", () => {
    const a = new Set([1, 2, 3]);
    const b = new Set([1, 2]);
    expect(setsEqual(a, b)).toBe(false);
  });

  it("returns false when one set contains an extra element", () => {
    const a = new Set(["a", "b"]);
    const b = new Set(["a", "b", "c"]);
    expect(setsEqual(a, b)).toBe(false);
  });
});

describe("makeShallowEqual", () => {
  it("creates a comparator that checks only the keys set to true", () => {
    type T = { x: number; y: number; meta?: string };
    const shallowEqual = makeShallowEqual<T>({ x: true, y: true, meta: false });

    const a: T = { x: 1, y: 2, meta: "foo" };
    const b: T = { x: 1, y: 2, meta: "bar" };
    const c: T = { x: 2, y: 2, meta: "foo" };

    expect(shallowEqual(a, b)).toBe(true);
    expect(shallowEqual(a, c)).toBe(false);
  });

  it("works with different key shapes", () => {
    type T = { id: string; active: boolean };
    const shallowEqual = makeShallowEqual<T>({ id: true, active: true });

    const a: T = { id: "node-1", active: true };
    const b: T = { id: "node-1", active: false };
    const c: T = { id: "node-2", active: true };

    expect(shallowEqual(a, b)).toBe(false);
    expect(shallowEqual(a, c)).toBe(false);
  });
});
