import { z } from "zod";

export const createReceiptHeadSchema = z.object({
    majorHead: z.string().min(1),

    subMajor: z.string().nullable().optional(),
    minorHead: z.string().nullable().optional(),
    subHead: z.string().nullable().optional(),
    subSubHead: z.string().nullable().optional(),
    detailHead: z.string().nullable().optional(),

    majorHeadCode: z.string().min(1),

    subMajorCode: z.string().nullable().optional(),
    subMajorParentCode: z.string().nullable().optional(),

    minorHeadCode: z.string().nullable().optional(),
    minorHeadParentCode: z.string().nullable().optional(),

    subHeadCode: z.string().nullable().optional(),
    subHeadParentCode: z.string().nullable().optional(),

    subSubHeadCode: z.string().nullable().optional(),
    subSubHeadParentCode: z.string().nullable().optional(),

    detailHeadCode: z.string().nullable().optional(),
    detailHeadParentCode: z.string().nullable().optional(),

    isActive: z.boolean().optional(),
});

export const updateReceiptHeadSchema =
    createReceiptHeadSchema.partial();