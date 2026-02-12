import prisma from "../../config/database.js";

export const getGrants = async () => {
    return prisma.grants.findMany();
}