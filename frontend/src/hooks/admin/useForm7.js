import { useState, useEffect, useCallback } from "react";
import { getForm7 } from "../../api/forms.api.js";

export const useForm7 = ({ sector } = {}, { enabled = true } = {}) => {
    // form7Data = { groups, grandTotalMonths, grandTotal }
    const [form7Data, setForm7Data] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = sector ? { sector } : {};
            const { data } = await getForm7(params);
            setForm7Data(data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 7 data");
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { form7Data, loading, error, refetch: fetchData };
};
