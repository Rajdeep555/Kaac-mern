import logger from "../../utils/logger.js";
import { generateChallanNo } from "./generate.service.js";

export const fetchNextChallanNo = async (req, res) => {
    try {
        const { type } = req.query;

        const challanNo = await generateChallanNo(type);

        res.json({ challanNo })

    } catch (error) {
        logger.error("Failed to fetch next challan no", error);
        console.error(error);
        res.status(400).json({ error: error.message });
    }
}