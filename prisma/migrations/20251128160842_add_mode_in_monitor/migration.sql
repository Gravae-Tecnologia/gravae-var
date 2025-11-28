-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Monitor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'WATCH_ONLY',
    "monitorId" TEXT NOT NULL,
    "eventId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Monitor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Monitor" ("createdAt", "eventId", "id", "monitorId", "name", "url") SELECT "createdAt", "eventId", "id", "monitorId", "name", "url" FROM "Monitor";
DROP TABLE "Monitor";
ALTER TABLE "new_Monitor" RENAME TO "Monitor";
CREATE UNIQUE INDEX "Monitor_monitorId_key" ON "Monitor"("monitorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
