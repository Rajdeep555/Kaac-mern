-- DropForeignKey
ALTER TABLE "Challan" DROP CONSTRAINT "Challan_cashierId_fkey";

-- CreateTable
CREATE TABLE "ChallanHeads" (
    "id" SERIAL NOT NULL,
    "majorHead" TEXT NOT NULL,
    "subMajor" TEXT,
    "subSubMajor" TEXT,
    "minorHead" TEXT,
    "detailHead" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChallanHeads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashReceipt" (
    "id" SERIAL NOT NULL,
    "cashierId" INTEGER NOT NULL,
    "counterfoilNo" TEXT,
    "date" TIMESTAMP(3),
    "receivedFrom" TEXT,
    "letterNo" TEXT,
    "letterDate" TIMESTAMP(3),
    "rupeesInCash" TEXT,
    "byChequeBank" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashReceipt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Challan" ADD CONSTRAINT "Challan_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashReceipt" ADD CONSTRAINT "CashReceipt_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
