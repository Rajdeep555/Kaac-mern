import { createDDOSchema } from "./ddo.schema.js"
import { createDDO, getAllDDOs } from "./ddo.service.js";

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

export const getAll = async (req, res) => {
    try {
        const ddos = await getAllDDOs();
        // console.log("ddos:", ddos); 

        return res.status(200).json({
            success: true,
            ddos,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch DDOs",
        });
    }
}