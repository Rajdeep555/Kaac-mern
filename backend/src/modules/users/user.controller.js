import { createUserSchema, updateUserSchema } from "./user.schema.js";
import { createUser, getAllUsers, updateUser, toggleUserStatus } from "./user.service.js";

export const create = async (req, res) => {
    try {
        // ✅ FIX: use safeParse instead of parse for consistent error format
        const result = createUserSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }
        const user = await createUser(result.data);
        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
            }
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// ✅ NEW
export const getAll = async (req, res) => {
    try {
        const users = await getAllUsers();
        return res.status(200).json({ success: true, users });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ✅ NEW
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const result = updateUserSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.flatten().fieldErrors,
            });
        }
        const user = await updateUser(id, result.data);
        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

// ✅ NEW
export const toggleStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await toggleUserStatus(id);
        return res.status(200).json({
            success: true,
            message: `User ${user.isActive ? "reactivated" : "deactivated"}`,
            user,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};