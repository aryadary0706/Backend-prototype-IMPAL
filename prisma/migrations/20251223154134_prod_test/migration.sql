/*
  Warnings:

  - You are about to drop the column `action` on the `HistoryManager` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - Added the required column `TreatmentAdvice` to the `Identification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isHealthy` to the `Identification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."HistoryManager" DROP CONSTRAINT "HistoryManager_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Identification" DROP CONSTRAINT "Identification_userId_fkey";

-- AlterTable
ALTER TABLE "HistoryManager" DROP COLUMN "action",
ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Identification" ADD COLUMN     "TreatmentAdvice" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isHealthy" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "userId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "updatedAt",
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- AddForeignKey
ALTER TABLE "Identification" ADD CONSTRAINT "Identification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistoryManager" ADD CONSTRAINT "HistoryManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
