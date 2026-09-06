import { useState, useEffect, useCallback } from "react";
import { getForm7A } from "../../api/forms.api.js";

export const useForm7A = ({ sector, dateRange } = {}, { enabled = true } = {}) => {
    const [form7AData, setForm7AData] = useState(null);
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
            const { data } = await getForm7A(params);
            setForm7AData(data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 7A data");
        } finally {
            setLoading(false);
        }
    }, [sector, from, to, enabled]);

    useEffect(() => {
        fetchData();
    }, [sector, from, to, enabled]);

    return { form7AData, loading, error, refetch: fetchData };
};  
