import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import NodeTooltip from "../NodeTooltip.vue";

describe("NodeTooltip", () => {
  const baseProps = {
    position: { x: 100, y: 200 },
  };

  it("renders nothing when hoverInfo is null", () => {
    const wrapper = mount(NodeTooltip, {
      props: {
        ...baseProps,
        hoverInfo: null,
      },
    });

    expect(wrapper.find(".node-tooltip").exists()).toBe(false);
  });

  it("renders node name", () => {
    const wrapper = mount(NodeTooltip, {
      props: {
        ...baseProps,
        hoverInfo: {
          name: "Enhanced Vitality",
          kind: "notable",
          stats: [],
          budget: { cost: null, refundCount: null },
        },
      },
    });

    const tooltip = wrapper.find(".node-tooltip");
    expect(tooltip.exists()).toBe(true);
    expect(tooltip.text()).toContain("Enhanced Vitality");
  });

  it("renders stats lines when present", () => {
    const wrapper = mount(NodeTooltip, {
      props: {
        ...baseProps,
        hoverInfo: {
          name: "Enhanced Vitality",
          kind: "notable",
          stats: ["+43 to maximum life", "+10% to fire resistance"],
          budget: { cost: null, refundCount: null },
        },
      },
    });

    const tooltip = wrapper.find(".node-tooltip");
    expect(tooltip.text()).toContain("+43 to maximum life");
    expect(tooltip.text()).toContain("+10% to fire resistance");
  });

  it("renders budget line with Allocate N points for unallocated nodes", () => {
    const wrapper = mount(NodeTooltip, {
      props: {
        ...baseProps,
        hoverInfo: {
          name: "Enhanced Vitality",
          kind: "notable",
          stats: [],
          budget: { cost: 3, refundCount: null },
        },
      },
    });

    const tooltip = wrapper.find(".node-tooltip");
    expect(tooltip.text()).toContain("+3 nodes");
  });

  it("renders budget line with Refund N nodes for allocated nodes", () => {
    const wrapper = mount(NodeTooltip, {
      props: {
        ...baseProps,
        hoverInfo: {
          name: "Enhanced Vitality",
          kind: "notable",
          stats: [],
          budget: { cost: null, refundCount: 5 },
        },
      },
    });

    const tooltip = wrapper.find(".node-tooltip");
    expect(tooltip.text()).toContain("-5 nodes");
  });

  it("hides budget line when both cost and refundCount are null", () => {
    const wrapper = mount(NodeTooltip, {
      props: {
        ...baseProps,
        hoverInfo: {
          name: "Enhanced Vitality",
          kind: "notable",
          stats: [],
          budget: { cost: null, refundCount: null },
        },
      },
    });

    expect(wrapper.find(".tooltip-budget").exists()).toBe(false);
  });
});
