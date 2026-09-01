import { useState, useEffect, useCallback } from "react";
import { getStatement4 } from "../../api/statements.api.js";

export const useStatement4 = (
    { sector, dateRange } = {},
    { enabled = true } = {}
) => {
    const [statement4Data, setStatement4Data] = useState({
        rows: [],
        total: {
            amountPaid: "0.00",
            amountRecover: "0.00",
            march: "0.00",
            increaseDecrease: "0.00",
        },
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const from = dateRange?.from;
    const to = dateRange?.to;

    const fetchData = useCallback(async () => {
        if (!enabled) return;

        setLoading(true);
        setError(null);

        try {
            const params = {};
            if (sector) params.sector = sector;
            if (from) params.from = from;
            if (to) params.to = to;

            const { data } = await getStatement4(params);
            setStatement4Data(
                data?.data ?? {
                    rows: [],
                    total: {
                        amountPaid: "0.00",
                        amountRecover: "0.00",
                        march: "0.00",
                        increaseDecrease: "0.00",
                    },
                }
            );
        } catch (err) {
            setError(
                err?.response?.data?.message ?? "Failed to fetch Statement 4 data"
            );
        } finally {
            setLoading(false);
        }
    }, [sector, from, to, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { statement4Data, loading, error, refetch: fetchData };
};