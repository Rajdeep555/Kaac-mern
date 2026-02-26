import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

export const getStatement7Data = async ({ sector } = {}) => {
    const sectorFilter =
        sector && sector !== "CONSOLIDATED" ? { sector } : {};

    // 1. Opening Balance
    const openingBalances = await prisma.openingBalance.findMany({
        where: { isActive: true, ...sectorFilter },
    });

    // 2. Cashbook entries for receipts & disbursements
    const cashbookEntries = await prisma.cashbookInformations.findMany({
        where: { isActive: true, ...sectorFilter },
    });

    const openingBalance = openingBalances.reduce(
        (sum, item) => sum + Number(item.amount ?? 0), 0
    );

    const receipts = cashbookEntries.reduce(
        (sum, item) =>
            sum +
            Number(item.receiptCashColumn ?? 0) +
            Number(item.receiptTreasuryPla ?? 0),
        0
    );

    const disbursement = cashbookEntries.reduce(
        (sum, item) =>
            sum +
            Number(item.disbursementCashColumn ?? 0) +
            Number(item.disbursementTreasuryPla ?? 0),
        0
    );

    const closingBalance = openingBalance + receipts - disbursement;

    return [
        {
            id: 1,
            headOfAccount: "8443-00-120",
            openingBalance: openingBalance.toFixed(2),
            receipts: receipts.toFixed(2),
            disbursement: disbursement.toFixed(2),
            closingBalance: closingBalance.toFixed(2),
        },
    ];
};


export const getStatement6Data = async ({ sector } = {}) => {
    const sectorFilter =
        sector && sector !== "CONSOLIDATED" ? { sector } : {};

    const expenditures = await prisma.expenditure.findMany({
        where: {
            isActive: true,
            ...sectorFilter,
        },
        select: {
            majorHead: true,
            minorHead: true,
            grossAmount: true,
            planType: true,
        },
    });

    // Group by majorHead + minorHead combination
    const groupMap = new Map();

    for (const item of expenditures) {
        const headKey = [item.majorHead, item.minorHead]
            .filter((p) => p && p !== "-")
            .join("-");

        if (!groupMap.has(headKey)) {
            groupMap.set(headKey, {
                heads: headKey,
                nonPlan: 0,
                plan: 0,
            });
        }

        const group = groupMap.get(headKey);
        const amount = Number(item.grossAmount ?? 0);

        // planType decides non-plan vs plan column
        if (item.planType?.toLowerCase() === "plan") {
            group.plan += amount;
        } else {
            group.nonPlan += amount;
        }
    }

    const rows = Array.from(groupMap.values()).map((item, index) => ({
        id: index + 1,
        heads: item.heads,
        nonPlan: item.nonPlan.toFixed(2),
        plan: item.plan.toFixed(2),
        total: (item.nonPlan + item.plan).toFixed(2),
    }));

    const grandTotal = rows.reduce(
        (sum, item) => sum + Number(item.total), 0
    );

    return { rows, grandTotal: grandTotal.toFixed(2) };
};


// ─────────────────────────────────────────────────────────────
// STATEMENT 5 - Detailed Account of Revenue Receipt by Minor Heads
// Data comes from 2 tables: challan, challanFromBill
// ─────────────────────────────────────────────────────────────

// Amount types allowed from challanFromBill for Statement 5
const STATEMENT5_ALLOWED_AMOUNT_TYPES = [
    "Professional Tax",
    "Monopoly",
    "Forest Royalty",
    "MC Forest Royalty",
];

// Get rows from Challan table
const getStatement5ChallanRows = async (sector) => {
    const where = { isActive: true };

    if (sector && sector !== "CONSOLIDATED") {
        where.challanType = sector;
    }

    const rows = await prisma.challan.findMany({ where });

    logger.info(
        `Statement5: Fetched ${rows.length} rows from Challan for sector: ${sector ?? "ALL"}`
    );

    return rows.map((row) => ({
        majorHead: row.majorHead ?? "Unknown",
        subMajor: row.subMajorHead ?? "-",
        minorHead: row.minorHead ?? "-",
        amount: parseFloat(row.amount ?? "0"),
        sector: row.challanType ?? null,
        source: "challan",
    }));
};

