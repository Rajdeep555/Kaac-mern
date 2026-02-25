-- CreateTable
CREATE TABLE "challanFromBill" (
    "id" SERIAL NOT NULL,
    "challanNo" TEXT NOT NULL,
    "idFromExpenditure" INTEGER NOT NULL,
    "sector" "Sector",
    "departmentId" INTEGER,
    "ddoId" INTEGER,
    "majorHead" TEXT,
    "subMajor" TEXT,
    "minorHead" TEXT,
    "treasuryCode" TEXT,
    "voucharDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2),
    "amountType" TEXT NOT NULL,
    "chequeNo" TEXT,
    "chequeDate" TIMESTAMP(3) NOT NULL,
    "salaryNonSalary" TEXT,
    "expenditureType" TEXT,
    "treasuryChallanNo" TEXT,
    "treasuryChallanDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challanFromBill_pkey" PRIMARY KEY ("id")
);
