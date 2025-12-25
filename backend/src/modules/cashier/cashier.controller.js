import { createCashierSchema } from "./cashier.schema.js"
import { createCashier } from "./cashier.service.js";

export const create = async (req, res) => {
    try {
        const data = await createCashierSchema.safeParse(req.body);

        const cashier = await createCashier(data);
    } catch (error) {
        
    }
}