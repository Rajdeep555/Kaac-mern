import { useEffect, useState } from "react";
import { getCashierExpenditures } from "../api/expenditure.api";

export const useCashierExpenditures = ({
    sector,
    treasuryStatus, // "yes" | "no" | undefined
} = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
    }, [sector, treasuryStatus]);

    return { data, loading, error };
};
