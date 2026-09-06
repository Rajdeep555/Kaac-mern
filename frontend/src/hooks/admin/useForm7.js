import { useState, useEffect, useCallback } from "react";
import { getForm7 } from "../../api/forms.api.js";

export const useForm7 = ({ sector, dateRange } = {}, { enabled = true } = {}) => {
    // form7Data = { groups, grandTotalMonths, grandTotal }
    const [form7Data, setForm7Data] = useState(null);
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
            const { data } = await getForm7(params);
            setForm7Data(data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 7 data");
        } finally {
            setLoading(false);
        }
    }, [sector, from, to, enabled]);

    useEffect(() => {
        fetchData();
    }, [sector, from, to, enabled]);

    return { form7Data, loading, error, refetch: fetchData };
};