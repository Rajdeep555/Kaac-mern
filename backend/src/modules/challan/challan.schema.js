import { z } from "zod";

export const createChallanSchema = z.object({
    counterfoilNo: z.string().optional(),

    counterfoilDate: z.string().optional(),

    challanNo: z.string().optional(),

    challanDate: z.string().optional(),

    challanType: z.enum(["COUNCIL", "CSS"]),

    departmentId: z.coerce.number(),
    divisionId: z.coerce.number(),
    ddoId: z.coerce.number(),

    majorHead: z.string().min(1),
    subMajorHead: z.string().min(1),
    minorHead: z.string().min(1),
    subHead: z.string().optional(),

    subSubHead: z.string().optional(),
    detailHead: z.string().min(1),

    treasuryCode: z.string().optional(),
    treasuryChallanNo: z.string().optional(),
    treasuryChallanDate: z.string().optional(),

    amount: z
        .string()
        .regex(/^\d+$/, "Amount must be numeric without commas"),

    remarks: z.string().min(1),
});
