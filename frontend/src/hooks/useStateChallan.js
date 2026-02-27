import { useState, useEffect } from "react";
import {
    getAllStateChallan,
    getStateChallanById,
    createStateChallan,
    updateStateChallan,
    deleteStateChallan,
} from "../api/stateChallan.api.js";

export const useStateChallan = () => {
    const [challans, setChallans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchAll = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getAllStateChallan();
            setChallans(res.data.data);
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to fetch challans");
        } finally {
            setLoading(false);
        }
    };

    const fetchById = async (id) => {
        try {
            setLoading(true);
            setError(null);
            const res = await getStateChallanById(id);
            return res.data.data;
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to fetch challan");
        } finally {
            setLoading(false);
        }
    };

    const create = async (data) => {
        try {
            setLoading(true);
            setError(null);
            const res = await createStateChallan(data);
            setChallans((prev) => [res.data.data, ...prev]);
            return res.data.data;
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to create challan");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const update = async (id, data) => {
        try {
            setLoading(true);
            setError(null);
            const res = await updateStateChallan(id, data);
            setChallans((prev) =>
                prev.map((c) => (c.id === id ? res.data.data : c))
            );
            return res.data.data;
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to update challan");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const remove = async (id) => {
        try {
            setLoading(true);
            setError(null);
            await deleteStateChallan(id);
            setChallans((prev) => prev.filter((c) => c.id !== id));
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to delete challan");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, []);

    return {
        challans,
        loading,
        error,
        fetchAll,
        fetchById,
        create,
        update,
        remove,
    };
};
