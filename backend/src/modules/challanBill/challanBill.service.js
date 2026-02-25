import prisma from "../../config/database.js";

/* ================= GET ALL CHALLANS BY CASHIER ================= */
export const getChallansByCashierService = async (cashierId) => {
    const challans = await prisma.challanFromBill.findMany({
        where: {
            expenditure: {
                cashierId: cashierId,
            },
            isActive: true,
        },
        include: {
            expenditure: {
                select: {
                    id: true,
                    voucherNo: true,
                    voucherDate: true,
                    sector: true,
                    cashierId: true,
                    department: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    ddo: {
                        select: {
                            id: true,
                            ddoName: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return challans;
};

/* ================= GET SINGLE CHALLAN BY ID ================= */
export const getChallanByIdService = async (id, cashierId) => {
    const challan = await prisma.challanFromBill.findFirst({
        where: {
            id: Number(id),
            isActive: true,
            expenditure: {
                cashierId: cashierId, // ✅ ensures cashier can only access their own
            },
        },
        include: {
            expenditure: {
                select: {
                    id: true,
                    voucherNo: true,
                    voucherDate: true,
                    sector: true,
                    cashierId: true,
                    department: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                        },
                    },
                    ddo: {
                        select: {
                            id: true,
                            ddoName: true,
                        },
                    },
                },
            },
        },
    });

    if (!challan) {
        throw new Error("Challan not found or access denied");
    }

    return challan;
};

/* ================= GET CHALLANS BY EXPENDITURE ID ================= */
export const getChallansByExpenditureService = async (expenditureId, cashierId) => {
    // ✅ First verify the expenditure belongs to this cashier
    const expenditure = await prisma.expenditure.findFirst({
        where: {
            id: Number(expenditureId),
            cashierId: cashierId,
            isActive: true,
        },
    });

    if (!expenditure) {
        throw new Error("Expenditure not found or access denied");
    }

    const challans = await prisma.challanFromBill.findMany({
        where: {
            idFromExpenditure: Number(expenditureId),
            isActive: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return challans;
};

/* ================= CREATE CHALLAN ================= */
export const createChallanService = async (cashierId, payload) => {
    const { idFromExpenditure, ...rest } = payload;

    // ✅ Verify the expenditure belongs to this cashier before creating
    const expenditure = await prisma.expenditure.findFirst({
        where: {
            id: Number(idFromExpenditure),
            cashierId: cashierId,
            isActive: true,
        },
    });

    if (!expenditure) {
        throw new Error("Expenditure not found or access denied");
    }

    const challan = await prisma.challanFromBill.create({
        data: {
            ...rest,
            idFromExpenditure: Number(idFromExpenditure),
        },
    });

    return challan;
};

/* ================= UPDATE CHALLAN ================= */
export const updateChallanService = async (id, cashierId, payload) => {
    // ✅ Verify ownership through expenditure
    const existing = await prisma.challanFromBill.findFirst({
        where: {
            id: Number(id),
            isActive: true,
            expenditure: {
                cashierId: cashierId,
            },
        },
    });

    if (!existing) {
        throw new Error("Challan not found or access denied");
    }

    const updated = await prisma.challanFromBill.update({
        where: { id: Number(id) },
        data: {
            ...payload,
            updatedAt: new Date(),
        },
    });

    return updated;
};

/* ================= DELETE (SOFT) CHALLAN ================= */
export const deleteChallanService = async (id, cashierId) => {
    // ✅ Verify ownership through expenditure
    const existing = await prisma.challanFromBill.findFirst({
        where: {
            id: Number(id),
            isActive: true,
            expenditure: {
                cashierId: cashierId,
            },
        },
    });

    if (!existing) {
        throw new Error("Challan not found or access denied");
    }

    const deleted = await prisma.challanFromBill.update({
        where: { id: Number(id) },
        data: { isActive: false },
    });

    return deleted;
};
