import { createDivisionSchema } from "./division.schema.js"
import { createDivison } from "./division.service.js";

export const create = async (req, res) => {
    try {
        const data = createDivisionSchema.safeParse(req.body);

        const divison = await createDivison(data);

        return res.status(201).json({
            success: true,
            message: "Divison created sucessfully",
            divison: {
                id: divison.id,
                divisionName: divison.divisionName,
                divisionCode: divison.divisionCode
            }
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
}