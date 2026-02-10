import logger from "../utils/logger.js";

export default function authorize(...allowedRoles) {
    return (req, res, next) => {
        const userRole = req.user?.role;

        logger.info("Authorization check", {
            userId: req.user?.userId,
            userRole,
            allowedRoles,
            path: req.originalUrl,
            method: req.method,
        });

        if (!userRole || !allowedRoles.includes(userRole)) {
            logger.warn("Authorization failed", {
                userId: req.user?.userId,
                userRole,
                allowedRoles,
            });

            return res.status(403).json({
                success: false,
                message: "Forbidden",
            });
        }

        logger.info("Authorization successful", {
            userId: req.user?.userId,
            role: userRole,
        });

        next();
    };
}