-- CreateTable
CREATE TABLE "HistoryManager" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultId" TEXT NOT NULL,

    CONSTRAINT "HistoryManager_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HistoryManager_resultId_key" ON "HistoryManager"("resultId");

-- AddForeignKey
ALTER TABLE "HistoryManager" ADD CONSTRAINT "HistoryManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryManager" ADD CONSTRAINT "HistoryManager_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Identification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
