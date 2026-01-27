-- CreateEnum
CREATE TYPE "ChallanType" AS ENUM ('STATE', 'COUNCIL', 'CSS');

-- CreateTable
CREATE TABLE "Challan" (
    "id" SERIAL NOT NULL,
    "cashierId" INTEGER NOT NULL,
    "counterfoilNo" TEXT,
    "counterfoilDate" TIMESTAMP(3),
    "challanNo" TEXT,
    "challanDate" TIMESTAMP(3),
    "challanType" "ChallanType" NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "divisionId" INTEGER NOT NULL,
    "ddoId" INTEGER NOT NULL,
    "majorHead" TEXT NOT NULL,
    "subMajorHead" TEXT NOT NULL,
    "subSubMajorHead" TEXT NOT NULL,
    "minorHead" TEXT NOT NULL,
    "detailHead" TEXT NOT NULL,
    "treasuryCode" TEXT,
    "treasuryChallanNo" TEXT,
    "treasuryChallanDate" TIMESTAMP(3),
    "amount" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Challan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Challan" ADD CONSTRAINT "Challan_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "Cashier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challan" ADD CONSTRAINT "Challan_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challan" ADD CONSTRAINT "Challan_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challan" ADD CONSTRAINT "Challan_ddoId_fkey" FOREIGN KEY ("ddoId") REFERENCES "DDO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
