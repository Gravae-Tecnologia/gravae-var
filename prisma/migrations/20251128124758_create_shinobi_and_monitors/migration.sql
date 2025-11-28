-- CreateTable
CREATE TABLE "Shinobi" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "groupKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Monitor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "monitorId" TEXT NOT NULL,
    "shinobiId" INTEGER,
    "eventId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Monitor_shinobiId_fkey" FOREIGN KEY ("shinobiId") REFERENCES "Shinobi" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Monitor_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Monitor_monitorId_key" ON "Monitor"("monitorId");
