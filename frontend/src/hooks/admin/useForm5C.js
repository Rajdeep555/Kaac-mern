import { useState, useEffect, useCallback } from "react";
import { getForm5C } from "../../api/forms.api.js";

export const useForm5C = ({ sector } = {}, { enabled = true } = {}) => {
    const [form5CData, setForm5CData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = sector ? { sector } : {};
            const { data } = await getForm5C(params);
            setForm5CData(data ?? []);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 5C data");
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { form5CData, loading, error, refetch: fetchData };
};
