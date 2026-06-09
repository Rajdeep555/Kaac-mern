import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

export const createExpenditure = async (data) => {
    return prisma.$transaction(async (tx) => {

        const { sector } = data;

        if (!sector || !["COUNCIL", "STATE"].includes(sector)) {
            throw new Error("Invalid sector");
        }

        const now = new Date();
        const fySuffix = now.getMonth() >= 3
            ? String(now.getFullYear() + 1).slice(-2)
            : String(now.getFullYear()).slice(-2);

        const prefixMap = { COUNCIL: "KAAC", STATE: "STATE" };
        const voucherPrefix = `${prefixMap[sector]}-${fySuffix}-`;

        const lastVoucher = await tx.expenditure.findFirst({
            where: {
                sector,
                voucherNo: { startsWith: voucherPrefix },
            },
            orderBy: { id: "desc" },
            select: { voucherNo: true },
        });

        let nextSerial = 1;
        if (lastVoucher?.voucherNo) {
            const parts = lastVoucher.voucherNo.split("-");
            nextSerial = parseInt(parts[parts.length - 1]) + 1;
        }

        const generatedVoucherNo = `${voucherPrefix}${String(nextSerial).padStart(4, "0")}`;

        // ✅ Strip any voucherNo that came from the request body
        const { voucherNo: _ignored, ...cleanData } = data;

        const expenditure = await tx.expenditure.create({
            data: {
                ...cleanData,
                voucherNo: generatedVoucherNo,  // ✅ only the generated one reaches DB
                voucherDate: data.voucherDate ? new Date(data.voucherDate) : null,
                requisitionDate: data.requisitionDate ? new Date(data.requisitionDate) : null,
                chequeIssueDate: data.chequeIssueDate ? new Date(data.chequeIssueDate) : null,
                treasuryDate: data.treasuryDate ? new Date(data.treasuryDate) : null,
            },
        });

        const deductionFields = {
            earnestMoneyDeduction: "Earnest Money",
            ptax: "Professional Tax",
            carLoanRecovery: "Car Loan",
            houseLoanRecovery: "Building Loan",
            houseRent: "House Rent",
            securityDepositsDeduction: "Security Deposits",
            monopoly: "Monopoly",
            forestRoyalty: "Forest Royalty",
            mcForestRoyalty: "MC Forest Royalty",
            advanceRecovery: "Advance Payment",
            otherDeductions: "Other Deductions",
            cgst: "CGST",
            sgst: "SGST",
            igst: "IGST",
            itax: "ITAX",
            mdrrf: "MDRRF",
            dmft: "DMFT",
            labourCess: "Labour Cess",
            itForestRoyalty: "IT Forest Royalty",
            vat: "VAT",
            cpfCouncil: "CPF Council Share",
            cpfContribution: "CPF Contribution",
            cpfRecovery: "CPF Advance",
        };

        const headCodeMapping = {
            "Professional Tax": { major: "001", sub_major: "01", minor: "02" },
            "Building Loan": { major: "661", sub_major: "01", minor: "02" },
            "Car Loan": { major: "661", sub_major: "02", minor: "01" },
            "Earnest Money": { major: "8440", sub_major: "00", minor: "120" },
            "House Rent": { major: "007", sub_major: "01", minor: "00" },
            "Security Deposits": { major: "8440", sub_major: "00", minor: "120" },
            "Forest Royalty": { major: "013", sub_major: "01", minor: "01" },
            "MC Forest Royalty": { major: "013", sub_major: "01", minor: "01" },
            "Monopoly": { major: "013", sub_major: "01", minor: "01" },
            "Advance Payment": { major: "8443", sub_major: "00", minor: "120" },
            "Other Deductions": { major: "8443", sub_major: "00", minor: "120" },
            "CGST": { major: "8443", sub_major: "00", minor: "120" },
            "SGST": { major: "8443", sub_major: "00", minor: "120" },
            "IGST": { major: "8443", sub_major: "00", minor: "120" },
            "ITAX": { major: "8443", sub_major: "01", minor: "120" },
            "MDRRF": { major: "8443", sub_major: "00", minor: "120" },
            "DMFT": { major: "8443", sub_major: "00", minor: "120" },
            "Labour Cess": { major: "8443", sub_major: "00", minor: "120" },
            "IT Forest Royalty": { major: "8443", sub_major: "00", minor: "120" },
            "VAT": { major: "8443", sub_major: "00", minor: "120" },
            "CPF Council Share": { major: "662", sub_major: "01", minor: "01" },
            "CPF Contribution": { major: "662", sub_major: "01", minor: "02" },
            "CPF Advance": { major: "662", sub_major: "01", minor: "05" },
        };

        const challanData = [];
        for (const [dbField, amountType] of Object.entries(deductionFields)) {
            const amount = data[dbField];
            if (amount && amount > 0) {
                const headCodes = headCodeMapping[amountType] || { major: "", sub_major: "", minor: "" };
                challanData.push({
                    challanNo: expenditure.voucherNo,
                    idFromExpenditure: expenditure.id,
                    sector: expenditure.sector,
                    departmentId: expenditure.departmentId,
                    ddoId: expenditure.ddoId,
                    majorHead: headCodes.major,
                    subMajor: headCodes.sub_major,
                    minorHead: headCodes.minor,
                    treasuryCode: expenditure.treasuryName || "",
                    voucharDate: expenditure.voucherDate || new Date(),
                    amount: Number(amount),
                    amountType,
                    chequeNo: expenditure.chequeNo ?? null,
                    chequeDate: expenditure.chequeIssueDate || new Date(),
                    salaryNonSalary: expenditure.salaryType,
                    expenditureType: expenditure.expenditureType,
                    treasuryChallanNo: expenditure.treasuryVoucherNo ?? null,
                    treasuryChallanDate: expenditure.treasuryDate || new Date(),
                });
            }
        }

        if (challanData.length > 0) {
            await tx.challanFromBill.createMany({ data: challanData });
        }

        return expenditure;
    });
};

