// hooks/useAllDepartments.js
import { useEffect, useState } from "react";
import { getAllChallanDepartments } from "../api/department.api";

export const useAllDepartments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDepartments = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await getAllChallanDepartments({}); // no type → backend returns all for ADMIN
                setDepartments(res.data);
            } catch (err) {
                console.error("Failed to fetch departments", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDepartments();
    }, []);

    return { departments, loading, error };
};