import { z } from "zod";

export const createDDOSchema = z.object({
    ddoName: z
        .string()
        .min(
            2,
            "DDO Name must be at least 2 characters",
        ),
    ddoEmail: z
        .string()
        .email("Invalid email")
        .optional()
        .or(z.literal(""))
        .nullable(),

    ddoCode: z
        .string()
        .min(
            2,
            "DDO Code must be at least 2 characters",
        )
        .transform((val) => val.toUpperCase()),
    ddoPhone: z
        .string()
        .min(10, "Phone must be 10 digits")
        .max(10, "Phone must be 10 digits")
        .optional()
        .or(z.literal(""))
        .nullable(),

    ddoPassword: z.string().optional(),

    isActive: z.boolean().optional(),

    divisionId: z.coerce.number(),

    division: z.string().optional(),
});

export const updateDDOSchema = z.object({
    ddoName: z.string().min(1, "Name is required"),
    ddoEmail: z.string().email().optional().or(z.literal("")).or(z.undefined()), // ✅ handles empty/missing
    ddoPhone: z.string().min(10).max(10).optional().or(z.literal("")),
    divisionId: z.coerce.number().optional(),  // ✅ coerce handles string "123" from form selects
});