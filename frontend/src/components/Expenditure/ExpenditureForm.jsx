import React from "react";
import FormWrapper from "../Forms/FormWrapper";
import BasicDetailsSection from "./BasicDetailsSection";
import HeadHierarchySection from "./HeadHierarchySection";
import AmountBreakupSection from "./AmountBreakupSection";
import DeductionsSection from "./DeductionsSection";
import { useExpenditureCalculations } from "../../hooks/useExpenditureCalculations";

const ExpenditureForm = ({ form, mode, onSubmit }) => {
  const { register, handleSubmit } = form;

  return (
    <FormWrapper
      onSubmit={handleSubmit(onSubmit)}
      submitText={mode === "edit" ? "Update" : "Create"}>
      <BasicDetailsSection
        register={register}
        departments={form.departments ?? []}
        ddos={form.ddos ?? []}
        grants={form.grants ?? []}
        isExpenditureLoading={form.isLoading}
      />

      <HeadHierarchySection
        register={register}
        loading={form.loading}
        majorHeads={form.majorHeads ?? []}
        subMajors={form.subMajors ?? []}
        minors={form.minors ?? []}
        subHeads={form.subHeads ?? []}
        subSubHeads={form.subSubHeads ?? []}
        detailHeads={form.detailHeads ?? []}
        subDetailHeads={form.subDetailHeads ?? []}
      />

      <AmountBreakupSection register={register} />
      <DeductionsSection register={register} />
    </FormWrapper>
  );
};

export default ExpenditureForm;
