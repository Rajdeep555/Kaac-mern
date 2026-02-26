import { useState, useEffect, useCallback } from "react";
import { getStatement7 } from "../../api/statements.api.js";

export const useStatement7 = ({ sector } = {}, { enabled = true } = {}) => {
    const [statement7Data, setStatement7Data] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;

        setLoading(true);
        setError(null);

        try {
            const params = sector ? { sector } : {};
            const { data } = await getStatement7(params);
            setStatement7Data(data?.data ?? []);
        } catch (err) {
            setError(
                err?.response?.data?.message ?? "Failed to fetch Statement 7 data"
            );
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { statement7Data, loading, error, refetch: fetchData };
};
