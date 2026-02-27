/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Department` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Expenditure" DROP CONSTRAINT "Expenditure_departmentId_fkey";

-- AlterTable
ALTER TABLE "Expenditure" ALTER COLUMN "departmentId" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- AddForeignKey
ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