export const getExpenditureById = async (id) => {
    const expenditure = await prisma.expenditure.findUnique({
        where: { id: Number(id) },
        include: {
            department: true,
            ddo: true,
        },
    });

    if (!expenditure) return null;

    const grant = expenditure.grantNo
        ? await prisma.grants.findUnique({
            where: { id: Number(expenditure.grantNo) },
            select: { code: true, name: true },
        })
        : null;



    return {
        ...expenditure,
        grant,
    };
};

export const updateExpenditure = async (id, data) => {
    return prisma.$transaction(async (tx) => {
        // ✅ Strip voucherNo so it is NEVER overwritten on update
        const { voucherNo: _ignored, ...cleanData } = data;

        const updatedExpenditure = await tx.expenditure.update({
            where: { id: Number(id) },
            data: {
                ...cleanData,  // ✅ cleanData, not data
                voucherDate: cleanData.voucherDate ? new Date(cleanData.voucherDate) : null,
                requisitionDate: cleanData.requisitionDate ? new Date(cleanData.requisitionDate) : null,
                chequeIssueDate: cleanData.chequeIssueDate ? new Date(cleanData.chequeIssueDate) : null,
                treasuryDate: cleanData.treasuryDate ? new Date(cleanData.treasuryDate) : null,
            },
        });

        if (cleanData.treasuryVoucherNo !== undefined || cleanData.treasuryDate !== undefined) {
            await tx.challanFromBill.updateMany({
                where: { idFromExpenditure: Number(id) },
                data: {
                    treasuryChallanNo: cleanData.treasuryVoucherNo || null,
                    treasuryChallanDate: cleanData.treasuryDate ? new Date(cleanData.treasuryDate) : null,
                },
            });
        }

        return updatedExpenditure;
    });
};
export const getVoucherNo = async (type) => {
    if (!type || !["COUNCIL", "STATE"].includes(type)) {
        logger.error("Invalid type");
        throw new Error("Invalid type");
    }

    const now = new Date();
    const fySuffix = now.getMonth() >= 3
        ? String(now.getFullYear() + 1).slice(-2)
        : String(now.getFullYear()).slice(-2);

    const prefixMap = {
        COUNCIL: "KAAC",
        STATE: "STATE",
    };

    const prefix = prefixMap[type];
    const voucherPrefix = `${prefix}-${fySuffix}-`;

    const lastVoucherNo = await prisma.expenditure.findFirst({
        where: {
            sector: type,
            voucherNo: { startsWith: voucherPrefix },
        },
        orderBy: { id: "desc" },
        select: { voucherNo: true },
    });

    let nextSerial = 1;
    if (lastVoucherNo?.voucherNo) {
        const part = lastVoucherNo.voucherNo.split("-");
        nextSerial = parseInt(part[part.length - 1]) + 1;
    }

    return `${voucherPrefix}${String(nextSerial).padStart(4, "0")}`;
};

