import { z } from "zod";

const headFields = {
    sector: z.enum(["COUNCIL", "STATE"]),
    grantName: z.string().min(2),
    grantNo: z.string().min(1).optional(),

    majorHead: z.string().min(2),
    majorHeadCode: z.string().min(1),

    subMajor: z.string().optional(),
    subMajorCode: z.string().optional(),

    minorHead: z.string().min(2),
    minorHeadCode: z.string().min(1),

    subHead: z.string().min(2),
    subHeadCode: z.string().min(1),

    subSubHead: z.string().optional(),
    subSubHeadCode: z.string().optional(),

    detailHead: z.string().optional(),
    detailHeadCode: z.string().optional(),

    subDetailHead: z.string().optional(),
    subDetailHeadCode: z.string().optional(),

    isActive: z.boolean().optional().default(true),
};

export const createHeadSchema = z.object(headFields);

export const updateHeadSchema = z.object({
    ...headFields,
    sector: z.enum(["COUNCIL", "STATE"]).optional(),
});