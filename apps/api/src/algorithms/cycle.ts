/** Maps a movie id to the ids of the movies that must be watched before it. */
export type PrerequisiteGraph = Map<number, number[]>;

/**
 * Would giving `movieId` the prerequisites `newPrerequisiteIds` create a loop?
 *
 * A loop appears when one of the new prerequisites already depends, directly or
 * through other movies, on `movieId`. So we walk the prerequisites of each new
 * prerequisite and see whether we ever arrive back at `movieId`.
 * `graph` is the current state of the database; the old prerequisites of
 * `movieId` are about to be replaced, and they are never needed for the walk
 * because reaching `movieId` is enough to answer.
 */
export function wouldCreateCycle(
  graph: PrerequisiteGraph,
  movieId: number,
  newPrerequisiteIds: number[],
): boolean {
  const visited = new Set<number>();
  const stack = [...newPrerequisiteIds];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === movieId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const next of graph.get(current) ?? []) stack.push(next);
  }
  return false;
}
