import { z } from "zod";

export const createExpenditureTypeSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    sector: z.enum(["COUNCIL", "STATE"]).optional(),
    isActive: z.boolean().optional().default(true),
});

export const updateExpenditureTypeSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    sector: z.enum(["COUNCIL", "STATE"]).optional(),
});