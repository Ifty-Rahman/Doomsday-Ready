import { describe, expect, it } from "vitest";
import { wouldCreateCycle, type PrerequisiteGraph } from "./cycle.js";
import { rewatchOrder } from "./rewatchOrder.js";
import { fewestBundles } from "./bundles.js";

// Sample data from the assessment
const IRON_MAN = 1, FIRST_AVENGER = 2, AVENGERS = 3, CIVIL_WAR = 4,
  RAGNAROK = 5, INFINITY_WAR = 6, ENDGAME = 7, DOOMSDAY = 8;

const mcu = (): PrerequisiteGraph =>
  new Map([
    [IRON_MAN, []],
    [FIRST_AVENGER, []],
    [AVENGERS, [IRON_MAN, FIRST_AVENGER]],
    [CIVIL_WAR, [AVENGERS]],
    [RAGNAROK, []],
    [INFINITY_WAR, [CIVIL_WAR, RAGNAROK]],
    [ENDGAME, [INFINITY_WAR]],
    [DOOMSDAY, [ENDGAME]],
  ]);

function expectValidOrder(graph: PrerequisiteGraph, order: number[]) {
  order.forEach((id, index) => {
    for (const prerequisite of graph.get(id) ?? []) {
      expect(order.indexOf(prerequisite)).toBeGreaterThanOrEqual(0);
      expect(order.indexOf(prerequisite)).toBeLessThan(index);
    }
  });
}

describe("rewatchOrder", () => {
  it("returns all 7 other movies for Doomsday in a valid order", () => {
    const graph = mcu();
    const order = rewatchOrder(graph, DOOMSDAY);
    expect(order).toHaveLength(7);
    expect(new Set(order).size).toBe(7);
    expect(order).not.toContain(DOOMSDAY);
    expectValidOrder(graph, order);
  });

  it("returns Iron Man and First Avenger, then The Avengers, for Civil War", () => {
    const order = rewatchOrder(mcu(), CIVIL_WAR);
    expect(order.slice(0, 2).sort()).toEqual([IRON_MAN, FIRST_AVENGER]);
    expect(order[2]).toBe(AVENGERS);
    expect(order).toHaveLength(3);
  });

  it("returns an empty list for Thor: Ragnarok", () => {
    expect(rewatchOrder(mcu(), RAGNAROK)).toEqual([]);
  });

  it("lists a shared prerequisite only once (diamond shape)", () => {
    const graph: PrerequisiteGraph = new Map([[1, []], [2, [1]], [3, [1]], [4, [2, 3]]]);
    const order = rewatchOrder(graph, 4);
    expect(order).toHaveLength(3);
    expect(order[0]).toBe(1);
  });
});

describe("wouldCreateCycle", () => {
  it("rejects Endgame as a prerequisite of Iron Man", () => {
    expect(wouldCreateCycle(mcu(), IRON_MAN, [ENDGAME])).toBe(true);
  });

  it("rejects a movie depending on itself", () => {
    expect(wouldCreateCycle(mcu(), RAGNAROK, [RAGNAROK])).toBe(true);
  });

  it("allows a harmless new prerequisite", () => {
    expect(wouldCreateCycle(mcu(), RAGNAROK, [IRON_MAN])).toBe(false);
  });

});

describe("fewestBundles", () => {
  it("1,3,4 for 6 seats -> 2 bundles: 3 x 2", () => {
    expect(fewestBundles([1, 3, 4], 6)).toEqual({ totalBundles: 2, bundles: [{ size: 3, count: 2 }] });
  });

  it("2,5 for 11 seats -> 4 bundles: 5 x 1, 2 x 3", () => {
    expect(fewestBundles([2, 5], 11)).toEqual({
      totalBundles: 4,
      bundles: [{ size: 5, count: 1 }, { size: 2, count: 3 }],
    });
  });

  it("6,9,20 for 44 seats -> 4 bundles: 20 x 1, 9 x 2, 6 x 1", () => {
    expect(fewestBundles([6, 9, 20], 44)).toEqual({
      totalBundles: 4,
      bundles: [{ size: 20, count: 1 }, { size: 9, count: 2 }, { size: 6, count: 1 }],
    });
  });

  it("4,6 for 7 seats -> not possible", () => {
    expect(fewestBundles([4, 6], 7)).toBeNull();
  });

});
