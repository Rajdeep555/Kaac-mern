import { useEffect, useState } from "react";
import { getExpenditureTypes } from "../api/expenditureType.api.js";

export const useExpenditureTypes = () => {
    const [expenditureTypeOptions, setExpenditureTypeOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchExpenditureTypes = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getExpenditureTypes();
                const list = res.data.expenditureTypes ?? [];

                // ✅ Map to select options, only active ones
                setExpenditureTypeOptions([
                    { label: "Select Type", value: "" },
                    ...list
                        .filter((et) => et.isActive)
                        .map((et) => ({
                            label: et.name,
                            value: et.id, // or et.name if your backend expects the name string
                        })),
                ]);
            } catch (err) {
                console.error("Failed to fetch expenditure types", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        fetchExpenditureTypes();
    }, []);

    return { expenditureTypeOptions, loading, error };
};