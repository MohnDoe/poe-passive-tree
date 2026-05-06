import { describe, it, expect } from "vitest";
import { normalizeSignedAngle } from "../math.utils";

describe("normalizeSignedAngle", () => {
  it("returns the same angle when already in (-pi, pi]", () => {
    const angles = [Math.PI / 2, -Math.PI / 2, Math.PI, -Math.PI + 0.001];

    for (const angle of angles) {
      expect(normalizeSignedAngle(angle)).toBe(angle);
    }
  });

  it("returns zero when the angle is zero", () => {
    expect(normalizeSignedAngle(0)).toBe(0);
  });

  it("normalize -pi to pi", () => {
    expect(normalizeSignedAngle(-Math.PI)).toBe(Math.PI);
  });

  it("wraps angles larger than pi down into the range", () => {
    // 3 * pi is equivalent to pi.
    expect(normalizeSignedAngle(3 * Math.PI)).toBe(Math.PI);
    // 5 * pi / 2 should normalize to pi / 2.
    expect(normalizeSignedAngle((5 * Math.PI) / 2)).toBe(Math.PI / 2);
  });

  it("wraps angles smaller than -pi up into the range", () => {
    // -3 * pi is equivalent to -pi but we normalize -pi to pi.
    expect(normalizeSignedAngle(-3 * Math.PI)).toBe(Math.PI);
    // -5 * pi / 2 should normalize to -pi / 2.
    expect(normalizeSignedAngle((-5 * Math.PI) / 2)).toBe(-Math.PI / 2);
  });

  it("handles very large positive and negative multiples of 2*pi", () => {
    expect(normalizeSignedAngle(1000 * 2 * Math.PI + Math.PI / 3)).toBeCloseTo(Math.PI / 3);
    expect(normalizeSignedAngle(-1000 * 2 * Math.PI - Math.PI / 3)).toBeCloseTo(-Math.PI / 3);
  });
});
