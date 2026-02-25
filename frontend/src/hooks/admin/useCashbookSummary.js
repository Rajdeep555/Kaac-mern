import { useState, useCallback } from "react";
import { saveCashbookSummary } from "../../api/formOne.api.js";

export const useCashbookSummary = () => {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const save = useCallback(async (payload) => {
        setSaving(true);
        setError(null);
        try {
            const { data } = await saveCashbookSummary(payload);
            return data;
        } catch (err) {
            const msg = err?.response?.data?.message ?? "Failed to save cashbook summary";
            setError(msg);
            throw new Error(msg);
        } finally {
            setSaving(false);
        }
    }, []);

    return { save, saving, error };
};
