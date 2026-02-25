import { useEffect, useState, useCallback, useMemo } from "react";
import { getFormOne } from "../../api/formOne.api.js";

const cache = new Map();
const cacheExpiry = new Map();

export function useCashbook({ year, sector }, options = {}) {
    const { enabled = true, staleTime = 5 * 60 * 1000 } = options;

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const cacheKey = useMemo(() => `${year}-${sector}`, [year, sector]);

    const getCachedData = useCallback(() => {
        const cached = cache.get(cacheKey);
        const expiry = cacheExpiry.get(cacheKey);
        const isStale = !cached || Date.now() - (expiry ?? 0) > staleTime;
        return { cached, isStale };
    }, [cacheKey, staleTime]);

    useEffect(() => {
        if (!enabled || !year) {
            setData([]);
            return;
        }

        const { cached, isStale } = getCachedData();

        if (cached && !isStale) {
            setData(cached);
            return;
        }

        setLoading(true);
        setError(null);

        getFormOne({ year, sector })
            .then((response) => {
                const newData = response.data?.data ?? [];
                cache.set(cacheKey, newData);
                cacheExpiry.set(cacheKey, Date.now());
                setData(newData);
            })
            .catch((err) => {
                setError(err);
                const { cached: fallback } = getCachedData();
                if (fallback) setData(fallback);
            })
            .finally(() => setLoading(false));
    }, [year, sector, enabled, getCachedData, cacheKey]);

    const refetch = useCallback(() => {
        cache.delete(cacheKey);
        cacheExpiry.delete(cacheKey);
        setData([]);
    }, [cacheKey]);

    return { data, loading, error, refetch };
}
