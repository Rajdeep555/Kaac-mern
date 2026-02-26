import { useState, useEffect, useCallback } from "react";
import {
    getStatement3Debt,
    getStatement3WaysAndMeans,
} from "../../api/statements.api.js";

// Hook for Part 1 — Debt Position
export const useStatement3Debt = ({ sector } = {}, { enabled = true } = {}) => {
    const [debtData, setDebtData] = useState({
        rows: [],
        total: {
            april: "0.00",
            receipts: "0.00",
            repayments: "0.00",
            march: "0.00",
            increaseDecrease: "0.00",
        },
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = sector ? { sector } : {};
            const { data } = await getStatement3Debt(params);
            setDebtData(data?.data ?? { rows: [], total: {} });
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch debt data");
        } finally {
            setLoading(false);
        }
    }, [sector, enabled]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { debtData, loading, error, refetch: fetchData };
};

// Hook for Part 2 — Ways and Means
export const useStatement3WaysAndMeans = (
    { sector, financialYear } = {},
    { enabled = true } = {}
) => {
    const [waysAndMeansData, setWaysAndMeansData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const params = {};
            if (sector) params.sector = sector;
            if (financialYear) params.financialYear = financialYear;
            const { data } = await getStatement3WaysAndMeans(params);
            setWaysAndMeansData(data?.data ?? []);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to fetch ways and means data");
        } finally {
            setLoading(false);
        }
    }, [sector, financialYear, enabled]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { waysAndMeansData, loading, error, refetch: fetchData };
};
