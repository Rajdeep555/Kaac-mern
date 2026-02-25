import { useState, useEffect, useCallback } from "react";
import { getForm5A } from "../../api/forms.api.js";

export const useForm5A = ({ sector } = {}, { enabled = true } = {}) => {
    const [form5AData, setForm5AData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = sector ? { sector } : {};
            const { data } = await getForm5A(params);
            setForm5AData(data ?? []);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 5A data");
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { form5AData, loading, error, refetch: fetchData };
};
