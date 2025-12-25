import { z } from "zod";

export const createDepartmentSchema = z.object({
    name: z.string().min(2),
    code: z.string(),
    sector: z.string().optional(),
    isActive: z.boolean()
})