import { z } from "zod";

const decimalField = z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => {
        if (val === undefined || val === "" || val === null) return null;
        return Number(val);
    });

export const createExpenditureSchema = z.object({
    /* ================= BASIC ================= */
    sector: z.enum(["COUNCIL", "STATE"]),
    voucherNo: z.string().min(1),
    voucherDate: z.string().optional(),

    requisitionNo: z.string().optional(),
    requisitionDate: z.string().optional(),

    grantNo: z.string().optional(),

    departmentId: z.number().int(),
    ddoId: z.number().int(),
    divisionId: z.number().int(),

    workName: z.string().optional(),
    expenditureType: z.enum(["CAPITAL", "REVENUE"]),

    /* ================= HEADS ================= */
    majorHead: z.string(),
    subMajorHead: z.string().optional(),
    minorHead: z.string().optional(),
    subHead: z.string().optional(),
    subSubHead: z.string().optional(),
    detailHead: z.string().optional(),
    subDetailHead: z.string().optional(),

    /* ================= CLASSIFICATION ================= */
    salaryType: z.enum(["SALARY", "NON_SALARY"]),
    planType: z.enum(["PLAN", "NON_PLAN"]),
    financialYear: z.string(),
    objectHead: z.string().optional(),

    /* ================= AMOUNT BREAKUP ================= */
    payOfficers: decimalField,
    payEstablishment: decimalField,
    allowanceHonorary: decimalField,
    contingencies: decimalField,
    grantsInAid: decimalField,
    works: decimalField,
    loansAdvances: decimalField,

    loanType: z.enum(["GOVT", "OTHER"]).optional(),
    loanRepayGovt: decimalField,
    loanRepayOther: decimalField,

    securityDeposit: decimalField,
    earnestMoney: decimalField,
    transferPayment: decimalField,

    /* ================= TOTAL ================= */
    grossAmount: z.number(),

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

    grossDeduction: z.number(),
    cpfPayable: z.number(),
    netDeduction: z.number(),
    netAmount: z.number(),
    amountPayable: z.number(),

    amountInWords: z.string(),

    /* ================= REMARKS ================= */
    remarks: z.string().optional(),

    /* ================= CHEQUE / TREASURY ================= */
    chequeBookNo: z.string().optional(),
    chequeNo: z.string().optional(),
    chequeIssueDate: z.string().optional(),

    treasuryName: z.string().optional(),
    treasuryVoucherNo: z.string().optional(),
    treasuryDate: z.string().optional(),
});
