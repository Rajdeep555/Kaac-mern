import prisma from "../../config/database.js";

export const getGrants = async () => {
    return prisma.grants.findMany({ orderBy: { createdAt: "desc" } });
};

export const createGrant = async (data) => {
    return prisma.grants.create({ data });
};

export const updateGrant = async (id, data) => {
    return prisma.grants.update({ where: { id }, data });
};

export const toggleGrantStatus = async (id) => {
    const grant = await prisma.grants.findUnique({ where: { id } });
    return prisma.grants.update({
        where: { id },
        data: { isActive: !grant.isActive },
    });
};