-- AlterTable
ALTER TABLE "Cashier" ADD COLUMN     "cashierCode" TEXT;

-- AlterTable
ALTER TABLE "DDO" ALTER COLUMN "ddoCode" DROP NOT NULL;
