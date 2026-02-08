import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

export const createHead = async (data) => {
    logger.info("Creating head with data:", data);

    //check if already exists
    // const existingHead = await prisma.heads.findUnique({
    //     where: {
    //         grantNo: data.grantNo,
    //         sector: data.sector,
    //         majorHeadCode: data.majorHeadCode,

    //     }
    // })

    return prisma.heads.create({
        data: {
            sector: data.sector,
            grantName: data.grantName,
            grantNo: data.grantNo,
            majorHead: data.majorHead,
            majorHeadCode: data.majorHeadCode,
            subMajor: data.subMajor,
            subMajorCode: data.subMajorCode,
            minorHead: data.minorHead,
            minorHeadCode: data.minorHeadCode,
            subHead: data.subHead,
            subHeadCode: data.subHeadCode,
            subSubHead: data.subSubHead,
            subSubHeadCode: data.subSubHeadCode,
            detailHead: data.detailHead,
            detailHeadCode: data.detailHeadCode,
            subDetailHead: data.subDetailHead,
            subDetailHeadCode: data.subDetailHeadCode,
            isActive: data.isActive
        }
    });
};

export const getAllHeads = async ({ sector }) => {
    return prisma.heads.findMany({
        where: { isActive: true, ...(sector ? { sector: sector } : {}) },
        select: {
            id: true,
            sector: true,
            grantName: true,
            grantNo: true,
            majorHead: true,
            majorHeadCode: true,
            subMajor: true,
            subMajorCode: true,
            minorHead: true,
            minorHeadCode: true,
            subHead: true,
            subHeadCode: true,
            subSubHead: true,
            subSubHeadCode: true,
            detailHead: true,
            detailHeadCode: true,
            subDetailHead: true,
            subDetailHeadCode: true
        },
        orderBy: {
            majorHead: "asc"
        }
    });
};


export const getHeadsHierarchy = async ({
    sector,
    level,
    majorHeadCode,
    subMajorCode,
    minorHeadCode,
    subHeadCode,
    subSubHeadCode,
    detailHeadCode,
}) => {
    const baseWhere = {
        isActive: true,
        sector,
    };

    const isValid = (v) => v && v !== "0";

    switch (level) {
        /* ================= MAJOR ================= */
        case "MAJOR":
            return prisma.heads.findMany({
                where: baseWhere,
                distinct: ["majorHeadCode"],
                select: {
                    majorHead: true,
                    majorHeadCode: true,
                },
                orderBy: { majorHeadCode: "asc" },
            });

        /* ================= SUB MAJOR ================= */
        case "SUB_MAJOR":
            return prisma.heads.findMany({
                where: {
                    ...baseWhere,
                    majorHeadCode,
                },
                distinct: ["subMajorCode"],
                select: {
                    subMajor: true,
                    subMajorCode: true,
                },
                orderBy: { subMajorCode: "asc" },
            });

        /* ================= MINOR ================= */
        case "MINOR":
            return prisma.heads.findMany({
                where: {
                    ...baseWhere,
                    majorHeadCode,
                    subMajorCode,
                },
                distinct: ["minorHeadCode"],
                select: {
                    minorHead: true,
                    minorHeadCode: true,
                },
                orderBy: { minorHeadCode: "asc" },
            });

        /* ================= SUB HEAD ================= */
        case "SUB_HEAD":
            return prisma.heads.findMany({
                where: {
                    ...baseWhere,
                    majorHeadCode,
                    subMajorCode,
                    minorHeadCode,
                },
                distinct: ["subHeadCode"],
                select: {
                    subHead: true,
                    subHeadCode: true,
                },
                orderBy: { subHeadCode: "asc" },
            });

        /* ================= SUB SUB HEAD ================= */
        case "SUB_SUB_HEAD":
            const subSubWhere = {
                ...baseWhere,
                majorHeadCode,
                subMajorCode,
                minorHeadCode,
            };

            // Only add subHeadCode if it's valid (not "0")
            if (isValid(subHeadCode)) {
                subSubWhere.subHeadCode = subHeadCode;
            }

            return prisma.heads.findMany({
                where: subSubWhere,
                distinct: ["subSubHeadCode"],
                select: {
                    subSubHead: true,
                    subSubHeadCode: true,
                },
                orderBy: { subSubHeadCode: "asc" },
            });

        /* ================= DETAIL ================= */
        case "DETAIL":
            const detailWhere = {
                ...baseWhere,
                majorHeadCode,
                subMajorCode,
                minorHeadCode,
            };

            // Add subHeadCode if valid
            if (isValid(subHeadCode)) {
                detailWhere.subHeadCode = subHeadCode;
            }

            // Add subSubHeadCode if valid
            if (isValid(subSubHeadCode)) {
                detailWhere.subSubHeadCode = subSubHeadCode;
            }

            return prisma.heads.findMany({
                where: detailWhere,
                distinct: ["detailHeadCode"],
                select: {
                    detailHead: true,
                    detailHeadCode: true,
                },
                orderBy: { detailHeadCode: "asc" },
            });

        /* ================= SUB DETAIL ================= */
        case "SUB_DETAIL":
            const subDetailWhere = {
                ...baseWhere,
                majorHeadCode,
                subMajorCode,
                minorHeadCode,
            };

            if (isValid(subHeadCode)) {
                subDetailWhere.subHeadCode = subHeadCode;
            }
            if (isValid(subSubHeadCode)) {
                subDetailWhere.subSubHeadCode = subSubHeadCode;
            }
            if (isValid(detailHeadCode)) {
                subDetailWhere.detailHeadCode = detailHeadCode;
            }

            return prisma.heads.findMany({
                where: subDetailWhere,
                distinct: ["subDetailHeadCode"],
                select: {
                    subDetailHead: true,
                    subDetailHeadCode: true,
                },
                orderBy: { subDetailHeadCode: "asc" },
            });

        default:
            throw new Error("Invalid hierarchy level");
    }
};