import { describe, expect, it } from "vitest";
import type { AscendancyId } from "../../PassiveAscendancy";
import type { ClassId } from "../../PassiveClass";
import { makeCustomAscendancyGraph } from "../../__tests__/PassiveGraph.fixtures";
import { isAscendancyValidForClass } from "../isAscendancyValidForClass";

describe("isAscendancyValidForClass", () => {
  it("returns false when classId does not exist", () => {
    const { graph } = makeCustomAscendancyGraph();
    expect(
      isAscendancyValidForClass(graph, 999 as ClassId, "whateverAscendancyId" as AscendancyId),
    ).toBe(false);
  });

  it("returns false when classId exists but has no ascendancies", () => {
    const { graph } = makeCustomAscendancyGraph();
    expect(
      isAscendancyValidForClass(graph, 1 as ClassId, "whateverAscendancyId" as AscendancyId),
    ).toBe(false);
  });

  it("returns true when classId maps to a set that contains the ascendancyId", () => {
    const { graph } = makeCustomAscendancyGraph();
    expect(isAscendancyValidForClass(graph, 2 as ClassId, "class2Ascendancy" as AscendancyId)).toBe(
      true,
    );
  });

  it("returns false for unknown ascendancy when class has multiple valid ascendancies", () => {
    const { graph } = makeCustomAscendancyGraph();
    // Class 3 has ["class3AscendancyA", "class3AscendancyB"], but we check for an unknown one
    expect(
      isAscendancyValidForClass(graph, 3 as ClassId, "unknown-ascendancy" as AscendancyId),
    ).toBe(false);
  });

  it("returns true for each valid ascendancy when class has multiple defined", () => {
    const { graph } = makeCustomAscendancyGraph();
    // Both "class3AscendancyA" and "class3AscendancyB" should be valid
    expect(
      isAscendancyValidForClass(graph, 3 as ClassId, "class3AscendancyA" as AscendancyId),
    ).toBe(true);
    expect(
      isAscendancyValidForClass(graph, 3 as ClassId, "class3AscendancyB" as AscendancyId),
    ).toBe(true);
  });
});
