// hooks/admin/useExpenditure.js
import { useState, useEffect } from 'react';
import { getAdminExpenditures } from '../../api/expenditure.api.js';

export const useExpenditure = (params = {}, options = {}) => {
    const [expenditures, setExpenditures] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // If enabled is false, don't fetch
        if (options.enabled === false) {
            return;
        }

        const fetchExpenditures = async () => {
            setLoading(true);
            setError(null);

            try {
                console.log('Fetching with params:', params); // Debug log
                const response = await getAdminExpenditures(params);
                console.log('Response:', response); // Debug log
                setExpenditures(response.data.data);
            } catch (err) {
                console.error('Error fetching expenditures:', err);
                console.error('Error response:', err.response); // Debug log
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchExpenditures();
    }, [params.sector, params.month, params.year, options.enabled]);

    return {
        expenditures,
        loading,
        error,
    };
};