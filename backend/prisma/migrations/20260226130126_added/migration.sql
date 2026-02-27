-- CreateTable
CREATE TABLE "state_challans" (
    "id" TEXT NOT NULL,
    "challanNo" TEXT,
    "challanDate" TIMESTAMP(3),
    "cashierId" INTEGER NOT NULL,
    "stateNo" TEXT,
    "from" TEXT,
    "to" TEXT,
    "subject" TEXT,
    "ddo" TEXT,
    "divisionCode" TEXT,
    "majorHead" TEXT,
    "subMajorHead" TEXT,
    "minorHead" TEXT,
    "subHead" TEXT,
    "subSubHead" TEXT,
    "detailHead" TEXT,
    "subDetailHead" TEXT,
    "purpose" TEXT,
    "remarks" TEXT,
    "totalAmount" DOUBLE PRECISION,
    "amountInWords" TEXT,
    "focNo" TEXT,
    "sanctionLetterNo" TEXT,
    "sanctionLetterDate" TIMESTAMP(3),
    "treasuryCode" TEXT,
    "treasuryChallanNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "state_challans_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "state_challans" ADD CONSTRAINT "state_challans_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
