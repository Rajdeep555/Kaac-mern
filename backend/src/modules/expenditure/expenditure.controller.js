import { createExpenditureSchema } from "./expenditure.schema.js"
import { createExpenditure, getExpenditureById, getExpenditureForCashier, getVoucherNo } from "./expenditure.service.js";
import logger from "../../utils/logger.js";


const handleError = (res, error, message = "An error occurred") => {
    console.error(error);
    res.status(error.status || 500).json({
        message: error.message || message,
        error: process.env.NODE_ENV === 'development' ? error : {}
    });
};
export const create = async (req, res) => {
    try {


        const cashierId = req.user.id;

        const payload = createExpenditureSchema.parse(req.body);

        const expenditure = await createExpenditure({ ...payload, cashierId });

        return res.status(201).json({
            success: true,
            message: "Expenditure Created Successfully",
            data: expenditure,
        })
    } catch (error) {
        console.error("Create Expenditure Error:", error);

        if (error.code === "P2003") {
            return res.status(400).json({
                success: false,
                message: "Invalid reference ID (Department / DDO / Division not found)",
                meta: error.meta,
            });
        }

        if (error.name === "ZodError") {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.errors,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const expenditure = await getExpenditureById(id);

        if (!expenditure) {
            return res.status(404).json({
                success: false,
                message: "Expenditure not found",
            });
        }

        // CASHIER can only access his own
        if (
            req.user.role === "CASHIER" &&
            expenditure.cashierId !== req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "Forbidden",
            });
        }

        res.status(200).json({
            success: true,
            data: expenditure,
        });
    } catch (error) {
        handleError(res, error);
    }
};

/* ================= UPDATE ================= */
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const payload = createExpenditureSchema.parse(req.body);

        const existing = await getExpenditureById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: "Expenditure not found",
            });
        }

        if (
            req.user.role === "CASHIER" &&
            existing.cashierId !== req.user.userId
        ) {
            return res.status(403).json({
                success: false,
                message: "Forbidden",
            });
        }

        const updated = await updateExpenditure(id, payload);

        res.status(200).json({
            success: true,
            message: "Expenditure Updated Successfully",
            data: updated,
        });
    } catch (error) {
        handleError(res, error);
    }
};

export const fetchNextVoucherNo = async (req, res) => {
    try {
        const { type } = req.query;

        const voucherNo = await getVoucherNo(type);

        res.json({ voucherNo })

    } catch (error) {
        logger.error("Failed to fetch next challan no", error);
        console.error(error);
        res.status(400).json({ error: error.message });
    }
}

export const getCashierExpenditures = async (req, res) => {
    try {
        const cashierId = req.user.id;
        const { sector, treasury } = req.query;

        const data = await getExpenditureForCashier({
            cashierId,
            sector,
            hasTreasuryVoucher: treasury === "yes" ? true : treasury === "no" ? false : undefined,
        })

        res.status(200).json({
            success: true,
            data
        })
    } catch (error) {
        logger.error("Failed to fetch expenditure", error);
        res.json(500).json({
            success: false,
            message: error.message
        })
    }
}

import { getExpendituresForAdmin } from "./expenditure.service.js";

export const getAdminExpenditures = async (req, res) => {
    try {
        const { sector, month, year, paymentMode } = req.query;

        const data = await getExpendituresForAdmin({
            sector,
            month: month ? Number(month) : undefined,
            year: year ? Number(year) : undefined,
            paymentMode,
        });

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        handleError(res, error);
    }
};
