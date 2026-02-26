import { useState, useEffect, useCallback } from "react";
import { getStatement1 } from "../../api/statements.api.js";

const DEFAULT_PAIR = ["0.00", "0.00"];

const DEFAULT_DATA = {
    financialYear: { current: "Current Year", previous: "Previous Year" },
    revenueReceipts: DEFAULT_PAIR,
    revenueExpenditure: DEFAULT_PAIR,
    revenueDeficit: DEFAULT_PAIR,
    revenueSurplus: DEFAULT_PAIR,
    capitalReceipts: DEFAULT_PAIR,
    capitalExpenditure: DEFAULT_PAIR,
    capitalDeficit: DEFAULT_PAIR,
    capitalSurplus: DEFAULT_PAIR,
    loanStateGovt: DEFAULT_PAIR,
    loanOtherSources: DEFAULT_PAIR,
    recoveriesLoans: DEFAULT_PAIR,
    recoveriesAdvances: DEFAULT_PAIR,
    totalRecoveriesLoansAdvances: DEFAULT_PAIR,
    totalReceiptPart1: DEFAULT_PAIR,
    loanRepayGovt: DEFAULT_PAIR,
    loanRepayOther: DEFAULT_PAIR,
    disbursementLoans: DEFAULT_PAIR,
    disbursementAdvances: DEFAULT_PAIR,
    totalDisbursementLoansAdvances: DEFAULT_PAIR,
    totalDisbursementPart1: DEFAULT_PAIR,
    fundsReceivedDeposits: DEFAULT_PAIR,
    taxesDeducted: DEFAULT_PAIR,
    securityDeducted: DEFAULT_PAIR,
    otherRecoveries: DEFAULT_PAIR,
    totalReceiptPart2: DEFAULT_PAIR,
    expenditureAgainstDeposits: DEFAULT_PAIR,
    taxesDeductedDisbursement: DEFAULT_PAIR,
    securityRefunded: DEFAULT_PAIR,
    otherDeposits: DEFAULT_PAIR,
    totalDisbursementPart2: DEFAULT_PAIR,
    totalReceipts: DEFAULT_PAIR,
    totalDisbursements: DEFAULT_PAIR,
    openingCashBalance: DEFAULT_PAIR,
    closingCashBalance: DEFAULT_PAIR,
    treasuryBalanceReceiptSide: DEFAULT_PAIR,
    treasuryBalanceDisbursementSide: DEFAULT_PAIR,
    grandTotalReceipt: DEFAULT_PAIR,
    grandTotalDisbursement: DEFAULT_PAIR,
};

export const useStatement1 = (
    { sector, financialYear } = {},
    { enabled = true } = {}
) => {
    const [statement1Data, setStatement1Data] = useState(DEFAULT_DATA);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (sector) params.sector = sector;
            if (financialYear) params.financialYear = financialYear;

            const { data } = await getStatement1(params);
            setStatement1Data(data?.data ?? DEFAULT_DATA);
        } catch (err) {
            setError(
                err?.response?.data?.message ?? "Failed to fetch Statement 1 data"
            );
        } finally {
            setLoading(false);
        }
    }, [sector, financialYear, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { statement1Data, loading, error, refetch: fetchData };
};
