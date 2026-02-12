import { z } from "zod";

export const createObjectHeadSchema = z.object({
    name: z.string().min(2),
    sector: z.string().optional(),
    isActive: z.boolean()
});