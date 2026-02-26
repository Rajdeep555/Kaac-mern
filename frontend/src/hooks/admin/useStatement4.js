import { useState, useEffect, useCallback } from "react";
import { getStatement4 } from "../../api/statements.api.js";

export const useStatement4 = ({ sector } = {}, { enabled = true } = {}) => {
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

    const fetchData = useCallback(async () => {
        if (!enabled) return;

        setLoading(true);
        setError(null);

        try {
            const params = sector ? { sector } : {};
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
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { statement4Data, loading, error, refetch: fetchData };
};
