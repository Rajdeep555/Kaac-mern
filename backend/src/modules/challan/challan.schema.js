import { z } from "zod";

export const createChallanSchema = z.object({
    cashierId: z.coerce.number().int(),
    counterfoilNo: z.string().optional(),
    counterfoilDate: z.date().optional(),
    challanNo: z.string(),
    challanDate: z.date(),
    challanType: z.string(),
    departmentId: z.coerce.number().int(),
    divisionId: z.coerce.number().int(),
    ddoId: z.coerce.number().int(),
    majorHead: z.coerce.number().int(),
    subMajorHead: z.coerce.number().int(),
    subSubMajorHead: z.coerce.number().int(),
    minorHead: z.coerce.number().int(),
    detailHead: z.coerce.number().int(),
    treasuryCode: z.coerce.number().int().optional(),
    treasuryChallanNo: z.string().optional(),
    treasuryChallanDate: z.date().optional(),
    amount: z.number().min(0, "Amount must be greater than 0").optional(),
    remarks: z.string().optional(),
    isActive: z.boolean().optional()
});