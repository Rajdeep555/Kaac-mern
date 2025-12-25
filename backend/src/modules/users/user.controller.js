import { createUserSchema } from "./user.schema.js";
import { createUser } from "./user.service.js";

export const create = async (req, res) => {
    try {
        const data = createUserSchema.parse(req.body);

        const user = await createUser(data);

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        })
    }
}