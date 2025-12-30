/*
  Warnings:

  - A unique constraint covering the columns `[cashierCode]` on the table `Cashier` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ddoCode]` on the table `DDO` will be added. If there are existing duplicate values, this will fail.
  - Made the column `cashierCode` on table `Cashier` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ddoCode` on table `DDO` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Cashier" ALTER COLUMN "cashierCode" SET NOT NULL;

-- AlterTable
ALTER TABLE "DDO" ALTER COLUMN "ddoCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Cashier_cashierCode_key" ON "Cashier"("cashierCode");

-- CreateIndex
CREATE UNIQUE INDEX "DDO_ddoCode_key" ON "DDO"("ddoCode");
