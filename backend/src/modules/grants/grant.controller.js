import { getGrants } from "./grant.service.js";

export const getAll = async (req, res) => {
    try {
        const grants = await getGrants();

        return res.status(200).json({
            success: true,
            grants,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch grants",
            error: error.message,
        });
    }
};