// Get rows from ChallanFromBill table
// Only allowed amount types — same as Form 5A
const getStatement5ChallanFromBillRows = async (sector) => {
    const where = {
        isActive: true,
        amountType: {
            in: STATEMENT5_ALLOWED_AMOUNT_TYPES, // ← filter applied
        },
    };

    if (sector && sector !== "CONSOLIDATED") {
        where.sector = sector;
    }

    const rows = await prisma.challanFromBill.findMany({ where });

    logger.info(
        `Statement5: Fetched ${rows.length} rows from ChallanFromBill for sector: ${sector ?? "ALL"}`
    );

    return rows.map((row) => ({
        majorHead: row.majorHead ?? "Unknown",
        subMajor: row.subMajor ?? "-",
        minorHead: row.minorHead ?? "-",
        amount: row.amount ? parseFloat(row.amount.toString()) : 0,
        sector: row.sector ?? null,
        source: "challanFromBill",
    }));
};

// Main Statement 5 function
export const getStatement5Data = async (sector) => {
    try {
        logger.info(`Fetching Statement 5 data for sector: ${sector ?? "ALL"}`);

        // Fetch both tables in parallel — same as Form 5A
        const [challanRows, challanFromBillRows] = await Promise.all([
            getStatement5ChallanRows(sector),
            getStatement5ChallanFromBillRows(sector),
        ]);

        const allRows = [...challanRows, ...challanFromBillRows];

        // Group by majorHead-minorHead as the "heads" key
        const grouped = allRows.reduce((acc, row) => {
            const key = [row.majorHead, row.minorHead]
                .filter((p) => p && p !== "-")
                .join("-");

            if (!acc[key]) acc[key] = [];
            acc[key].push(row);
            return acc;
        }, {});

        const result = Object.entries(grouped).map(([heads, rows]) => {
            const total = rows.reduce((sum, row) => sum + row.amount, 0);
            return {
                heads,
                rows,
                total,
                hasMultiple: rows.length > 1,
            };
        });

        logger.info(`Statement 5 total groups returned: ${result.length}`);

        return result;
    } catch (error) {
        logger.error(`Error fetching Statement 5 data: ${error.message}`);
        throw error;
    }
};


// ─────────────────────────────────────────────────────────────
// STATEMENT 4 - Loans and Advances by the Council
// Only 2 fixed rows: Car Loan & House/Building Loan
// Data source: Expenditure table
// ─────────────────────────────────────────────────────────────

