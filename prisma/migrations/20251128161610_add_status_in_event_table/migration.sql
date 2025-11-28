/*
  Warnings:

  - You are about to drop the column `eventId` on the `Monitor` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "EventMonitor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "videoUrl" TEXT,
    "monitorId" INTEGER NOT NULL,
    "eventId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventMonitor_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventMonitor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECORDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Event" ("createdAt", "id", "name") SELECT "createdAt", "id", "name" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE TABLE "new_Monitor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'WATCH_ONLY',
    "monitorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Monitor" ("createdAt", "id", "mode", "monitorId", "name", "url") SELECT "createdAt", "id", "mode", "monitorId", "name", "url" FROM "Monitor";
DROP TABLE "Monitor";
ALTER TABLE "new_Monitor" RENAME TO "Monitor";
CREATE UNIQUE INDEX "Monitor_monitorId_key" ON "Monitor"("monitorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
