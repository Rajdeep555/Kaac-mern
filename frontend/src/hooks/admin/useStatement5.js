import { useState, useEffect, useCallback } from "react";
import { getStatement5 } from "../../api/statements.api.js";

export const useStatement5 = (
    { sector, dateRange } = {},
    { enabled = true } = {}
) => {
    const [statement5Data, setStatement5Data] = useState([]);
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

            const { data } = await getStatement5(params);
            setStatement5Data(data?.data ?? []);
        } catch (err) {
            setError(
                err?.response?.data?.message ?? "Failed to fetch Statement 5 data"
            );
        } finally {
            setLoading(false);
        }
    }, [sector, from, to, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { statement5Data, loading, error, refetch: fetchData };
};