import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

export const createExpenditure = async (data) => {
    return prisma.$transaction(async (tx) => {
        // 1) Create expenditure first
        const expenditure = await tx.expenditure.create({
            data: {
                ...data,
                voucherDate: data.voucherDate ? new Date(data.voucherDate) : null,
                requisitionDate: data.requisitionDate ? new Date(data.requisitionDate) : null,
                chequeIssueDate: data.chequeIssueDate ? new Date(data.chequeIssueDate) : null,
                treasuryDate: data.treasuryDate ? new Date(data.treasuryDate) : null,
            },
        });

        // 2) Deduction fields mapping: DB field => amountType display
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

        // 3) Head code mapping: amountType => {major, sub_major, minor}
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

        // 4) ✅ BATCH CREATE challanFromBill rows (fixes transaction timeout)
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

        // Single batch insert - 100x faster!
        if (challanData.length > 0) {
            await tx.challanFromBill.createMany({
                data: challanData,
            });
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
        // 1) Update expenditure
        const updatedExpenditure = await tx.expenditure.update({
            where: { id: Number(id) },
            data: {
                ...data,
                voucherDate: data.voucherDate ? new Date(data.voucherDate) : null,
                requisitionDate: data.requisitionDate ? new Date(data.requisitionDate) : null,
                chequeIssueDate: data.chequeIssueDate ? new Date(data.chequeIssueDate) : null,
                treasuryDate: data.treasuryDate ? new Date(data.treasuryDate) : null,
            },
        });

        // 2) Update treasury fields in ALL related challanFromBill rows
        if (data.treasuryVoucherNo !== undefined || data.treasuryDate !== undefined) {
            await tx.challanFromBill.updateMany({
                where: { idFromExpenditure: Number(id) },
                data: {
                    treasuryChallanNo: data.treasuryVoucherNo || null,
                    treasuryChallanDate: data.treasuryDate ? new Date(data.treasuryDate) : null,
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
