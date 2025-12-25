import { z } from "zod";

export const createCashierSchema = z.object({
    name: z.string().min(2, "Cashier name must be at least 2 characters"),
    email: z.email().optional(),
    cashierCode: z.string().min(2, "Cashier code must be at least 2 characters").toUpperCase(),
    phone: z.int().min(10).max(10).optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    divisionId: z.int().optional(),
    ddoId: z.int().optional(),
    isActive: z.boolean(),
})