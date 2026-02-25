import { useState, useEffect, useCallback } from "react";
import { getForm11 } from "../../api/forms.api.js";

export const useForm11 = ({ sector } = {}, { enabled = true } = {}) => {
    const [form11Data, setForm11Data] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = sector ? { sector } : {};
            const { data } = await getForm11(params);
            setForm11Data(data ?? null);
        } catch (err) {
            setError(
                err?.response?.data?.message ?? "Failed to fetch Form 11 data"
            );
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { form11Data, loading, error, refetch: fetchData };
};
