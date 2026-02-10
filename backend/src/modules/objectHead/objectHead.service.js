import prisma from "../../config/database.js"

export const getObjectHead = async () => {
    return prisma.objectHead.findMany({
        orderBy: { id: "asc" }
    });
}

export const createObjectHead = async (data) => {
    const existing = await prisma.objectHead.findFirst({
        where: {
            name: {
                equals: data.name,
                mode: "insensitive"
            }
        }
    });

    if (existing) {
        throw new Error("Object Head already exists");
    }

    return prisma.objectHead.create({
        data: {
            name: data.name,
            sector: data.sector,
            isActive: data.isActive ?? true,
        }
    })
}

