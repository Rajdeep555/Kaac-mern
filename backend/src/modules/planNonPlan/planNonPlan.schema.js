import { z } from "zod";

export const createPlanNonPlanSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    sector: z.enum(["COUNCIL", "STATE"]).optional(),
    isActive: z.boolean().optional().default(true), 
});

export const updatePlanNonPlanSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    sector: z.enum(["COUNCIL", "STATE"]).optional(),
});