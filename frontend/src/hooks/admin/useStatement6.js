import { useState, useEffect, useCallback } from "react";
import { getStatement6 } from "../../api/statements.api.js";

export const useStatement6 = ({ sector } = {}, { enabled = true } = {}) => {
    const [statement6Data, setStatement6Data] = useState({ rows: [], grandTotal: "0.00" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;

        setLoading(true);
        setError(null);

        try {
            const params = sector ? { sector } : {};
            const { data } = await getStatement6(params);
            setStatement6Data(data?.data ?? { rows: [], grandTotal: "0.00" });
        } catch (err) {
            setError(
                err?.response?.data?.message ?? "Failed to fetch Statement 6 data"
            );
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { statement6Data, loading, error, refetch: fetchData };
};
