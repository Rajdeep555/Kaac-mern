-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CASHIER');

-- CreateEnum
CREATE TYPE "Sector" AS ENUM ('COUNCIL', 'STATE');

-- CreateEnum
CREATE TYPE "ChallanType" AS ENUM ('STATE', 'COUNCIL', 'CSS');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "role" "UserRole" NOT NULL DEFAULT 'CASHIER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Division" (
    "id" SERIAL NOT NULL,
    "divisionName" TEXT NOT NULL,
    "divisionCode" TEXT NOT NULL,
    "sector" "Sector",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DDO" (
    "id" SERIAL NOT NULL,
    "ddoName" TEXT NOT NULL,
    "ddoEmail" TEXT,
    "ddoPhone" TEXT,
    "ddoPassword" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "divisionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ddoCode" TEXT NOT NULL,

    CONSTRAINT "DDO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cashier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "divisionId" INTEGER NOT NULL,
    "ddoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cashierCode" TEXT NOT NULL,

    CONSTRAINT "Cashier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenditureType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sector" "Sector",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenditureType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanNonPlan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sector" "Sector",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanNonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjectHead" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sector" "Sector",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObjectHead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sector" "Sector",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Heads" (
    "id" SERIAL NOT NULL,
    "sector" "Sector" NOT NULL,
    "grantName" TEXT NOT NULL,
    "grantNo" TEXT NOT NULL,
    "majorHead" TEXT NOT NULL,
    "majorHeadCode" TEXT NOT NULL,
    "subMajor" TEXT,
    "subMajorCode" TEXT,
    "minorHead" TEXT,
    "minorHeadCode" TEXT,
    "subHead" TEXT,
    "subHeadCode" TEXT,
    "subSubHead" TEXT,
    "subSubHeadCode" TEXT,
    "detailHead" TEXT,
    "detailHeadCode" TEXT,
    "subDetailHead" TEXT,
    "subDetailHeadCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Heads_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Division_divisionCode_key" ON "Division"("divisionCode");

-- CreateIndex
CREATE UNIQUE INDEX "DDO_ddoCode_key" ON "DDO"("ddoCode");

-- CreateIndex
CREATE UNIQUE INDEX "Cashier_cashierCode_key" ON "Cashier"("cashierCode");

-- AddForeignKey
ALTER TABLE "DDO" ADD CONSTRAINT "DDO_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cashier" ADD CONSTRAINT "Cashier_ddoId_fkey" FOREIGN KEY ("ddoId") REFERENCES "DDO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cashier" ADD CONSTRAINT "Cashier_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challan" ADD CONSTRAINT "Challan_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "Cashier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challan" ADD CONSTRAINT "Challan_ddoId_fkey" FOREIGN KEY ("ddoId") REFERENCES "DDO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challan" ADD CONSTRAINT "Challan_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challan" ADD CONSTRAINT "Challan_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
