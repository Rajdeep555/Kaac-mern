import { getForm4Data, getForm5AData, getForm5BData, getForm5CData, getForm5DData, getForm5EData, getForm6Data, getForm7Data } from "./forms.service.js";
import logger from "../../utils/logger.js";
import { getForm10Data, getForm11Data, getForm7AData, getForm7BData, getForm8Data, getForm9Data } from "./fromsSecond.service.js";
import { getForm12Data } from "./form12.service.js";

// GET /forms/form4?sector=COUNCIL
export const getForm4 = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form4 controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm4Data(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form4 controller error: ${error.message}`);
        return res.status(500).json({ message: "Failed to fetch Form 4 data", error: error.message });
    }
};

// GET /forms/form5a?sector=COUNCIL
export const getForm5A = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form5A controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm5AData(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form5A controller error: ${error.message}`);
        return res.status(500).json({ message: "Failed to fetch Form 5A data", error: error.message });
    }
};

// GET /forms/form5b?sector=COUNCIL
export const getForm5B = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form5B controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm5BData(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form5B controller error: ${error.message}`);
        return res.status(500).json({ message: "Failed to fetch Form 5B data", error: error.message });
    }
};

// GET /forms/form5c?sector=COUNCIL
export const getForm5C = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form5C controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm5CData(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form5C controller error: ${error.message}`);
        return res.status(500).json({
            message: "Failed to fetch Form 5C data",
            error: error.message,
        });
    }
};

// GET /forms/form5d?sector=COUNCIL
export const getForm5D = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form5D controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm5DData(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form5D controller error: ${error.message}`);
        return res.status(500).json({
            message: "Failed to fetch Form 5D data",
            error: error.message,
        });
    }
};


export const getForm5E = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form5E controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm5EData(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form5E controller error: ${error.message}`);
        return res.status(500).json({
            message: "Failed to fetch Form 5E data",
            error: error.message,
        });
    }
};



// GET /forms/form6?sector=COUNCIL
export const getForm6 = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form6 controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm6Data(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form6 controller error: ${error.message}`);
        return res.status(500).json({
            message: "Failed to fetch Form 6 data",
            error: error.message,
        });
    }
};


// GET /forms/form7?sector=COUNCIL
export const getForm7 = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form7 controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm7Data(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form7 controller error: ${error.message}`);
        return res.status(500).json({
            message: "Failed to fetch Form 7 data",
            error: error.message,
        });
    }
};


// GET /forms/form7a?sector=COUNCIL
export const getForm7A = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form7A controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm7AData(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form7A controller error: ${error.message}`);
        return res.status(500).json({
            message: "Failed to fetch Form 7A data",
            error: error.message,
        });
    }
};

export const getForm7B = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form7B controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm7BData(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form7B controller error: ${error.message}`);
        return res.status(500).json({
            message: "Failed to fetch Form 7B data",
            error: error.message,
        });
    }
};

export const getForm8 = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form8 controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm8Data(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form8 controller error: ${error.message}`);
        return res.status(500).json({
            message: "Failed to fetch Form 8 data",
            error: error.message,
        });
    }
};


// GET /forms/form9?sector=COUNCIL
export const getForm9 = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form9 controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm9Data(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form9 controller error: ${error.message}`);
        return res.status(500).json({
            message: "Failed to fetch Form 9 data",
            error: error.message,
        });
    }
};


export const getForm10 = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form10 controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm10Data(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form10 controller error: ${error.message}`);
        return res.status(500).json({
            message: "Failed to fetch Form 10 data",
            error: error.message,
        });
    }
};

// GET /forms/form11?sector=COUNCIL
export const getForm11 = async (req, res) => {
    try {
        const { sector } = req.query;
        logger.info(`Form11 controller hit — sector: ${sector ?? "ALL"}`);
        const data = await getForm11Data(sector);
        return res.status(200).json(data);
    } catch (error) {
        logger.error(`Form11 controller error: ${error.message}`);
        return res.status(500).json({
            message: "Failed to fetch Form 11 data",
            error: error.message,
        });
    }
};


export const getForm12 = async (req, res) => {
    try {
        const { sector } = req.query;
        const data = await getForm12Data(sector);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch Form 12 data",
            error: error.message,
        });
    }
};
