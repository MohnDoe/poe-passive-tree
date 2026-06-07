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

  it("renders node name and kind badge", () => {
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
    expect(tooltip.text()).toContain("Notable");
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
    expect(tooltip.text()).toContain("Allocate 3 points");
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
    expect(tooltip.text()).toContain("Refund 5 nodes");
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

    const tooltip = wrapper.find(".node-tooltip");
    expect(tooltip.text()).not.toContain("Allocate");
    expect(tooltip.text()).not.toContain("Refund");
  });

  it("positions itself at the correct mouse coordinates", () => {
    const wrapper = mount(NodeTooltip, {
      props: {
        ...baseProps,
        hoverInfo: {
          name: "Test Node",
          kind: "normal",
          stats: [],
          budget: { cost: null, refundCount: null },
        },
        position: { x: 420, y: 310 },
      },
    });

    const tooltip = wrapper.find(".node-tooltip");
    const style = tooltip.element.style;
    expect(style.left).toBe("420px");
    expect(style.top).toBe("310px");
  });
});
