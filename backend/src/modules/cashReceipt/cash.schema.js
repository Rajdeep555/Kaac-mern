import { z } from "zod";

export const createCashReceiptSchema = z.object({
    counterfoilNo: z.string().optional(),

    date: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        }),

    receivedFrom: z.string().optional(),

    letterNo: z.string().optional(),

    letterDate: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
            message: "Invalid letter date",
        }),

    rupeesInCash: z
        .string()
        .optional()
        .refine((val) => !val || /^\d+$/.test(val), {
            message: "Rupees in cash must be numeric",
        }),

    byChequeBank: z.string().optional(),
});
