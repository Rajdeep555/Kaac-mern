import { useEffect, useState, useCallback } from "react";
import { getHeadHierarchy } from "../api/head.api.js";

export const useHeadHierarchy = (sector, isEditMode = false) => { // ✅ Accept isEditMode
    const [loading, setLoading] = useState(false);

    const [majorHeads, setMajorHeads] = useState([]);
    const [subMajors, setSubMajors] = useState([]);
    const [minors, setMinors] = useState([]);
    const [subHeads, setSubHeads] = useState([]);
    const [subSubHeads, setSubSubHeads] = useState([]);
    const [detailHeads, setDetailHeads] = useState([]);
    const [subDetailHeads, setSubDetailHeads] = useState([]);

    /* ================= MAJOR ================= */
    useEffect(() => {
        if (!sector || isEditMode) return; // ✅ Skip in edit mode

        const fetchMajorHeads = async () => {
            try {
                setLoading(true);
                const res = await getHeadHierarchy({ sector, level: "MAJOR" });

                setMajorHeads(
                    res.data.data.map((h) => ({
                        label: `${h.majorHeadCode} - ${h.majorHead}`,
                        value: h.majorHeadCode,
                    }))
                );

                setSubMajors([]);
                setMinors([]);
                setSubHeads([]);
                setSubSubHeads([]);
                setDetailHeads([]);
                setSubDetailHeads([]);
            } catch (err) {
                console.error("Major head error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMajorHeads();
    }, [sector, isEditMode]); // ✅ Add isEditMode to deps

    /* ================= SUB MAJOR ================= */
    const fetchSubMajors = useCallback(
        async (majorHeadCode) => {
            if (majorHeadCode === "") return;

            try {
                setLoading(true);
                const res = await getHeadHierarchy({
                    sector,
                    level: "SUB_MAJOR",
                    majorHeadCode,
                });

                setSubMajors(
                    res.data.data.map((h) => ({
                        label: `${h.subMajorCode} - ${h.subMajor}`,
                        value: h.subMajorCode,
                    }))
                );

                setMinors([]);
                setSubHeads([]);
                setSubSubHeads([]);
                setDetailHeads([]);
                setSubDetailHeads([]);
            } catch (err) {
                console.error("Sub major error:", err);
            } finally {
                setLoading(false);
            }
        },
        [sector]
    );

    /* ================= MINOR ================= */
    const fetchMinors = useCallback(
        async ({ majorHeadCode, subMajorCode }) => {
            if (subMajorCode === "") return;

            try {
                setLoading(true);
                const res = await getHeadHierarchy({
                    sector,
                    level: "MINOR",
                    majorHeadCode,
                    subMajorCode,
                });

                setMinors(
                    res.data.data.map((h) => ({
                        label: `${h.minorHeadCode} - ${h.minorHead}`,
                        value: h.minorHeadCode,
                    }))
                );

                setSubHeads([]);
                setSubSubHeads([]);
                setDetailHeads([]);
                setSubDetailHeads([]);
            } catch (err) {
                console.error("Minor error:", err);
            } finally {
                setLoading(false);
            }
        },
        [sector]
    );

    /* ================= SUB HEAD ================= */
    const fetchSubHeads = useCallback(
        async ({ majorHeadCode, subMajorCode, minorHeadCode }) => {
            if (minorHeadCode === "") return;

            try {
                setLoading(true);
                const res = await getHeadHierarchy({
                    sector,
                    level: "SUB_HEAD",
                    majorHeadCode,
                    subMajorCode,
                    minorHeadCode,
                });

                setSubHeads(
                    res.data.data.map((h) => ({
                        label: `${h.subHeadCode} - ${h.subHead}`,
                        value: h.subHeadCode,
                    }))
                );

                setSubSubHeads([]);
                setDetailHeads([]);
                setSubDetailHeads([]);
            } catch (err) {
                console.error("Sub head error:", err);
            } finally {
                setLoading(false);
            }
        },
        [sector]
    );

    /* ================= SUB SUB HEAD ================= */
    const fetchSubSubHeads = useCallback(
        async ({ majorHeadCode, subMajorCode, minorHeadCode, subHeadCode }) => {
            if (subHeadCode === "") return;

            try {
                setLoading(true);
                const res = await getHeadHierarchy({
                    sector,
                    level: "SUB_SUB_HEAD",
                    majorHeadCode,
                    subMajorCode,
                    minorHeadCode,
                    subHeadCode,
                });

                setSubSubHeads(
                    res.data.data.map((h) => ({
                        label: `${h.subSubHeadCode} - ${h.subSubHead}`,
                        value: h.subSubHeadCode,
                    }))
                );

                setDetailHeads([]);
                setSubDetailHeads([]);
            } catch (err) {
                console.error("Sub sub head error:", err);
            } finally {
                setLoading(false);
            }
        },
        [sector]
    );

    /* ================= DETAIL ================= */
    const fetchDetailHeads = useCallback(
        async ({ majorHeadCode, subMajorCode, minorHeadCode, subHeadCode, subSubHeadCode }) => {
            if (subSubHeadCode === "") return;

            try {
                setLoading(true);
                const res = await getHeadHierarchy({
                    sector,
                    level: "DETAIL",
                    majorHeadCode,
                    subMajorCode,
                    minorHeadCode,
                    subHeadCode,
                    subSubHeadCode,
                });

                setDetailHeads(
                    res.data.data.map((h) => ({
                        label: `${h.detailHeadCode} - ${h.detailHead}`,
                        value: h.detailHeadCode,
                    }))
                );

                setSubDetailHeads([]);
            } catch (err) {
                console.error("Detail error:", err);
            } finally {
                setLoading(false);
            }
        },
        [sector]
    );

    /* ================= SUB DETAIL ================= */
    const fetchSubDetailHeads = useCallback(
        async ({
            majorHeadCode,
            subMajorCode,
            minorHeadCode,
            subHeadCode,
            subSubHeadCode,
            detailHeadCode,
        }) => {
            if (detailHeadCode === "") return;

            try {
                setLoading(true);
                const res = await getHeadHierarchy({
                    sector,
                    level: "SUB_DETAIL",
                    majorHeadCode,
                    subMajorCode,
                    minorHeadCode,
                    subHeadCode,
                    subSubHeadCode,
                    detailHeadCode,
                });

                setSubDetailHeads(
                    res.data.data.map((h) => ({
                        label: `${h.subDetailHeadCode} - ${h.subDetailHead}`,
                        value: h.subDetailHeadCode,
                    }))
                );
            } catch (err) {
                console.error("Sub detail error:", err);
            } finally {
                setLoading(false);
            }
        },
        [sector]
    );

    return {
        loading,
        majorHeads,
        subMajors,
        minors,
        subHeads,
        subSubHeads,
        detailHeads,
        subDetailHeads,
        fetchSubMajors,
        fetchMinors,
        fetchSubHeads,
        fetchSubSubHeads,
        fetchDetailHeads,
        fetchSubDetailHeads,
    };
};
