import prisma from "../../config/database.js"

export const getAllChallanHeads = async () => {
    return prisma.challanHeads.findMany({
        where: { isActive: true },
    })
}


export const createReceiptHeadService = async (
    data,
) => {
    return await prisma.challanHeads.create({
        data,
    });
};

export const getReceiptHeadByIdService =
    async (id) => {
        return await prisma.challanHeads.findUnique({
            where: {
                id: Number(id),
            },
        });
    };

export const updateReceiptHeadService =
    async (id, data) => {
        return await prisma.challanHeads.update({
            where: {
                id: Number(id),
            },

            data,
        });
    };

export const deleteReceiptHeadService =
    async (id) => {
        return await prisma.challanHeads.update({
            where: {
                id: Number(id),
            },

            data: {
                isActive: false,
            },
        });
    };