import { useEffect, useState } from "react";
import { getDDOs } from "../api/ddo.api";

export const useDdo = () => {
    const [ddos, setDdos] = useState([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDdos = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await getDDOs();
                const options = res.data.ddos.map((ddo) => ({
                    label: ddo.ddoCode + " - " + ddo.ddoName,
                    value: ddo.id
                }))
                setDdos(options);

            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        }
        fetchDdos();
    }, []);

    return { ddos, loading, error }
};