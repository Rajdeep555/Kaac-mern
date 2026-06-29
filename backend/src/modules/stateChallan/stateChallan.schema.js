import { z } from "zod";

// ── Create schema — challanNo is intentionally absent (DB generates it) ──
export const stateChallanSchema = z.object({
    // challanNo: removed — auto-generated in service
    challanDate: z.string().min(1, "Challan Date is required"),
    stateNo: z.string().optional().nullable(),
    from: z.string().optional(),
    to: z.string().optional(),
    subject: z.string().optional(),
    sector: z.enum(["COUNCIL", "STATE"], {
        errorMap: () => ({ message: "Sector must be COUNCIL or STATE" }),
    }),
    ddo: z.coerce.string().optional(),
    divisionCode: z.coerce.string().optional(),
    grantNo: z.coerce.string().optional(),
    majorHead: z.string().min(1, "Major Head is required"),
    subMajorHead: z.string().optional(),
    minorHead: z.string().optional(),
    subHead: z.string().optional(),
    subSubHead: z.string().optional(),
    detailHead: z.string().optional(),
    subDetailHead: z.string().optional(),
    purpose: z.string().optional(),
    remarks: z.string().optional(),
    totalAmount: z.string().min(1, "Amount is required").refine(
        (val) => {
            const num = parseFloat(val.replace(/,/g, ""));
            return !isNaN(num) && num > 0;
        },
        { message: "Amount must be a positive number" }
    ),
    amountInWords: z.string().optional(),
    focNo: z.string().optional(),
    sanctionLetterNo: z.string().optional(),
    sanctionLetterDate: z.string().optional(),
    treasuryCode: z.string().optional(),
    treasuryChallanNo: z.string().optional(),
    treasuryChallanDate: z.string().optional(),
});

// ── Update schema — id required, all fields optional, challanNo blocked ──
export const updateStateChallanSchema = stateChallanSchema
    .omit({ sector: true })                   // make sector optional on update
    .partial()
    .extend({
        id: z.number().int().positive("ID must be a positive integer"),
        sector: z.enum(["COUNCIL", "STATE"]).optional(),
        // challanNo explicitly excluded — cannot be updated
    });