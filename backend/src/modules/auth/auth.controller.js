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
        if (
            error.message?.includes("Can't reach database") ||
            error.message?.includes("database server") ||
            error.code === "P1001" || // Prisma: connection error
            error.code === "P1002"    // Prisma: timeout
        ) {
            return res.status(503).json({
                message: "Service temporarily unavailable. Please try again later.",
            });
        }

        return res.status(500).json({
            message: "Something went wrong. Please try again.",
        });
        // return res.status(401).json({
        //     success: false,
        //     message: error.message || "Login failed"
        // })
    }
}