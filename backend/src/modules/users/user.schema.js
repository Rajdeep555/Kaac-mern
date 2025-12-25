import { z } from "zod";
import { ROLES } from "../../constrants/roles.js";

export const createUserSchema = z.object({
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(6),
    role: z.enum([ROLES.ADMIN, ROLES.CASHIER]).default(ROLES.CASHIER)
})