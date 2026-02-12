import { createObjectHeadSchema } from "./objectHead.schema.js";
import { createObjectHead, getObjectHead } from "./objectHead.service.js";

export const getAll = async (req, res) => {
    try {
        const objectHead = await getObjectHead();

        return res.status(200).json({
            success: true,
            objectHead
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


export const create = async (req, res) => {
    try {
        const vaildateData = createObjectHeadSchema.parse(req.body);

        const objectHead = await createObjectHead(vaildateData);

        return res.status(201).json({
            success: true,
            message: "Object Head Created Successfully",
            objectHead
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
}