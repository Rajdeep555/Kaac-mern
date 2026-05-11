import prisma from "../../config/database.js";
import logger from "../../utils/logger.js";

const headSelect = {
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
    subDetailHeadCode: true,
    isActive: true,
};

export const createHead = async (data) => {
    logger.info("Creating head with data:", data);
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
            isActive: data.isActive ?? true,
        },
        select: headSelect,
    });
};

// ✅ FIX: removed isActive: true filter so all records show in admin table
export const getAllHeads = async ({ sector }) => {
    return prisma.heads.findMany({
        where: { ...(sector ? { sector } : {}) },
        select: headSelect,
        orderBy: { majorHead: "asc" }
    });
};

// ✅ NEW
export const updateHead = async (id, data) => {
    return prisma.heads.update({
        where: { id: Number(id) },
        data: {
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
        },
        select: headSelect,
    });
};

// ✅ NEW
export const toggleHeadStatus = async (id) => {
    const existing = await prisma.heads.findUnique({ where: { id: Number(id) } });
    if (!existing) throw new Error("Head not found");

    return prisma.heads.update({
        where: { id: Number(id) },
        data: { isActive: !existing.isActive },
        select: headSelect,
    });
};

export const getHeadsHierarchy = async ({
    sector, level, majorHeadCode, subMajorCode,
    minorHeadCode, subHeadCode, subSubHeadCode, detailHeadCode,
}) => {
    const baseWhere = { isActive: true, sector };
    const isValid = (v) => v && v !== "0";

    switch (level) {
        case "MAJOR":
            return prisma.heads.findMany({
                where: baseWhere,
                distinct: ["majorHeadCode"],
                select: { majorHead: true, majorHeadCode: true },
                orderBy: { majorHeadCode: "asc" },
            });
        case "SUB_MAJOR":
            return prisma.heads.findMany({
                where: { ...baseWhere, majorHeadCode },
                distinct: ["subMajorCode"],
                select: { subMajor: true, subMajorCode: true },
                orderBy: { subMajorCode: "asc" },
            });
        case "MINOR":
            return prisma.heads.findMany({
                where: { ...baseWhere, majorHeadCode, subMajorCode },
                distinct: ["minorHeadCode"],
                select: { minorHead: true, minorHeadCode: true },
                orderBy: { minorHeadCode: "asc" },
            });
        case "SUB_HEAD":
            return prisma.heads.findMany({
                where: { ...baseWhere, majorHeadCode, subMajorCode, minorHeadCode },
                distinct: ["subHeadCode"],
                select: { subHead: true, subHeadCode: true },
                orderBy: { subHeadCode: "asc" },
            });
        case "SUB_SUB_HEAD": {
            const w = { ...baseWhere, majorHeadCode, subMajorCode, minorHeadCode };
            if (isValid(subHeadCode)) w.subHeadCode = subHeadCode;
            return prisma.heads.findMany({
                where: w,
                distinct: ["subSubHeadCode"],
                select: { subSubHead: true, subSubHeadCode: true },
                orderBy: { subSubHeadCode: "asc" },
            });
        }
        case "DETAIL": {
            const w = { ...baseWhere, majorHeadCode, subMajorCode, minorHeadCode };
            if (isValid(subHeadCode)) w.subHeadCode = subHeadCode;
            if (isValid(subSubHeadCode)) w.subSubHeadCode = subSubHeadCode;
            return prisma.heads.findMany({
                where: w,
                distinct: ["detailHeadCode"],
                select: { detailHead: true, detailHeadCode: true },
                orderBy: { detailHeadCode: "asc" },
            });
        }
        case "SUB_DETAIL": {
            const w = { ...baseWhere, majorHeadCode, subMajorCode, minorHeadCode };
            if (isValid(subHeadCode)) w.subHeadCode = subHeadCode;
            if (isValid(subSubHeadCode)) w.subSubHeadCode = subSubHeadCode;
            if (isValid(detailHeadCode)) w.detailHeadCode = detailHeadCode;
            return prisma.heads.findMany({
                where: w,
                distinct: ["subDetailHeadCode"],
                select: { subDetailHead: true, subDetailHeadCode: true },
                orderBy: { subDetailHeadCode: "asc" },
            });
        }
        default:
            throw new Error("Invalid hierarchy level");
    }
};