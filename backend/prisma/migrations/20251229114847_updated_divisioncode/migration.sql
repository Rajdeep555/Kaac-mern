/*
  Warnings:

  - A unique constraint covering the columns `[divisionCode]` on the table `Division` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Division_divisionCode_key" ON "Division"("divisionCode");
