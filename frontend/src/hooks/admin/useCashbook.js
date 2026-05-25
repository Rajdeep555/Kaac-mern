// useCashbook.js
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { getFormOne } from "../../api/formOne.api.js";

// Move cache inside the hook — no shared module-level state
export function useCashbook({ year, sector }, options = {}) {
    const { enabled = true, staleTime = 5 * 60 * 1000 } = options;

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Per-instance cache via ref — not shared across hook instances
    const cacheRef = useRef(new Map());
    const cacheExpiryRef = useRef(new Map());

    const cacheKey = `${year}-${sector}`;

    useEffect(() => {
        if (!enabled || !year || !sector) {
            setData([]);
            setLoading(false);
            return;
        }

        const cached = cacheRef.current.get(cacheKey);
        const expiry = cacheExpiryRef.current.get(cacheKey) ?? 0;
        const isStale = !cached || Date.now() - expiry > staleTime;

        if (cached && !isStale) {
            setData(cached);
            return;
        }

        let cancelled = false;  // ← prevent stale closure race conditions
        setLoading(true);
        setError(null);

        getFormOne({ year, sector })
            .then((response) => {
                if (cancelled) return;
                const newData = response.data?.data ?? [];
                cacheRef.current.set(cacheKey, newData);
                cacheExpiryRef.current.set(cacheKey, Date.now());
                setData(newData);
            })
            .catch((err) => {
                if (cancelled) return;
                setError(err);
                const fallback = cacheRef.current.get(cacheKey);
                if (fallback) setData(fallback);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;  // ← cleanup on unmount or key change
        };
    }, [year, sector, enabled, cacheKey, staleTime]);

    const refetch = useCallback(() => {
        cacheRef.current.delete(cacheKey);
        cacheExpiryRef.current.delete(cacheKey);
        setData([]);
    }, [cacheKey]);

    return { data, loading, error, refetch };
}