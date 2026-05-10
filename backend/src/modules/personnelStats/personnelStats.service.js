import prisma from "../../config/database.js";

export const getPersonnelStats = async () => {
    const [cashier, ddo, department, division] = await Promise.all([
        prisma.user.count({ where: { role: "CASHIER", isActive: true } }),
        prisma.dDO.count({ where: { isActive: true } }),
        prisma.department.count({ where: { isActive: true } }),
        prisma.division.count({ where: { isActive: true } }),
    ])

    return { cashier, ddo, department, division };
};