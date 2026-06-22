import { z } from "zod";

export const createGrantSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(1, "Code is required"),
    sector: z.enum(["STATE", "COUNCIL"]).optional(),
    isActive: z.boolean().optional().default(true),
});

export const updateGrantSchema = createGrantSchema.partial();