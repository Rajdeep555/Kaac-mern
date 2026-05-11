import { z } from "zod";

export const createDepartmentSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(1, "Code is required"),
    sector: z.string().optional(),
    isActive: z.boolean().optional().default(true), 
});

export const updateDepartmentSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    sector: z.string().optional(),
    isActive: z.boolean().optional(),
});