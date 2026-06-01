import { useEffect, useState, useMemo } from "react";
import { getCashierExpenditures } from "../api/expenditure.api.js";

let sharedCache = null;

export const useCashierExpenditures = ({ sector, treasuryStatus } = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTick, setRefreshTick] = useState(0);

    const sectorKey = useMemo(() => {
        if (!sector) return "";
        return Array.isArray(sector) ? sector.join(",") : sector;
    }, [JSON.stringify(sector)]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const fetchExpenditures = async () => {
            if (sharedCache) {
                setData(sharedCache);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const res = await getCashierExpenditures({
                    sector,
                    treasury: treasuryStatus,
                });
                const result = res.data.data || [];
                sharedCache = result;
                setData(result);
            } catch (err) {
                console.error("Failed to fetch expenditures", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchExpenditures();
    }, [sectorKey, treasuryStatus, refreshTick]);

    const invalidate = () => {
        sharedCache = null;
        setRefreshTick((t) => t + 1); // triggers useEffect to re-run
    };

    return { data, loading, error, invalidate };
};