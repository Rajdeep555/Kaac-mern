import { useState, useEffect, useCallback } from "react";
import { getForm7A } from "../../api/forms.api.js";

export const useForm7A = ({ sector } = {}, { enabled = true } = {}) => {
    const [form7AData, setForm7AData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = sector ? { sector } : {};
            const { data } = await getForm7A(params);
            setForm7AData(data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 7A data");
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { form7AData, loading, error, refetch: fetchData };
};
