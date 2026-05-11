// src/hooks/useObjectHead.js
import { useEffect, useState } from "react";
import { getAllObjectHead } from "../api/objectHead.api.js";

export const useObjectHead = () => {
    const [objectHeads, setObjectHeads] = useState([]);           // raw list
    const [objectHeadOptions, setObjectHeadOptions] = useState([]); // select options
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchObjectHead = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getAllObjectHead();
                const list = res.data.objectHead || [];

                // raw for admin
                setObjectHeads(list);

                // options for selects (cashier)
                const options = list
                    .filter((item) => item.isActive !== false) // treat undefined as active
                    .map((item) => ({
                        label: item.name,
                        value: item.id,
                    }));

                setObjectHeadOptions(options);
            } catch (error) {
                console.error("Failed to fetch object heads", error);
                setError(error);
            } finally {
                setLoading(false);
            }
        };
        fetchObjectHead();
    }, []);

    return {
        objectHeads,             // admin tables
        setObjectHeads,
        objectHeadOptions,       // cashier forms
        objectHead: objectHeadOptions, // backward compatible alias
        loading,
        error,
    };
};