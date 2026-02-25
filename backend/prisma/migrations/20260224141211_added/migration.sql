-- CreateTable
CREATE TABLE "cashbookInformations" (
    "id" SERIAL NOT NULL,
    "sector" "Sector",
    "month" INTEGER,
    "year" INTEGER,
    "financialYear" TEXT,
    "receiptCashColumn" DECIMAL(14,2),
    "receiptTreasuryPla" DECIMAL(14,2),
    "disbursementCashColumn" DECIMAL(14,2),
    "disbursementTreasuryPla" DECIMAL(14,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cashbookInformations_pkey" PRIMARY KEY ("id")
);
