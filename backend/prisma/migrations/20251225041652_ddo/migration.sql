/*
  Warnings:

  - Added the required column `ddoCode` to the `DDO` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DDO" ADD COLUMN     "ddoCode" TEXT NOT NULL;
