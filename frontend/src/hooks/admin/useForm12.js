import { useState, useEffect, useCallback } from "react";
import { getForm12 } from "../../api/forms.api.js";

export const useForm12 = (
    { sector, dateRange } = {},
    { enabled = true } = {}
) => {
    const [form12Data, setForm12Data] = useState(null);
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
            const { data } = await getForm12(params);
            setForm12Data(data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 12 data");
        } finally {
            setLoading(false);
        }
    }, [sector, from, to, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { form12Data, loading, error, refetch: fetchData };
};