export const getExpenditureForCashier = async ({
    cashierId,
    sector,
    hasTreasuryVoucher,
}) => {
    return prisma.expenditure.findMany({
        where: {
            cashierId,
            ...(sector && { sector }),
            ...(hasTreasuryVoucher === true && { treasuryVoucherNo: { not: null } }),
            ...(hasTreasuryVoucher === false && { treasuryVoucherNo: null }),
        },
        include: {
            ddo: true,
        },
        orderBy: { createdAt: "desc" },
    });
};

export const getExpendituresForAdmin = async ({ sector, month, year }) => {
    const whereClause = {};
    if (sector) whereClause.sector = sector;
    if (month && year) {
        whereClause.chequeIssueDate = {
            gte: new Date(year, month - 1, 1),
            lt: new Date(year, month, 1),
        };
    }

    return prisma.expenditure.findMany({
        where: whereClause,
        orderBy: { chequeIssueDate: "asc" },
    });
};

export const deleteExpenditure = async (id) => {
    return prisma.$transaction(async (tx) => {
        // Delete related challans first (foreign key constraint)
        await tx.challanFromBill.deleteMany({
            where: { idFromExpenditure: Number(id) },
        });

        // Then delete the expenditure
        return tx.expenditure.delete({
            where: { id: Number(id) },
        });
    });
};

export const getChequeDetails = async ({ sector, financialYear, month }) => {
    const whereClause = {
        chequeNo: { not: null },
    };

    if (sector) whereClause.sector = sector;

    // Financial year = "2025-2026" → April 2025 to March 2026
    if (financialYear) {
        const [startYear, endYear] = financialYear.split("-").map(Number);
        const fyStart = new Date(startYear, 3, 1);   // April 1 of start year
        const fyEnd = new Date(endYear, 3, 1);   // April 1 of end year (exclusive)
        whereClause.chequeIssueDate = { gte: fyStart, lt: fyEnd };
    }

    // If a specific month is also selected, narrow further
    if (financialYear && month) {
        const [startYear, endYear] = financialYear.split("-").map(Number);
        const monthNum = Number(month);
        // Months 1-3 belong to endYear, months 4-12 belong to startYear
        const year = monthNum >= 1 && monthNum <= 3 ? endYear : startYear;
        whereClause.chequeIssueDate = {
            gte: new Date(year, monthNum - 1, 1),
            lt: new Date(year, monthNum, 1),
        };
    }

    const rows = await prisma.expenditure.findMany({
        where: whereClause,
        select: {
            chequeNo: true,
            chequeBookNo: true,
            chequeIssueDate: true,
            grossAmount: true,
            sector: true,
        },
        orderBy: { chequeIssueDate: "asc" },
    });

    // Group by chequeNo, sum grossAmount
    const grouped = {};
    for (const row of rows) {
        const key = row.chequeNo;
        if (!grouped[key]) {
            grouped[key] = {
                chequeNo: row.chequeNo,
                chequeBookNo: row.chequeBookNo || "-",
                chequeIssueDate: row.chequeIssueDate,
                sector: row.sector,
                totalAmount: 0,
                count: 0,
            };
        }
        grouped[key].totalAmount += Number(row.grossAmount);
        grouped[key].count += 1;
    }

    return Object.values(grouped);
};