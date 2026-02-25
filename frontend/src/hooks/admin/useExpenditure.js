// hooks/admin/useExpenditure.js - CACHED VERSION
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAdminExpenditures } from '../../api/expenditure.api.js';

// Global cache for expenditures
const expenditureCache = new Map();
const expenditureCacheExpiry = new Map();

export const useExpenditure = (params = {}, options = {}) => {
    const [expenditures, setExpenditures] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { enabled = true, staleTime = 5 * 60 * 1000 } = options; // 5 min default

    // Cache key from params (sector, month, year)
    const cacheKey = useMemo(() => {
        const keyParts = [];
        if (params.sector) keyParts.push(`sector-${params.sector}`);
        if (params.month) keyParts.push(`month-${params.month}`);
        if (params.year) keyParts.push(`year-${params.year}`);
        return keyParts.join('-') || 'default';
    }, [params.sector, params.month, params.year]);

    // Check cache (pure function)
    const getCachedData = useCallback(() => {
        const cached = expenditureCache.get(cacheKey);
        const expiry = expenditureCacheExpiry.get(cacheKey);
        const isStale = !cached || (Date.now() - (expiry || 0)) > staleTime;

        return { cached, isStale };
    }, [cacheKey, staleTime]);

    useEffect(() => {
        // Skip if disabled
        if (enabled === false) {
            setExpenditures(null);
            return;
        }

        const { cached, isStale } = getCachedData();

        // Return cached data immediately if fresh
        if (cached && !isStale) {
            setExpenditures(cached);
            return;
        }

        const fetchExpenditures = async () => {
            setLoading(true);
            setError(null);

            try {
                console.log('Fetching with params:', params);
                const response = await getAdminExpenditures(params);
                console.log('Response:', response);

                const newData = response.data.data;

                // Cache fresh data
                expenditureCache.set(cacheKey, newData);
                expenditureCacheExpiry.set(cacheKey, Date.now());

                setExpenditures(newData);
            } catch (err) {
                console.error('Error fetching expenditures:', err);
                console.error('Error response:', err.response);
                setError(err);

                // Fallback to cache on error
                if (cached) {
                    setExpenditures(cached);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchExpenditures();
    }, [params.sector, params.month, params.year, enabled, getCachedData]);

    // Manual refresh
    const refetch = useCallback(() => {
        expenditureCache.delete(cacheKey);
        expenditureCacheExpiry.delete(cacheKey);
        setExpenditures(null);
    }, [cacheKey]);

    return {
        expenditures,
        loading,
        error,
        refetch, // Bonus: manual refresh
    };
};
