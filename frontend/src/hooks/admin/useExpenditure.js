import { useEffect, useState } from "react";
import { getAdminExpenditures } from "../../api/expenditure.api";

export const useExpenditure = (params = {}) => {
    const [expenditures, setExpenditures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchExpenditures = async () => {
        try {
            setLoading(true);
            const res = await getAdminExpenditures(params);
            setExpenditures(res.data.data);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenditures();
    }, [JSON.stringify(params)]);

    return { expenditures, loading, error };
};
