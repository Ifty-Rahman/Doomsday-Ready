-- CreateTable
CREATE TABLE "MoviePrerequisite" (
    "movieId" INTEGER NOT NULL,
    "prerequisiteId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "MoviePrerequisite_pkey" PRIMARY KEY ("movieId","prerequisiteId")
);

-- Keep existing links: in "_Prerequisites", "A" is the movie and "B" its prerequisite.
INSERT INTO "MoviePrerequisite" ("movieId", "prerequisiteId", "position")
SELECT "A", "B", ROW_NUMBER() OVER (PARTITION BY "A" ORDER BY "B") - 1
FROM "_Prerequisites";

-- DropTable
DROP TABLE "_Prerequisites";

-- CreateIndex
CREATE INDEX "MoviePrerequisite_prerequisiteId_idx" ON "MoviePrerequisite"("prerequisiteId");

-- AddForeignKey
ALTER TABLE "MoviePrerequisite" ADD CONSTRAINT "MoviePrerequisite_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoviePrerequisite" ADD CONSTRAINT "MoviePrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;
