import type { PrerequisiteGraph } from "./cycle.js";

/**
 * Returns the ids of every movie that must be watched before `targetId`
 * (its prerequisites, their prerequisites, and so on), each exactly once,
 * in an order where every movie comes after all of its own prerequisites.
 * The target itself is not included.
 *
 * This is a depth-first walk that adds a movie to the result only after all of
 * its prerequisites have been added (a post-order). The graph is expected to be
 * loop-free; the `visited` set also guarantees we stop if it ever is not.
 */
export function rewatchOrder(graph: PrerequisiteGraph, targetId: number): number[] {
  const visited = new Set<number>([targetId]);
  const result: number[] = [];

  // Iterative DFS so a very long chain cannot overflow the call stack.
  const stack: { id: number; next: number }[] = [{ id: targetId, next: 0 }];
  while (stack.length > 0) {
    const frame = stack[stack.length - 1];
    const prerequisites = graph.get(frame.id) ?? [];

    if (frame.next < prerequisites.length) {
      const prerequisite = prerequisites[frame.next++];
      if (!visited.has(prerequisite)) {
        visited.add(prerequisite);
        stack.push({ id: prerequisite, next: 0 });
      }
    } else {
      stack.pop();
      if (frame.id !== targetId) result.push(frame.id);
    }
  }
  return result;
}
