/*
  Warnings:

  - You are about to drop the column `videoUrl` on the `EventMonitor` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Video" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventMonitorId" INTEGER,
    CONSTRAINT "Video_eventMonitorId_fkey" FOREIGN KEY ("eventMonitorId") REFERENCES "EventMonitor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EventMonitor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "monitorId" INTEGER NOT NULL,
    "eventId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventMonitor_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EventMonitor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_EventMonitor" ("createdAt", "eventId", "id", "monitorId") SELECT "createdAt", "eventId", "id", "monitorId" FROM "EventMonitor";
DROP TABLE "EventMonitor";
ALTER TABLE "new_EventMonitor" RENAME TO "EventMonitor";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
