import { startsWith } from "zod";
import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

export const createExpenditure = async (data) => {


    return prisma.expenditure.create({
        data: {
            ...data,

            voucherDate: data.voucherDate
                ? new Date(data.voucherDate)
                : null,

            requisitionDate: data.requisitionDate
                ? new Date(data.requisitionDate)
                : null,

            chequeIssueDate: data.chequeIssueDate
                ? new Date(data.chequeIssueDate)
                : null,

            treasuryDate: data.treasuryDate
                ? new Date(data.treasuryDate)
                : null,
        },
    });
};

export const getExpenditureById = async (id) => {
    return prisma.expenditure.findUnique({
        where: { id: Number(id) },
        include: {
            department: true,
            ddo: true,
        },
    });
};

export const updateExpenditure = async (id, data) => {
    return prisma.expenditure.update({
        where: { id: Number(id) },
        data: {
            ...data,
            voucherDate: data.voucherDate ? new Date(data.voucherDate) : null,
            requisitionDate: data.requisitionDate ? new Date(data.requisitionDate) : null,
            chequeIssueDate: data.chequeIssueDate ? new Date(data.chequeIssueDate) : null,
            treasuryDate: data.treasuryDate ? new Date(data.treasuryDate) : null,
        },
    });
};



export const getVoucherNo = async (type) => {
    if (!type || !["COUNCIL", "STATE"].includes(type)) {
        logger.error("Invalid type")
        throw new error("Invalid type")
    }

    // financial year 
    const now = new Date();
    const fySuffix = now.getMonth() >= 3 ? String(now.getFullYear() + 1).slice(-2) : String(now.getFullYear()).slice(-2);

    // prefix mapping 
    const prefixMap = {
        COUNCIL: "KAAC",
        STATE: "STATE",
    };

    const prefix = prefixMap[type];
    const voucherPrefix = `${prefix}-${fySuffix}-`;

    // get last voucher no 
    const lastVoucherNo = await prisma.expenditure.findFirst({
        where: {
            sector: type,
            voucherNo: {
                startsWith: voucherPrefix
            },

        },
        orderBy: { id: "desc" },
        select: { voucherNo: true },
    })

    let nextSerial = 1;

    if (lastVoucherNo?.voucherNo) {
        const part = lastVoucherNo.voucherNo.split("-");
        nextSerial = parseInt(part[part.length - 1]) + 1;
    }

    return `${voucherPrefix}${String(nextSerial).padStart(4, "0")}-${nextSerial}`

}


export const getExpenditureForCashier = async ({
    cashierId,
    sector,
    hasTreasuryVoucher,
}) => {
    return prisma.expenditure.findMany({
        where: {
            cashierId,
            ...(sector && { sector }),
            ...(hasTreasuryVoucher === true && {
                treasuryVoucherNo: { not: null },
            }),
            ...(hasTreasuryVoucher === false && {
                treasuryVoucherNo: null,
            }),
        },
        orderBy: {
            createdAt: "desc",
        },
    })
}

export const getExpendituresForAdmin = async ({
    sector,
    month,
    year,
    paymentMode,
}) => {
    return prisma.expenditure.findMany({
        where: {
            ...(sector && { sector }),
            ...(paymentMode === "CHEQUE" && { chequeNo: { not: null } }),
            ...(paymentMode === "CASH" && { chequeNo: null }),
            ...(month && year && {
                chequeIssueDate: {
                    gte: new Date(year, month - 1, 1),
                    lt: new Date(year, month, 1),
                },
            }),
        },
        orderBy: {
            chequeIssueDate: "asc",
        },
    });
};