export const getStatement4Data = async (sector) => {
    try {
        logger.info(`Fetching Statement 4 data for sector: ${sector ?? "ALL"}`);

        const sectorFilter =
            sector && sector !== "CONSOLIDATED" ? { sector } : {};

        const where = { isActive: true, ...sectorFilter };

        const expenditures = await prisma.expenditure.findMany({
            where,
            select: {
                loanType: true,
                loansAdvances: true,
                carLoanRecovery: true,
                houseLoanRecovery: true,
            },
        });

        // ── Row 1: CAR LOAN ──────────────────────────────────
        // loansAdvances where loanType === "CAR_LOAN"
        const carAmountPaid = expenditures
            .filter((e) => e.loanType === "CAR_LOAN")
            .reduce((sum, e) => sum + Number(e.loansAdvances ?? 0), 0);

        // carLoanRecovery — independent field, just sum all isActive rows
        const carAmountRecovered = expenditures.reduce(
            (sum, e) => sum + Number(e.carLoanRecovery ?? 0),
            0
        );

        const carOpeningBalance = 0;
        const carClosingBalance = carOpeningBalance + carAmountPaid - carAmountRecovered;
        const carNetChange = carClosingBalance;

        // ── Row 2: HOUSE / BUILDING LOAN ─────────────────────
        // loansAdvances where loanType === "BUILDIN_LOAN"
        const houseAmountPaid = expenditures
            .filter((e) => e.loanType === "BUILDING_LOAN")
            .reduce((sum, e) => sum + Number(e.loansAdvances ?? 0), 0);

        // houseLoanRecovery — independent field, just sum all isActive rows
        const houseAmountRecovered = expenditures.reduce(
            (sum, e) => sum + Number(e.houseLoanRecovery ?? 0),
            0
        );

        const houseOpeningBalance = 0;
        const houseClosingBalance = houseOpeningBalance + houseAmountPaid - houseAmountRecovered;
        const houseNetChange = houseClosingBalance;

        // ── Totals ───────────────────────────────────────────
        const totalAmountPaid = carAmountPaid + houseAmountPaid;
        const totalAmountRecovered = carAmountRecovered + houseAmountRecovered;
        const totalClosingBalance = carClosingBalance + houseClosingBalance;
        const totalNetChange = carNetChange + houseNetChange;

        return {
            rows: [
                {
                    id: 1,
                    loans: "Car Loan",
                    april: carOpeningBalance.toFixed(2),
                    amountPaid: carAmountPaid.toFixed(2),
                    amountRecover: carAmountRecovered.toFixed(2),
                    march: carClosingBalance.toFixed(2),
                    increaseDecrease: carNetChange.toFixed(2),
                },
                {
                    id: 2,
                    loans: "House / Building Loan",
                    april: houseOpeningBalance.toFixed(2),
                    amountPaid: houseAmountPaid.toFixed(2),
                    amountRecover: houseAmountRecovered.toFixed(2),
                    march: houseClosingBalance.toFixed(2),
                    increaseDecrease: houseNetChange.toFixed(2),
                },
            ],
            total: {
                amountPaid: totalAmountPaid.toFixed(2),
                amountRecover: totalAmountRecovered.toFixed(2),
                march: totalClosingBalance.toFixed(2),
                increaseDecrease: totalNetChange.toFixed(2),
            },
        };
    } catch (error) {
        logger.error(`Error fetching Statement 4 data: ${error.message}`);
        throw error;
    }
};


// ─────────────────────────────────────────────────────────────
// STATEMENT 2 - Capital Outlay - Progressive Capital Outlay
// Data source: Expenditure table
// Groups by full head of account chain
// ─────────────────────────────────────────────────────────────

export const getStatement2Data = async (sector, financialYear) => {
    try {
        logger.info(
            `Fetching Statement 2 data for sector: ${sector ?? "ALL"}, FY: ${financialYear ?? "ALL"}`
        );

        const sectorFilter =
            sector && sector !== "CONSOLIDATED" ? { sector } : {};

        const fyFilter = financialYear ? { financialYear } : {};

        const expenditures = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                expenditureType: "CAPITAL", // ← only capital expenditures
                ...sectorFilter,
                ...fyFilter,
            },
            select: {
                majorHead: true,
                subMajorHead: true,
                minorHead: true,
                subHead: true,
                subSubHead: true,
                detailHead: true,
                subDetailHead: true,
                works: true,
                grantsInAid: true,
                contingencies: true,
                payOfficers: true,
                payEstablishment: true,
                allowanceHonorary: true,
            },
        });

        const groupMap = new Map();

        for (const item of expenditures) {
            const headKey = [
                item.majorHead,
                item.subMajorHead,
                item.minorHead,
                item.subHead,
                item.subSubHead,
                item.detailHead,
                item.subDetailHead,
            ]
                .filter((p) => p && p.trim() !== "" && p !== "-")
                .join("-");

            const currentYearAmount =
                Number(item.works ?? 0) +
                Number(item.grantsInAid ?? 0) +
                Number(item.contingencies ?? 0) +
                Number(item.payOfficers ?? 0) +
                Number(item.payEstablishment ?? 0) +
                Number(item.allowanceHonorary ?? 0);

            if (!groupMap.has(headKey)) {
                groupMap.set(headKey, {
                    majorHead: headKey,
                    previousYear: 0,
                    currentYear: 0,
                });
            }

            groupMap.get(headKey).currentYear += currentYearAmount;
        }

        const rows = Array.from(groupMap.values()).map((item, index) => ({
            id: index + 1,
            majorHead: item.majorHead,
            previousYear: item.previousYear.toFixed(2),
            currentYear: item.currentYear.toFixed(2),
            total: (item.previousYear + item.currentYear).toFixed(2),
        }));

        const grandTotalPreviousYear = 0;
        const grandTotalCurrentYear = rows.reduce(
            (sum, r) => sum + Number(r.currentYear),
            0
        );
        const grandTotal = grandTotalPreviousYear + grandTotalCurrentYear;

        logger.info(`Statement 2 total rows returned: ${rows.length}`);

        return {
            rows,
            total: {
                previousYear: grandTotalPreviousYear.toFixed(2),
                currentYear: grandTotalCurrentYear.toFixed(2),
                total: grandTotal.toFixed(2),
            },
        };
    } catch (error) {
        logger.error(`Error fetching Statement 2 data: ${error.message}`);
        throw error;
    }
};


