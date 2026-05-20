import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";


export const createChallan = async (data) => {
    try {
        const challan = await prisma.challan.create({
            data: {
                cashierId: data.cashierId,
                counterfoilNo: data.counterfoilNo,
                counterfoilDate: data.counterfoilDate
                    ? new Date(data.counterfoilDate)
                    : null,

                challanNo: data.challanNo,
                challanDate: data.challanDate
                    ? new Date(data.challanDate)
                    : null,

                challanType: data.challanType,

                departmentId: data.departmentId,
                divisionId: data.divisionId,
                ddoId: data.ddoId,

                majorHead: data.majorHead,
                subMajorHead: data.subMajorHead,
                minorHead: data.minorHead,
                subHead: data.subHead,
                subSubHead: data.subSubHead,
                detailHead: data.detailHead,

                treasuryCode: data.treasuryCode,
                treasuryChallanNo: data.treasuryChallanNo,
                treasuryChallanDate: data.treasuryChallanDate
                    ? new Date(data.treasuryChallanDate)
                    : null,

                amount: data.amount,
                remarks: data.remarks,
            },
            include: {
                department: true,
                division: true,
                ddo: true,
                user: true,
            },
        });

        return challan;
    } catch (error) {
        logger.error("Create Challan Error:", error);
        throw error;
    }
};

export const updateChallan = async (id, data, userId, role) => {
    try {
        // First check 
        const existing = await prisma.challan.findFirst({
            where: {
                id: Number(id),
                ...(role === "CASHIER" && { cashierId: userId }),
            },
        });

        if (!existing) {
            throw new Error("Challan not found or access denied");
        }

        const updated = await prisma.challan.update({
            where: { id: Number(id) },
            data: {
                counterfoilNo: data.counterfoilNo,
                counterfoilDate: data.counterfoilDate
                    ? new Date(data.counterfoilDate)
                    : null,
                challanNo: data.challanNo,
                challanDate: data.challanDate
                    ? new Date(data.challanDate)
                    : null,
                challanType: data.challanType,
                departmentId: data.departmentId,
                divisionId: data.divisionId,
                ddoId: data.ddoId,
                majorHead: data.majorHead,
                subMajorHead: data.subMajorHead,
                minorHead: data.minorHead,
                subHead: data.subHead,
                subSubHead: data.subSubHead,
                detailHead: data.detailHead,
                treasuryCode: data.treasuryCode,
                treasuryChallanNo: data.treasuryChallanNo,
                treasuryChallanDate: data.treasuryChallanDate
                    ? new Date(data.treasuryChallanDate)
                    : null,
                amount: data.amount,
                remarks: data.remarks,
            },
        });

        return updated;
    } catch (error) {
        logger.error("Update Challan Error:", error);
        throw error;
    }
};

export const getChallanById = async (id, userId, role) => {
    try {
        const challan = await prisma.challan.findFirst({
            where: {
                id: Number(id),
                isActive: true,

                ...(role === "CASHIER" && { cashierId: userId }),
            },
            include: {
                department: true,
                division: true,
                ddo: true,
                user: true,
            },
        });

        if (!challan) {
            throw new Error("Challan not found or access denied");
        }

        return challan;
    } catch (error) {
        logger.error("Get Challan By ID Error:", error);
        throw error;
    }
};

// export const getAllChallans = async () => {
//     try {
//         const challans = await prisma.challan.findMany({
//             where: {
//                 isActive: true,
//             },
//             include: {
//                 department: true,
//                 division: true,
//                 ddo: true,
//                 user: true,
//             },
//             orderBy: {
//                 createdAt: "desc",
//             },
//         });

//         return challans;
//     } catch (error) {
//         logger.error("Get All Challans Error:", error);
//         throw error;
//     }
// };


export const getAllChallans = async ({
    page = 1,
    limit = 10,
    departmentId,
    challanType,
    userId,
    role,
}) => {
    try {
        const skip = (page - 1) * limit;

        const where = {
            isActive: true,

            ...(departmentId && { departmentId: Number(departmentId) }),
            ...(challanType && { challanType }),

            // 🔥 Restrict Cashier
            ...(role === "CASHIER" && { cashierId: userId }),
        };

        const [challans, total] = await prisma.$transaction([
            prisma.challan.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    department: true,
                    division: true,
                    ddo: true,
                    user: true,
                },
            }),
            prisma.challan.count({ where }),
        ]);

        return {
            data: challans,
            meta: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        logger.error("Get All Challans Error:", error);
        throw error;
    }
};
