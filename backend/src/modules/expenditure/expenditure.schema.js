import { z } from "zod";

const decimalField = z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
        if (val === undefined || val === "" || val === null) return 0; // ✅ Change to 0
        const num = Number(val);
        return isNaN(num) ? 0 : num; // ✅ Handle NaN
    });

// ✅ Make calculated totals optional or default to 0
const requiredDecimal = z.number().min(0); // ✅ For grossAmount etc.

export const createExpenditureSchema = z.object({
    /* ================= BASIC ================= */
    sector: z.enum(["COUNCIL", "STATE"]),
    voucherNo: z.string().min(1),
    voucherDate: z.string().optional(),

    requisitionNo: z.string().optional(),
    requisitionDate: z.string().optional(),

    grantNo: z.string().optional(),

    departmentId: z.number().int().positive(),
    ddoId: z.number().int().positive(),

    workName: z.string().optional(),
    expenditureType: z.enum(["CAPITAL", "REVENUE"]),

    /* ================= HEADS ================= */
    majorHead: z.string().min(1),
    subMajorHead: z.string().optional(),
    minorHead: z.string().optional(),
    subHead: z.string().optional(),
    subSubHead: z.string().optional(),
    detailHead: z.string().optional(),
    subDetailHead: z.string().optional(),

    /* ================= CLASSIFICATION ================= */
    salaryType: z.enum(["SALARY", "NON_SALARY"]),
    planType: z.string().min(1),
    financialYear: z.string().min(1),
    objectHead: z.string().optional(),

    /* ================= AMOUNT BREAKUP ================= */
    payOfficers: decimalField,
    payEstablishment: decimalField,
    allowanceHonorary: decimalField,
    contingencies: decimalField,
    grantsInAid: decimalField,
    works: decimalField,
    loansAdvances: decimalField,

    loanType: z.enum(["BUILDING_LOAN", "CAR_LOAN"]).optional().nullable(),
    loanRepayGovt: decimalField,
    loanRepayOther: decimalField,

    securityDeposit: decimalField,
    earnestMoney: decimalField,
    transferPayment: decimalField,

    /* ================= TOTAL ================= */
    grossAmount: decimalField, // Changed from z.number()

    /* ================= DEDUCTIONS ================= */
    cgst: decimalField,
    sgst: decimalField,
    igst: decimalField,
    earnestMoneyDeduction: decimalField,
    ptax: decimalField,
    itax: decimalField,
    carLoanRecovery: decimalField,
    houseLoanRecovery: decimalField,
    cpfCouncil: decimalField,
    cpfContribution: decimalField,
    cpfRecovery: decimalField,
    houseRent: decimalField,
    securityDepositsDeduction: decimalField,
    forestRoyalty: decimalField,
    monopoly: decimalField,
    mcForestRoyalty: decimalField,
    mdrrf: decimalField,
    dmft: decimalField,
    labourCess: decimalField,
    itForestRoyalty: decimalField,
    vat: decimalField,
    advanceRecovery: decimalField,
    otherDeductions: decimalField,

    // ✅ All calculated totals use decimalField now
    grossDeduction: decimalField,
    cpfPayable: decimalField,
    netDeduction: decimalField,
    netAmount: decimalField,
    amountPayable: decimalField,

    amountInWords: z.string().min(1),

    /* ================= REMARKS ================= */
    remarks: z.string().nullable().optional(),

    /* ================= CHEQUE / TREASURY ================= */
    chequeBookNo: z.string().optional().nullable(),
    chequeNo: z.string().optional().nullable(),
    chequeIssueDate: z.string().optional(),

    treasuryName: z.string().nullable().optional(),
    treasuryVoucherNo: z.string().nullable().optional(),
    treasuryDate: z.string().nullable().optional(),
});
