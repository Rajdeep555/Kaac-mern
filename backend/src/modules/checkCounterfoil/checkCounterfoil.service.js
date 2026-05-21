import prisma from "../../config/database.js"

export const generateCounterfoilNo = async () => {
    // Get the latest counterfoil number from DB
    const latest = await prisma.cashReceipt.findFirst({
        where: {
            counterfoilNo: {
                startsWith: "C",
            },
        },
        orderBy: {
            counterfoilNo: "desc",
        },
        select: {
            counterfoilNo: true,
        },
    });

    if (!latest?.counterfoilNo) {
        return "C001";
    }

    // Extract numeric part — e.g. "C001" → 1, "C099" → 99
    const numeric = parseInt(latest.counterfoilNo.slice(1), 10);
    if (isNaN(numeric)) return "C001";

    // Increment and pad to 3 digits
    const next = numeric + 1;
    return `C${String(next).padStart(3, "0")}`;
};