// ─────────────────────────────────────────────────────────────
// STATEMENT 3 - PART 1: Debt Position
// ─────────────────────────────────────────────────────────────

export const getStatement3DebtData = async (sector) => {
    try {
        logger.info(`Fetching Statement 3 Debt data for sector: ${sector ?? "ALL"}`);

        const sectorFilter =
            sector && sector !== "CONSOLIDATED" ? { sector } : {};

        const expenditures = await prisma.expenditure.findMany({
            where: {
                isActive: true,
                ...sectorFilter,
            },
            select: {
                securityDepositsDeduction: true,
                earnestMoneyDeduction: true,
            },
        });

        // 3. Receipts = securityDepositsDeduction + earnestMoneyDeduction
        const receipts = expenditures.reduce(
            (sum, e) =>
                sum +
                Number(e.securityDepositsDeduction ?? 0) +
                Number(e.earnestMoneyDeduction ?? 0),
            0
        );

        // 4. Repayments = same as receipts
        const repayments = receipts;

        // 2. Opening balance (1st April) = 0
        const openingBalance = 0;

        // 5. Balance on 31st March = opening + receipts - repayments
        const closingBalance = openingBalance + receipts - repayments;

        // 6. Net Increase/Decrease = opening - closing
        const netChange = openingBalance - closingBalance;

        return {
            rows: [
                {
                    id: 1,
                    natureDept: "8443-00-120 (Civil Deposit)",
                    april: openingBalance.toFixed(2),
                    receipts: receipts.toFixed(2),
                    repayments: repayments.toFixed(2),
                    march: closingBalance.toFixed(2),
                    increaseDecrease: netChange.toFixed(2),
                },
            ],
            total: {
                april: openingBalance.toFixed(2),
                receipts: receipts.toFixed(2),
                repayments: repayments.toFixed(2),
                march: closingBalance.toFixed(2),
                increaseDecrease: netChange.toFixed(2),
            },
        };
    } catch (error) {
        logger.error(`Error fetching Statement 3 Debt data: ${error.message}`);
        throw error;
    }
};

// ─────────────────────────────────────────────────────────────
// STATEMENT 3 - PART 2: Ways and Means (Month-wise)
// ─────────────────────────────────────────────────────────────

// Financial year months: April(4) to March(3)
const FY_MONTHS = [
    { month: "April", num: 4 },
    { month: "May", num: 5 },
    { month: "June", num: 6 },
    { month: "July", num: 7 },
    { month: "August", num: 8 },
    { month: "September", num: 9 },
    { month: "October", num: 10 },
    { month: "November", num: 11 },
    { month: "December", num: 12 },
    { month: "January", num: 1 },
    { month: "February", num: 2 },
    { month: "March", num: 3 },
];

// Amount types allowed from challanFromBill
const CHALLAN_FROM_BILL_AMOUNT_TYPES = [
    "Professional Tax",
    "Forest Royalty",
    "MC Forest Royalty",
    "Monopoly",
    "House Rent",
    "Earnest Money",
    "Car Loan",
    "Building Loan",
    "Security Deposits",
    "Advance Payment",
    "Other Deductions",
];

