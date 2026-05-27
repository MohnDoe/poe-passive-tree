import { describe, expect, it } from "vitest";
import type { ClassId } from "../../PassiveClass";
import { makeCustomAscendancyGraph } from "../../__tests__/PassiveGraph.fixtures";
import { isAscendancyValidForClass } from "../isAscendancyValidForClass";

describe("isAscendancyValidForClass", () => {
  it("returns false when classId does not exist", () => {
    const { graph } = makeCustomAscendancyGraph();
    expect(isAscendancyValidForClass(graph, 999 as ClassId, "whateverAscendancyId")).toBe(false);
  });

  it("returns false when classId exists but has no ascendancies", () => {
    const { graph, classes } = makeCustomAscendancyGraph();
    expect(isAscendancyValidForClass(graph, classes.noAscendancy, "whateverAscendancyId")).toBe(
      false,
    );
  });

  it("returns true when classId maps to a set that contains the ascendancyId", () => {
    const { graph, classes } = makeCustomAscendancyGraph();
    expect(isAscendancyValidForClass(graph, classes.oneAscendancy, "ascendancyA")).toBe(true);
  });

  it("returns false for unknown ascendancy when class has multiple valid ascendancies", () => {
    const { graph, classes } = makeCustomAscendancyGraph();
    expect(isAscendancyValidForClass(graph, classes.twoAscendancies, "unknown-ascendancy")).toBe(
      false,
    );
  });

  it("returns true for each valid ascendancy when class has multiple defined", () => {
    const { graph, classes } = makeCustomAscendancyGraph();
    expect(isAscendancyValidForClass(graph, classes.twoAscendancies, "ascendancyB")).toBe(true);
    expect(isAscendancyValidForClass(graph, classes.twoAscendancies, "ascendancyC")).toBe(true);
  });
});
