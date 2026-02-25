import { useState, useEffect, useCallback } from "react";
import { getForm7B } from "../../api/forms.api.js";

export const useForm7B = ({ sector } = {}, { enabled = true } = {}) => {
    const [form7BData, setForm7BData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = sector ? { sector } : {};
            const { data } = await getForm7B(params);
            setForm7BData(data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 7B data");
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { form7BData, loading, error, refetch: fetchData };
};
