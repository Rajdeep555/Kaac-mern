/*
  Warnings:

  - The values [BUIDLING_LOAN] on the enum `LoanType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LoanType_new" AS ENUM ('BUILDING_LOAN', 'CAR_LOAN');
ALTER TABLE "Expenditure" ALTER COLUMN "loanType" TYPE "LoanType_new" USING ("loanType"::text::"LoanType_new");
ALTER TYPE "LoanType" RENAME TO "LoanType_old";
ALTER TYPE "LoanType_new" RENAME TO "LoanType";
DROP TYPE "public"."LoanType_old";
COMMIT;
