import { useState, useEffect } from "react";
import { getPersonnelStats } from "../api/personnelStats.api.js";

export const usePersonnelStats = () => {
    const [stats, setStats] = useState({
        cashier: 0,
        ddo: 0,
        department: 0,
        division: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const { data } = await getPersonnelStats();
                setStats(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading, error };
};