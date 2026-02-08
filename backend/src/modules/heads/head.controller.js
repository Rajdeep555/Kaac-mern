import logger from "../../utils/logger.js"
import { createHeadSchema } from "./head.schema.js";
import { createHead, getAllHeads, getHeadsHierarchy } from "./head.service.js";

export const create = async (req, res) => {
    try {
        logger.info("Creating head == ", req.body);
        const result = createHeadSchema.safeParse(req.body);
        logger.info("After head", result);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten(),
            });
        }

        const head = await createHead(result.data);

        return res.status(201).json({
            success: true,
            message: "Head created sucessfully",
            head: {
                id: head.id,
            }
        })

    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
}

export const getAll = async (req, res) => {
    try {
        const { sector } = req.query;
        const heads = await getAllHeads({ sector });

        console.log("heads", heads);
        return res.status(200).json({
            success: true,
            heads,
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch Head",
        });
    }
}

export const getHierarchy = async (req, res) => {
    try {
        const {
            sector,
            level,
            majorHeadCode,
            subMajorCode,
            minorHeadCode,
            subHeadCode,
            subSubHeadCode,
            detailHeadCode,
        } = req.query;

        if (!sector || !level) {
            return res.status(400).json({
                success: false,
                message: "sector and level are required",
            });
        }

        logger.info("Fetching heads hierarchy", {
            sector,
            level,
            majorHeadCode,
            subMajorCode,
            minorHeadCode,
            subHeadCode,
            subSubHeadCode,
            detailHeadCode,
        });

        const data = await getHeadsHierarchy({
            sector,
            level,
            majorHeadCode,
            subMajorCode,
            minorHeadCode,
            subHeadCode,
            subSubHeadCode,
            detailHeadCode,
        });

        return res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        logger.error("Failed to fetch heads hierarchy", error);

        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};