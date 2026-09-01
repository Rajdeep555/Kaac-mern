import { useState, useEffect, useCallback } from "react";
import { getForm5E } from "../../api/forms.api.js";

export const useForm5E = (
    { sector, dateRange } = {},
    { enabled = true } = {}
) => {
    const [form5EData, setForm5EData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const from = dateRange?.from;
    const to = dateRange?.to;

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = {
                ...(sector ? { sector } : {}),
                ...(from ? { from } : {}),
                ...(to ? { to } : {}),
            };
            const { data } = await getForm5E(params);
            setForm5EData(data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 5E data");
        } finally {
            setLoading(false);
        }
    }, [sector, from, to, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { form5EData, loading, error, refetch: fetchData };
};