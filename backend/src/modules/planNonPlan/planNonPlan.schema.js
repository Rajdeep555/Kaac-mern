import { z } from "zod";

export const createPlanNonPlanSchema = z.object({
    name: z.string().min(2),
    sector: z.string().optional(),
    isActive: z.boolean()
})