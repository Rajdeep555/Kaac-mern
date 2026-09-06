import { useState, useEffect, useCallback } from "react";
import { getForm9 } from "../../api/forms.api.js";

export const useForm9 = ({ sector, dateRange } = {}, { enabled = true } = {}) => {
    const [form9Data, setForm9Data] = useState(null);
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
            const { data } = await getForm9(params);
            setForm9Data(data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 9 data");
        } finally {
            setLoading(false);
        }
    }, [sector, from, to, enabled]);

    useEffect(() => {
        fetchData();
    }, [sector, from, to, enabled]);

    return { form9Data, loading, error, refetch: fetchData };
};  