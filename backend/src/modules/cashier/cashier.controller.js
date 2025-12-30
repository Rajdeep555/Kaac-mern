import { createCashierSchema } from "./cashier.schema.js";
import { createCashier, getCashiers } from "./cashier.service.js";

export const create = async (req, res) => {
    try {
        const data = createCashierSchema.parse(req.body); // auto-throws

        const cashier = await createCashier(data);

        return res.status(201).json({
            success: true,
            message: "Cashier created successfully",
            cashier
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.errors?.[0]?.message || error.message
        });
    }
};


export const getData = async (req, res) => {
    try {
        const cashiers = await getCashiers();

        return res.status(200).json({
            success: true,
            cashiers
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};