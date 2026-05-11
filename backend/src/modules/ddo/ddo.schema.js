import { z } from "zod";

export const createDDOSchema = z.object({
    ddoName: z.string().min(2, "DDO Name must be at least 2 characters"),
    ddoEmail: z.email().optional(),            // ✅ Zod 4 top-level (or keep z.string().email())
    ddoCode: z.string().min(2, "DDO Code must be at least 2 characters").toUpperCase(),
    ddoPhone: z.string().min(10).max(10).optional(),
    ddoPassword: z.string().optional(),
    isActive: z.boolean().optional(),
    divisionId: z.coerce.number(),
    division: z.string().optional()
});

export const updateDDOSchema = z.object({
    ddoName: z.string().min(1, "Name is required"),
    ddoEmail: z.string().email().optional().or(z.literal("")).or(z.undefined()), // ✅ handles empty/missing
    ddoPhone: z.string().min(10).max(10).optional().or(z.literal("")),
    divisionId: z.coerce.number().optional(),  // ✅ coerce handles string "123" from form selects
});