// src/hooks/usePlanNonPlan.js
import { useEffect, useState } from "react";
import { getAllPlanNonPlan } from "../api/planNonPlan.api.js";

export const usePlanNonPlan = () => {
    const [planNonPlan, setPlanNonPlan] = useState([]); // options for selects
    const [rawPlanNonPlan, setRawPlanNonPlan] = useState([]); // raw data for admin (optional)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPlanNonPlan = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await getAllPlanNonPlan();
                const list = res.data.planNonPlans || [];

                setRawPlanNonPlan(list);

                const options = list
                    .filter((item) => item.isActive !== false)
                    .map((item) => ({
                        label: item.name,
                        value: item.id,
                    }));

                setPlanNonPlan(options);
            } catch (error) {
                console.error("Failed to fetch plan non plan", error);
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchPlanNonPlan();
    }, []);

    return { planNonPlan, rawPlanNonPlan, loading, error };
};