import React from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { createExpenditure } from "../../../api/expenditure.api";
import { useExpenditureForm } from "../../../hooks/useExpenditureForm";
import { useExpenditureCalculations } from "../../../hooks/useExpenditureCalculations";
import ExpenditureForm from "../../../components/Expenditure/ExpenditureForm";
import { transformDataForBackend } from "../../../utils/expenditureMapper.js";

const CreateExpenditure = () => {
  const navigate = useNavigate();
  const form = useExpenditureForm();

  useExpenditureCalculations(form);

  const onSubmit = async (data) => {
    const payload = transformDataForBackend(data);
    await createExpenditure(payload);
    toast.success("Expenditure created successfully");
    navigate("/generated-expenditure");
  };

  return <ExpenditureForm form={form} mode="create" onSubmit={onSubmit} />;
};

export default CreateExpenditure;
