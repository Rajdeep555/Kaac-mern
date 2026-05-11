import { useEffect, useState } from "react";
import { getDivisions } from "../api/division.api.js";

export const useDivisions = () => {
    const [divisions, setDivisions] = useState([]);
    const [divisionOptions, setDivisionOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDivisions = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getDivisions();
                const list = Array.isArray(res?.data?.divisions) ? res.data.divisions : [];

                setDivisions(list);
                setDivisionOptions(
                    list.map((division) => ({
                        label: `${division.divisionCode} - ${division.divisionName}`,
                        value: division.id,
                    }))
                );
            } catch (err) {
                console.error("Failed to fetch divisions", err);
                setError(err);
                setDivisions([]);
                setDivisionOptions([]);
            } finally {
                setLoading(false);
            }
        };
        fetchDivisions();
    }, []);

    return { divisions, setDivisions, divisionOptions, loading, error };
};