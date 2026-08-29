import { useState, useEffect, useCallback } from "react";
import { getForm4 } from "../../api/forms.api.js";

export const useForm4 = ({ sector, dateRange } = {}, { enabled = true } = {}) => {
    const [form4Data, setForm4Data] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const from = dateRange?.from;
    const to = dateRange?.to;

    const fetchData = useCallback(async () => {
        // Don't fetch if disabled
        if (!enabled) return;

        setLoading(true);
        setError(null);

        try {
            // Pass sector + from/to as query params e.g. ?sector=COUNCIL&from=2025-04-01&to=2026-08-28
            const params = {};
            if (sector) params.sector = sector;
            if (from) params.from = from;
            if (to) params.to = to;

            const { data } = await getForm4(params);

            setForm4Data(data ?? []);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch Form 4 data");
        } finally {
            setLoading(false);
        }
    }, [sector, from, to, enabled]);

    // Re-fetch whenever sector, from, to, or enabled changes
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { form4Data, loading, error, refetch: fetchData };
};