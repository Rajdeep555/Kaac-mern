/*
  Warnings:

  - Added the required column `cashierId` to the `Expenditure` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Expenditure" ADD COLUMN     "cashierId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
