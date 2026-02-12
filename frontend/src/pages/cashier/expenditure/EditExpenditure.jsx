import React, { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  getExpenditureById,
  updateExpenditure,
} from "../../../api/expenditure.api";

import { useExpenditureForm } from "../../../hooks/useExpenditureForm";
import { useExpenditureCalculations } from "../../../hooks/useExpenditureCalculations";
import { useHeadHierarchy } from "../../../hooks/useHeadHierarchy";

import ExpenditureForm from "../../../components/Expenditure/ExpenditureForm";

import {
  mapBackendToForm,
  transformDataForBackend,
} from "../../../utils/expenditureMapper";

import { prefillHierarchyOnce } from "../../../utils/expenditureHierarchyPrefill";

const EditExpenditure = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const form = useExpenditureForm();
  const { watch } = form;

  // 🔑 Head hierarchy hook
  const hierarchy = useHeadHierarchy(watch("sector"));

  // 🔢 Calculations (gross, net, etc.)
  useExpenditureCalculations(form);

  // 🧠 Run-once guard
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!id || initializedRef.current) return;

    const load = async () => {
      try {
        const res = await getExpenditureById(id);

        // 1️⃣ Map backend → form shape
        const mapped = mapBackendToForm(res.data);

        // 2️⃣ Reset form
        form.reset(mapped);

        // 3️⃣ Prefill hierarchy safely (awaited)
        await prefillHierarchyOnce(res.data, form, hierarchy);

        initializedRef.current = true;
      } catch (err) {
        console.error("Failed to load expenditure", err);
        toast.error("Failed to load expenditure");
        navigate("/generated-expenditure");
      }
    };

    load();
  }, [id]); // ⚠️ IMPORTANT: only depend on id

  const onSubmit = async (data) => {
    try {
      const payload = transformDataForBackend(data);
      await updateExpenditure(id, payload);
      toast.success("Expenditure updated successfully");
      navigate("/generated-expenditure");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update expenditure");
    }
  };

  return <ExpenditureForm form={form} mode="edit" onSubmit={onSubmit} />;
};

export default EditExpenditure;
