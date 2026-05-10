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
        if (_cache && !force) {
            setChallans(_cache);
            return;
        }
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

    const create = async (data) => {
        try {
            setLoading(true);
            setError(null);
            const res = await createStateChallan(data);
            _cache = null;
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

            // ── FIX: Only send fields the schema knows — strip everything else ──
            const payload = {
                challanNo: data.challanNo,
                challanDate: data.challanDate,
                stateNo: data.stateNo,
                from: data.from,
                to: data.to,
                subject: data.subject,
                sector: data.sector,
                ddo: data.ddo,
                divisionCode: data.divisionCode,
                majorHead: data.majorHead,
                subMajorHead: data.subMajorHead,
                minorHead: data.minorHead,
                subHead: data.subHead,
                subSubHead: data.subSubHead,
                detailHead: data.detailHead,
                subDetailHead: data.subDetailHead,
                purpose: data.purpose,
                remarks: data.remarks,
                totalAmount: data.totalAmount,
                amountInWords: data.amountInWords,
                focNo: data.focNo,
                sanctionLetterNo: data.sanctionLetterNo,
                sanctionLetterDate: data.sanctionLetterDate,
                treasuryCode: data.treasuryCode,
                treasuryChallanNo: data.treasuryChallanNo,
            };

            const res = await updateStateChallan(parseInt(id, 10), payload);
            _cache = null;
            setChallans((prev) =>
                prev.map((c) => (c.id === parseInt(id, 10) ? res.data.data : c))
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
            setChallans((prev) => prev.filter((c) => c.id !== parseInt(id, 10)));
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