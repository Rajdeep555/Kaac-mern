/*
  Warnings:

  - The primary key for the `state_challans` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `state_challans` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "state_challans" DROP CONSTRAINT "state_challans_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "state_challans_pkey" PRIMARY KEY ("id");
