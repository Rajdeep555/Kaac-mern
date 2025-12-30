import { createDDOSchema } from "./ddo.schema.js"
import { createDDO } from "./ddo.service.js";

export const create = async (req, res) => {
    try {
        const result = createDDOSchema.safeParse(req.body);

        const ddo = await createDDO(result.data);

        return res.status(201).json({
            success: true,
            message: "DDO created successfully",
            ddo: {
                id: ddo.id,
                ddoName: ddo.ddoName,
                ddoCode: ddo.ddoCode,
                ddoEmail: ddo.ddoEmail,
                ddoPhone: ddo.ddoPhone,
                ddoPassword: ddo.ddoPassword,
                isActive: ddo.isActive,
                divisionId: ddo.divisionId,
            }
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
}