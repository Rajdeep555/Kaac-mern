import { z } from "zod";

export const createCashierSchema = z.object({
    name: z.string().min(2, "Cashier name must be at least 2 characters"),
    email: z.email().optional(),
    cashierCode: z.string().min(2, "Cashier code must be at least 2 characters").toUpperCase(),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    divisionId: z.coerce.number().int(),
    ddoId: z.coerce.number().int(),
    isActive: z.boolean().optional(),
})

export const updateCashierSchema = z.object({
    name: z.string().min(2, "Cashier name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email").optional(),
    cashierCode: z
        .string()
        .min(2, "Cashier code must be at least 2 characters")
        .toUpperCase()
        .optional(),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    divisionId: z.coerce.number().int().optional(),
    ddoId: z.coerce.number().int().optional(),
    isActive: z.boolean().optional(),
});

export const deactivateCashierSchema = z.object({}).optional(); 
