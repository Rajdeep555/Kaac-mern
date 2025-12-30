import { z } from "zod";

export const createDDOSchema = z.object({
    ddoName: z.string().min(2, "DDO Name must be al least 2 character"),
    ddoEmail: z.email().optional(),
    ddoCode: z.string().min(2, "DDO Code must be al least 2 character").toUpperCase(),
    ddoPhone: z.string().min(10).max(10).optional(),
    ddoPassword: z.string().optional(),
    isActive: z.boolean().optional(),
    divisionId: z.int().optional(),
    division: z.string().optional()
})