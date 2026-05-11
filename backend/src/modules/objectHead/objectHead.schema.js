import { z } from "zod";

export const createObjectHeadSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    sector: z.string().optional(),
    isActive: z.boolean().optional().default(true), 
});

export const updateObjectHeadSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    sector: z.string().optional(),
});