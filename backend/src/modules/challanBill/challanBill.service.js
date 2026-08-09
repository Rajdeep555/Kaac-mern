import prisma from "../../config/database.js";

// A cashier is restricted to their own entries UNLESS the relevant granular
// permission flag is true. ADMIN (or any non-CASHIER role) is never
// restricted, regardless of these flags.
const isRestricted = (role, hasPermission) =>
    role === "CASHIER" && !hasPermission;

/* ================= GET ALL CHALLANS BY CASHIER ================= */
export const getChallansByCashierService = async (cashierId, role, canViewAllEntries) => {
    const challans = await prisma.challanFromBill.findMany({
        where: {
            isActive: true,
            // 🔥 Restrict to own entries unless canViewAllEntries is granted
            ...(isRestricted(role, canViewAllEntries) && {
                expenditure: { cashierId },
            }),
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
export const getChallanByIdService = async (id, cashierId, role, canViewAllEntries) => {
    const challan = await prisma.challanFromBill.findFirst({
        where: {
            id: Number(id),
            isActive: true,
            ...(isRestricted(role, canViewAllEntries) && {
                expenditure: { cashierId }, // ✅ ensures cashier can only access their own, unless granted
            }),
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
export const getChallansByExpenditureService = async (expenditureId, cashierId, role, canViewAllEntries) => {
    // ✅ Verify the expenditure exists — and belongs to this cashier, unless canViewAllEntries is granted
    const expenditure = await prisma.expenditure.findFirst({
        where: {
            id: Number(expenditureId),
            isActive: true,
            ...(isRestricted(role, canViewAllEntries) && { cashierId }),
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
export const createChallanService = async (cashierId, payload, role, canEditAllEntries) => {
    const { idFromExpenditure, ...rest } = payload;

    // ✅ Verify the expenditure belongs to this cashier before creating — unless canEditAllEntries is granted
    const expenditure = await prisma.expenditure.findFirst({
        where: {
            id: Number(idFromExpenditure),
            isActive: true,
            ...(isRestricted(role, canEditAllEntries) && { cashierId }),
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
export const updateChallanService = async (id, cashierId, payload, role, canEditAllEntries) => {
    // ✅ Verify ownership through expenditure — unless canEditAllEntries is granted
    const existing = await prisma.challanFromBill.findFirst({
        where: {
            id: Number(id),
            isActive: true,
            ...(isRestricted(role, canEditAllEntries) && {
                expenditure: { cashierId },
            }),
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
export const deleteChallanService = async (id, cashierId, role, canDeleteAllEntries) => {
    // ✅ Verify ownership through expenditure — unless canDeleteAllEntries is granted
    const existing = await prisma.challanFromBill.findFirst({
        where: {
            id: Number(id),
            isActive: true,
            ...(isRestricted(role, canDeleteAllEntries) && {
                expenditure: { cashierId },
            }),
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