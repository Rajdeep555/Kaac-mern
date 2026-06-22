import { useState, useEffect } from "react";
import {
    getAllStateChallan,
    getStateChallanById,
    createStateChallan,
    updateStateChallan,
    deleteStateChallan,
} from "../api/stateChallan.api.js";

let _cache = null;

export const useStateChallan = () => {
    const [challans, setChallans] = useState(_cache || []);
    const [loading, setLoading] = useState(!_cache);
    const [error, setError] = useState(null);

    const fetchAll = async (force = false) => {
        if (_cache && !force) { setChallans(_cache); return; }
        try {
            setLoading(true);
            setError(null);
            const res = await getAllStateChallan();
            _cache = res.data.data;
            setChallans(_cache);
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
            throw err;
        } finally {
            setLoading(false);
        }
    };

    /**
     * create() returns the full challan record from the API.
     * The caller (StateChallan.jsx) reads .challanNo from the returned object
     * to show the user their auto-assigned number.
     *
     * API response shape expected:
     *   { success: true, challanNo: "STATE-2026-01", data: { ...challan } }
     */
    const create = async (data) => {
        try {
            setLoading(true);
            setError(null);
            const res = await createStateChallan(data);

            // res.data is the full axios response body:
            // { success, challanNo, data: { ...record } }
            const record = res.data.data;

            _cache = null; // bust cache so list refetches
            setChallans((prev) => [record, ...prev]);

            // Return the full API body so the form can extract challanNo
            return res.data;
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

            // Strip challanNo — it must never be sent to the update endpoint
            const {
                challanNo: _ignored,
                financialYear: _fy,   // UI-only field, not persisted separately
                ...payload
            } = data;

            const res = await updateStateChallan(parseInt(id, 10), payload);
            _cache = null;
            setChallans((prev) =>
                prev.map((c) =>
                    c.id === parseInt(id, 10) ? res.data.data : c
                )
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
            _cache = null;
            setChallans((prev) =>
                prev.filter((c) => c.id !== parseInt(id, 10))
            );
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to delete challan");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);

    return { challans, loading, error, fetchAll, fetchById, create, update, remove };
};