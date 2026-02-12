/*
  Warnings:

  - The values [GOVT,OTHER] on the enum `LoanType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `divisionId` on the `Expenditure` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LoanType_new" AS ENUM ('BUIDLING_LOAN', 'CAR_LOAN');
ALTER TABLE "Expenditure" ALTER COLUMN "loanType" TYPE "LoanType_new" USING ("loanType"::text::"LoanType_new");
ALTER TYPE "LoanType" RENAME TO "LoanType_old";
ALTER TYPE "LoanType_new" RENAME TO "LoanType";
DROP TYPE "public"."LoanType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Expenditure" DROP CONSTRAINT "Expenditure_divisionId_fkey";

-- AlterTable
ALTER TABLE "Expenditure" DROP COLUMN "divisionId";
