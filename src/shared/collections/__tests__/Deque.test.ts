import { describe, expect, it } from "vitest";
import { Deque } from "../Deque";

describe("Deque", () => {
  it("is initially empty", () => {
    const deque = new Deque<number>();

    expect(deque.size).toBe(0);
    expect(deque.isEmpty()).toBe(true);

    expect(deque.popFront()).toBeUndefined();
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

  it("tracks size correctly and can be cleared", () => {
    const deque = new Deque<number>();
    deque.pushBack(1);
    deque.pushFront(0);
    deque.pushBack(2);

    expect(deque.size).toBe(3);

    deque.clear();

    expect(deque.size).toBe(0);
    expect(deque.isEmpty()).toBe(true);
    expect(deque.popFront()).toBeUndefined();
  });
});
