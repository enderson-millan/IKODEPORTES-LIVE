-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LeagueCode" AS ENUM ('LVBP', 'MLB', 'LIDOM', 'LMP', 'WBC', 'SOFTBALL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'LIVE', 'FINAL', 'POSTPONED', 'CANCELED');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "league" "LeagueCode" NOT NULL,
    "externalGameId" TEXT,
    "feedUrl" TEXT,
    "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "latestState" JSONB,
    "startsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayEvent" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "inning" INTEGER NOT NULL,
    "isTopInning" BOOLEAN NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE INDEX "Game_startsAt_idx" ON "Game"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Game_league_externalGameId_key" ON "Game"("league", "externalGameId");

-- CreateIndex
CREATE INDEX "PlayEvent_gameId_createdAt_idx" ON "PlayEvent"("gameId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlayEvent_gameId_sequence_key" ON "PlayEvent"("gameId", "sequence");

-- AddForeignKey
ALTER TABLE "PlayEvent" ADD CONSTRAINT "PlayEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;


