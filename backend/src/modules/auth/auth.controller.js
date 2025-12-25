import { loginSchema } from "./auth.schema.js";
import { loginUser } from "./auth.service.js";


export const login = async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await loginUser(data);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            ...result
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message || "Login failed"
        })
    }
}