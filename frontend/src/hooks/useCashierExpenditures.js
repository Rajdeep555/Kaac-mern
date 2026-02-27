import { useEffect, useState, useMemo } from "react";
import { getCashierExpenditures } from "../api/expenditure.api.js";

export const useCashierExpenditures = ({
    sector,
    treasuryStatus,
} = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ Serialize sector array → stable string for useEffect comparison
    const sectorKey = useMemo(() => {
        if (!sector) return "";
        return Array.isArray(sector) ? sector.join(",") : sector;
    }, [JSON.stringify(sector)]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const fetchExpenditures = async () => {
            try {
                setLoading(true);
                const res = await getCashierExpenditures({
                    sector,
                    treasury: treasuryStatus,
                });
                setData(res.data.data || []);
            } catch (err) {
                console.error("Failed to fetch expenditures", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchExpenditures();
    }, [sectorKey, treasuryStatus]); // ✅ sectorKey is a stable string

    return { data, loading, error };
};
