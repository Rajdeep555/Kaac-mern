import prisma from "../../config/database.js"
export const createOpeningBalance = async (payload) => {
    const { cashierId, amount, year, month, sector } = payload;

    //check exising
    const existing = await prisma.openingBalance.findFirst({
        where: {
            cashierId,
            month,
            year,
            sector
        }
    })

    if (existing) {
        throw new Error("Opening Balance already exists");
    }

    //create 
    const openingBalance = await prisma.openingBalance.create({
        data: {
            cashierId,
            amount: Number(amount),
            month,
            year,
            sector
        }
    })

    return openingBalance;
}

export const getAllOpeningBalance = async () => {
    return prisma.openingBalance.findMany({
        where: {
            isActive: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};


export const updateOpeningBalance = async (id, user, payload) => {
    //   role check
    if (user.role !== 'CASHIER') {
        throw new Error('Access Denied');
    }

    // find record 
    const existing = await prisma.openingBalance.findUnique({
        where: {
            id: Number(id)
        }
    })

    if (!existing) {
        throw new Error('Opening Balance not found');
    }

    if (existing.cashierId !== user.id) {
        throw new Error("You are not allowed to edit this record");
    }

    // update 
    const updated = await prisma.openingBalance.update({
        where: {
            id: Number(id)
        },
        data: {
            ...payload,
            amount: payload.amount ? Number(payload.amount) : undefined
        }
    })

    return updated;
};