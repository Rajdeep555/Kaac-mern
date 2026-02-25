-- CreateTable
CREATE TABLE "challanTwo" (
    "id" SERIAL NOT NULL,
    "kaacChallanNo" TEXT NOT NULL,
    "kaacChallanDate" TIMESTAMP(3) NOT NULL,
    "sector" "Sector",
    "majorHead" TEXT,
    "subMajor" TEXT,
    "minorHead" TEXT,
    "divisonCode" TEXT,
    "ddoCode" TEXT,
    "treasuryCode" TEXT,
    "treasuryChallanNo" TEXT,
    "treasuryChallanDate" TIMESTAMP(3) NOT NULL,
    "loansReceivedGovt" DECIMAL(14,2),
    "loansReceivedOther" DECIMAL(14,2),
    "depositReceivedTransferredItems" DECIMAL(14,2),
    "grantsInAid" DECIMAL(14,2),
    "amount" DECIMAL(14,2),
    "narration" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "challanTwo_pkey" PRIMARY KEY ("id")
);
