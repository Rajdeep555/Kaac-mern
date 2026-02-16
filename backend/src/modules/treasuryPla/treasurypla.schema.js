import { z } from "zod";

export const createTreasuryPlaSchema = z.object({
    amount: z
        .union([
            z.string(),
            z.number()
        ])
        .refine((val) => !isNaN(Number(val)), {
            message: "Amount must be a valid number",
        }),
    month: z
        .number()
        .int()
        .min(1, "Month must be between 1 and 12")
        .max(12, "Month must be between 1 and 12"),

    year: z
        .number()
        .int()
        .min(2000, "Invalid year"),
    sector: z.enum(["COUNCIL", "STATE"]).optional(),

    isActive: z.boolean().optional(),
})


export const updateTreasuryPlaSchema = z.object({
    amount: z
        .union([z.string(), z.number()])
        .optional()
        .refine((val) => val === undefined || !isNaN(Number(val)), {
            message: "Amount must be valid",
        }),

    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2000).optional(),
    sector: z.enum(["COUNCIL", "STATE"]).optional(),
    isActive: z.boolean().optional(),
});
