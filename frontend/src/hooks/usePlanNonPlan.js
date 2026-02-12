import { useEffect, useState } from "react";
import { getAllPlanNonPlan } from "../api/planNonPlan.api";

export const usePlanNonPlan = () => {
    const [planNonPlan, setPlanNonPlan] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPlanNonPlan = async () => {
            setLoading(true);
            setError(null);

            try {
                const res = await getAllPlanNonPlan();

                const list = res.data.planNonPlans || [];

                const options = list.map((item) => ({
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

    return { planNonPlan, loading, error };
};
