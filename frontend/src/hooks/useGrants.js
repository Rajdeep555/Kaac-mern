import { useEffect, useState } from "react";
import { getGrants } from "../api/grant.api.js";

export const useGrants = () => {
    const [grants, setGrants] = useState([]);
    const [grantOptions, setGrantOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchGrants = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await getGrants();

                const list = Array.isArray(res?.data?.grants)
                    ? res.data.grants
                    : [];

                setGrants(list);

                setGrantOptions(
                    list.map((grant) => ({
                        label: `${grant.code || grant.id} - ${grant.name || grant.grantName}`,
                        value: grant.id,
                    }))
                );
            } catch (err) {
                console.error("Failed to fetch grants", err);
                setError(err);
                setGrants([]);
                setGrantOptions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGrants();
    }, []);

    return {
        grants,
        grantOptions,
        loading,
        error,
    };
};
