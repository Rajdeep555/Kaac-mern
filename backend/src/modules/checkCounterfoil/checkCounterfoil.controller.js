import { generateCounterfoilNo } from "./checkCounterfoil.service.js";

export const getNextCounterfoilNo = async (req, res) => {
    try {
        const counterfoilNo = await generateCounterfoilNo();
        return res.status(200).json({
            success: true,
            counterfoilNo,
        });
    } catch (error) {
        console.error("Failed to generate counterfoil number:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to generate counterfoil number",
        });
    }
};