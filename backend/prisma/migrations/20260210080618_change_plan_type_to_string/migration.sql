/*
  Warnings:

  - Changed the type of `planType` on the `Expenditure` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Expenditure" DROP COLUMN "planType",
ADD COLUMN     "planType" TEXT NOT NULL;
