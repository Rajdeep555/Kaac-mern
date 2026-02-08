import { z } from "zod";

export const createHeadSchema = z.object({
    sector: z.enum(["COUNCIL", "STATE"]),
    grantName: z.string().min(2),
    grantNo: z.string().min(1),

    majorHead: z.string().min(2),
    majorHeadCode: z.string().min(1),

    subMajor: z.string().min(1),
    subMajorCode: z.string().min(1),

    minorHead: z.string().min(2),
    minorHeadCode: z.string().min(1),

    subHead: z.string().min(2),
    subHeadCode: z.string().min(1),

    subSubHead: z.string().min(2),
    subSubHeadCode: z.string().min(1),

    detailHead: z.string().min(2),
    detailHeadCode: z.string().min(1),

    subDetailHead: z.string().min(2),
    subDetailHeadCode: z.string().min(1),

    isActive: z.boolean()
});