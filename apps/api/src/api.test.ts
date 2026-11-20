// Integration tests: they need a real Postgres (set DATABASE_URL, run the migrations first)
// and wipe the Movie and Cinema tables. They are skipped when DATABASE_URL is not set.
import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

const run = describe.skipIf(!process.env.DATABASE_URL);

run("API", async () => {
  const { createApp } = await import("./app.js");
  const { prisma } = await import("./db.js");
  const app = createApp();

  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE "Movie", "Cinema" RESTART IDENTITY CASCADE`;
  });

  const addMovie = async (title: string, prerequisiteIds: number[] = [], extra: object = {}) => {
    const res = await request(app).post("/api/movies").send({ title, releaseYear: 2012, runtime: 100, prerequisiteIds, ...extra });
    expect(res.status).toBe(201);
    return res.body as { id: number };
  };

  describe("movies", () => {
    it("creates a movie with watched defaulting to false", async () => {
      const res = await request(app).post("/api/movies").send({ title: "Iron Man", releaseYear: 2008, runtime: 126 });
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: "Iron Man", watched: false, prerequisiteIds: [] });
    });

    it("rejects a duplicate title ignoring case", async () => {
      await addMovie("Iron Man");
      const res = await request(app).post("/api/movies").send({ title: "iron man", releaseYear: 2008, runtime: 126 });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("DUPLICATE_TITLE");
    });

    it.each([
      [{ releaseYear: 2007 }],
      [{ releaseYear: 2027 }],
      [{ runtime: 0 }],
      [{ runtime: 301 }],
      [{ title: "   " }],
    ])("rejects invalid input %j with 400", async (bad) => {
      const res = await request(app).post("/api/movies").send({ title: "X", releaseYear: 2010, runtime: 100, ...bad });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe("VALIDATION_ERROR");
    });

    it("rejects unknown prerequisite ids with 400", async () => {
      const res = await request(app).post("/api/movies").send({ title: "X", releaseYear: 2010, runtime: 100, prerequisiteIds: [999] });
      expect(res.status).toBe(400);
    });

    it("updates watched and prerequisites, replacing the old list", async () => {
      const a = await addMovie("A");
      const b = await addMovie("B");
      const c = await addMovie("C", [a.id]);
      const res = await request(app).patch(`/api/movies/${c.id}`).send({ watched: true, prerequisiteIds: [b.id] });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ watched: true, prerequisiteIds: [b.id] });
    });

    it("keeps prerequisites in the order they were sent", async () => {
      const a = await addMovie("A");
      const b = await addMovie("B");
      const c = await addMovie("C");
      const d = await addMovie("D", [c.id, a.id, b.id]);
      expect(d).toBeDefined();
      const list = async () => (await request(app).get("/api/movies")).body.find((m: { title: string }) => m.title === "D");
      expect((await list()).prerequisiteIds).toEqual([c.id, a.id, b.id]);

      await request(app).patch(`/api/movies/${d.id}`).send({ prerequisiteIds: [b.id, c.id, a.id] });
      expect((await list()).prerequisiteIds).toEqual([b.id, c.id, a.id]);
    });

    it("uses the prerequisite order for the rewatch order", async () => {
      const a = await addMovie("A");
      const b = await addMovie("B");
      const t = await addMovie("T", [b.id, a.id]);
      const names = async () =>
        (await request(app).get(`/api/movies/${t.id}/rewatch-order`)).body.order.map((m: { title: string }) => m.title);
      expect(await names()).toEqual(["B", "A"]);
      await request(app).patch(`/api/movies/${t.id}`).send({ prerequisiteIds: [a.id, b.id] });
      expect(await names()).toEqual(["A", "B"]);
    });

    it("returns 404 when updating a missing movie", async () => {
      const res = await request(app).patch("/api/movies/999").send({ watched: true });
      expect(res.status).toBe(404);
    });

    it("returns 409 CIRCULAR_DEPENDENCY for a self reference", async () => {
      const a = await addMovie("A");
      const res = await request(app).patch(`/api/movies/${a.id}`).send({ prerequisiteIds: [a.id] });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CIRCULAR_DEPENDENCY");
    });

    it("returns 409 CIRCULAR_DEPENDENCY when Endgame becomes a prerequisite of Iron Man", async () => {
      const ironMan = await addMovie("Iron Man");
      const avengers = await addMovie("The Avengers", [ironMan.id]);
      const infinityWar = await addMovie("Infinity War", [avengers.id]);
      const endgame = await addMovie("Endgame", [infinityWar.id]);

      const res = await request(app).patch(`/api/movies/${ironMan.id}`).send({ prerequisiteIds: [endgame.id] });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CIRCULAR_DEPENDENCY");

      const after = await request(app).get("/api/movies");
      expect(after.body.find((m: { id: number }) => m.id === ironMan.id).prerequisiteIds).toEqual([]);
    });

    it("blocks deleting a movie that others depend on, then allows it once free", async () => {
      const a = await addMovie("A");
      const b = await addMovie("B", [a.id]);
      const blocked = await request(app).delete(`/api/movies/${a.id}`);
      expect(blocked.status).toBe(409);
      expect(blocked.body.code).toBe("MOVIE_IS_PREREQUISITE");
      expect(blocked.body.message).toContain("B");

      expect((await request(app).delete(`/api/movies/${b.id}`)).status).toBe(204);
      expect((await request(app).delete(`/api/movies/${a.id}`)).status).toBe(204);
      expect((await request(app).delete(`/api/movies/${a.id}`)).status).toBe(404);
    });
  });

  describe("rewatch order", () => {
    it("returns ordered prerequisites with watched count and remaining runtime", async () => {
      const ironMan = await addMovie("Iron Man", [], { watched: true, runtime: 126 });
      const firstAvenger = await addMovie("First Avenger", [], { runtime: 124 });
      const avengers = await addMovie("The Avengers", [ironMan.id, firstAvenger.id], { runtime: 143 });
      const civilWar = await addMovie("Civil War", [avengers.id]);

      const res = await request(app).get(`/api/movies/${civilWar.id}/rewatch-order`);
      expect(res.status).toBe(200);
      expect(res.body.order.map((m: { title: string }) => m.title).at(-1)).toBe("The Avengers");
      expect(res.body.order).toHaveLength(3);
      expect(res.body).toMatchObject({ watchedCount: 1, totalCount: 3, remainingRuntime: 124 + 143 });
      expect(res.body.target.title).toBe("Civil War");
    });

    it("returns an empty list for a movie with no prerequisites", async () => {
      const thor = await addMovie("Ragnarok");
      const res = await request(app).get(`/api/movies/${thor.id}/rewatch-order`);
      expect(res.body).toMatchObject({ order: [], totalCount: 0, watchedCount: 0, remainingRuntime: 0 });
    });

    it("returns 404 for a missing movie", async () => {
      expect((await request(app).get("/api/movies/999/rewatch-order")).status).toBe(404);
    });
  });

  describe("cinemas", () => {
    const addCinema = async (name: string, bundleSizes: number[]) => {
      const res = await request(app).post("/api/cinemas").send({ name, bundleSizes });
      expect(res.status).toBe(201);
      return res.body as { id: number };
    };

    it("creates a cinema with sorted sizes and rejects a duplicate name ignoring case", async () => {
      const res = await request(app).post("/api/cinemas").send({ name: "Star", bundleSizes: [5, 2] });
      expect(res.body.bundleSizes).toEqual([2, 5]);
      const dup = await request(app).post("/api/cinemas").send({ name: "STAR", bundleSizes: [1] });
      expect(dup.status).toBe(409);
      expect(dup.body.code).toBe("DUPLICATE_CINEMA_NAME");
    });

    it.each([
      [[]],
      [[0]],
      [[501]],
      [[3, 3]],
      [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]],
    ])("rejects bundle sizes %j with 400", async (bundleSizes) => {
      const res = await request(app).post("/api/cinemas").send({ name: "C", bundleSizes });
      expect(res.status).toBe(400);
    });

    it("quotes the fewest bundles, and 200 with possible:false when impossible", async () => {
      const c = await addCinema("Multi", [6, 9, 20]);
      const ok = await request(app).get(`/api/cinemas/${c.id}/booking?groupSize=44`);
      expect(ok.status).toBe(200);
      expect(ok.body).toEqual({
        possible: true, groupSize: 44, totalBundles: 4,
        bundles: [{ size: 20, count: 1 }, { size: 9, count: 2 }, { size: 6, count: 1 }],
      });

      const d = await addCinema("Even", [4, 6]);
      const no = await request(app).get(`/api/cinemas/${d.id}/booking?groupSize=7`);
      expect(no.status).toBe(200);
      expect(no.body).toEqual({ possible: false, groupSize: 7 });
    });

    it("validates the group size and the cinema id", async () => {
      const c = await addCinema("C", [2]);
      for (const g of ["0", "10001", "abc", "2.5", ""]) {
        expect((await request(app).get(`/api/cinemas/${c.id}/booking?groupSize=${g}`)).status).toBe(400);
      }
      expect((await request(app).get("/api/cinemas/999/booking?groupSize=4")).status).toBe(404);
    });

    it("deletes a cinema and returns 404 the second time", async () => {
      const c = await addCinema("C", [2]);
      expect((await request(app).delete(`/api/cinemas/${c.id}`)).status).toBe(204);
      expect((await request(app).delete(`/api/cinemas/${c.id}`)).status).toBe(404);
    });
  });
});
