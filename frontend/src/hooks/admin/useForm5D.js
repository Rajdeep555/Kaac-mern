import { useState, useEffect, useCallback } from "react";
import { getForm5D } from "../../api/forms.api.js";

export const useForm5D = ({ sector, dateRange } = {}, { enabled = true } = {}) => {
    const [form5DData, setForm5DData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const from = dateRange?.from;
    const to = dateRange?.to;

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = sector ? { sector } : {};
            if (from) params.from = from;
            if (to) params.to = to;

            const { data } = await getForm5D(params);
            setForm5DData(data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 5D data");
        } finally {
            setLoading(false);
        }
    }, [sector, from, to, enabled]);

    useEffect(() => {
        fetchData();
    }, [sector, from, to, enabled]); // ✅ primitives only, not fetchData

    return { form5DData, loading, error, refetch: fetchData };
};
