import prisma from "../../config/database.js";

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
