import { describe, expect, it } from "vitest";
import { Deque } from "../Deque";

describe("Deque", () => {
  it("is initially empty", () => {
    const deque = new Deque<number>();

    expect(deque.size).toBe(0);
    expect(deque.isEmpty()).toBe(true);
  });

  it("cannot pop front when empty", () => {
    const deque = new Deque<number>();
    expect(deque.popFront()).toBeUndefined();
  });

  it("cannot pop back when empty", () => {
    const deque = new Deque<number>();
    expect(deque.popBack()).toBeUndefined();
  });

  it("pushes to the back and pops from the front in FIFO order", () => {
    const deque = new Deque<number>();
    deque.pushBack(1);
    deque.pushBack(2);
    deque.pushBack(3);

    expect(deque.size).toBe(3);

    expect(deque.popFront()).toBe(1);
    expect(deque.popFront()).toBe(2);
    expect(deque.popFront()).toBe(3);

    expect(deque.isEmpty()).toBe(true);
  });

  it("pushes to the front and pops from the front in LIFO order", () => {
    const deque = new Deque<number>();
    deque.pushFront(1);
    deque.pushFront(2);
    deque.pushFront(3);

    expect(deque.size).toBe(3);

    expect(deque.popFront()).toBe(3);
    expect(deque.popFront()).toBe(2);
    expect(deque.popFront()).toBe(1);

    expect(deque.isEmpty()).toBe(true);
  });

  it("can pop from the back after mixed pushes", () => {
    const deque = new Deque<number>();

    deque.pushBack(1); // [1]
    deque.pushBack(2); // [1, 2]
    deque.pushFront(0); // [0, 1, 2]

    expect(deque.popBack()).toBe(2);
    expect(deque.popBack()).toBe(1);
    expect(deque.popBack()).toBe(0);

    expect(deque.isEmpty()).toBe(true);
  });

  it("does nothing when clearing empty deque", () => {
    const deque = new Deque<number>();
    deque.clear();

    expect(deque.size).toBe(0);
    expect(deque.isEmpty()).toBe(true);
  });

  it("handles interleaved pushes and pops correctly", () => {
    const deque = new Deque<number>();
    deque.pushBack(1); // [1]

    expect(deque.popFront()).toBe(1); // [1] → []

    deque.pushBack(2); // [2]
    deque.pushBack(3); // [2, 3]
    expect(deque.popBack()).toBe(3); // [2, 3] → [2]

    deque.pushFront(0); // [0, 2]
    expect(deque.popFront()).toBe(0); // [0, 2] → [2]
    expect(deque.popFront()).toBe(2); // [2] → []

    expect(deque.isEmpty()).toBe(true);
  });
});
