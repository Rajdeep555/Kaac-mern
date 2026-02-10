import prisma from "../../config/database.js"

export const createDepartment = async (data) => {
    //check in db 
    const exsitingDepartment = await prisma.department.findUnique({
        where: {
            code: data.code
        }
    })
    if (exsitingDepartment) {
        throw new Error("Department already exists")
    }
    return prisma.department.create({
        data: {
            name: data.name,
            code: data.code,
            sector: data.sector,
            isActive: data.isActive
        }
    })
}

export const getAllDepartment = async ({ type, isAdmin }) => {
    const whereClause = {};

    //ADMIN can access all dept
    if (!isAdmin) {
        whereClause.isActive = true;

        if (type && ["COUNCIL", "STATE"].includes(type)) {
            whereClause.sector = type;
        }
    }

    return prisma.department.findMany({
        where: whereClause,
        orderBy: { id: "asc" }
    });
}

