import { getStatement1Data } from "./statement1.service.js";
import { getStatement2Data, getStatement3DebtData, getStatement3WaysAndMeansData, getStatement4Data, getStatement5Data, getStatement6Data, getStatement7Data } from "./statements.service.js";

export const getStatement7 = async (req, res) => {
    try {
        const { sector } = req.query;
        const data = await getStatement7Data({ sector });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Statement7 Error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message ?? "Failed to fetch Statement 7 data",
        });
    }
};


export const getStatement6 = async (req, res) => {
    try {
        const { sector } = req.query;
        const data = await getStatement6Data({ sector });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Statement6 Error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message ?? "Failed to fetch Statement 6 data",
        });
    }
};


export const getStatement5 = async (req, res) => {
    try {
        const { sector } = req.query;
        const data = await getStatement5Data(sector);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Statement5 Error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message ?? "Failed to fetch Statement 5 data",
        });
    }
};


export const getStatement4 = async (req, res) => {
    try {
        const { sector } = req.query;
        const data = await getStatement4Data(sector);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Statement4 Error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message ?? "Failed to fetch Statement 4 data",
        });
    }
};



export const getStatement2 = async (req, res) => {
    try {
        const { sector, financialYear } = req.query;
        const data = await getStatement2Data(sector, financialYear);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Statement2 Error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message ?? "Failed to fetch Statement 2 data",
        });
    }
};



// Statement 3

// Part 1 — Debt Position
export const getStatement3Debt = async (req, res) => {
    try {
        const { sector } = req.query;
        const data = await getStatement3DebtData(sector);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Statement3 Debt Error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message ?? "Failed to fetch Statement 3 debt data",
        });
    }
};

// Part 2 — Ways and Means
export const getStatement3WaysAndMeans = async (req, res) => {
    try {
        const { sector, financialYear } = req.query;
        const data = await getStatement3WaysAndMeansData(sector, financialYear);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Statement3 Ways & Means Error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message ?? "Failed to fetch Statement 3 ways and means data",
        });
    }
};



export const getStatement1 = async (req, res) => {
    try {
        const { sector, financialYear } = req.query;
        const data = await getStatement1Data(sector, financialYear);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error("Statement1 Error:", error);
        return res.status(500).json({
            success: false,
            message: error?.message ?? "Failed to fetch Statement 1 data",
        });
    }
};