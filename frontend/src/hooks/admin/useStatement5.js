import { useState, useEffect, useCallback } from "react";
import { getStatement5 } from "../../api/statements.api.js";

export const useStatement5 = ({ sector } = {}, { enabled = true } = {}) => {
    const [statement5Data, setStatement5Data] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;

        setLoading(true);
        setError(null);

        try {
            const params = sector ? { sector } : {};
            const { data } = await getStatement5(params);
            setStatement5Data(data?.data ?? []);
        } catch (err) {
            setError(
                err?.response?.data?.message ?? "Failed to fetch Statement 5 data"
            );
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { statement5Data, loading, error, refetch: fetchData };
};
