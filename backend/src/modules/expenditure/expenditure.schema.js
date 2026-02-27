import { z } from "zod";

// ✅ Accepts string, number, or null — always outputs a number or 0
const decimalField = z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((val) => {
        if (val === undefined || val === "" || val === null) return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
    });

// ✅ Accepts string or number — always outputs Int or null
const intField = z
    .union([z.string(), z.number(), z.null()])
    .optional()
    .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = Number(val);
        return isNaN(num) ? null : Math.trunc(num); // ✅ ensures Int, not float
    });

export const createExpenditureSchema = z.object({
    /* ================= BASIC ================= */
    sector: z.enum(["COUNCIL", "STATE"]),
    voucherNo: z.string().min(1),
    voucherDate: z.string().nullable().optional(),

    requisitionNo: z.string().nullable().optional(),
    requisitionDate: z.string().nullable().optional(),

    grantNo: z.string().nullable().optional(),

    // ✅ FIXED: intField handles both String and Number input → always outputs Int
    departmentId: intField,
    ddoId: intField,

    workName: z.string().nullable().optional(),
    expenditureType: z.string().min(1),

    /* ================= HEADS ================= */
    majorHead: z.string().min(1),

    // ✅ FIXED: nullable + optional + default empty string
    subMajorHead: z.string().nullable().optional().transform((val) => val ?? ""),
    minorHead: z.string().nullable().optional().transform((val) => val ?? ""),
    subHead: z.string().nullable().optional().transform((val) => val ?? ""),
    subSubHead: z.string().nullable().optional().transform((val) => val ?? ""),
    detailHead: z.string().nullable().optional().transform((val) => val ?? ""),
    subDetailHead: z.string().nullable().optional().transform((val) => val ?? ""),

    /* ================= CLASSIFICATION ================= */
    salaryType: z.enum(["SALARY", "NON_SALARY"]),
    planType: z.string().min(1),
    financialYear: z.string().min(1),
    objectHead: z.string().nullable().optional(),

    /* ================= AMOUNT BREAKUP ================= */
    payOfficers: decimalField,
    payEstablishment: decimalField,
    allowanceHonorary: decimalField,
    contingencies: decimalField,
    grantsInAid: decimalField,
    works: decimalField,
    loansAdvances: decimalField,

    loanType: z.enum(["BUILDING_LOAN", "CAR_LOAN"]).nullable().optional(),
    loanRepayGovt: decimalField,
    loanRepayOther: decimalField,

    securityDeposit: decimalField,
    earnestMoney: decimalField,
    transferPayment: decimalField,

    /* ================= TOTAL ================= */
    grossAmount: decimalField,

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

    /* ================= CALCULATED TOTALS ================= */
    grossDeduction: decimalField,
    cpfPayable: decimalField,
    netDeduction: decimalField,
    netAmount: decimalField,
    amountPayable: decimalField,

    amountInWords: z.string().min(1),

    /* ================= REMARKS ================= */
    remarks: z.string().nullable().optional(),

    /* ================= CHEQUE / TREASURY ================= */
    chequeBookNo: z.string().nullable().optional(),
    chequeNo: z.string().nullable().optional(),
    chequeIssueDate: z.string().nullable().optional(),

    treasuryName: z.string().nullable().optional(),
    treasuryVoucherNo: z.string().nullable().optional(),
    treasuryDate: z.string().nullable().optional(),
});
