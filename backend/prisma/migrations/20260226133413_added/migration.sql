/*
  Warnings:

  - Added the required column `sector` to the `state_challans` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "state_challans" ADD COLUMN     "sector" "Sector" NOT NULL;
