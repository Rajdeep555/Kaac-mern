import { useState, useEffect, useCallback } from "react";
import { getForm5B } from "../../api/forms.api.js";

export const useForm5B = ({ sector, dateRange } = {}, { enabled = true } = {}) => {
    const [form5BData, setForm5BData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const from = dateRange?.from;
    const to = dateRange?.to;

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (sector) params.sector = sector;
            if (from) params.from = from;
            if (to) params.to = to;

            const { data } = await getForm5B(params);
            setForm5BData(data ?? []);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 5B data");
        } finally {
            setLoading(false);
        }
    }, [sector, from, to, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]); // now correctly depends on fetchData, same fix as your other hooks

    return { form5BData, loading, error, refetch: fetchData };
};