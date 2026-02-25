import { useState, useEffect } from "react";
import { getChallanFromBillByCashier } from "../api/challanFromBill.api.js";

// ✅ Cache lives OUTSIDE the hook — persists across component mounts
let cache = {
    data: null,
    isFetched: false,
    isFetching: false,
};

export const useChallanFromBill = () => {
    const [challans, setChallans] = useState(cache.data ?? []);
    const [loading, setLoading] = useState(!cache.isFetched); // ✅ no loading if already cached
    const [error, setError] = useState(null);

    useEffect(() => {
        // ✅ If already fetched, use cache — no API call
        if (cache.isFetched) {
            setChallans(cache.data);
            setLoading(false);
            return;
        }

        // ✅ If already fetching (e.g. StrictMode double mount), skip
        if (cache.isFetching) return;

        const fetchChallans = async () => {
            cache.isFetching = true;
            setLoading(true);
            try {
                const response = await getChallanFromBillByCashier();
                const data = response.data.data ?? response.data ?? [];

                // ✅ Store in cache
                cache.data = data;
                cache.isFetched = true;

                setChallans(data);
            } catch (err) {
                console.error("Failed to fetch challans:", err);
                setError(err);
                setChallans([]);
            } finally {
                cache.isFetching = false;
                setLoading(false);
            }
        };

        fetchChallans();
    }, []);

    // ✅ Manual refresh — call this after create/update/delete
    const refetch = async () => {
        cache.isFetched = false;
        cache.data = null;
        setLoading(true);
        try {
            const response = await getChallanFromBillByCashier();
            const data = response.data.data ?? response.data ?? [];
            cache.data = data;
            cache.isFetched = true;
            setChallans(data);
        } catch (err) {
            console.error("Failed to refetch challans:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return { challans, loading, error, refetch };
};
