import { z } from "zod";

export const createExpenditureTypeSchema = z.object({
    name: z.string().min(2, "Expenditure type name must be at least 2 characters"),
    sector: z.string().optional(),
    isActive: z.boolean()
})