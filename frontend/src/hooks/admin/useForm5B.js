import { useState, useEffect, useCallback } from "react";
import { getForm5B } from "../../api/forms.api.js";

export const useForm5B = ({ sector } = {}, { enabled = true } = {}) => {
    const [form5BData, setForm5BData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = sector ? { sector } : {};
            const { data } = await getForm5B(params);
            setForm5BData(data ?? []);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 5B data");
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [sector, enabled]); // ✅ primitives only, not fetchData

    return { form5BData, loading, error, refetch: fetchData };
};
