import logger from "../../utils/logger.js"
import prisma from "../../config/database.js"

export const generateChallanNo = async (type) => {
    if (!type || !["COUNCIL", "STATE"].includes(type)) {
        logger.error("Invalid type")
        throw new error("Invalid type")
    }

    // financial year 
    const now = new Date();
    const fySuffix = now.getMonth() >= 3 ? String(now.getFullYear() + 1).slice(-2) : String(now.getFullYear()).slice(-2);

    // prefix mapping 
    const prefixMap = {
        COUNCIL: "KAAC",
        STATE: "STATE",
    };

    const prefix = prefixMap[type];
    const challanPrefix = `${prefix}-${fySuffix}-`;

    //get last challan no
    const lastChallanNo = await prisma.challan.findFirst({
        where: {
            challanType: type,
            challanNo: {
                startsWith: challanPrefix,
            }
        },
        orderBy: { id: "desc" },
        select: { challanNo: true },
    })

    let nextSerial = 1;

    if (lastChallanNo?.challanNo) {
        const part = lastChallanNo.challanNo.split("-");
        nextSerial = parseInt(part[2], 10) + 1;
    }
    return `${challanPrefix}${String(nextSerial).padStart(2, "0")}`;

}