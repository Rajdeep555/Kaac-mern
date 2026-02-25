import { useState, useEffect, useCallback } from "react";
import { getForm8 } from "../../api/forms.api.js";

export const useForm8 = ({ sector } = {}, { enabled = true } = {}) => {
    const [form8Data, setForm8Data] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = sector ? { sector } : {};
            const { data } = await getForm8(params);
            setForm8Data(data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 8 data");
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { form8Data, loading, error, refetch: fetchData };
};
