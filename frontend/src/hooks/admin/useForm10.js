import { useState, useEffect, useCallback } from "react";
import { getForm10 } from "../../api/forms.api.js";

export const useForm10 = ({ sector, dateRange } = {}, { enabled = true } = {}) => {
    const [form10Data, setForm10Data] = useState(null);
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
            const { data } = await getForm10(params);
            setForm10Data(data ?? null);
        } catch (err) {
            setError(
                err?.response?.data?.message ?? "Failed to fetch Form 10 data"
            );
        } finally {
            setLoading(false);
        }
    }, [sector, from, to, enabled]);

    useEffect(() => {
        fetchData();
    }, [sector, from, to, enabled]);

    return { form10Data, loading, error, refetch: fetchData };
};  
