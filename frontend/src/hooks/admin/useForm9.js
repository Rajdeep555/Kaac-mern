import { useState, useEffect, useCallback } from "react";
import { getForm9 } from "../../api/forms.api.js";

export const useForm9 = ({ sector } = {}, { enabled = true } = {}) => {
    const [form9Data, setForm9Data] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = sector ? { sector } : {};
            const { data } = await getForm9(params);
            setForm9Data(data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 9 data");
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { form9Data, loading, error, refetch: fetchData };
};
