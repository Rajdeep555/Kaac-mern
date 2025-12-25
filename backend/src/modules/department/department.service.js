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