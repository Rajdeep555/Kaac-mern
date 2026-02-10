// src/utils/expenditureHierarchyPrefill.js

/**
 * Prefills head hierarchy ONLY ONCE for edit mode
 * Prevents infinite loops
 */
export const prefillHierarchyOnce = async (data, form, hierarchy) => {
    const {
        setValue,
    } = form;

    const {
        fetchSubMajors,
        fetchMinors,
        fetchSubHeads,
        fetchSubSubHeads,
        fetchDetailHeads,
        fetchSubDetailHeads,
    } = hierarchy;

    // 1️⃣ Major → Sub Major
    if (data.majorHead) {
        await fetchSubMajors(data.majorHead);
        setValue("subMajorHead", data.subMajorHead || "");
    }

    // 2️⃣ Sub Major → Minor
    if (data.subMajorHead) {
        await fetchMinors({
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
        });
        setValue("minorHead", data.minorHead || "");
    }

    // 3️⃣ Minor → Sub Head
    if (data.minorHead) {
        await fetchSubHeads({
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
            minorHeadCode: data.minorHead,
        });
        setValue("subHead", data.subHead || "");
    }

    // 4️⃣ Sub Head → Sub Sub Head
    if (data.subHead !== null && data.subHead !== undefined) {
        await fetchSubSubHeads({
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
            minorHeadCode: data.minorHead,
            subHeadCode: data.subHead,
        });
        setValue("subSubHead", data.subSubHead || "");
    }

    // 5️⃣ Sub Sub Head → Detail Head
    if (data.subSubHead !== null && data.subSubHead !== undefined) {
        await fetchDetailHeads({
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
            minorHeadCode: data.minorHead,
            subHeadCode: data.subHead,
            subSubHeadCode: data.subSubHead,
        });
        setValue("detailHead", data.detailHead || "");
    }

    // 6️⃣ Detail Head → Sub Detail Head
    if (data.detailHead) {
        await fetchSubDetailHeads({
            majorHeadCode: data.majorHead,
            subMajorCode: data.subMajorHead,
            minorHeadCode: data.minorHead,
            subHeadCode: data.subHead,
            subSubHeadCode: data.subSubHead,
            detailHeadCode: data.detailHead,
        });
        setValue("subDetailHead", data.subDetailHead || "");
    }
};
