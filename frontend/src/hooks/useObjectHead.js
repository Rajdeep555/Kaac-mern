import { useEffect } from "react";
import { getAllObjectHead } from "../api/objectHead.api";
import { useState } from "react";

export const useObjectHead = () => {
    const [objectHead, setObjectHead] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchObjectHead = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await getAllObjectHead();

                const list = res.data.objectHead || [];

                const options = list.map((item) => ({
                    label: item.name,
                    value: item.id,
                }));

                setObjectHead(options);
            } catch (error) {
                console.error("Failed to fetch object head", error);
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchObjectHead();
    }, [])

    return { objectHead, loading, error };
}

