export interface BundleSelection {
  totalBundles: number;
  bundles: { size: number; count: number }[];
}

/**
 * Fewest bundles whose seats add up to exactly `groupSize`, or null if no exact
 * combination exists. Each size can be used any number of times.
 *
 * `fewest[n]` is the smallest number of bundles that give exactly n seats, and
 * `lastUsed[n]` is a bundle size that achieves it. We fill both from 0 seats up
 * to `groupSize`, then follow `lastUsed` backwards to count each size.
 */
export function fewestBundles(bundleSizes: number[], groupSize: number): BundleSelection | null {
  const sizes = [...new Set(bundleSizes)].sort((a, b) => a - b);
  const fewest: number[] = new Array(groupSize + 1).fill(Infinity);
  const lastUsed: number[] = new Array(groupSize + 1).fill(0);
  fewest[0] = 0;

  for (let seats = 1; seats <= groupSize; seats++) {
    for (const size of sizes) {
      if (size > seats) break;
      const candidate = fewest[seats - size] + 1;
      if (candidate < fewest[seats]) {
        fewest[seats] = candidate;
        lastUsed[seats] = size;
      }
    }
  }

  if (fewest[groupSize] === Infinity) return null;

  const counts = new Map<number, number>();
  for (let seats = groupSize; seats > 0; seats -= lastUsed[seats]) {
    counts.set(lastUsed[seats], (counts.get(lastUsed[seats]) ?? 0) + 1);
  }

  const bundles = [...counts.entries()]
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.size - a.size);

  return { totalBundles: fewest[groupSize], bundles };
}
