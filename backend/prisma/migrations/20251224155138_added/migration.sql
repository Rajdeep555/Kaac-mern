-- CreateEnum
CREATE TYPE "Sector" AS ENUM ('COUNCIL', 'STATE');

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

-- AddForeignKey
ALTER TABLE "DDO" ADD CONSTRAINT "DDO_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cashier" ADD CONSTRAINT "Cashier_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cashier" ADD CONSTRAINT "Cashier_ddoId_fkey" FOREIGN KEY ("ddoId") REFERENCES "DDO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
