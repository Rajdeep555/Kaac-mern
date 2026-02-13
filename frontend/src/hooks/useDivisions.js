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
                console.log("div" + res?.data?.divisions)

                const list = Array.isArray(res?.data?.divisions)
                    ? res.data.divisions
                    : [];

                // ✅ RAW DATA (for table)
                setDivisions(list);

                // ✅ OPTIONS (for select)
                setDivisionOptions(
                    list.map((division) => ({
                        label: `${division.divisionCode} - ${division.divisionName}`,
                        value: division.id,
                    }))
                );

                console.log(divisionOptions)
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

    return {
        divisions,
        divisionOptions,
        loading,
        error,
    };
};
