import { useEffect, useState } from "react";
import { getDivisions } from "../api/division.api";

export const useDivisions = () => {
    const [divisions, setDivisions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDivisions = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await getDivisions();

                const options = res.data.divisions.map((div) => ({
                    label: `${div.divisionCode} - ${div.divisionName}`,
                    value: div.id,
                }));

                setDivisions(options);
            } catch (err) {
                console.error("Failed to fetch divisions", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDivisions();
    }, []);

    return {
        divisions,
        loading,
        error,
    };
};