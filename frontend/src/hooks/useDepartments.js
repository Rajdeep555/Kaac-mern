import { useEffect, useState } from "react";
import { getAllChallanDepartments } from "../api/department.api";


export const useDepartments = ({ type }) => {
    const [departments, setDepartments] = useState([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDepartments = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await getAllChallanDepartments({ type });

                const options = res.data.map((dept) => ({
                    label: dept.id + " - " + dept.name,
                    value: dept.id,
                }));

                setDepartments(options);
            } catch (err) {
                console.error("Failed to fetch departments", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        }
        if (type) {
            fetchDepartments();
        }
    }, [type]);

    return {
        departments,
        loading,
        error
    }
}