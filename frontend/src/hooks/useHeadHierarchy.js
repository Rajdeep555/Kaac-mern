import { useEffect, useState, useCallback } from "react";
import { getHeadHierarchy } from "../api/head.api.js";

export const useHeadHierarchy = (sector, isEditMode = false) => {
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
        if (!sector || isEditMode) return;

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
    }, [sector, isEditMode]);

    // ── Also fetch major heads in edit mode when sector becomes available ──
    useEffect(() => {
        if (!sector || !isEditMode) return;

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
            } catch (err) {
                console.error("Major head error (edit):", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMajorHeads();
    }, [sector, isEditMode]);

    /* ================= SUB MAJOR ================= */
    // sectorOverride lets edit-mode cascade pass sector directly
    // instead of relying on the closed-over sector (which may still be "")
    const fetchSubMajors = useCallback(
        async (majorHeadCode, sectorOverride) => {
            if (!majorHeadCode) return;
            const activeSector = sectorOverride || sector;
            if (!activeSector) return;

            try {
                setLoading(true);
                const res = await getHeadHierarchy({
                    sector: activeSector,
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
        async ({ majorHeadCode, subMajorCode, sectorOverride }) => {
            if (!subMajorCode) return;
            const activeSector = sectorOverride || sector;
            if (!activeSector) return;

            try {
                setLoading(true);
                const res = await getHeadHierarchy({
                    sector: activeSector,
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
        async ({ majorHeadCode, subMajorCode, minorHeadCode, sectorOverride }) => {
            if (!minorHeadCode) return;
            const activeSector = sectorOverride || sector;
            if (!activeSector) return;

            try {
                setLoading(true);
                const res = await getHeadHierarchy({
                    sector: activeSector,
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
        async ({ majorHeadCode, subMajorCode, minorHeadCode, subHeadCode, sectorOverride }) => {
            if (!subHeadCode) return;
            const activeSector = sectorOverride || sector;
            if (!activeSector) return;

            try {
                setLoading(true);
                const res = await getHeadHierarchy({
                    sector: activeSector,
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
        async ({ majorHeadCode, subMajorCode, minorHeadCode, subHeadCode, subSubHeadCode, sectorOverride }) => {
            if (!subSubHeadCode) return;
            const activeSector = sectorOverride || sector;
            if (!activeSector) return;

            try {
                setLoading(true);
                const res = await getHeadHierarchy({
                    sector: activeSector,
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
        async ({ majorHeadCode, subMajorCode, minorHeadCode, subHeadCode, subSubHeadCode, detailHeadCode, sectorOverride }) => {
            if (!detailHeadCode) return;
            const activeSector = sectorOverride || sector;
            if (!activeSector) return;

            try {
                setLoading(true);
                const res = await getHeadHierarchy({
                    sector: activeSector,
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