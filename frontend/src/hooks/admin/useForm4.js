import { useState, useEffect, useCallback } from "react";
import { getForm4 } from "../../api/forms.api.js";

export const useForm4 = ({ sector } = {}, { enabled = true } = {}) => {
    const [form4Data, setForm4Data] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        // Don't fetch if disabled
        if (!enabled) return;

        setLoading(true);
        setError(null);

        try {
            // Pass sector as query param e.g. ?sector=COUNCIL
            const params = sector ? { sector } : {};

            const { data } = await getForm4(params);

            setForm4Data(data ?? []);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 4 data");
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    // Re-fetch whenever sector or enabled changes
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { form4Data, loading, error, refetch: fetchData };
};
