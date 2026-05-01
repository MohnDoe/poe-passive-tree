/**
 * Small double-ended queue used by graph traversals.
 *
 * Why this exists:
 * - Array.shift() / Array.unshift() are awkward for hot traversal loops.
 * - 0-1 BFS needs push-front for cost 0 edges and push-back for cost 1 edges.
 * - Plain BFS can also reuse this with pushBack + popFront.
 */
export class Deque<T> {
  private items = new Map<number, T>();
  private head = 0;
  private tail = 0;

  get size(): number {
    return this.tail - this.head;
  }

  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * Used by 0-1 BFS when traversing a zero-cost edge.
   */
  pushFront(value: T): void {
    this.head -= 1;
    this.items.set(this.head, value);
  }

  /**
   * Used by plain BFS and by 0-1 BFS for cost-1 edges.
   */
  pushBack(value: T): void {
    this.items.set(this.tail, value);
    this.tail += 1;
  }

  /**
   * Remove and return the front item.
   */
  popFront(): T | undefined {
    if (this.isEmpty()) return undefined;

    const value = this.items.get(this.head);
    this.items.delete(this.head);
    this.head += 1;
    return value;
  }

  /**
   * Remove and return the back item.
   */
  popBack(): T | undefined {
    if (this.isEmpty()) return undefined;

    this.tail -= 1;
    const value = this.items.get(this.tail);
    this.items.delete(this.tail);
    return value;
  }

  clear(): void {
    this.items.clear();
    this.head = 0;
    this.tail = 0;
  }
}
