import { useState, useEffect, useCallback } from "react";
import { getStatement2 } from "../../api/statements.api.js";

export const useStatement2 = (
    { sector, financialYear } = {},
    { enabled = true } = {}
) => {
    const [statement2Data, setStatement2Data] = useState({
        rows: [],
        total: {
            previousYear: "0.00",
            currentYear: "0.00",
            total: "0.00",
        },
    });
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

            const { data } = await getStatement2(params);
            setStatement2Data(
                data?.data ?? {
                    rows: [],
                    total: {
                        previousYear: "0.00",
                        currentYear: "0.00",
                        total: "0.00",
                    },
                }
            );
        } catch (err) {
            setError(
                err?.response?.data?.message ?? "Failed to fetch Statement 2 data"
            );
        } finally {
            setLoading(false);
        }
    }, [sector, financialYear, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { statement2Data, loading, error, refetch: fetchData };
};
