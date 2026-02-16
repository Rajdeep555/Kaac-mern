import prisma from "../../config/database.js";

export const createTreasuryPla = async (data) => {
    const { cashierId, amount, year, month, sector } = data;

    //check
    const existing = await prisma.treasuryPla.findFirst({
        where: {
            cashierId,
            month,
            year,
            sector
        }
    })

    if (existing) {
        throw new Error("Treasury PLA already exists");
    }

    // create 
    const treasuryPla = await prisma.treasuryPla.create({
        data: {
            cashierId,
            amount: Number(amount),
            month,
            year,
            sector
        }
    })

    return treasuryPla;

};


export const getAllTreasuryPla = async (user) => {
    const whereCondition =
        user.role === "ADMIN"
            ? { isActive: true }
            : {
                isActive: true,
                cashierId: user.id,
            };

    return prisma.treasuryPla.findMany({
        where: whereCondition,
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const updateTreasuryPla = async (id, user, payload) => {
    if (user.role !== "CASHIER") {
        throw new Error("Only cashier can update Treasury PLA");
    }

    const existing = await prisma.treasuryPla.findUnique({
        where: { id: Number(id) },
    });

    if (!existing) {
        throw new Error("Treasury PLA not found");
    }

    if (existing.cashierId !== user.id) {
        throw new Error("You are not allowed to edit this record");
    }

    const updated = await prisma.treasuryPla.update({
        where: { id: Number(id) },
        data: {
            ...payload,
            amount: payload.amount ? Number(payload.amount) : undefined,
        },
    });

    return updated;
};
