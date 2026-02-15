import logger from "../../utils/logger.js";
import { getAllChallanHeads } from "./challanHead.service.js"

export const getAll = async (req, res) => {
    try {
        const heads = await getAllChallanHeads();

        return res.json({
            success: true,
            data: heads
        })

    } catch (error) {
        logger.error("Failed to fetch heads", error);
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}