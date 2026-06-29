import {
    createStateChallanService,
    getAllStateChallanService,
    getStateChallanByIdService,
    updateStateChallanService,
    deleteStateChallanService,
} from "./stateChallan.service.js";
import {
    stateChallanSchema,
    updateStateChallanSchema,
} from "./stateChallan.schema.js";

// ── Create ─────────────────────────────────────────────────────────────────
export const createStateChallan = async (req, res) => {
    try {
        console.log("─── [createStateChallan] raw req.body ───────────────────");
        console.log(JSON.stringify(req.body, null, 2));

        const parsed = stateChallanSchema.safeParse(req.body);

        if (!parsed.success) {
            console.error("─── [createStateChallan] Zod validation FAILED ──────────");
            console.error(JSON.stringify(parsed.error.flatten(), null, 2));
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        console.log("─── [createStateChallan] parsed.data (after Zod) ────────");
        console.log(JSON.stringify(parsed.data, null, 2));

        const challan = await createStateChallanService({
            ...parsed.data,
            userId: req.user.id,
        });

        console.log(`─── [createStateChallan] SUCCESS → challanNo: ${challan.challanNo}`);

        return res.status(201).json({
            success: true,
            data: challan,
            challanNo: challan.challanNo,
        });
    } catch (error) {
        console.error("─── [createStateChallan] EXCEPTION ──────────────────────");
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ── Get All ────────────────────────────────────────────────────────────────
export const getAllStateChallan = async (req, res) => {
    try {
        const challans = await getAllStateChallanService();
        return res.status(200).json({ success: true, data: challans });
    } catch (error) {
        console.error("─── [getAllStateChallan] EXCEPTION ──────────────────────");
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ── Get By ID ──────────────────────────────────────────────────────────────
export const getStateChallanById = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }
        const challan = await getStateChallanByIdService(id);
        return res.status(200).json({ success: true, data: challan });
    } catch (error) {
        console.error("─── [getStateChallanById] EXCEPTION ─────────────────────");
        console.error(error);
        return res.status(404).json({ success: false, message: error.message });
    }
};

// ── Update ─────────────────────────────────────────────────────────────────
export const updateStateChallan = async (req, res) => {
    try {
        console.log(`─── [updateStateChallan] id param: ${req.params.id} ──────`);
        console.log("─── [updateStateChallan] raw req.body ───────────────────");
        console.log(JSON.stringify(req.body, null, 2));

        const parsed = updateStateChallanSchema.safeParse({
            ...req.body,
            id: parseInt(req.params.id, 10),
        });

        if (!parsed.success) {
            console.error("─── [updateStateChallan] Zod validation FAILED ──────────");
            console.error(JSON.stringify(parsed.error.flatten(), null, 2));
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        console.log("─── [updateStateChallan] parsed.data (after Zod) ────────");
        console.log(JSON.stringify(parsed.data, null, 2));

        const { id, ...data } = parsed.data;
        const challan = await updateStateChallanService(id, data);

        console.log(`─── [updateStateChallan] SUCCESS → id: ${challan.id}`);

        return res.status(200).json({ success: true, data: challan });
    } catch (error) {
        console.error("─── [updateStateChallan] EXCEPTION ──────────────────────");
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ── Delete ─────────────────────────────────────────────────────────────────
export const deleteStateChallan = async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid ID" });
        }
        await deleteStateChallanService(id);
        return res.status(200).json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        // console.error("─── [deleteStateChallan] EXCEPTION ──────────────────────");
        // console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};