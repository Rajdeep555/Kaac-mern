import logger from "../utils/logger.js";

export default function authorize(requiredRole) {
    return (req, res, next) => {
        const userRole = req.user?.role;

        // Logging every authorization attempt
        logger.info("Authorization check", {
            userId: req.user?.userId,
            userRole,
            requiredRole,
            path: req.originalUrl,
            method: req.method,
        });

        if (userRole !== requiredRole) {
            logger.warn("Authorization failed", {
                userId: req.user?.userId,
                userRole,
                requiredRole,
            });

            return res.status(403).json({
                success: false,
                message: "Forbidden",
            });
        }

        // Optional success log (can be noisy in prod) // remove it ltr
        logger.info("Authorization successful", {
            userId: req.user?.userId,
            role: userRole,
        });

        next();
    };
}
