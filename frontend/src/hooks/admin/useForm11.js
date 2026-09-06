import { useState, useEffect, useCallback } from "react";
import { getForm11 } from "../../api/forms.api.js";

export const useForm11 = ({ sector, dateRange } = {}, { enabled = true } = {}) => {
    const [form11Data, setForm11Data] = useState(null);
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
            const { data } = await getForm11(params);
            setForm11Data(data ?? null);
        } catch (err) {
            setError(
                err?.response?.data?.message ?? "Failed to fetch Form 11 data"
            );
        } finally {
            setLoading(false);
        }
    }, [sector, from, to, enabled]);

    useEffect(() => {
        fetchData();
    }, [sector, from, to, enabled]);

    return { form11Data, loading, error, refetch: fetchData };
};  
