import { z } from "zod";

export const createDivisionSchema = z.object({
    divisionName: z.string().min(2, "Division name must be at least 2 characters"),
    divisionCode: z.string().min(2, "Division code must be at least 2 characters").toUpperCase(),
    sector: z.enum(["COUNCIL", "STATE"]).optional(),
    isActive: z.boolean().optional().default(true),
});

export const updateDivisionSchema = z.object({
    divisionName: z.string().min(2, "Division name must be at least 2 characters"),
    sector: z.enum(["COUNCIL", "STATE"]).optional(),
});