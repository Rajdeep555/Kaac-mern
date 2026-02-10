-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('SALARY', 'NON_SALARY');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('PLAN', 'NON_PLAN');

-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('GOVT', 'OTHER');

-- CreateTable
CREATE TABLE "Expenditure" (
    "id" SERIAL NOT NULL,
    "sector" "Sector" NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "voucherDate" TIMESTAMP(3),
    "requisitionNo" TEXT,
    "requisitionDate" TIMESTAMP(3),
    "grantNo" TEXT,
    "departmentId" INTEGER NOT NULL,
    "ddoId" INTEGER NOT NULL,
    "divisionId" INTEGER NOT NULL,
    "workName" TEXT,
    "expenditureType" TEXT NOT NULL,
    "majorHead" TEXT NOT NULL,
    "subMajorHead" TEXT,
    "minorHead" TEXT,
    "subHead" TEXT,
    "subSubHead" TEXT,
    "detailHead" TEXT,
    "subDetailHead" TEXT,
    "salaryType" "SalaryType" NOT NULL,
    "planType" "PlanType" NOT NULL,
    "financialYear" TEXT NOT NULL,
    "objectHead" TEXT,
    "payOfficers" DECIMAL(14,2),
    "payEstablishment" DECIMAL(14,2),
    "allowanceHonorary" DECIMAL(14,2),
    "contingencies" DECIMAL(14,2),
    "grantsInAid" DECIMAL(14,2),
    "works" DECIMAL(14,2),
    "loansAdvances" DECIMAL(14,2),
    "loanType" "LoanType",
    "loanRepayGovt" DECIMAL(14,2),
    "loanRepayOther" DECIMAL(14,2),
    "securityDeposit" DECIMAL(14,2),
    "earnestMoney" DECIMAL(14,2),
    "transferPayment" DECIMAL(14,2),
    "grossAmount" DECIMAL(14,2) NOT NULL,
    "cgst" DECIMAL(14,2),
    "sgst" DECIMAL(14,2),
    "igst" DECIMAL(14,2),
    "earnestMoneyDeduction" DECIMAL(14,2),
    "ptax" DECIMAL(14,2),
    "itax" DECIMAL(14,2),
    "carLoanRecovery" DECIMAL(14,2),
    "houseLoanRecovery" DECIMAL(14,2),
    "cpfCouncil" DECIMAL(14,2),
    "cpfContribution" DECIMAL(14,2),
    "cpfRecovery" DECIMAL(14,2),
    "houseRent" DECIMAL(14,2),
    "securityDepositsDeduction" DECIMAL(14,2),
    "forestRoyalty" DECIMAL(14,2),
    "monopoly" DECIMAL(14,2),
    "mcForestRoyalty" DECIMAL(14,2),
    "mdrrf" DECIMAL(14,2),
    "dmft" DECIMAL(14,2),
    "labourCess" DECIMAL(14,2),
    "itForestRoyalty" DECIMAL(14,2),
    "vat" DECIMAL(14,2),
    "advanceRecovery" DECIMAL(14,2),
    "otherDeductions" DECIMAL(14,2),
    "grossDeduction" DECIMAL(14,2) NOT NULL,
    "cpfPayable" DECIMAL(14,2) NOT NULL,
    "netDeduction" DECIMAL(14,2) NOT NULL,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "amountPayable" DECIMAL(14,2) NOT NULL,
    "amountInWords" TEXT NOT NULL,
    "remarks" TEXT,
    "chequeBookNo" TEXT,
    "chequeNo" TEXT,
    "chequeIssueDate" TIMESTAMP(3),
    "treasuryName" TEXT,
    "treasuryVoucherNo" TEXT,
    "treasuryDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expenditure_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_ddoId_fkey" FOREIGN KEY ("ddoId") REFERENCES "DDO"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expenditure" ADD CONSTRAINT "Expenditure_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
