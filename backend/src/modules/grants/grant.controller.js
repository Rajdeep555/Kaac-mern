import {
    getGrants,
    createGrant,
    updateGrant,
    toggleGrantStatus,
} from "./grant.service.js";
import { createGrantSchema, updateGrantSchema } from "./grant.schema.js";

export const getAll = async (req, res) => {
    try {
        const grants = await getGrants();
        return res.status(200).json({ success: true, grants });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch grants", error: error.message });
    }
};

export const create = async (req, res) => {
    try {
        // console.log("req.body:", req.body); //  check what's coming in
        const parsed = createGrantSchema.safeParse(req.body);
        // console.log("parsed:", parsed); // heck if validation passes

        if (!parsed.success)
            return res.status(400).json({ success: false, message: parsed.error.errors[0].message });

        const grant = await createGrant(parsed.data);
        // console.log("created grant:", grant); //  check what Prisma returns
        return res.status(201).json({ success: true, grant });
    } catch (error) {
        // console.error("Create grant error:", error); //  check for errors
        return res.status(500).json({ success: false, message: "Failed to create grant", error: error.message });
    }
};

export const update = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const parsed = updateGrantSchema.safeParse(req.body);
        if (!parsed.success)
            return res.status(400).json({ success: false, message: parsed.error.errors[0].message });

        const grant = await updateGrant(id, parsed.data);
        return res.status(200).json({ success: true, grant });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to update grant", error: error.message });
    }
};

export const toggleStatus = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const grant = await toggleGrantStatus(id);
        return res.status(200).json({ success: true, grant });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to toggle status", error: error.message });
    }
};