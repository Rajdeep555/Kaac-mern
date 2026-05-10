import { getPersonnelStats } from "./personnelStats.service.js"

export const fetchPersonnelStats = async (req, res) => {
    try {
        const stats = await getPersonnelStats();
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch personnal stats",
            error: error.message
        })
    }
}