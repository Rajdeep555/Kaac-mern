import { z } from "zod";

export const stateChallanSchema = z.object({
    challanNo: z.string().min(1, "Challan No is required"),
    challanDate: z.string().min(1, "Challan Date is required"),
    stateNo: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    subject: z.string().optional(),
    sector: z.enum(["COUNCIL", "STATE"], {
        errorMap: () => ({ message: "Sector must be COUNCIL or STATE" }),
    }),
    ddo: z.string().optional(),
    divisionCode: z.string().optional(),
    majorHead: z.string().min(1, "Major Head is required"),
    subMajorHead: z.string().optional(),
    minorHead: z.string().optional(),
    subHead: z.string().optional(),
    subSubHead: z.string().optional(),
    detailHead: z.string().optional(),
    subDetailHead: z.string().optional(),
    purpose: z.string().optional(),
    remarks: z.string().optional(),
    totalAmount: z
        .string()
        .min(1, "Amount is required")
        .refine((val) => !isNaN(parseFloat(val.replace(/,/g, ""))), {
            message: "Amount must be a valid number",
        }),
    amountInWords: z.string().optional(),
    focNo: z.string().optional(),
    sanctionLetterNo: z.string().optional(),
    sanctionLetterDate: z.string().optional(),
    treasuryCode: z.string().optional(),
    treasuryChallanNo: z.string().optional(),
});

// ── FIX: id is number because controller passes parseInt() ──
export const updateStateChallanSchema = stateChallanSchema.partial().extend({
    id: z.number().int().positive("ID must be a positive integer"),
});