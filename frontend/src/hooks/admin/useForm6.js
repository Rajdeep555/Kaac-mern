import { useState, useEffect, useCallback } from "react";
import { getForm6 } from "../../api/forms.api.js";

export const useForm6 = ({ sector } = {}, { enabled = true } = {}) => {
    // form6Data will be { rows, grandTotalMonths, grandTotal }
    const [form6Data, setForm6Data] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = sector ? { sector } : {};
            const { data } = await getForm6(params);
            setForm6Data(data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 6 data");
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { form6Data, loading, error, refetch: fetchData };
};
