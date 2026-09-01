// Counterfoil numbers that should NEVER be treated as "used up" once a
// Challan is raised against them. C725 is a revolving/imprest cash
// receipt: every Challan drawn against it just reduces its remaining
// rupeesInCash balance — the receipt itself must always keep appearing
// in "Pending Receipts", and re-inserting a new Challan against the
// same counterfoilNo must always be allowed.
//
// Every other counterfoilNo behaves exactly as before (once a Challan
// is linked to it, it disappears from "Pending" and can't be re-used).
export const PERPETUAL_PENDING_COUNTERFOILS = ["C725"];

export const isPerpetualCounterfoil = (counterfoilNo) =>
    !!counterfoilNo && PERPETUAL_PENDING_COUNTERFOILS.includes(counterfoilNo);
