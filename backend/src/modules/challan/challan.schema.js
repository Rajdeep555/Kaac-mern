import { z } from "zod";

export const createChallanSchema = z.object({
    counterfoilNo: z.string().optional(),

    counterfoilDate: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
            message: "Invalid counterfoil date",
        }),

    challanNo: z.string().optional(),

    challanDate: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
            message: "Invalid challan date",
        }),

    challanType: z.enum(["COUNCIL", "css"]),

    departmentId: z.number({
        required_error: "Department is required",
    }),

    divisionId: z.number({
        required_error: "Division is required",
    }),

    ddoId: z.number({
        required_error: "DDO is required",
    }),

    majorHead: z.string().min(1, "Major Head is required"),
    subMajorHead: z.string().min(1, "Sub Major Head is required"),
    subSubMajorHead: z.string().min(1, "Sub Sub Major Head is required"),
    minorHead: z.string().min(1, "Minor Head is required"),
    detailHead: z.string().min(1, "Detail Head is required"),

    treasuryCode: z.string().optional(),
    treasuryChallanNo: z.string().optional(),

    treasuryChallanDate: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
            message: "Invalid treasury challan date",
        }),

    amount: z
        .string()
        .min(1, "Amount is required")
        .regex(/^\d+$/, "Amount must be numeric without commas"),

    remarks: z.string().min(1, "Remarks is required"),
});