export const getStatement3WaysAndMeansData = async (sector, financialYear) => {
    try {
        logger.info(
            `Fetching Statement 3 Ways & Means for sector: ${sector ?? "ALL"}, FY: ${financialYear ?? "ALL"}`
        );

        const isChallanConsolidated = !sector || sector === "CONSOLIDATED";

        const challanSectorFilter = isChallanConsolidated ? {} : { challanType: sector };
        const challanFromBillSectorFilter = isChallanConsolidated ? {} : { sector };
        const challanTwoSectorFilter = isChallanConsolidated ? {} : { sector };
        const expenditureSectorFilter = isChallanConsolidated ? {} : { sector };

        const [
            openingBalances,
            challans,
            challanFromBills,
            challanTwos,
            expenditures,
        ] = await Promise.all([
            prisma.openingBalance.findMany({
                where: { isActive: true, ...(isChallanConsolidated ? {} : { sector }) },
                select: { month: true, amount: true },
            }),
            prisma.challan.findMany({
                where: { isActive: true, ...challanSectorFilter },
                select: { challanDate: true, amount: true },
            }),
            prisma.challanFromBill.findMany({
                where: {
                    isActive: true,
                    amountType: { in: CHALLAN_FROM_BILL_AMOUNT_TYPES },
                    ...challanFromBillSectorFilter,
                },
                select: { createdAt: true, amount: true },
            }),
            prisma.challanTwo.findMany({
                where: { isActive: true, ...challanTwoSectorFilter },
                select: { createdAt: true, amount: true },
            }),
            prisma.expenditure.findMany({
                where: { isActive: true, ...expenditureSectorFilter },
                select: { voucherDate: true, grossAmount: true },
            }),
        ]);

        // ── Helper: get month number from date ───────────────
        const getMonthNum = (date) =>
            date ? new Date(date).getMonth() + 1 : null;

        // ── Helper: sum amounts by month ─────────────────────
        const sumByMonth = (records, dateField, amountField) => {
            const map = new Map();
            for (const r of records) {
                const m = getMonthNum(r[dateField]);
                if (!m) continue;
                map.set(m, (map.get(m) ?? 0) + Number(r[amountField] ?? 0));
            }
            return map;
        };

        // Opening balance from DB only for April (first month of FY)
        const openingByMonth = new Map(
            openingBalances.map((o) => [o.month, Number(o.amount ?? 0)])
        );

        const challanByMonth = sumByMonth(challans, "challanDate", "amount");
        const challanFromBillByMonth = sumByMonth(challanFromBills, "createdAt", "amount");
        const challanTwoByMonth = sumByMonth(challanTwos, "createdAt", "amount");
        const expenditureByMonth = sumByMonth(expenditures, "voucherDate", "grossAmount");

        // ── Build rows with carry-forward logic ──────────────
        let carryForward = 0; // tracks closing balance → next month's opening

        const rows = FY_MONTHS.map(({ month, num }, index) => {
            // First month (April) → use DB opening balance
            // Every subsequent month → use previous month's closing balance
            const openingBalance =
                index === 0
                    ? (openingByMonth.get(num) ?? 0)
                    : carryForward;

            const receipt =
                (challanByMonth.get(num) ?? 0) +
                (challanFromBillByMonth.get(num) ?? 0) +
                (challanTwoByMonth.get(num) ?? 0);

            const disbursement = expenditureByMonth.get(num) ?? 0;

            const closingBalance = openingBalance + receipt - disbursement;

            // Carry closing balance forward to next month
            carryForward = closingBalance;

            return {
                monthNum: num,
                month,
                openingBalance: openingBalance.toFixed(2),
                receipt: receipt.toFixed(2),
                disbursement: disbursement.toFixed(2),
                closingBalance: closingBalance.toFixed(2),
            };
        });

        logger.info(`Statement 3 Ways & Means rows built: ${rows.length}`);

        return rows;
    } catch (error) {
        logger.error(`Error fetching Statement 3 Ways & Means data: ${error.message}`);
        throw error;
    }
};

